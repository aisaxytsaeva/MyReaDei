
from typing import List, Optional
from fastapi import APIRouter, Query
from backend.app.schemas.books import BookCreate, BookResponse, Catalog

router = APIRouter()

#get catalog
@router.get("/", response_model=List[Catalog])
async def get_catalog(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = Query(None),
):
    return 

@router.post("/", response_model=BookResponse)
async def create_book(book_data: BookCreate):
    return BookResponse(
        id=1,
        book_name=book_data.name,
        author=book_data.author,
        descriptoin=book_data.descriptoin,
        cover=book_data.cover,
        reader_count=0,
        location=book_data.location,
        owner_id=1,
        status=""
    )


#get book 
@router.get("/{book_id}", response_model=BookResponse)
async def get_book_profile(book_id: int):
    return BookResponse(
        id=book_id,
        book_name="",
        author="",
        descriptoin="",
        cover="",
        reader_count=1,
        location="",
        owner_id=1,
        status=""
    )

    

#delete book
@router.delete("/{book_id}")
async def delete_book(book_id: int):

    return {"message": f"Book {book_id} is deleted"}

#get location
@router.get("/{book_id}/locations")
async def get_book_locations(book_id: int):

    return {"locations": []}