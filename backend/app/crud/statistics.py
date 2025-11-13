from sqlalchemy import func, desc
from sqlalchemy.orm import Session
from typing import List, Optional
from schemas.statistics import PlatformStats, PopularBook
from models.books import Book
from models.reservations import Reservation
from models.users import User

def get_popular_books(db: Session, skip: int =0, limit: int = 10, days: Optional[int] = None) -> List[PopularBook]:
    query = db.query(
        Book.id,
        Book.title, 
        Book.author,
        Book.cover_image_uri.label('cover_image'),
        func.count(Reservation.id).label('reservation_count')
    ).join(
        Reservation, Book.id == Reservation.book_id
    )
    
    if days:
        from datetime import datetime, timedelta
        date_threshold = datetime.now() - timedelta(days=days)
        query = query.filter(Reservation.created_at >= date_threshold)
    
    popular_books = query.group_by(
        Book.id
    ).order_by(
        desc('reservation_count')
    ).offset(skip).limit(limit).all()
    
    return [
        PopularBook(
            id=book.id,
            title=book.title,
            author=book.author,
            cover_image=book.cover_image or "",
            reservation_count=book.reservation_count
        )
        for book in popular_books
    ]

def get_platform_stats(db: Session) -> PlatformStats:

    total_books = db.query(func.count(Book.id)).scalar() or 0
    
    total_users = db.query(func.count(User.id)).scalar() or 0
    
    total_reservations = db.query(func.count(Reservation.id)).scalar() or 0
    
    active_reservations = db.query(func.count(Reservation.id)).filter(
        Reservation.status == 'active'  # или другой статус для активных
    ).scalar() or 0
    
    return PlatformStats(
        total_books=total_books,
        total_users=total_users,
        total_reservations=total_reservations,
        active_reservations=active_reservations
    )
