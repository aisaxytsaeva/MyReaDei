import pytest
from unittest.mock import patch, AsyncMock, MagicMock
import httpx
from app.services.google_books import google_books_service

class TestExternalAPI:

    @pytest.mark.asyncio
    async def test_search_books_success(self):
        mock_response = {
            "totalItems": 2,
            "items": [
                {
                    "id": "test_id_1",
                    "volumeInfo": {
                        "title": "Test Book 1",
                        "authors": ["Test Author 1"],
                        "description": "Test description 1",
                        "imageLinks": {"thumbnail": "http://test.com/cover1.jpg"}
                    }
                },
                {
                    "id": "test_id_2",
                    "volumeInfo": {
                        "title": "Test Book 2",
                        "authors": ["Test Author 2"],
                        "description": "Test description 2",
                        "imageLinks": {"thumbnail": "http://test.com/cover2.jpg"}
                    }
                }
            ]
        }
        
        with patch('httpx.AsyncClient.get') as mock_get:
            mock_response_obj = AsyncMock()
            mock_response_obj.status_code = 200
            mock_response_obj.json = MagicMock(return_value=mock_response)
            mock_get.return_value = mock_response_obj
            
            result = await google_books_service.search_books("test query", max_results=5)
            
            assert result["total_items"] == 2
            assert len(result["items"]) == 2
            assert result["items"][0]["title"] == "Test Book 1"
            assert result["items"][0]["authors"] == ["Test Author 1"]
            assert result["error"] is None


    @pytest.mark.asyncio
    async def test_search_books_with_special_characters(self):
        mock_response = {
            "totalItems": 0,
            "items": []
        }
        
        with patch('httpx.AsyncClient.get') as mock_get:
            mock_response_obj = AsyncMock()
            mock_response_obj.status_code = 200
            mock_response_obj.json = MagicMock(return_value=mock_response)
            mock_get.return_value = mock_response_obj
            
            result = await google_books_service.search_books("test @#$%", max_results=5)
            
            assert result["total_items"] == 0
            assert result["error"] is None

    
    @pytest.mark.asyncio
    async def test_search_books_handles_general_exception(self):
        with patch('httpx.AsyncClient.get') as mock_get:
            mock_get.side_effect = Exception("Unknown error")
            
            result = await google_books_service.search_books("test query")
            
            assert result["error"] == "unknown"
            assert result["items"] == []

    
    @pytest.mark.asyncio
    async def test_normalize_response_structure(self):
        raw_response = {
            "totalItems": 1,
            "items": [
                {
                    "id": "abc123",
                    "volumeInfo": {
                        "title": "Original Title",
                        "authors": ["Author One", "Author Two"],
                        "description": "Original description",
                        "imageLinks": {"thumbnail": "http://example.com/cover.jpg"}
                    }
                }
            ]
        }
        
        with patch('httpx.AsyncClient.get') as mock_get:
            mock_response_obj = AsyncMock()
            mock_response_obj.status_code = 200
            mock_response_obj.json = MagicMock(return_value=raw_response)
            mock_get.return_value = mock_response_obj
            
            result = await google_books_service.search_books("test")
            
            assert result["total_items"] == 1
            assert result["items"][0]["title"] == "Original Title"
            assert result["items"][0]["authors"] == ["Author One", "Author Two"]
            assert result["items"][0]["google_books_id"] == "abc123"

    @pytest.mark.asyncio
    async def test_search_books_handles_missing_volume_info(self):
        raw_response = {
            "totalItems": 1,
            "items": [
                {
                    "id": "abc123"
                }
            ]
        }
        
        with patch('httpx.AsyncClient.get') as mock_get:
            mock_response_obj = AsyncMock()
            mock_response_obj.status_code = 200
            mock_response_obj.json = MagicMock(return_value=raw_response)
            mock_get.return_value = mock_response_obj
            
            result = await google_books_service.search_books("test")
            
            assert result["total_items"] == 1
            assert result["items"][0]["title"] == ""
            assert result["items"][0]["authors"] == []

    @pytest.mark.asyncio
    async def test_search_books_passes_correct_params(self):
        with patch('httpx.AsyncClient.get') as mock_get:
            mock_response_obj = AsyncMock()
            mock_response_obj.status_code = 200
            mock_response_obj.json = MagicMock(return_value={"totalItems": 0, "items": []})
            mock_get.return_value = mock_response_obj
            
            await google_books_service.search_books("harry potter", max_results=10)
            
            # Проверяем, что параметры переданы правильно
            call_args = mock_get.call_args[1]
            assert call_args["params"]["q"] == "harry potter"
            assert call_args["params"]["maxResults"] == 10