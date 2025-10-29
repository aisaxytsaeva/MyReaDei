from pydantic import BaseModel

class Catalog(BaseModel):
    id: int
    book_name: str
    author: str
    cover: str
    readers_count: int

class BookResponse(BaseModel):
    id: int
    book_name: str
    author: str
    descriptoin: str
    cover: str
    reader_count: int 
    location: str
    owner_id: int
    status: str

class BookCreate(BaseModel):
    book_name: str
    author: str
    descriptoin: str
    cover: str
    location: str
    