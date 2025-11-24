from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional, Dict
from app.models.book_location import BookLocation
from app.schemas.location import LocationCreate, LocationUpdate, LocationResponse
from backend.app.models.books import Book
from backend.app.models.locations import Location

def get_location(db: Session, location_id: int) -> Optional[Location]:
    return db.query(Location).filter(Location.id == location_id).first()

def get_locations(
    db: Session, 
    skip: int = 0, 
    limit: int = 100,
    approved_only: bool = True
) -> List[Location]:

    query = db.query(Location)
    
    if approved_only:
        query = query.filter(Location.is_approved == True)
    
    return query.offset(skip).limit(limit).all()

def create_location(db: Session, location_data: LocationCreate, user_id: int) -> Location:

    db_location = Location(
        name=location_data.name,
        address=location_data.address,
        latitude=location_data.latitude,
        longitude=location_data.longitude,
        created_by=user_id
    )
    
    db.add(db_location)
    db.commit()
    return db_location

def update_location(
    db: Session, 
    location_id: int, 
    location_data: LocationUpdate
) -> Optional[Location]:
    location = db.query(Location).filter(Location.id == location_id).first()
    
    if not location:
        return None
    

    update_data = location_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(location, field, value)
    
    location.updated_at = func.now()
    db.commit()
    db.refresh(location)
    return location

def delete_location(db: Session, location_id: int) -> bool:
    location = db.query(Location).filter(Location.id == location_id).first()
    
    if not location:
        return False

    book_count = db.query(BookLocation).filter(
        BookLocation.location_id == location_id
    ).count()
    
    if book_count > 0:
        raise ValueError(f"Нельзя удалить локацию: к ней привязано {book_count} книг")
    
    db.delete(location)
    db.commit()
    return True

def approve_location(db: Session, location_id: int) -> Optional[Location]:
    location = db.query(Location).filter(Location.id == location_id).first()
    
    if not location:
        return None
    
    location.is_approved = True
    location.updated_at = func.now()
    db.commit()
    db.refresh(location)
    return location

def get_locations_nearby(
    db: Session, 
    latitude: float, 
    longitude: float, 
    radius_km: float = 5,
    limit: int = 50
) -> List[Location]:

    distance_formula = func.acos(
        func.sin(func.radians(latitude)) * func.sin(func.radians(Location.latitude)) +
        func.cos(func.radians(latitude)) * func.cos(func.radians(Location.latitude)) *
        func.cos(func.radians(Location.longitude) - func.radians(longitude))
    ) * 6371 
    
    return db.query(Location, distance_formula.label('distance_km'))\
        .filter(Location.is_approved == True)\
        .filter(distance_formula <= radius_km)\
        .order_by(distance_formula)\
        .limit(limit)\
        .all()

def get_user_locations(db: Session, user_id: int) -> List[Location]:
    return db.query(Location)\
        .filter(Location.created_by == user_id)\
        .order_by(Location.created_at.desc())\
        .all()

def get_location_with_stats(db: Session, location_id: int) -> Optional[Dict]:
    location = db.query(Location).filter(Location.id == location_id).first()
    
    if not location:
        return None
    
    books_count = db.query(BookLocation).filter(
        BookLocation.location_id == location_id
    ).count()

    active_books_count = db.query(BookLocation).join(Book).filter(
        BookLocation.location_id == location_id,
        Book.status == 'available'
    ).count()
    
    return {
        "location": location,
        "stats": {
            "total_books": books_count,
            "available_books": active_books_count,
            "created_by_user_id": location.created_by,
            "is_approved": location.is_approved
        }
    }