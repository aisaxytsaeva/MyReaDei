from typing import List, Optional
from pydantic import BaseModel, field_validator


class TagInfo(BaseModel):
    id: int
    tag_name: str

class Catalog(BaseModel):
    id: int
    title: str
    author: str
    cover_image_uri: str 
    readers_count: int
    tags: List[TagInfo] = []  

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
    tags: List[TagInfo] = [] 

class BookCreate(BaseModel):
    title: str  
    author: str
    description: str  
    cover_image_key: Optional[str] = None
    location_ids: List[int]
    tag_ids: Optional[List[int]] = []  
    tag_names: Optional[List[str]] = []  

    @field_validator('tag_ids', 'tag_names')
    @classmethod
    def validate_tags(cls, v, info):
        if info.field_name == 'tag_ids' and v and len(v) > 10:
            raise ValueError('Maximum 10 tags per book')
        if info.field_name == 'tag_names' and v and len(v) > 10:
            raise ValueError('Maximum 10 tags per book')
        return v

class BookUpdate(BaseModel):
    title: Optional[str] = None
    author: Optional[str] = None
    description: Optional[str] = None
    cover_image_key: Optional[str] = None
    status: Optional[str] = None
    location_ids: Optional[List[int]] = None
    tag_ids: Optional[List[int]] = None  
    tag_names: Optional[List[str]] = None  

    @field_validator("status")
    @classmethod
    def validate_status(cls, v):
        if v and v not in ["available", "unavailable", "reserved", "marked_for_deletion"]:
            raise ValueError("Status must be 'available', 'unavailable' or 'reserved' or 'marked_for_deletion'")
        return v

    @field_validator('tag_ids')
    @classmethod
    def validate_tag_ids(cls, v):
        if v and len(v) > 10:
            raise ValueError('Maximum 10 tags per book')
        return v

class DeleteBook(BaseModel):
    book_id: int

class DeleteBookResponse(BaseModel):
    book_id: int
    success: bool
    message: str = "Книга успешно удалена"

class BookForDelete(BaseModel):
    id: int
    title: str
    author: str
    cover_image_uri: str
    status: str
    tags: List[TagInfo] = [] 