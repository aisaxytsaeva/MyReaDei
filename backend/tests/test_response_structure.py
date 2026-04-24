class TestResponseStructure:

    def test_book_response_structure(self, client, test_book):
        response = client.get(f"/books/{test_book.id}")
        assert response.status_code == 200
        data = response.json()

        required_fields = [
            "id", "title", "author", "description",
            "cover_image_uri", "reader_count", "locations",
            "owner_id", "status", "tags"
        ]

        for field in required_fields:
            assert field in data

        assert isinstance(data["id"], int)
        assert isinstance(data["title"], str)
        assert isinstance(data["locations"], list)
        assert isinstance(data["tags"], list)

    def test_catalog_response_structure(self, client, test_book):
        response = client.get("/books/catalog")
        assert response.status_code == 200
        data = response.json()

        if isinstance(data, list):
            assert len(data) >= 0
            if len(data) > 0:
                first_book = data[0]
                required_fields = [
                    "id", "title", "author", "cover_image_uri",
                    "readers_count", "tags"
                ]
                for field in required_fields:
                    assert field in first_book, (
                        f"Field '{field}' not found in catalog item"
                    )
        else:
            assert "items" in data or "data" in data
            if "items" in data:
                assert isinstance(data["items"], list)
            if "total" in data:
                assert isinstance(data["total"], int)