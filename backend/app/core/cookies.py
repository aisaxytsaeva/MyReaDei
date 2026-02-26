from datetime import timedelta
from fastapi import Response
from core.config import settings

def set_refresh_cookie(response: Response, refresh_token: str):
    max_age = int(timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS).total_seconds())
    response.set_cookie(
        key=settings.REFRESH_COOKIE_NAME,
        value=refresh_token,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
        max_age=max_age,
        path="/auth/refresh",
    )

def clear_refresh_cookie(response: Response):
    response.delete_cookie(
        key=settings.REFRESH_COOKIE_NAME,
        path="/auth/refresh",
    )