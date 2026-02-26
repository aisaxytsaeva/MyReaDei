from datetime import timedelta
from fastapi import APIRouter, Cookie, Depends, HTTPException, Response, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from redis.asyncio import Redis

from core.config import settings
from core.db import get_db
from core.redis import get_redis
from core.cookies import set_refresh_cookie, clear_refresh_cookie
from core.security import create_access_token, create_refresh_token, verify_token
from services.refresh_store import RefreshStore
from models.users import User
from crud.user import authenticate_user, create_user
from schemas.auth import UserRegister, UserResponse

router = APIRouter(prefix="/auth", tags=["auth"])

def refresh_ttl_seconds() -> int:
    return int(timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS).total_seconds())

@router.post("/register", response_model=UserResponse)
async def register(user_data: UserRegister, db: Session = Depends(get_db)):
    try:
        user = create_user(db, user_data)
        return UserResponse(
            id=user.id,
            username=user.username,
            email=user.email,
            role=user.role,
            is_active=user.is_active,
            created_at=user.created_at
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.post("/login")
async def login(
    request: Request,
    response: Response,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
    redis: Redis = Depends(get_redis),
):
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect username or password")

    access_token = create_access_token(
        data={"sub": user.username, "role": user.role.value, "user_id": user.id},
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    )

    refresh_token, jti, _expires_at = create_refresh_token(
        data={"sub": user.username, "role": user.role.value, "user_id": user.id}
    )

    store = RefreshStore(redis)
    await store.add(jti=jti, user_id=user.id, ttl_seconds=refresh_ttl_seconds())

    set_refresh_cookie(response, refresh_token)

    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/refresh")
async def refresh(
    response: Response,
    db: Session = Depends(get_db),
    redis: Redis = Depends(get_redis),
    refresh_token: str | None = Cookie(default=None, alias=settings.REFRESH_COOKIE_NAME),
):
    if not refresh_token:
        raise HTTPException(status_code=401, detail="Missing refresh token")

    payload = verify_token(refresh_token)
    if payload is None or payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")

    jti = payload.get("jti")
    user_id_claim = payload.get("user_id")

    if not jti or not user_id_claim:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    user = db.query(User).filter(User.id == int(user_id_claim)).first()
    if user is None or not user.is_active:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    store = RefreshStore(redis)

    active_user_id = await store.get_user_id(jti)
    if active_user_id is None or active_user_id != user.id:
        raise HTTPException(status_code=401, detail="Refresh token revoked")

    new_access = create_access_token(
        data={"sub": user.username, "role": user.role.value, "user_id": user.id},
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    )

    new_refresh, new_jti, _new_exp = create_refresh_token(
        data={"sub": user.username, "role": user.role.value, "user_id": user.id}
    )

    await store.add(jti=new_jti, user_id=user.id, ttl_seconds=refresh_ttl_seconds())
    await store.revoke(jti=jti, user_id=user.id)

    set_refresh_cookie(response, new_refresh)

    return {"access_token": new_access, "token_type": "bearer"}

@router.post("/logout")
async def logout(
    response: Response,
    redis: Redis = Depends(get_redis),
    refresh_token: str | None = Cookie(default=None, alias=settings.REFRESH_COOKIE_NAME),
):
    if refresh_token:
        payload = verify_token(refresh_token)
        if payload and payload.get("type") == "refresh":
            jti = payload.get("jti")
            user_id = payload.get("user_id")
            if jti and user_id:
                store = RefreshStore(redis)
                await store.revoke(jti=jti, user_id=int(user_id))

    clear_refresh_cookie(response)
    return {"success": True, "message": "Logged out successfully"}

@router.post("/logout_all")
async def logout_all(
    response: Response,
    redis: Redis = Depends(get_redis),
    refresh_token: str | None = Cookie(default=None, alias=settings.REFRESH_COOKIE_NAME),
):
    if not refresh_token:
        clear_refresh_cookie(response)
        return {"success": True, "revoked": 0}

    payload = verify_token(refresh_token)
    user_id = payload.get("user_id") if payload else None
    if not user_id:
        clear_refresh_cookie(response)
        return {"success": True, "revoked": 0}

    store = RefreshStore(redis)
    revoked = await store.revoke_all(int(user_id))
    clear_refresh_cookie(response)
    return {"success": True, "revoked": revoked}