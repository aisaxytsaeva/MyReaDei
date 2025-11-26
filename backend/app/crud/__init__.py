# app/crud/__init__.py
from .user import get_user_by_username, get_user_by_email, get_user_by_id, create_user, authenticate_user, update_user
from .book import (
    get_book_with_details, get_catalog_books, get_users_books, 
    create_book, delete_book, update_book, update_book_locations,
    get_readers_count, get_users_books_count
)
from .reservation import (
    get_user_completed_reservations_count,
    create_reservation,
    confirm_reservation, 
    get_reservation,
    close_reservation,
    cancel_reservation,
    get_user_reservations,
    get_owner_reservations,
    get_user_reservations_stats,
    get_reservation_by_id_with_access_check
)
from .locations import (
    create_location, get_location, get_locations, update_location,
    delete_location, approve_location
)
from .statistics import (
    get_popular_books, get_platform_stats, get_popular_locations 
)

__all__ = [
    # user
    "get_user_by_username", "get_user_by_email", "get_user_by_id", 
    "create_user", "authenticate_user", "update_user",
    
    # books
    "get_book_with_details", "get_catalog_books", "get_users_books",
    "create_book", "delete_book", "update_book", "update_book_locations",
    "get_readers_count", "get_users_books_count",
    
    # reservation
    "get_user_completed_reservations_count",
    "create_reservation",
    "confirm_reservation",
    "get_reservation", 
    "close_reservation",
    "cancel_reservation",
    "get_user_reservations",
    "get_owner_reservations",
    "get_user_reservations_stats",
    "get_reservation_by_id_with_access_check",
    
    # locations
    "create_location", "get_location", "get_locations", "update_location",
    "delete_location", "approve_location",
    
    # statistics
    "get_popular_books", "get_platform_stats", "get_popular_locations" 
]