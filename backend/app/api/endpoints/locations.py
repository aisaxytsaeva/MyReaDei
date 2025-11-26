

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List
from crud import locations
from core.db import get_db
from core.dependencies import require_admin, require_moderator
from core.security import get_current_user
from models.locations import Location
from models.users import User
from schemas.location import LocationCreate, LocationResponse, LocationUpdate, LocationWithStats


router = APIRouter(prefix="/locations", tags=["locations"])


@router.post("/", response_model=LocationResponse, status_code=status.HTTP_201_CREATED)
async def create_location(
    location_data: LocationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Создать новую локацию
    - Все авторизованные пользователи могут создавать локации
    - Локация создается с is_approved=False (требует модерации)
    """
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
    """
    Получить список локаций
    - По умолчанию возвращаются только подтвержденные локации
    - Поддержка пагинации
    """
    locations = locations.get_locations(
        db, skip=skip, limit=limit, approved_only=approved_only
    )
    return locations


@router.get("/nearby", response_model=List[LocationResponse])
async def get_nearby_locations(
    latitude: float = Query(..., description="Широта текущего местоположения"),
    longitude: float = Query(..., description="Долгота текущего местоположения"),
    radius_km: float = Query(5.0, ge=0.1, le=100.0, description="Радиус поиска в км"),
    limit: int = Query(50, ge=1, le=200, description="Максимальное количество результатов"),
    db: Session = Depends(get_db)
):
    """
    Найти локации поблизости
    - Возвращает локации в указанном радиусе
    - Только подтвержденные локации
    - Сортировка по расстоянию
    """
    locations = locations.get_locations_nearby(
        db, latitude=latitude, longitude=longitude, radius_km=radius_km, limit=limit
    )
    
   
    return [location for location, distance in locations]


@router.get("/my", response_model=List[LocationResponse])
async def get_my_locations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Получить локации созданные текущим пользователем
    """
    locations = locations.get_user_locations(db, current_user.id)
    return locations


@router.get("/{location_id}", response_model=LocationWithStats)
async def get_location(
    location_id: int,
    db: Session = Depends(get_db)
):
    """
    Получить информацию о локации со статистикой
    """
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
    """
    Обновить информацию о локации
    - Только создатель локации или админ может обновлять
    """
    location = locations.get_location(db, location_id)
    if not location:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Location not found"
        )
    
    # Проверка прав: создатель или админ
    if location.created_by != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to update this location"
        )
    
    updated_location = locations.update_location(db, location_id, location_data)
    return updated_location


@router.post("/{location_id}/approve", response_model=LocationResponse)
async def approve_location(
    location_id: int,
    current_user: User = Depends(require_moderator),  # Модераторы и админы
    db: Session = Depends(get_db)
):
    """
    Подтвердить локацию (апрув)
    - Только модераторы и админы
    """
    location = locations.approve_location(db, location_id)
    if not location:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Location not found"
        )
    return location


@router.delete("/{location_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_location(
    location_id: int,
    current_user: User = Depends(require_admin),  # Только админы
    db: Session = Depends(get_db)
):
    """
    Удалить локацию
    - Только админы
    - Нельзя удалить если есть привязанные книги
    """
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
    """
    Получить количество книг на локации
    """
    location_with_stats = locations.get_location_with_stats(db, location_id)
    if not location_with_stats:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Location not found"
        )
    
    return {
        "location_id": location_id,
        "total_books": location_with_stats["stats"]["total_books"],
        "available_books": location_with_stats["stats"]["available_books"]
    }


@router.get("/search/", response_model=List[LocationResponse])
async def search_locations(
    query: str = Query(..., min_length=2, description="Поисковый запрос"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """
    Поиск локаций по названию и адресу
    """
    # Простая реализация поиска (можно улучшить полнотекстовым поиском)
    locations = db.query(Location).filter(
        (Location.name.ilike(f"%{query}%")) | (Location.address.ilike(f"%{query}%")),
        Location.is_approved == True
    ).offset(skip).limit(limit).all()
    
    return locations