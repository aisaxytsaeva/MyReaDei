from requests import Session

from app.core.permissions import UserRole
from app.core.security import get_password_hash, verify_password
from app.models.users import User
from app.schemas.auth import UserRegister
from app.schemas.user import UserUpdate


def get_user_by_username(db: Session, username: str) -> User | None:
    return db.query(User).filter(User.username == username).first()


def get_user_by_email(db: Session, email: str) -> User | None:
    return db.query(User).filter(User.email == email).first()


def get_user_by_id(db: Session, user_id: int) -> User | None:
    return db.query(User).filter(User.id == user_id).first()


def create_user(db: Session, user_data: UserRegister) -> User:
    if get_user_by_username(db, user_data.username):
        raise ValueError("Пользователь с таким именем уже существует")

    if get_user_by_email(db, user_data.email):
        raise ValueError("Пользователь с таким email уже существует")

    hashed_password = get_password_hash(user_data.password)

    db_user = User(
        username=user_data.username,
        email=user_data.email,
        password_hash=hashed_password,
        role=UserRole.USER
    )

    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def authenticate_user(db: Session, username: str, password: str) -> User | None:
    user = get_user_by_username(db, username)
    if not user:
        return None

    if not user.is_active:
        return None

    if not verify_password(password, user.password_hash):
        return None

    return user


def update_user(db: Session, user_id: int, user_update: UserUpdate) -> User | None:
    user = get_user_by_id(db, user_id)
    if not user:
        return None

    update_data = user_update.dict(exclude_unset=True)

    if "username" in update_data:
        existing_user = get_user_by_username(db, update_data["username"])
        if existing_user and existing_user.id != user_id:
            raise ValueError("Пользователь с таким именем уже существует")

    if "email" in update_data:
        existing_email = get_user_by_email(db, update_data["email"])
        if existing_email and existing_email.id != user_id:
            raise ValueError("Пользователь с таким email уже существует")

    if "password" in update_data:
        update_data["password_hash"] = get_password_hash(update_data.pop("password"))

    for field, value in update_data.items():
        setattr(user, field, value)

    db.commit()
    db.refresh(user)
    return user
