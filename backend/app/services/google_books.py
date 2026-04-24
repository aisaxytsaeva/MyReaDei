import httpx
import logging
from typing import Dict, Any
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type


logger = logging.getLogger(__name__)


class GoogleBooksService:
    def __init__(self):
        self.base_url = "https://www.googleapis.com/books/v1"
        self.timeout = 10.0
        self.max_retries = 3

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=1, max=10),
        retry=retry_if_exception_type(httpx.TimeoutException)
    )
    async def search_books(self, query: str, max_results: int = 5) -> Dict[str, Any]:
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await client.get(
                    f"{self.base_url}/volumes",
                    params={
                        "q": query,
                        "maxResults": max_results,
                    }
                )
                response.raise_for_status()
                return self._normalize_response(response.json())

            except httpx.TimeoutException as e:
                logger.error(f"Google Books API timeout: {e}")
                return {"error": "timeout", "items": []}
            except httpx.HTTPStatusError as e:
                logger.error(f"Google Books API HTTP error: {e}")
                return {"error": f"http_{e.response.status_code}", "items": []}
            except Exception as e:
                logger.error(f"Google Books API error: {e}")
                return {"error": "unknown", "items": []}

    def _normalize_response(self, raw_data: Dict) -> Dict[str, Any]:
        normalized_items = []

        for item in raw_data.get("items", []):
            volume = item.get("volumeInfo", {})

            normalized_items.append({
                "title": volume.get("title", ""),
                "authors": volume.get("authors", []),
                "description": volume.get("description", ""),
                "google_books_id": item.get("id", "")
            })

        return {
            "total_items": raw_data.get("totalItems", 0),
            "items": normalized_items,
            "error": None
        }


google_books_service = GoogleBooksService()
