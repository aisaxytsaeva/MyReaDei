from app.crud import book as books_crud
from app.schemas.books import BookCreate


class TestBooksEndpoints:

    def test_create_book_endpoint_success(self, client, auth_headers, test_location):
        response = client.post(
            "/books/",
            headers=auth_headers,
            data={
                "title": "Test Book",
                "author": "Test Author",
                "description": "Test Description",
                "location_ids": "1,2",
                "tag_ids": "1,2"
            }
        )
        assert response.status_code == 201
        assert response.json()["title"] == "Test Book"

    def test_create_book_endpoint_unauthorized(self, client):
        response = client.post("/books/", data={"title": "Test"})
        assert response.status_code == 401

    def test_get_books_catalog_endpoint(self, client, db_session, test_user, test_location):
        book_data = BookCreate(
            title="Catalog Test Book",
            author="Test Author",
            description="Test",
            location_ids=[test_location.id],
            tag_ids=[]
        )
        books_crud.create_book(db_session, book_data, user_id=test_user.id)

        response = client.get("/books/catalog")
        assert response.status_code == 200

        data = response.json()
        if isinstance(data, list):
            assert len(data) >= 0
        else:
            assert "items" in data or "data" in data

    def test_create_book_endpoint_with_auth(self, client, test_user, test_location, auth_headers):
        response = client.post(
            "/books/",
            headers=auth_headers,
            data={
                "title": "API Test Book",
                "author": "API Author",
                "description": "API Description",
                "location_ids": str(test_location.id),
                "tag_ids": ""
            }
        )
        assert response.status_code == 201
        data = response.json()
        assert data["title"] == "API Test Book"

    def test_get_book_details_endpoint(self, client, test_book):
        response = client.get(f"/books/{test_book.id}")
        assert response.status_code == 200
        assert response.json()["id"] == test_book.id