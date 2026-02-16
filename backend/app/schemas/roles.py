from pydantic import BaseModel
from typing import List
from core.permissions import UserRole

class RoleUpdateRequest(BaseModel):
    role: UserRole

class ActiveUpdateRequest(BaseModel):
    is_active: bool

class AdminUserResponse(BaseModel):
    id: int
    username: str
    email: str | None = None
    role: UserRole
    is_active: bool

class RolesListResponse(BaseModel):
    roles: List[UserRole]

class PermissionsResponse(BaseModel):
    permissions: List[str]
