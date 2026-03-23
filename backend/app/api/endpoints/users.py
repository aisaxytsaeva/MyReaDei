from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from requests import Session

from app.schemas.auth import UserResponse
from app.core.db import get_db
from app.core.security import get_current_user
from app.crud.user import get_user_by_id, update_user
from app.models.users import User
from app.schemas.books import Catalog
from app.schemas.user import  UserProfile, UserUpdate
from app.crud import reservation as reservations_crud
from app.crud import book as books_crud


router = APIRouter(prefix="/users", tags=["users"])

@router.get("/me", response_model=UserProfile)
async def read_users_me(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    book_added = books_crud.get_users_books_count(db, current_user.id)
    book_borrowed = reservations_crud.get_user_completed_reservations_count(db, current_user.id)
    
    return UserProfile(
        id=current_user.id,
        username=current_user.username,
        email=current_user.email,
        book_added=book_added,
        book_borrowed=book_borrowed
    )

@router.put("/me")
async def update_user_profile(
    user_update: UserUpdate, 
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    updated_user = update_user(db, current_user.id, user_update)
    if not updated_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {
        "message": "Profile updated successfully",
        "user": {
            "id": updated_user.id,
            "username": updated_user.username,
            "email": updated_user.email
        }
    }

@router.get("/stats/my")
async def get_my_reservations_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    stats = reservations_crud.get_user_reservations_stats(db, current_user.id)
    return stats

@router.get("/book/my", response_model=List[Catalog])
async def get_my_books(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_books = books_crud.get_users_books(db, current_user.id, skip=skip, limit=limit)
    return user_books

@router.get("/{user_id}/books", response_model=List[Catalog])
async def get_my_books(
    user_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db)
):
    user_books = books_crud.get_users_books(db, user_id, skip=skip, limit=limit)
    return user_books


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: int,
    db: Session = Depends(get_db)
):
    user = get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    return UserResponse(
        id=user.id,
        username=user.username,
        email=user.email,
        role=user.role,
        is_active=user.is_active,
        created_at=user.created_at
    )