from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List
from app.core.permissions import UserRole
from app.crud import locations
from app.core.db import get_db
from app.core.security import get_current_user, require_moderator_or_admin

from app.models.users import User
from app.schemas.location import (
    LocationCreate,
    LocationResponse,
    LocationUpdate,
    LocationWithStats
)

router = APIRouter(prefix="/locations", tags=["locations"])


@router.post("/", response_model=LocationResponse, status_code=status.HTTP_201_CREATED)
async def create_location(
    location_data: LocationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        location = locations.create_location(db, location_data, current_user.id)
        return location
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/", response_model=List[LocationResponse])
async def get_locations(
    skip: int = Query(0, ge=0, description="Смещение для пагинации"),
    limit: int = Query(100, ge=1, le=1000, description="Лимит записей"),
    approved_only: bool = Query(True, description="Только подтвержденные локации"),
    db: Session = Depends(get_db)
):
    location_list = locations.get_locations(
        db, skip=skip, limit=limit, approved_only=approved_only
    )
    return location_list


@router.get("/nearby", response_model=List[LocationResponse])
async def get_nearby_locations(
    latitude: float = Query(..., description="Широта текущего местоположения"),
    longitude: float = Query(..., description="Долгота текущего местоположения"),
    radius_km: float = Query(5.0, ge=0.1, le=100.0, description="Радиус поиска в км"),
    limit: int = Query(50, ge=1, le=200, description="Максимальное количество результатов"),
    db: Session = Depends(get_db)
):
    results = locations.get_locations_nearby(
        db, latitude=latitude, longitude=longitude, radius_km=radius_km, limit=limit
    )

    return [location for location, distance in results]


@router.get("/my", response_model=List[LocationResponse])
async def get_my_locations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    location_list = locations.get_user_locations(db, current_user.id)
    return location_list


@router.get("/{location_id}", response_model=LocationWithStats)
async def get_location(
    location_id: int,
    db: Session = Depends(get_db)
):
    location_with_stats = locations.get_location_with_stats(db, location_id)
    if not location_with_stats:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Location not found"
        )
    return location_with_stats


@router.put("/{location_id}", response_model=LocationResponse)
async def update_location(
    location_id: int,
    location_data: LocationUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    location = locations.get_location(db, location_id)
    if not location:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Location not found"
        )

    if location.created_by != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to update this location"
        )

    updated_location = locations.update_location(db, location_id, location_data)
    return updated_location


@router.post("/{location_id}/approve", response_model=LocationResponse)
async def approve_location(
    location_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role not in [UserRole.MODERATOR, UserRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Moderator or admin role required"
        )

    location = locations.approve_location(db, location_id)
    if not location:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Location not found"
        )
    return location


@router.delete("/{location_id}/reject")
def reject_location(
    location_id: int,
    current_user: User = Depends(require_moderator_or_admin),
    db: Session = Depends(get_db),
):
    locations.reject_location(db=db, location_id=location_id)
    return {"message": "Location rejected and deleted"}


@router.get("/pending-list", response_model=List[LocationResponse])
def list_locations_pending(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user: User = Depends(require_moderator_or_admin),
    db: Session = Depends(get_db),
):
    return locations.get_locations_pending_approval(db=db, skip=skip, limit=limit)


@router.delete("/{location_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_location(
    location_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin role required"
        )

    try:
        success = locations.delete_location(db, location_id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Location not found"
            )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/{location_id}/books/count")
async def get_location_books_count(
    location_id: int,
    db: Session = Depends(get_db)
):
    location_with_stats = locations.get_location_with_stats(db, location_id)
    if not location_with_stats:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Location not found"
        )

    return {
        "location_id": location_id,
        "total_books": location_with_stats.stats["total_books"],
        "available_books": location_with_stats.stats["available_books"]
    }


@router.get("/search/", response_model=List[LocationResponse])
async def search_locations(
    query: str = Query(..., min_length=2, description="Поисковый запрос"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db)
):
    return locations.search_locations(db, query, skip, limit)
