from fastapi import UploadFile
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from typing import List, Optional
from app.models.user_read_books import UserReadBooks
from app.models.book_location import BookLocation
from app.models.books import Book
from app.models.locations import Location
from app.models.reservations import Reservation
from app.core.minio_client import minio_service
from datetime import datetime, timedelta
from app.models.tags import Tag
from app.schemas.books import BookCreate, BookResponse, BookUpdate, Catalog, TagInfo
from app.core.db import SessionLocal
import logging

logger = logging.getLogger(__name__)

BOOK_STATUS_MARKED_FOR_DELETION = "marked_for_deletion"


def get_readers_count(db: Session, book_id: int) -> int:
    return db.query(func.count(UserReadBooks.id)).filter(
        UserReadBooks.book_id == book_id
    ).scalar() or 0


def get_users_books_count(db: Session, user_id: int) -> int:
    return db.query(Book).filter(Book.owner_id == user_id).count()


def get_catalog_books(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    sort_by: str = "title"
) -> List[Catalog]:
    books = db.query(Book).options(joinedload(Book.tags)).offset(skip).limit(limit).all()

    catalog_books = []
    for book in books:
        readers_count = get_readers_count(db, book.id)
        tags = [TagInfo(id=tag.id, tag_name=tag.tag_name) for tag in book.tags]
        cover_url = get_book_cover_url(book)

        catalog_books.append(Catalog(
            id=book.id,
            title=book.title,
            author=book.author,
            cover_image_uri=cover_url,
            readers_count=readers_count,
            tags=tags
        ))

    if sort_by == "readers":
        catalog_books.sort(key=lambda x: x.readers_count, reverse=True)
    elif sort_by == "title":
        catalog_books.sort(key=lambda x: x.title)
    elif sort_by == "author":
        catalog_books.sort(key=lambda x: x.author)

    return catalog_books


def get_users_books(
    db: Session,
    user_id: int,
    skip: int = 0,
    limit: int = 100
) -> List[Catalog]:
    books = db.query(Book).filter(
        Book.owner_id == user_id
    ).options(joinedload(Book.tags)).offset(skip).limit(limit).all()

    user_books = []
    for book in books:
        readers_count = get_readers_count(db, book.id)
        tags = [TagInfo(id=tag.id, tag_name=tag.tag_name) for tag in book.tags]
        cover_url = get_book_cover_url(book)

        user_books.append(Catalog(
            id=book.id,
            title=book.title,
            author=book.author,
            cover_image_uri=cover_url,
            readers_count=readers_count,
            tags=tags
        ))

    return user_books


def create_book(db: Session, book_data: BookCreate, user_id: int) -> Book:
    db_book = Book(
        title=book_data.title,
        author=book_data.author,
        description=book_data.description,
        cover_image_key=book_data.cover_image_key,
        owner_id=user_id,
        status="available"
    )
    db.add(db_book)
    db.flush()

    for location_id in book_data.location_ids:
        book_location = BookLocation(
            book_id=db_book.id,
            location_id=location_id
        )
        db.add(book_location)

    if hasattr(book_data, 'tag_ids') and book_data.tag_ids:
        if book_data.tag_ids and hasattr(book_data.tag_ids[0], 'id'):
            tag_ids_list = [tag.id for tag in book_data.tag_ids]
        else:
            tag_ids_list = book_data.tag_ids

        tags = db.query(Tag).filter(Tag.id.in_(tag_ids_list)).all()
        db_book.tags.extend(tags)

    db.commit()
    db.refresh(db_book)
    return db_book


def get_book_cover_url(book: Book, refresh: bool = False) -> str:
    if not book.cover_image_key:
        return ""

    if refresh or not book.cover_image_url or \
       not book.cover_image_updated_at or \
       book.cover_image_updated_at < datetime.utcnow() - timedelta(minutes=50):

        book.cover_image_url = minio_service.get_file_url(book.cover_image_key)
        book.cover_image_updated_at = datetime.utcnow()

        db = SessionLocal()
        try:
            db.merge(book)
            db.commit()
        finally:
            db.close()

    return book.cover_image_url


