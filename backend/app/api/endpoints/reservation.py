from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from datetime import datetime, timedelta
from core.db import get_db
from core.security import get_current_user
from crud import reservation as reservations_crud
from models.users import User
from schemas.reservation import ReservationCreate, ReservationResponse

router = APIRouter(prefix="/reservations", tags=["reservations"])


@router.post("/", response_model=ReservationResponse, status_code=status.HTTP_201_CREATED)
async def create_reservation(
    reservation_data: ReservationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    try:
        reservation = reservations_crud.create_reservation(
            db, reservation_data, current_user.id
        )
        return reservations_crud.get_reservation(db, reservation.id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/my", response_model=List[ReservationResponse])
async def get_my_reservations(
    skip: int = Query(0, ge=0, description="Смещение для пагинации"),
    limit: int = Query(100, ge=1, le=1000, description="Лимит записей"),
    status_filter: Optional[str] = Query(None, description="Фильтр по статусу"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    reservations = reservations_crud.get_user_reservations(
        db, current_user.id, skip=skip, limit=limit
    )
    
    if status_filter:
        reservations = [r for r in reservations if r.status == status_filter]
    
    return reservations


@router.get("/{reservation_id}", response_model=ReservationResponse)
async def get_reservation(
    reservation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    reservation = reservations_crud.get_reservation_by_id_with_access_check(
        db, reservation_id, current_user.id
    )
    if not reservation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reservation not found or access denied"
        )
    
    return reservation


@router.post("/{reservation_id}/confirm", response_model=ReservationResponse)
async def confirm_reservation(
    reservation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    try:
        reservation = reservations_crud.confirm_reservation(
            db, reservation_id, current_user.id
        )
        return reservations_crud.get_reservation(db, reservation.id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/{reservation_id}/close", response_model=ReservationResponse)
async def close_reservation(
    reservation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    try:
        reservation = reservations_crud.close_reservation(db, reservation_id)
        if not reservation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Reservation not found"
            )
        return reservations_crud.get_reservation(db, reservation.id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/{reservation_id}/cancel", response_model=ReservationResponse)
async def cancel_reservation(
    reservation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        reservation = reservations_crud.cancel_reservation(
            db, reservation_id, current_user.id
        )
        return reservations_crud.get_reservation(db, reservation.id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/as-owner/", response_model=List[ReservationResponse])
async def get_owner_reservations(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    status_filter: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    reservations = reservations_crud.get_owner_reservations(
        db, current_user.id, skip=skip, limit=limit, status_filter=status_filter
    )
    return reservations




