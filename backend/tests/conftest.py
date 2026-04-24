import asyncio
from datetime import datetime, timedelta
import os
import sys
from pathlib import Path
from unittest.mock import MagicMock, AsyncMock

# Устанавливаем тестовое окружение ДО импорта чего-либо
os.environ['TESTING'] = 'true'
os.environ['DISABLE_MINIO'] = 'true'
os.environ['DISABLE_REDIS'] = 'true'
os.environ['DATABASE_URL'] = 'sqlite:///./test.db'

sys.path.insert(0, str(Path(__file__).parent.parent))

# Полностью заменяем minio_client модуль
import app.core.minio_client
from unittest.mock import MagicMock

# Создаём мок-объект
mock_minio = MagicMock()
mock_minio.client = MagicMock()
mock_minio.client.bucket_exists = MagicMock(return_value=True)
mock_minio.client.make_bucket = MagicMock()
mock_minio.client.set_bucket_policy = MagicMock()
mock_minio.upload_file = AsyncMock(return_value={"filename": "test.jpg"})
mock_minio.delete_file = MagicMock(return_value=True)
mock_minio.get_file_url = MagicMock(return_value="http://localhost:9000/test.jpg")
mock_minio._ensure_bucket_exists = MagicMock()

# Заменяем
app.core.minio_client.minio_service = mock_minio
app.core.minio_client.MinioService = MagicMock(return_value=mock_minio)

# Теперь импортируем всё остальное
import pytest
import jwt
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

from app.core.config import settings
from app.main import app
from app.core.db import Base, get_db
from app.core.security import get_password_hash
from app.models.users import User
from app.models.locations import Location
from app.models.tags import Tag
from app.core.permissions import UserRole
from app.crud import book as books_crud
from app.schemas.books import BookCreate

TEST_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    yield loop
    loop.close()


@pytest.fixture(scope="function")
def db_session():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture(scope="function")
def test_user(db_session):
    user = User(
        id=1,
        username="testuser",
        email="test@example.com",
        password_hash=get_password_hash("test_1111"),
        is_active=True
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture(scope="function")
def admin_user(db_session):
    admin = User(
        id=2,
        username="admin",
        email="admin@example.com",
        password_hash=get_password_hash("admin123"),
        role=UserRole.ADMIN,
        is_active=True
    )
    db_session.add(admin)
    db_session.commit()
    db_session.refresh(admin)
    return admin


@pytest.fixture(scope="function")
def test_moderator(db_session):
    moderator = User(
        id=3,
        username="moderator",
        email="moderator@test.com",
        password_hash=get_password_hash("moderator123"),
        role=UserRole.MODERATOR,
        is_active=True
    )
    db_session.add(moderator)
    db_session.commit()
    db_session.refresh(moderator)
    return moderator


@pytest.fixture(scope="function")
def test_location(db_session, test_user):
    location = Location(
        id=1,
        name="Памятник Ленину",
        address="Test Address",
        latitude=55.7558,
        longitude=37.6176,
        is_approved=True,
        created_by=test_user.id
    )
    db_session.add(location)
    db_session.commit()
    db_session.refresh(location)
    return location


@pytest.fixture(scope="function")
def test_tag(db_session):
    tag = Tag(id=1, tag_name="Тестовый тег")
    db_session.add(tag)
    db_session.commit()
    db_session.refresh(tag)
    return tag


@pytest.fixture(scope="function")
def test_book(db_session, test_user, test_location):
    book_data = BookCreate(
        title="Test Book",
        author="Test Author",
        description="Test Description",
        location_ids=[test_location.id],
        tag_ids=[]
    )
    book = books_crud.create_book(db_session, book_data, user_id=test_user.id)
    return book


@pytest.fixture(scope="function")
def test_book_another_user(db_session, test_location):
    from app.crud import book as books_crud
    from app.schemas.books import BookCreate
    from app.models.users import User
    from app.core.security import get_password_hash

    other_user = User(
        id=4,
        username="otheruser",
        email="other@example.com",
        password_hash=get_password_hash("other123"),
        is_active=True
    )
    db_session.add(other_user)
    db_session.commit()

    book_data = BookCreate(
        title="Other User Book",
        author="Other Author",
        description="This book belongs to another user",
        location_ids=[test_location.id],
        tag_ids=[]
    )
    book = books_crud.create_book(db_session, book_data, user_id=other_user.id)
    return book


@pytest.fixture(scope="function")
def auth_headers(client, test_user):
    payload = {
        "sub": test_user.username,
        "user_id": test_user.id,
        "role": test_user.role.value if hasattr(test_user.role, 'value') else str(test_user.role),
        "exp": datetime.utcnow() + timedelta(minutes=30),
        "type": "access"
    }

    token = jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(scope="function")
def admin_headers(client, admin_user):
    response = client.post("/auth/login", data={
        "username": admin_user.username,
        "password": "admin123"
    })

    if response.status_code != 200:
        pytest.skip(f"Admin login failed: {response.text}")

    token = response.json().get("access_token")
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(scope="function")
def moderator_headers(client, test_moderator):
    response = client.post("/auth/login", data={
        "username": test_moderator.username,
        "password": "moderator123"
    })

    if response.status_code != 200:
        pytest.skip(f"Moderator login failed: {response.text}")

    token = response.json().get("access_token")
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def sample_image_path():
    fixtures_dir = Path(__file__).parent / "static"
    return fixtures_dir / "test_cover.jpg"


@pytest.fixture
def mock_google_books_service(monkeypatch):
    mock = MagicMock()
    mock.search_books = AsyncMock(return_value={
        "total_items": 1,
        "items": [
            {
                "title": "Mock Book",
                "authors": ["Mock Author"],
                "description": "Mock description",
                "google_books_id": "mock_id_123"
            }
        ],
        "error": None
    })

    monkeypatch.setattr("app.services.external_books.google_books_service", mock)
    return mock