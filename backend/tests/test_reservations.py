# tests/test_reservations.py
import pytest
from datetime import datetime, timedelta
from app.models.reservations import Reservation
from app.models.books import Book
from app.models.users import User
from app.crud import reservation as reservations_crud
from app.schemas.reservation import ReservationCreate, ReturnPeriod
from app.core.security import get_password_hash

class TestReservations:

    def test_create_reservation_success(self, db_session, test_user, test_book, test_location):
        reservation_data = ReservationCreate(
            book_id=test_book.id,
            selected_location_id=test_location.id,
            planned_return_days=ReturnPeriod.FOURTEEN_DAYS
        )
        
        reservation = reservations_crud.create_reservation(
            db_session, reservation_data, test_user.id
        )
        
        assert reservation.id is not None
        assert reservation.book_id == test_book.id
        assert reservation.borrower_id == test_user.id
        assert reservation.location_id == test_location.id
        assert reservation.status == "pending"
        assert reservation.planned_return_days == 14

    def test_cannot_reserve_unavailable_book(self, db_session, test_user, test_book, test_location):
        reservation_data = ReservationCreate(
            book_id=test_book.id,
            selected_location_id=test_location.id,
            planned_return_days=ReturnPeriod.FOURTEEN_DAYS
        )
        reservations_crud.create_reservation(db_session, reservation_data, test_user.id)
        
        with pytest.raises(ValueError) as exc_info:
            reservations_crud.create_reservation(db_session, reservation_data, test_user.id)
        
        error_msg = str(exc_info.value).lower()
        assert "недоступна" in error_msg or "unavailable" in error_msg

    def test_confirm_reservation_by_owner(self, db_session, test_user, test_book, test_location):
        reservation_data = ReservationCreate(
            book_id=test_book.id,
            selected_location_id=test_location.id,
            planned_return_days=ReturnPeriod.FOURTEEN_DAYS
        )
        reservation = reservations_crud.create_reservation(
            db_session, reservation_data, test_user.id
        )
        
        confirmed = reservations_crud.confirm_reservation(
            db_session, reservation.id, test_user.id
        )
        
        assert confirmed.status == "confirmed_by_owner"

    def test_non_owner_cannot_confirm_reservation(self, db_session, test_user, test_book, test_location):
        other_user = User(
            username="other",
            email="other@test.com",
            password_hash=get_password_hash("other123")
        )
        db_session.add(other_user)
        db_session.commit()
        db_session.refresh(other_user)
        
        reservation_data = ReservationCreate(
            book_id=test_book.id,
            selected_location_id=test_location.id,
            planned_return_days=ReturnPeriod.FOURTEEN_DAYS
        )
        reservation = reservations_crud.create_reservation(
            db_session, reservation_data, test_user.id
        )
        
        with pytest.raises(ValueError) as exc_info:
            reservations_crud.confirm_reservation(
                db_session, reservation.id, other_user.id
            )
        
        error_msg = str(exc_info.value).lower()
        assert "владельцем" in error_msg or "owner" in error_msg

    def test_close_reservation_return_book(self, db_session, test_user, test_book, test_location):
        reservation_data = ReservationCreate(
            book_id=test_book.id,
            selected_location_id=test_location.id,
            planned_return_days=ReturnPeriod.FOURTEEN_DAYS
        )
        reservation = reservations_crud.create_reservation(
            db_session, reservation_data, test_user.id
        )
        reservation = reservations_crud.confirm_reservation(
            db_session, reservation.id, test_user.id
        )
        
        closed = reservations_crud.close_reservation(db_session, reservation.id)
        
        assert closed is not None
        assert closed.status == "returned"
        assert closed.returned_at is not None
        
        book = db_session.query(Book).filter(Book.id == test_book.id).first()
        assert book.status == "available"

    def test_cancel_pending_reservation_by_borrower(self, db_session, test_user, test_book, test_location):
        reservation_data = ReservationCreate(
            book_id=test_book.id,
            selected_location_id=test_location.id,
            planned_return_days=ReturnPeriod.FOURTEEN_DAYS
        )
        reservation = reservations_crud.create_reservation(
            db_session, reservation_data, test_user.id
        )
        
        cancelled = reservations_crud.cancel_reservation(
            db_session, reservation.id, test_user.id
        )
        
        assert cancelled.status == "cancelled"
        
        book = db_session.query(Book).filter(Book.id == test_book.id).first()
        assert book.status == "available"

    def test_cancel_pending_reservation_by_owner(self, db_session, test_user, test_book, test_location):
        reservation_data = ReservationCreate(
            book_id=test_book.id,
            selected_location_id=test_location.id,
            planned_return_days=ReturnPeriod.FOURTEEN_DAYS
        )
        reservation = reservations_crud.create_reservation(
            db_session, reservation_data, test_user.id
        )
        
        cancelled = reservations_crud.cancel_reservation(
            db_session, reservation.id, test_user.id
        )
        
        assert cancelled.status == "cancelled"

    def test_cancel_confirmed_reservation_by_borrower(self, db_session, test_user, test_book, test_location):
        reservation_data = ReservationCreate(
            book_id=test_book.id,
            selected_location_id=test_location.id,
            planned_return_days=ReturnPeriod.FOURTEEN_DAYS
        )
        reservation = reservations_crud.create_reservation(
            db_session, reservation_data, test_user.id
        )
        reservation = reservations_crud.confirm_reservation(
            db_session, reservation.id, test_user.id
        )
        
        try:
            cancelled = reservations_crud.cancel_reservation(db_session, reservation.id, test_user.id)
            assert cancelled.status in ["cancelled", "returned"]
        except ValueError as e:
            error_msg = str(e).lower()
            assert "отменить" in error_msg or "cancel" in error_msg

    def test_get_user_reservations(self, db_session, test_user, test_book, test_location):
        reservation_data = ReservationCreate(
            book_id=test_book.id,
            selected_location_id=test_location.id,
            planned_return_days=ReturnPeriod.FOURTEEN_DAYS
        )
        reservations_crud.create_reservation(db_session, reservation_data, test_user.id)
        
        reservations = reservations_crud.get_user_reservations(db_session, test_user.id)
        
        assert len(reservations) >= 1
        assert reservations[0].book_id == test_book.id
        assert reservations[0].status == "pending"

    def test_get_owner_reservations(self, db_session, test_user, test_book, test_location):
        reservation_data = ReservationCreate(
            book_id=test_book.id,
            selected_location_id=test_location.id,
            planned_return_days=ReturnPeriod.FOURTEEN_DAYS
        )
        reservations_crud.create_reservation(db_session, reservation_data, test_user.id)
        
        reservations = reservations_crud.get_owner_reservations(db_session, test_user.id)
        
        assert len(reservations) >= 1
        assert reservations[0].book_id == test_book.id

    def test_get_reservation_by_id_with_access(self, db_session, test_user, test_book, test_location):
        reservation_data = ReservationCreate(
            book_id=test_book.id,
            selected_location_id=test_location.id,
            planned_return_days=ReturnPeriod.FOURTEEN_DAYS
        )
        reservation = reservations_crud.create_reservation(
            db_session, reservation_data, test_user.id
        )
        
        result = reservations_crud.get_reservation_by_id_with_access_check(
            db_session, reservation.id, test_user.id
        )
        
        assert result is not None
        assert result.book_id == test_book.id