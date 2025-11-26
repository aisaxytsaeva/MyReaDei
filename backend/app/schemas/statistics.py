from pydantic import BaseModel 


class PopularBook(BaseModel):
    id: int
    title: str
    author: str
    cover_image: str
    reservation_count: int

class PlatformStats(BaseModel):
    total_books: int
    total_users: int
    total_reservations: int
    active_reservations: int
    available_books: int

class PopularLocation(BaseModel):
    id: int
    name: str
    address: str
    books_count: int
    reservations_count: int