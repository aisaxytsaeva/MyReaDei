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