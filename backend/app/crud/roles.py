from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.crud.user import get_user_by_id
from app.models.users import User
from app.core.permissions import UserRole



def list_users(db: Session, skip: int = 0, limit: int = 100) -> List[User]:
    return db.query(User).offset(skip).limit(limit).all()

def set_user_role(db: Session, user_id: int, new_role: UserRole) -> User:
    user = get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    user.role = new_role  
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

def set_user_active(db: Session, user_id: int, is_active: bool) -> User:
    user = get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    user.is_active = is_active
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
