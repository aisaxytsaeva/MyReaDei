from fastapi import Depends, HTTPException, status

from .security import get_current_user
from .permissions import UserRole, LocationPermission
from app.models.users import User


def require_role(required_roles: list[UserRole]):
    def role_checker(current_user: User = Depends(get_current_user)):
        if current_user.role not in required_roles and current_user.role != UserRole.ADMIN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions"
            )
        return current_user
    return role_checker


def require_permission(permission: LocationPermission):
    def permission_checker(current_user: User = Depends(get_current_user)):
        if current_user.role == UserRole.ADMIN:
            return current_user

        if permission == LocationPermission.CREATE_LOCATION:
            return current_user
        elif permission in [
            LocationPermission.APPROVE_LOCATION,
            LocationPermission.DELETE_LOCATION
        ]:
            if current_user.role not in [UserRole.ADMIN, UserRole.MODERATOR]:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Insufficient permissions"
                )
            return current_user

        return current_user
    return permission_checker


def require_admin(current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


def require_moderator(current_user: User = Depends(get_current_user)):
    if current_user.role not in [UserRole.MODERATOR, UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Moderator access required")
    return current_user
