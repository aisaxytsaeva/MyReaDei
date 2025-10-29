from enum import Enum
from pydantic import BaseModel

class ReturnPeriod(str, Enum):
    SEVEN_DAYS = "7"
    FOURTEEN_DAYS = "14"
    THIRTY_DAYS = "30"
    SIXTY_DAYS = "60"


class ReservationCreate(BaseModel):
    book_id: int
    location_id: int
    return_days: ReturnPeriod


class ReservationResponse(BaseModel):
    id: int
    book_id: int
    book_title: str
    status: str
    created_at: str
    planned_return_date: str
    selected_location: dict