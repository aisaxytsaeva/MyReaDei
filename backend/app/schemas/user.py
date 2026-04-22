from typing import Optional
from pydantic import BaseModel, EmailStr

from app.core.permissions import UserRole

class UserProfile(BaseModel):
    id: int
    username: str
    email: EmailStr
    book_added: int 
    book_borrowed: int 


class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    is_active: Optional[bool] = None


class UserUpdateRole(BaseModel):
    role: UserRole

class UserUpdateAdmin(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    is_active: Optional[bool] = None
    role: Optional[UserRole] = None 