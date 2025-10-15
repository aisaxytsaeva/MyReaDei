from fastapi import APIRouter

from backend.app.schemas.user_schema import UserProfile

router = APIRouter()

@router.get("profile", redponse_model=UserProfile)
async def get_profile():
    return


@router.get("/my-books")
async def get_my_books():
    return {"books": []}

@router.get("/my-reservations")
async def get_my_reservations():
    return {"reservations": []}