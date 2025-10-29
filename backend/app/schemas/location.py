from pydantic import BaseModel

class LocationCreate(BaseModel):
    name: str
    address: str
    latitude: float
    longitude: float

class LocationResponse(BaseModel):
    id: int
    name: str
    address: str
    latitude: float
    longitude: float
    created_by: int
