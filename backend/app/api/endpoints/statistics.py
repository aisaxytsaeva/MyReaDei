from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from requests import Session

from app.core.db import get_db
from app.schemas.statistics import PlatformStats, PopularBook
from app.crud import statistics as stats_crud

router = APIRouter(prefix="/statistics", tags=["statistics"])

@router.get("/platform", response_model=PlatformStats)
async def get_platform_stats(
    db: Session = Depends(get_db)
):

    stats = stats_crud.get_platform_stats(db)
    return stats


@router.get("/books/popular", response_model=List[PopularBook])
async def get_popular_books_stats(
    limit: int = Query(10, ge=1, le=100, description="Количество книг"),
    days: Optional[int] = Query(None, ge=1, description="За последние N дней"),
    db: Session = Depends(get_db)
):

    popular_books = stats_crud.get_popular_books(db, limit=limit, days=days)
    return popular_books


@router.get("/users/active")
async def get_active_users_stats(
    days: int = Query(30, ge=1, description="За последние N дней"),
    db: Session = Depends(get_db)
):
    active_users = stats_crud.get_active_users_count(db, days=days)
    return {"active_users": active_users, "period_days": days}


@router.get("/locations/popular")
async def get_popular_locations_stats(
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db)
):
    popular_locations = stats_crud.get_popular_locations(db, limit=limit)
    return popular_locations