def get_book_with_details(db: Session, book_id: int) -> Optional[BookResponse]:
    book = db.query(Book).options(joinedload(Book.tags)).filter(
        Book.id == book_id
    ).first()

    if not book:
        raise ValueError("Книга не найдена")

    cover_url = get_book_cover_url(book)
    readers_count = get_readers_count(db, book.id)

    locations = db.query(Location.id, Location.name, Location.address).join(
        BookLocation, BookLocation.location_id == Location.id
    ).filter(BookLocation.book_id == book.id).all()

    location_items = [
        {"id": loc.id, "name": loc.name or "", "address": loc.address or ""}
        for loc in locations
    ]

    tags = [TagInfo(id=tag.id, tag_name=tag.tag_name) for tag in book.tags]

    return BookResponse(
        id=book.id,
        title=book.title,
        author=book.author,
        description=book.description or "",
        cover_image_uri=cover_url,
        reader_count=readers_count or 0,
        locations=location_items,
        owner_id=book.owner_id,
        status=book.status or "available",
        tags=tags
    )


def update_book(db: Session, book_id: int, book_data: BookUpdate, user_id: int) -> Book:
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise ValueError("Книга не найдена")

    if book.owner_id != user_id:
        raise ValueError("Вы не являетесь владельцем этой книги")

    if book_data.status is not None and book_data.status != book.status:
        active_reservations = db.query(Reservation).filter(
            Reservation.book_id == book_id,
            Reservation.status.in_(["pending", "confirmed_by_owner", "handed_over"])
        ).count()

        if active_reservations > 0 and book_data.status == "unavailable":
            raise ValueError("Нельзя сделать книгу недоступной при активных бронированиях")

    try:
        update_data = book_data.model_dump(exclude_unset=True)
        excluded_fields = ['location_ids', 'tag_ids', 'cover_image_key']

        for field, value in update_data.items():
            if field not in excluded_fields:
                setattr(book, field, value)

        if 'cover_image_key' in update_data and update_data['cover_image_key'] is not None:
            if book.cover_image_key:
                try:
                    minio_service.delete_file(book.cover_image_key)
                except Exception as e:
                    logger.error(f"Error deleting old cover: {e}")

            book.cover_image_key = update_data['cover_image_key']
            book.cover_image_url = minio_service.get_file_url(update_data['cover_image_key'])
            book.cover_image_updated_at = datetime.utcnow()

        if 'tag_ids' in update_data and update_data['tag_ids'] is not None:
            tag_ids_list = []
            for tag in update_data['tag_ids']:
                if hasattr(tag, 'id'):
                    tag_ids_list.append(tag.id)
                elif isinstance(tag, dict):
                    tag_ids_list.append(tag['id'])
                else:
                    tag_ids_list.append(int(tag))

            tags = db.query(Tag).filter(Tag.id.in_(tag_ids_list)).all()
            book.tags = tags

        book.updated_at = func.now()
        db.commit()
        db.refresh(book)
        return book

    except Exception as e:
        db.rollback()
        raise ValueError(f"Ошибка при обновлении книги: {str(e)}")


async def replace_book_cover(
    db: Session,
    book_id: int,
    cover_image: UploadFile,
    user_id: int
) -> Book:
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise ValueError("Книга не найдена")

    if book.owner_id != user_id:
        raise ValueError("Вы не являетесь владельцем этой книги")

    if book.cover_image_key:
        try:
            minio_service.delete_file(book.cover_image_key)
            logger.info(f"Deleted old cover: {book.cover_image_key}")
        except Exception as e:
            logger.error(f"Error deleting old cover: {e}")

    file_info = await minio_service.upload_file(cover_image)

    book.cover_image_key = file_info["filename"]
    book.cover_image_url = minio_service.get_file_url(file_info["filename"])
    book.cover_image_updated_at = datetime.utcnow()
    book.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(book)

    logger.info(f"Cover replaced for book {book_id}: {file_info['filename']}")
    return book


def update_book_locations(
    db: Session,
    book_id: int,
    location_ids: List[int],
    user_id: int
) -> Book:
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise ValueError("Книга не найдена")

    if book.owner_id != user_id:
        raise ValueError("Вы не являетесь владельцем этой книги")

    active_reservations = db.query(Reservation).filter(
        Reservation.book_id == book_id,
        Reservation.status.in_(["pending", "confirmed_by_owner", "handed_over"])
    ).count()

    if active_reservations > 0:
        raise ValueError("Нельзя изменять локации при активных бронированиях")

    try:
        db.query(BookLocation).filter(BookLocation.book_id == book_id).delete()

        for location_id in location_ids:
            location = db.query(Location).filter(Location.id == location_id).first()
            if not location:
                raise ValueError(f"Локация с ID {location_id} не найдена")

            if not location.is_approved:
                raise ValueError(f"Локация '{location.name}' не подтверждена")

            book_location = BookLocation(
                book_id=book_id,
                location_id=location_id
            )
            db.add(book_location)

        book.updated_at = func.now()
        db.commit()
        db.refresh(book)
        return book

    except Exception as e:
        db.rollback()
        raise ValueError(f"Ошибка при обновлении локаций книги: {str(e)}")


