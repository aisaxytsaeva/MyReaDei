from enum import Enum


class UserRole(str, Enum):
    GUEST = "guest"
    USER = "user"
    MODERATOR = "moderator"
    ADMIN = "admin"


class LocationPermission(str, Enum):
    CREATE_LOCATION = "create_location"
    APPROVE_LOCATION = "approve_location"
    DELETE_LOCATION = "delete_location"


class BookPermission(str, Enum):
    CREATE_BOOK = "create_book"
    EDIT_ANY_BOOK = "edit_any_book"
    DELETE_ANY_BOOK = "delete_any_book"
