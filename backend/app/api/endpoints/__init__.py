from .auth import router as auth_router
from .users import router as users_router
from .books import router as books_router
from .locations import router as locations_router
from .reservation import router as reservation_router
from .statistics import router as statitics_router
from .admin_roles import router as admin_roles_router
from .tags import router as tags_router



__all__ = [
    "auth_router",
    "users_router",
    "books_router",
    "locations_router",
    "reservation_router",
    "statitics_router",
    "admin_roles_router",
    "tags_router"

]