def add_tags_to_book(
    db: Session,
    book_id: int,
    tag_ids: List[TagInfo],
    user_id: int
) -> Book:
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise ValueError("Книга не найдена")

    if book.owner_id != user_id:
        raise ValueError("Вы не являетесь владельцем этой книги")

    tag_ids_list = [tag.id for tag in tag_ids]
    tags = db.query(Tag).filter(Tag.id.in_(tag_ids_list)).all()
    if len(tags) != len(tag_ids_list):
        raise ValueError("Некоторые теги не найдены")

    existing_tag_ids = {tag.id for tag in book.tags}
    for tag in tags:
        if tag.id not in existing_tag_ids:
            book.tags.append(tag)

    db.commit()
    db.refresh(book)
    return book


def remove_tags_from_book(
    db: Session,
    book_id: int,
    user_id: int,
    tag_ids: List[TagInfo],
) -> Book:
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise ValueError("Книга не найдена")

    if book.owner_id != user_id:
        raise ValueError("Вы не являетесь владельцем этой книги")

    tag_ids_list = [tag.id for tag in tag_ids]
    book.tags = [tag for tag in book.tags if tag.id not in tag_ids_list]

    db.commit()
    db.refresh(book)
    return book


def search_books_by_tags(
    db: Session,
    tag_ids: List[int],
    match_all: bool = True,
    skip: int = 0,
    limit: int = 100
) -> List[Book]:
    if not tag_ids:
        return []

    if isinstance(tag_ids[0], int):
        tag_ids_list = tag_ids
    else:
        tag_ids_list = [tag.id for tag in tag_ids]

    if match_all:
        books = db.query(Book).join(Book.tags).filter(
            Tag.id.in_(tag_ids_list)
        ).group_by(Book.id).having(
            func.count(Tag.id) == len(tag_ids_list)
        ).offset(skip).limit(limit).all()
    else:
        books = db.query(Book).join(Book.tags).filter(
            Tag.id.in_(tag_ids_list)
        ).distinct().offset(skip).limit(limit).all()

    return books


def delete_book(db: Session, book_id: int, user_id: int) -> bool:
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise ValueError("Книга не найдена")

    active_reservations = db.query(Reservation).filter(
        Reservation.book_id == book_id,
        Reservation.status.in_(["pending", "confirmed_by_owner", "handed_over"])
    ).count()

    if active_reservations > 0:
        raise ValueError("Вы не можете удалить книгу с активными бронированиями")

    try:
        db.query(BookLocation).filter(BookLocation.book_id == book_id).delete()
        db.query(UserReadBooks).filter(UserReadBooks.book_id == book_id).delete()
        db.query(Reservation).filter(Reservation.book_id == book_id).delete()

        if book.cover_image_key:
            try:
                minio_service.delete_file(book.cover_image_key)
                logger.info(f"Deleted cover: {book.cover_image_key}")
            except Exception as e:
                logger.error(f"Error deleting cover: {e}")

        db.delete(book)
        db.commit()
        return True

    except Exception as e:
        db.rollback()
        raise ValueError(f"Ошибка при удалении книги: {str(e)}")


def update_status_by_admin(db: Session, book_id: int, new_status: str) -> Book:
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise ValueError("Книга не найдена")

    allowed = {"available", BOOK_STATUS_MARKED_FOR_DELETION}

    if new_status not in allowed:
        raise ValueError(f"Invalid status: {new_status}")

    book.status = new_status
    db.add(book)
    db.commit()
    db.refresh(book)
    return book


def get_books_marked_for_deletion(
    db: Session,
    skip: int = 0,
    limit: int = 100,
) -> List[Book]:
    return (
        db.query(Book)
        .filter(Book.status == BOOK_STATUS_MARKED_FOR_DELETION)
        .offset(skip)
        .limit(limit)
        .all()
    )


def count_books_marked_for_deletion(db: Session) -> int:
    return db.query(Book).filter(Book.status == "marked_for_deletion").count()
