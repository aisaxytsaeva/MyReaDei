from fastapi import APIRouter

router = APIRouter()

@router.get("/popular_books")
async def get_popular_books():
    return