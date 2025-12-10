from enum import Enum
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any

class ReturnPeriod(str, Enum):
    SEVEN_DAYS = "7"
    FOURTEEN_DAYS = "14"
    THIRTY_DAYS = "30"
    SIXTY_DAYS = "60"


class ReservationStatus(str, Enum):
    PENDING = "pending"
    CONFIRMED_BY_OWNER = "confirmed_by_owner"
    HANDED_OVER = "handed_over"
    RETURNED = "returned"
    CANCELLED = "cancelled"


class ReservationCreate(BaseModel):
    book_id: int
    selected_location_id: int
    planned_return_days: ReturnPeriod

class LocationInfo(BaseModel):
    id: Optional[int] = None
    name: str
    address: str

class ReservationResponse(BaseModel):
    id: int
    book_id: int
    book_title: str
    status: str
    created_at: str
    planned_return_date: str
    selected_location: LocationInfo  
    
    class Config:
        from_attributes = True


class ReservationStats(BaseModel):
    total: int = 0
    pending: int = 0
    active: int = 0
    completed: int = 0
    cancelled: int = 0


class UserReservationStats(BaseModel):
    as_borrower: ReservationStats
    as_owner: ReservationStats