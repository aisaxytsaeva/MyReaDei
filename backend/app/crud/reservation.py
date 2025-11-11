from datetime import datetime, timedelta
from typing import List, Optional
from sqlalchemy.orm import Session, joinedload
from backend.app.models.books import Book
from backend.app.models.reservations import Reservation
from backend.app.models.user_read_books import UserReadBooks
from backend.app.schemas.reservation import ReservationCreate, ReservationResponse
from core.db import Base


def create_reservation(db:Session, reservation_data:ReservationCreate, borrower_id: int) -> Reservation:
    db_reservation = Reservation(
        book_id = reservation_data.book_id,
        borrower_id = borrower_id ,
        selected_location_id = reservation_data.selected_location_id,
        status = "pending",
        planned_return_days = reservation_data.planned_return_days.value
        
    ) 
    db.add(db_reservation)
    db.commit()
    db.refresh(db_reservation)
    book = db.query(Book).filter(Book.id == reservation_data.book_id).first()
    if book:
        book.status = "booked"  
        book.updated_at = datetime.now()
        db.commit()
    

    
    return db_reservation


def confirm_reservation(db: Session, reservation_id: int, owner_id: int) -> Reservation:
    reservation = db.query(Reservation).filter(Reservation.id == reservation_id).first()
    
    if not reservation:
        raise ValueError("Бронирование не найдено")
    

    book = db.query(Book).filter(Book.id == reservation.book_id).first()
    if not book or book.owner_id != owner_id:
        raise ValueError("Вы не являетесь владельцем этой книги")
 
    if reservation.status != "pending":
        raise ValueError(f"Невозможно подтвердить бронь со статусом: {reservation.status}")

    reservation.status = "confirmed_by_owner"
    reservation.updated_at = datetime.now()
    
    db.commit()
    db.refresh(reservation)
    
    return reservation

def get_reservation(db:Session, reservation_id: int) -> Optional[ReservationResponse]:
    reservation = db.query(Reservation).options(
        joinedload(Reservation.book),
        joinedload(Reservation.selected_location)
    ).filter(Reservation.id == reservation_id).first()

    if not reservation:
        return None
    
    if reservation.created_at and reservation.planned_return_days:
        planned_return_date = reservation.created_at + timedelta(days=reservation.planned_return_days)
    else:
        planned_return_date = None
    
    return ReservationResponse(
        id=reservation.id, 
        book_id=reservation.book_id,
        book_title=reservation.book.title if reservation.book else "Неизвестная книга",
        status=reservation.status,
        created_at=reservation.created_at.isoformat() if reservation.created_at else "",
        planned_return_date=planned_return_date.isoformat() if planned_return_date else "",
        selected_location={
            "id": reservation.selected_location.id if reservation.selected_location else None,
            "name": reservation.selected_location.name if reservation.selected_location else "Неизвестный адрес",
            "address": reservation.selected_location.address if reservation.selected_location else ""
        }
    )

def close_reservation(db: Session, reservation_id:int) -> Optional[Reservation]:
    reservation = db.query(Reservation).filter(Reservation.id == reservation_id).first()

    if not reservation:
        return None
    
    if reservation.status == "returned":
        raise ValueError("Книга уже возвращена")

    reservation.status = "returned"
    reservation.returned_at = datetime.now()
    reservation.updated_at = datetime.now()

    book = db.query(Book).filter(Book.id == reservation.book_id).first()
    if book:
        book.status = "available"  
        book.updated_at = datetime.now()
    

    read_book = UserReadBooks(
        book_id = reservation.book_id,
        user_id = reservation.borrower_id,
        reservation_id = reservation.id,
        read_at = datetime.now(),
        created_at = datetime.now()
    )
    db.add(read_book)
    db.commit()
    db.refresh(reservation)

    return reservation

def cancel_reservation(db: Session, reservation_id: int, user_id: int) -> Optional[Reservation]:
    reservation = db.query(Reservation).filter(Reservation.id == reservation_id).first()

    if not reservation:
        raise ValueError("Бронирование не найдено")
    
    book = db.query(Book).filter(Book.id == reservation.book_id).first()
    if not book:
        raise ValueError("Книга не найдена")
    
    is_owner = book.owner_id == user_id
    is_borrower = reservation.borrower_id == user_id
    
    if not (is_owner or is_borrower):
        raise ValueError("Недостаточно прав для отмены этого бронирования")
    
    if reservation.status == "cancelled":
        raise ValueError("Бронирование уже отменено")
    
    if reservation.status == "returned":
        raise ValueError("Нельзя отменить завершенное бронирование")
    
    if reservation.status == "handed_over":
        raise ValueError("Нельзя отменить бронирование после передачи книги")
    
    
    reservation.status = "cancelled"
    reservation.updated_at = datetime.now()
    
    
    book.status = "available"
    book.updated_at = datetime.now()
    
    db.commit()
    db.refresh(reservation)
    
    return reservation

def get_user_reservations(db:Session, user_id: int, skip: int = 0, limit: int = 100) -> List[ReservationResponse]:
    reservations = db.query(Reservation).filter(Reservation.borrower_id == user_id ).options(
        joinedload(Reservation.book),
        joinedload(Reservation.selected_location)
    ).offset(skip).limit(limit).all()

    users_reservations = []

    for reservation in reservations:
        if reservation.created_at and reservation.planned_return_days:
            planned_return_date = (reservation.created_at + timedelta(days=reservation.planned_return_days)).isoformat()
        else:
            planned_return_date = ""

    for reservation in reservations:
        users_reservations.append(ReservationResponse(
        id=reservation.id, 
        book_id=reservation.book_id,
        book_title=reservation.book.title if reservation.book else "Неизвестная книга",
        status=reservation.status,
        created_at=reservation.created_at.isoformat() if reservation.created_at else "",
        planned_return_date=planned_return_date.isoformat() if planned_return_date else "",
        selected_location={
            "id": reservation.selected_location.id if reservation.selected_location else None,
            "name": reservation.selected_location.name if reservation.selected_location else "Неизвестный адрес",
            "address": reservation.selected_location.address if reservation.selected_location else ""
        }
        ))