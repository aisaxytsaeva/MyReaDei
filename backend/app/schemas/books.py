from typing import List
from pydantic import BaseModel

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
    cover_image_uri: str 
    location_ids: List[int]  

class DeleteBook(BaseModel):
    book_id: int

class DeleteBookResponse(BaseModel):
    book_id: int
    success: bool
    message: str = "Книга успешно удалена"

