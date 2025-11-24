from requests import Session

from backend.app.core.security import get_password_hash, verify_password
from backend.app.models.users import User
from backend.app.schemas.auth import UserRegister


def get_user_by_username(db:Session, username:str) -> User | None:
    return db.query(User).filter(User.username == username).first()

def get_user_by_email(db:Session, email:str) -> User | None:
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
        password_hash=hashed_password
    )
    
    db.add(db_user)
    db.commit()
    return db_user

def authenticate_user(db: Session, username: str, password: str) -> User | None:
    user = get_user_by_username(db, username)
    if not user:
        return None
    if not verify_password(password, user.password_hash):
        return None
    return user

def update_user(db: Session, user_id: int, user_update) -> User | None:
    user = get_user_by_id(db, user_id)
    if not user:
        return None
    
    update_data = user_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(user, field, value)
    
    db.commit()
    return user