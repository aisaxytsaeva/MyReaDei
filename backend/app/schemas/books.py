from typing import List, Optional
from pydantic import BaseModel, field_validator

class Catalog(BaseModel):
    id: int
    title: str
    author: str
    cover_image_uri: str 
    readers_count: int

class BookResponse(BaseModel):
    id: int
    title: str
    author: str
    description: str
    cover_image_uri: str
    reader_count: int 
    locations: List[str]
    owner_id: int
    status: str

class BookCreate(BaseModel):
    title: str  
    author: str
    description: str  
    cover_image_uri: Optional[str] = None 
    location_ids: List[int]  

class BookUpdate(BaseModel):
    title: Optional[str] = None
    author: Optional[str] = None
    description: Optional[str] = None
    cover_image_uri: Optional[str] = None
    status: Optional[str] = None
    location_ids: Optional[List[int]] = None  # 

    @field_validator("status")
    @classmethod
    def validate_status(cls, v):
        if v and v not in ["available", "unavailable", "reserved"]:
            raise ValueError("Status must be 'available', 'unavailable' or 'reserved'")
        return v

class DeleteBook(BaseModel):
    book_id: int

class DeleteBookResponse(BaseModel):
    book_id: int
    success: bool
    message: str = "Книга успешно удалена"

