import datetime

from fastapi import APIRouter, Depends, Response
from pathlib import Path

from requests import Session

from app.core.db import get_db
from app.models.books import Book

router = APIRouter(tags=["seo"])
BASE_URL = "http://localhost:8000"
@router.get("/sitemap.xml", include_in_schema=False)
async def generate_sitemap(db: Session = Depends(get_db)):
    
    static_pages = [
        {"loc": "/", "priority": "1.0", "changefreq": "daily"},
        {"loc": "/home", "priority": "1.0", "changefreq": "daily"},
        {"loc": "/search", "priority": "0.6", "changefreq": "weekly"},
    ]
    
    books = db.query(Book.id, Book.updated_at).filter(Book.status == "available").all()
    book_urls = [
        {
            "loc": f"/book/{book.id}",
            "lastmod": book.updated_at.isoformat() if book.updated_at else datetime.now().isoformat(),
            "priority": "0.9",
            "changefreq": "weekly"
        }
        for book in books
    ]
    
    all_urls = static_pages + book_urls
    
    xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    
    for url in all_urls:
        xml += '  <url>\n'
        xml += f'    <loc>{BASE_URL}{url["loc"]}</loc>\n'
        if url.get("lastmod"):
            xml += f'    <lastmod>{url["lastmod"]}</lastmod>\n'
        xml += f'    <changefreq>{url.get("changefreq", "monthly")}</changefreq>\n'
        xml += f'    <priority>{url.get("priority", "0.5")}</priority>\n'
        xml += '  </url>\n'
    
    xml += '</urlset>'
    
    return Response(content=xml, media_type="application/xml")

@router.get("/robots.txt", include_in_schema=False)
async def robots_txt():
    robots_path = Path("robots.txt")
    content = robots_path.read_text(encoding="utf-8")
    return Response(content=content, media_type="text/plain")