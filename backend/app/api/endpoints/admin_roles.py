from typing import List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.schemas.books import BookForDelete
from app.crud import book as books_crud
from app.core.db import get_db
from app.core.security import get_current_user, require_admin, get_user_permissions
from app.models.users import User
from app.core.permissions import UserRole

from app.schemas.roles import (
    RoleUpdateRequest,
    ActiveUpdateRequest,
    AdminUserResponse,
    RolesListResponse,
    PermissionsResponse,
)
from app.crud import roles as roles_crud

router = APIRouter(prefix="/admin", tags=["admin"])

@router.get("/roles", response_model=RolesListResponse)
async def list_roles(
    _: User = Depends(require_admin),
):

    return {"roles": list(UserRole)}

@router.get("/users", response_model=list[AdminUserResponse])
async def admin_list_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    users = roles_crud.list_users(db, skip=skip, limit=limit)
    return [
        AdminUserResponse(
            id=u.id,
            username=u.username,
            email=u.email,
            role=u.role,
            is_active=u.is_active,
        )
        for u in users
    ]

@router.put("/users/{user_id}/role", response_model=AdminUserResponse)
async def admin_set_user_role(
    user_id: int,
    payload: RoleUpdateRequest,
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    u = roles_crud.set_user_role(db, user_id=user_id, new_role=payload.role)
    return AdminUserResponse(
        id=u.id, username=u.username, email=u.email, role=u.role, is_active=u.is_active
    )

@router.put("/users/{user_id}/active", response_model=AdminUserResponse)
async def admin_set_user_active(
    user_id: int,
    payload: ActiveUpdateRequest,
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    u = roles_crud.set_user_active(db, user_id=user_id, is_active=payload.is_active)
    return AdminUserResponse(
        id=u.id, username=u.username, email=u.email, role=u.role, is_active=u.is_active
    )

@router.get("/users/{user_id}/permissions", response_model=PermissionsResponse)
async def admin_get_user_permissions(
    user_id: int,
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    u = roles_crud.get_user_by_id(db, user_id=user_id)
    if not u:
        return {"permissions": []}
    return {"permissions": get_user_permissions(u)}



@router.get("/books/for-delete", response_model=List[BookForDelete])
def list_books_marked_for_deletion(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    books = books_crud.get_books_marked_for_deletion(db=db, skip=skip, limit=limit)


    return [
        BookForDelete(
            id=b.id,
            title=b.title or "",
            author=b.author or "",
            cover_image_uri=b.cover_image_uri or "",
            status=b.status or "",
        )
        for b in books
    ]