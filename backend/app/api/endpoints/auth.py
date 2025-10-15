from fastapi import APIRouter

from backend.app.schemas.auth_schema import Token, UserLogin, UserRegister, UserResponse


router = APIRouter()

@router.post("/register", response_model=UserResponse)
async def register(user_data: UserRegister):
    return UserResponse(
        id=1,
        username=user_data.username,
        email=user_data.email,
        is_active=True
    )

@router.post("/login", response_model=Token)
async def login(login_data: UserLogin):
    return Token(
        access_token= "",
        token_type=""
    )


@router.get("/usr", response_model=UserResponse)
async def get_user():
    return 