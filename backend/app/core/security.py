from datetime import datetime, timedelta
from typing import List
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from .permissions import BookPermission, LocationPermission, UserRole
from .config import settings
from .db import get_db
from jose import JWTError, jwt
from app.models.users import User
from passlib.context import CryptContext
from uuid import uuid4



oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: timedelta = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire, "type": "access", "role": data.get("role", "user")})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def create_refresh_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    jti = uuid4().hex
    to_encode.update({
        "exp": expire,
        "type": "refresh",
        "role": data.get("role", "user"),
        "jti": jti,
    })
    token = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return token, jti, expire

def verify_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        return None

async def get_current_user(
        token: str = Depends(oauth2_scheme),
        db: Session = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid authentication credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    payload = verify_token(token)
    if payload is None or payload.get("type") != "access":
        raise credentials_exception
            
    username: str = payload.get("sub")
    if username is None:
        raise credentials_exception
    
    user = db.query(User).filter(User.username == username).first()
    if user is None:
        raise credentials_exception
        
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is deactivated",
        )
    
    return user

async def require_role(required_role: UserRole, current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != required_role:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Role {required_role.value} required. Your role: {current_user.role.value}"
        )
    return current_user

async def require_any_role(*roles: UserRole, current_user: User = Depends(get_current_user)) -> User:
    if current_user.role not in roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"One of roles {[r.value for r in roles]} required. Your role: {current_user.role.value}"
        )
    return current_user

async def require_authenticated(current_user: User = Depends(get_current_user)) -> User:
    return current_user

async def require_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin role required"
        )
    return current_user

async def require_moderator_or_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role not in [UserRole.MODERATOR, UserRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Moderator or admin role required"
        )
    return current_user

async def require_owner_or_admin(
    resource_owner_id: int, 
    current_user: User = Depends(get_current_user)
) -> User:
    if current_user.id != resource_owner_id and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You must be the owner or an admin to perform this action"
        )
    return current_user

async def require_owner_or_moderator_or_admin(
    resource_owner_id: int, 
    current_user: User = Depends(get_current_user)
) -> User:
    if (current_user.id != resource_owner_id and 
        current_user.role not in [UserRole.MODERATOR, UserRole.ADMIN]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You must be the owner, moderator or admin to perform this action"
        )
    return current_user

async def require_permission(permission: str, current_user: User = Depends(get_current_user)) -> User:

    if not hasattr(current_user, 'has_permission'):
        has_access = await check_permission_by_role(current_user, permission)
        if not has_access:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission {permission} required"
            )
        return current_user

    if not current_user.has_permission(permission):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Permission {permission} required"
        )
    return current_user

async def check_permission_by_role(user: User, permission: str) -> bool:
    if user.role == UserRole.ADMIN:
        return True
    

    if user.role == UserRole.MODERATOR:
        moderator_permissions = [
            LocationPermission.APPROVE_LOCATION.value,
            BookPermission.EDIT_ANY_BOOK.value,
        ]
        return permission in moderator_permissions
    

    if user.role == UserRole.USER:
        user_permissions = [
            LocationPermission.CREATE_LOCATION.value,
            BookPermission.CREATE_BOOK.value,
        ]
        return permission in user_permissions
    
    return False

def get_user_permissions(user: User) -> List[str]:

    permissions = []
    
    base_permissions = [
        BookPermission.CREATE_BOOK.value,
        LocationPermission.CREATE_LOCATION.value,
    ]
    permissions.extend(base_permissions)
    
    if user.role == UserRole.ADMIN:
        permissions.extend([
            BookPermission.EDIT_ANY_BOOK.value,
            BookPermission.DELETE_ANY_BOOK.value,
            LocationPermission.APPROVE_LOCATION.value,
            LocationPermission.DELETE_LOCATION.value,
        ])
    elif user.role == UserRole.MODERATOR:
        permissions.extend([
            BookPermission.EDIT_ANY_BOOK.value,
            LocationPermission.APPROVE_LOCATION.value,
        ])
    
    return list(set(permissions))  