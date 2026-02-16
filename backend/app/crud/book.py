
from fastapi import Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from models.user_read_books import UserReadBooks
from models.book_location import BookLocation
from core.security import get_current_user
from models.books import Book
from models.locations import Location
from models.reservations import Reservation
from models.users import User
from schemas.books import BookCreate, BookResponse, BookUpdate, Catalog


def get_readers_count(db: Session, book_id: int) -> int:
    return db.query(func.count(UserReadBooks.id)).filter(
            UserReadBooks.book_id == book_id
        ).scalar() or 0

def get_users_books_count(db: Session, user_id: int) -> int:
    return db.query(Book).filter(Book.owner_id == user_id).count()

def get_catalog_books(db: Session, skip: int = 0, limit: int = 100, sort_by: str = "title") -> List[Catalog]:
    books = db.query(Book).offset(skip).limit(limit).all()
    
    catalog_books = []
    for book in books:
        readers_count = get_readers_count(db, book.id)
        
        catalog_books.append(Catalog(
            id=book.id,
            title=book.title,
            author=book.author,
            cover_image_uri=book.cover_image_uri,
            readers_count=readers_count
        ))

    if sort_by == "readers":
        catalog_books.sort(key=lambda x: x.readers_count, reverse=True)
    elif sort_by == "title":
        catalog_books.sort(key=lambda x: x.title)
    elif sort_by == "author":
        catalog_books.sort(key=lambda x: x.author)
    
    return catalog_books


def get_users_books(db: Session, user_id: int, skip: int = 0, limit: int = 100) -> List[Catalog]:
    books = db.query(Book).filter(Book.owner_id == user_id).offset(skip).limit(limit).all()
    
    user_books = []
    for book in books:
        readers_count = get_readers_count(db, book.id)
        
        user_books.append(Catalog(
            id=book.id,
            title=book.title,
            author=book.author,
            cover_image_uri=book.cover_image_uri,
            readers_count=readers_count
        ))
    
    return user_books


def create_book(db: Session, book_data: BookCreate, user_id: int) -> Book:

    db_book = Book(
        title=book_data.title,
        author=book_data.author,
        description=book_data.description,
        cover_image_uri=book_data.cover_image_uri,
        owner_id=user_id,  
        status="available"  
    )
    db.add(db_book)
    db.commit()
    db.refresh(db_book)  
    

    for location_id in book_data.location_ids:
        book_location = BookLocation(
            book_id=db_book.id,
            location_id=location_id
        )
        db.add(book_location)
    
    db.commit()
    return db_book

def get_book_with_details(db: Session, book_id: int) -> Optional[BookResponse]:
    book = db.query(Book).filter(Book.id == book_id).first()
    
    if not book:
        return None
    

    readers_count = get_readers_count(db, book.id)
    
    locations = db.query(Location.name).join(
        BookLocation, BookLocation.location_id == Location.id
    ).filter(BookLocation.book_id == book.id).all()
    
    location_names = [loc[0] for loc in locations]

    return {
        "id": book.id,
        "title": book.title,
        "author": book.author,
        "description": book.description or "",
        "cover_image_uri": book.cover_image_uri or "",
        "reader_count": readers_count or 0,  
        "locations": location_names,
        "owner_id": book.owner_id,
        "status": book.status or "available"
    }

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
        

        db.delete(book)
        db.commit()
        
        return True
        
    except Exception as e:
        db.rollback()
        raise ValueError(f"Ошибка при удалении книги: {str(e)}")

def update_book(
    db: Session, 
    book_id: int, 
    book_data: BookUpdate, 
    user_id: int
) -> Book:


    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise ValueError("Книга не найдена")

    if book.owner_id != user_id:
        raise ValueError("Вы не являетесь владельцем этой книги")

    if book_data.status and book_data.status != book.status:
        active_reservations = db.query(Reservation).filter(
            Reservation.book_id == book_id,
            Reservation.status.in_(["pending", "confirmed_by_owner", "handed_over"])
        ).count()
        
        if active_reservations > 0 and book_data.status == "unavailable":
            raise ValueError("Нельзя сделать книгу недоступной при активных бронированиях")
    
    try:

        update_data = book_data.dict(exclude_unset=True)
        

        for field, value in update_data.items():
            setattr(book, field, value)

        book.updated_at = func.now()
        
        db.commit()

        
        return book
        
    except Exception as e:
        db.rollback()
        raise ValueError(f"Ошибка при обновлении книги: {str(e)}")


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