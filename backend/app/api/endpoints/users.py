from fastapi import APIRouter

from backend.app.schemas.user import UserProfile

router = APIRouter()

@router.get("profile", redponse_model=UserProfile)
async def get_profile():
    return


@router.get("/my_books")
async def get_my_books():
    return {"books": []}

@router.get("/my_reservations")
async def get_my_reservations():
    return {"reservations": []}