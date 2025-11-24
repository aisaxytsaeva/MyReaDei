from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime

class LocationBase(BaseModel):
    name: str
    address: str
    latitude: float
    longitude: float

class LocationCreate(LocationBase):
    pass

class LocationUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class LocationResponse(LocationBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    created_by: Optional[int] = None
    is_approved: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

class LocationWithStats(LocationResponse):
    stats: dict

class LocationNearby(BaseModel):
    location: LocationResponse
    distance_km: float