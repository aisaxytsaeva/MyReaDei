import pytest
from app.crud import book as books_crud
from app.schemas.books import BookCreate, BookUpdate, TagInfo
from app.models.users import User
from app.models.locations import Location
from app.models.book_location import BookLocation
from app.models.tags import Tag


@pytest.fixture(autouse=True)
def setup_test_data(db_session):
    loc1 = Location(id=1, name="Библиотека №1", address="ул. Ленина, 1", is_approved=True)
    loc2 = Location(id=2, name="Библиотека №2", address="ул. Пушкина, 2", is_approved=True)
    db_session.add_all([loc1, loc2])
    db_session.commit()

    yield


def test_create_book_real(db_session, test_user):
    book_data = BookCreate(
        title="Война и мир",
        author="Лев Толстой",
        description="Роман-эпопея",
        location_ids=[1, 2],
        tag_ids=[]
    )

    book = books_crud.create_book(db_session, book_data, user_id=test_user.id)

    assert book.id is not None
    assert book.title == "Война и мир"
    assert book.author == "Лев Толстой"
    assert book.description == "Роман-эпопея"
    assert book.owner_id == test_user.id
    assert book.status == "available"

    book_locations = db_session.query(BookLocation).filter(
        BookLocation.book_id == book.id
    ).all()
    assert len(book_locations) == 2
    location_ids = [bl.location_id for bl in book_locations]
    assert 1 in location_ids
    assert 2 in location_ids


def test_create_book_with_tags(db_session, test_user, setup_test_data):
    tag1 = Tag(id=1, tag_name="Роман")
    tag2 = Tag(id=2, tag_name="Классика")
    db_session.add_all([tag1, tag2])
    db_session.commit()

    book_data = BookCreate(
        title="Война и мир",
        author="Лев Толстой",
        description="Роман-эпопея",
        location_ids=[1],
        tag_ids=[
            TagInfo(id=1, tag_name="Роман"),
            TagInfo(id=2, tag_name="Классика")
        ]
    )

    book = books_crud.create_book(db_session, book_data, user_id=test_user.id)

    assert len(book.tags) == 2
    tag_names = [tag.tag_name for tag in book.tags]
    assert "Роман" in tag_names
    assert "Классика" in tag_names


def test_get_book_with_details_real(db_session, test_user, setup_test_data):
    book_data = BookCreate(
        title="Тест",
        author="Автор",
        description="Описание",
        location_ids=[1],
        tag_ids=[]
    )
    created = books_crud.create_book(db_session, book_data, user_id=test_user.id)

    result = books_crud.get_book_with_details(db_session, created.id)

    assert result is not None
    assert result.title == "Тест"
    assert result.author == "Автор"
    assert result.description == "Описание"
    assert len(result.locations) == 1
    assert result.locations[0].id == 1


def test_update_book_real(db_session, test_user, setup_test_data):
    book_data = BookCreate(
        title="Старое название",
        author="Автор",
        description="Описание",
        location_ids=[1],
        tag_ids=[]
    )
    book = books_crud.create_book(db_session, book_data, user_id=test_user.id)

    update_data = BookUpdate(title="Новое название")
    updated = books_crud.update_book(db_session, book.id, update_data, user_id=test_user.id)

    assert updated.title == "Новое название"
    assert updated.author == "Автор"
    assert updated.description == "Описание"


def test_update_book_with_tags(db_session, test_user, setup_test_data):
    tag1 = Tag(id=1, tag_name="Роман")
    tag2 = Tag(id=2, tag_name="Классика")
    tag3 = Tag(id=3, tag_name="Исторический")
    db_session.add_all([tag1, tag2, tag3])
    db_session.commit()

    book_data = BookCreate(
        title="Война и мир",
        author="Лев Толстой",
        description="Роман-эпопея",
        location_ids=[1],
        tag_ids=[TagInfo(id=1, tag_name="Роман")]
    )
    book = books_crud.create_book(db_session, book_data, user_id=test_user.id)

    update_data = BookUpdate(
        tag_ids=[
            TagInfo(id=2, tag_name="Классика"),
            TagInfo(id=3, tag_name="Исторический")
        ]
    )
    updated = books_crud.update_book(db_session, book.id, update_data, user_id=test_user.id)

    assert len(updated.tags) == 2
    tag_ids = [tag.id for tag in updated.tags]
    assert 2 in tag_ids
    assert 3 in tag_ids
    assert 1 not in tag_ids


def test_delete_book_real(db_session, test_user, setup_test_data):
    book_data = BookCreate(
        title="На удаление",
        author="Автор",
        description="Описание",
        location_ids=[1],
        tag_ids=[]
    )
    book = books_crud.create_book(db_session, book_data, user_id=test_user.id)

    assert books_crud.get_book_with_details(db_session, book.id) is not None

    result = books_crud.delete_book(db_session, book.id, user_id=test_user.id)
    assert result is True

    with pytest.raises(ValueError, match="Книга не найдена"):
        books_crud.get_book_with_details(db_session, book.id)

    book_locations = db_session.query(BookLocation).filter(
        BookLocation.book_id == book.id
    ).all()
    assert len(book_locations) == 0


def test_delete_book_not_found(db_session, test_user):
    with pytest.raises(ValueError, match="Книга не найдена"):
        books_crud.delete_book(db_session, 999, user_id=test_user.id)


def test_update_book_not_found(db_session, test_user):
    update_data = BookUpdate(title="Новое название")
    with pytest.raises(ValueError, match="Книга не найдена"):
        books_crud.update_book(db_session, 999, update_data, user_id=test_user.id)


def test_get_book_with_details_not_found(db_session):
    with pytest.raises(ValueError, match="Книга не найдена"):
        books_crud.get_book_with_details(db_session, 999)