
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from app.models.user_read_books import UserReadBooks
from app.models.book_location import BookLocation
from backend.app.models.books import Books
from backend.app.models.locations import Locations
from backend.app.models.reservations import Reservations
from backend.app.schemas import location
from backend.app.schemas.books import BookCreate, BookResponse, Catalog


def get_readers_count(db: Session, book_id: int) -> int:
    return db.query(func.count(UserReadBooks.id)).filter(
            UserReadBooks.book_id == book_id
        ).scalar() or 0

def get_catalog_books(db: Session, skip: int = 0, limit: int = 100) -> List[Catalog]:
    books = db.query(Books).offset(skip).limit(limit).all()
    
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
    
    return catalog_books


def get_users_books(db: Session, user_id: int, skip: int = 0, limit: int = 100) -> List[Catalog]:
    books = db.query(Books).filter(Books.owner_id == user_id).offset(skip).limit(limit).all()
    
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


def create_book_with_locations(db: Session, book_data: BookCreate, owner_id: int) -> Books:
    db_book = Books(
        title=book_data.title,
        author=book_data.author,
        description=book_data.description,
        cover_image_uri=book_data.cover_image_uri,
        owner_id=owner_id
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
    
    book = db.query(Books).filter(Books.id == book_id).first()
    
    if not book:
        return None
    
    
    readers_count = get_readers_count(db, book.id)
    
    
    locations = db.query(Locations.name).join(
        BookLocation, BookLocation.location_id == Locations.id
    ).filter(BookLocation.book_id == book.id).all()
    
    location_names = [loc[0] for loc in locations]
    
    return BookResponse(
        id=book.id,
        title=book.title,
        author=book.author,
        description=book.description,
        cover_image_uri=book.cover_image_uri,
        readers_count=readers_count or 0,
        locations=location_names,
        owner_id=book.owner_id,
        status=book.status
    )


def delete_book(db:Session, book_id: int, user_id: int):
    book = db.query(Books).filter(Books.id == book_id).first()
    if not book:
        return ValueError("Книга не найдена")
    if book.owner_id != user_id:
        return ValueError("Вы не являетесь владельцем этой книги. Удаление недоступно")
    

    actinve_reservations = db.query(Reservations).filter(Reservations.book_id == book_id, Reservations.status.in_(["pending", "handed_over"])).count

    if actinve_reservations > 0:
        return ValueError("Вы не можете удалить забронированную книгу")
    
    try:
        
        book_locations = db.query(BookLocation).filter(BookLocation.book_id == book_id).all()
        for book_location in book_locations:
            db.delete(book_location)
        
        
        read_records = db.query(UserReadBooks).filter(UserReadBooks.book_id == book_id).all()
        for read_record in read_records:
            db.delete(read_record)
        
        
        db.delete(book)
        db.commit()
        
        return True
        
    except Exception as e:
        db.rollback()
        raise ValueError(f"Ошибка при удалении книги: {str(e)}")
    return 