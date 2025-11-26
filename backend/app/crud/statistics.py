from sqlalchemy import func, desc
from sqlalchemy.orm import Session
from typing import List, Optional
from models.book_location import BookLocation
from models.locations import Location
from schemas.statistics import PlatformStats, PopularBook, PopularLocation
from models.books import Book
from models.reservations import Reservation
from models.users import User
from sqlalchemy import func, desc
from datetime import datetime, timedelta
from typing import List, Optional

def get_popular_books(db: Session, skip: int = 0, limit: int = 10, days: Optional[int] = None) -> List[PopularBook]:
    query = db.query(
        Book.id,
        Book.title, 
        Book.author,
        Book.cover_image_uri,
        func.count(Reservation.id).label('reservation_count')
    ).join(
        Reservation, Book.id == Reservation.book_id
    )
    
    if days:
        date_threshold = datetime.now() - timedelta(days=days)
        query = query.filter(Reservation.created_at >= date_threshold)
    
    popular_books = query.group_by(
        Book.id, Book.title, Book.author, Book.cover_image_uri  
    ).order_by(
        desc('reservation_count')
    ).offset(skip).limit(limit).all()
    
    return [
        PopularBook(
            id=book.id,
            title=book.title,
            author=book.author,
            cover_image=book.cover_image_uri or "", 
            reservation_count=book.reservation_count
        )
        for book in popular_books
    ]

def get_platform_stats(db: Session) -> PlatformStats:
    total_books = db.query(func.count(Book.id)).scalar() or 0
    
    total_users = db.query(func.count(User.id)).scalar() or 0
    
    total_reservations = db.query(func.count(Reservation.id)).scalar() or 0
    
    active_reservations = db.query(func.count(Reservation.id)).filter(
        Reservation.status.in_(['pending', 'confirmed_by_owner', 'handed_over'])
    ).scalar() or 0
    
    available_books = db.query(func.count(Book.id)).filter(
        Book.status == 'available'
    ).scalar() or 0
    
    return PlatformStats(
        total_books=total_books,
        total_users=total_users,
        total_reservations=total_reservations,
        active_reservations=active_reservations,
        available_books=available_books  
    )

def get_popular_locations(db: Session, limit: int = 10) -> List[PopularLocation]:   
    popular_locations = db.query(
        Location.id,
        Location.name,
        Location.address,
        func.count(BookLocation.book_id).label('books_count'),
        func.count(Reservation.id).label('reservations_count')
    ).join(
        BookLocation, Location.id == BookLocation.location_id
    ).join(
        Reservation, Location.id == Reservation.location_id, isouter=True
    ).filter(
        Location.is_approved == True
    ).group_by(
        Location.id, Location.name, Location.address
    ).order_by(
        desc('books_count')
    ).limit(limit).all()
    
    return [
        PopularLocation(
            id=location.id,
            name=location.name,
            address=location.address,
            books_count=location.books_count,
            reservations_count=location.reservations_count or 0
        )
        for location in popular_locations
    ]