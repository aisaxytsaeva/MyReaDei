from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional
from sqlalchemy.orm import Session, joinedload
from models.books import Book
from models.reservations import Reservation
from models.user_read_books import UserReadBooks
from models.locations import Location
from schemas.reservation import ReservationCreate, ReservationResponse, ReturnPeriod, LocationInfo

def get_user_completed_reservations_count(db: Session, user_id: int) -> int:
    return db.query(Reservation).filter(
        Reservation.borrower_id == user_id,
        Reservation.status == "returned"
    ).count()

def create_reservation(db: Session, reservation_data: ReservationCreate, borrower_id: int) -> Reservation:
    book = db.query(Book).filter(Book.id == reservation_data.book_id).first()
    if not book:
        raise ValueError("Книга не найдена")
    if book.status != "available":
        raise ValueError("Книга недоступна для бронирования")
    
 
    planned_return_days_int = int(reservation_data.planned_return_days.value)
    
    db_reservation = Reservation(
        book_id=reservation_data.book_id,
        borrower_id=borrower_id,
        location_id=reservation_data.selected_location_id,
        status="pending",
        planned_return_days=planned_return_days_int  
    ) 
    
    db.add(db_reservation)
    db.commit()
    db.refresh(db_reservation)

    book.status = "booked"  
    book.updated_at = datetime.now()
    db.commit()
    db.refresh(book)  
    
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

def get_reservation(db: Session, reservation_id: int) -> Optional[ReservationResponse]:
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

    location_info = LocationInfo(
        id=reservation.selected_location.id if reservation.selected_location else None,
        name=reservation.selected_location.name if reservation.selected_location else "Неизвестный адрес",
        address=reservation.selected_location.address if reservation.selected_location else ""
    )
    
    return ReservationResponse(
        id=reservation.id, 
        book_id=reservation.book_id,
        book_title=reservation.book.title if reservation.book else "Неизвестная книга",
        status=reservation.status,
        created_at=reservation.created_at.isoformat() if reservation.created_at else "",
        planned_return_date=planned_return_date.isoformat() if planned_return_date else "",
        selected_location=location_info
    )

def close_reservation(db: Session, reservation_id: int) -> Optional[Reservation]:
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
        db.commit()  

    read_book = UserReadBooks(
        book_id=reservation.book_id,
        user_id=reservation.borrower_id,
        reservation_id=reservation.id,
        read_at=datetime.now(),
        created_at=datetime.now()
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

def get_user_reservations(db: Session, user_id: int, skip: int = 0, limit: int = 100) -> List[ReservationResponse]:
    reservations = db.query(Reservation).filter(Reservation.borrower_id == user_id).options(
        joinedload(Reservation.book),
        joinedload(Reservation.selected_location)
    ).offset(skip).limit(limit).all()

    users_reservations = []

    for reservation in reservations:
        if reservation.created_at and reservation.planned_return_days:
            planned_return_date = (reservation.created_at + timedelta(days=reservation.planned_return_days)).isoformat()
        else:
            planned_return_date = ""


        location_info = LocationInfo(
            id=reservation.selected_location.id if reservation.selected_location else None,
            name=reservation.selected_location.name if reservation.selected_location else "Неизвестный адрес",
            address=reservation.selected_location.address if reservation.selected_location else ""
        )

        users_reservations.append(ReservationResponse(
            id=reservation.id, 
            book_id=reservation.book_id,
            book_title=reservation.book.title if reservation.book else "Неизвестная книга",
            status=reservation.status,
            created_at=reservation.created_at.isoformat() if reservation.created_at else "",
            planned_return_date=planned_return_date,  
            selected_location=location_info
        ))
    
    return users_reservations  

def get_owner_reservations(
    db: Session, 
    owner_id: int, 
    skip: int = 0, 
    limit: int = 100,
    status_filter: Optional[str] = None
) -> List[ReservationResponse]:
    user_books = db.query(Book.id).filter(Book.owner_id == owner_id).all()
    book_ids = [book.id for book in user_books]
    
    if not book_ids:
        return []

    reservations_query = db.query(Reservation).filter(
        Reservation.book_id.in_(book_ids)
    ).options(
        joinedload(Reservation.book),
        joinedload(Reservation.selected_location)
    )
    
    if status_filter:
        reservations_query = reservations_query.filter(Reservation.status == status_filter)
    
    reservations = reservations_query.offset(skip).limit(limit).all()
    
    result = []
    for reservation in reservations:
        if reservation.created_at and reservation.planned_return_days:
            planned_return_date = (
                reservation.created_at + timedelta(days=reservation.planned_return_days)
            ).isoformat()
        else:
            planned_return_date = ""

        location_info = LocationInfo(
            id=reservation.selected_location.id if reservation.selected_location else None,
            name=reservation.selected_location.name if reservation.selected_location else "Неизвестный адрес",
            address=reservation.selected_location.address if reservation.selected_location else ""
        )
        
        result.append(ReservationResponse(
            id=reservation.id,
            book_id=reservation.book_id,
            book_title=reservation.book.title if reservation.book else "Неизвестная книга",
            status=reservation.status,
            created_at=reservation.created_at.isoformat() if reservation.created_at else "",
            planned_return_date=planned_return_date,
            selected_location=location_info
        ))
    
    return result

def get_user_reservations_stats(db: Session, user_id: int) -> Dict[str, Any]:
    as_borrower = db.query(Reservation).filter(
        Reservation.borrower_id == user_id
    )

    user_book_ids = db.query(Book.id).filter(Book.owner_id == user_id).subquery()
    as_owner = db.query(Reservation).filter(Reservation.book_id.in_(user_book_ids))
    
    stats = {
        "as_borrower": {
            "total": as_borrower.count(),
            "pending": as_borrower.filter(Reservation.status == "pending").count(),
            "active": as_borrower.filter(Reservation.status.in_(["confirmed_by_owner", "handed_over"])).count(),
            "completed": as_borrower.filter(Reservation.status == "returned").count(),
            "cancelled": as_borrower.filter(Reservation.status == "cancelled").count()
        },
        "as_owner": {
            "total": as_owner.count(),
            "pending": as_owner.filter(Reservation.status == "pending").count(),
            "active": as_owner.filter(Reservation.status.in_(["confirmed_by_owner", "handed_over"])).count(),
            "completed": as_owner.filter(Reservation.status == "returned").count(),
            "cancelled": as_owner.filter(Reservation.status == "cancelled").count()
        }
    }
    
    return stats

def get_reservation_by_id_with_access_check(
    db: Session, 
    reservation_id: int, 
    user_id: int
) -> Optional[ReservationResponse]:
    reservation = get_reservation(db, reservation_id)
    if not reservation:
        return None
    
    reservation_obj = db.query(Reservation).filter(Reservation.id == reservation_id).first()
    book = db.query(Book).filter(Book.id == reservation_obj.book_id).first()
    
    if (reservation_obj.borrower_id != user_id and 
        (not book or book.owner_id != user_id)):
        return None
    
    return reservation