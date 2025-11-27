from datetime import timedelta
from fastapi import APIRouter, Body, Depends, HTTPException, status
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordRequestForm 
from models.users import User
from core.config import settings
from core.db import get_db
from core.security import create_access_token, create_refresh_token, verify_token
from crud.user import authenticate_user, create_user
from schemas.auth import Token, UserRegister

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register")
async def register(
    user_data: UserRegister,
    db: Session = Depends(get_db)
):
    try:
        user = create_user(db, user_data)
        return {
            "message": "User registered successfully",
            "user_id": user.id,
            "username": user.username
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.post("/login")
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    refresh_token = create_refresh_token(data={"sub": user.username})
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,  
        "token_type": "bearer",
        "user_id": user.id,
        "username": user.username
    }

@router.post("/refresh")
async def refresh_token(
    refresh_token: str = Body(..., embed=True),
    db: Session = Depends(get_db)
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid refresh token",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    payload = verify_token(refresh_token)
    if payload is None or payload.get("type") != "refresh":
        raise credentials_exception
            
    username: str = payload.get("sub")
    if username is None:
        raise credentials_exception

    user = db.query(User).filter(User.username == username).first()
    if user is None or not user.is_active:
        raise credentials_exception
    

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    new_access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    
    return {
        "access_token": new_access_token,
        "token_type": "bearer"
    }