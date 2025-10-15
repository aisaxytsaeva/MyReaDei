from fastapi import APIRouter

router = APIRouter()

#get catalog
@router.get("/")
async def get_catalog():
    return 

@router.post("/")
async def create_book():
    return 

#get book 
@router.get("/{book_id}")
async def get_book_profile():
    return 

#delete book
@router.delete("/{book_id}")
async def delete_book(book_id: int):

    return {"message": f"Book {book_id} is deleted"}

#get location
@router.get("/{book_id}/locations")
async def get_book_locations(book_id: int):

    return {"locations": []}