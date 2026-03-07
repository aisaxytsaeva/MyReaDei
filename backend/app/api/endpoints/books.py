from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
import shutil
import os
import uuid
from app.core.permissions import UserRole
from app.crud import book as books_crud
from app.core.db import get_db
from app.core.security import get_current_user, require_admin
from app.models.books import Book
from app.models.users import User
from app.schemas.books import BookCreate, BookResponse, BookUpdate, Catalog
import logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/books", tags=["books"])



UPLOAD_DIR = os.getenv("UPLOAD_DIR", "/app/static/covers")
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_book(
    title: str = Form(..., description="Название книги"),
    author: str = Form(..., description="Автор книги"),
    description: Optional[str] = Form(None, description="Описание книги"),
    location_ids: List[int] = Form(..., description="ID локаций где находится книга"),
    cover_image: Optional[UploadFile] = File(None, description="Обложка книги"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    cover_image_uri = None
    file_path = None
    
    try:
        if cover_image:
            if not cover_image.content_type.startswith('image/'):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="File must be an image"
                )
            
            file_extension = cover_image.filename.split('.')[-1]
            filename = f"{uuid.uuid4()}.{file_extension}"
            file_path = os.path.join(UPLOAD_DIR, filename)
            
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(cover_image.file, buffer)
            
            cover_image_uri = f"/static/covers/{filename}"
        
        book_data = BookCreate(
            title=title,
            author=author,
            description=description or "",
            cover_image_uri=cover_image_uri or "",
            location_ids=location_ids
        )
        
        created_book = books_crud.create_book(db, book_data, current_user.id)
        
        if not created_book:
            raise HTTPException(500, "Failed to create book")
            
        book_response = books_crud.get_book_with_details(db, created_book.id)
        
        if not book_response:
            return {
                "id": created_book.id,
                "title": created_book.title,
                "author": created_book.author,
                "description": created_book.description or "",
                "cover_image_uri": created_book.cover_image_uri or "",
                "reader_count": 0,
                "locations": [],
                "owner_id": created_book.owner_id,
                "status": created_book.status or "available"
            }
        
        return book_response
        
    except HTTPException:
        raise
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Error in create_book: {str(e)}", exc_info=True)
        
        if file_path and os.path.exists(file_path):
            try:
                os.remove(file_path)
            except:
                pass
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error while creating book"
        )
@router.get("/catalog", response_model=List[Catalog])
async def get_catalog(
    skip: int = Query(0, ge=0, description="Смещение для пагинации"),
    limit: int = Query(100, ge=1, le=1000, description="Лимит записей"),
    db: Session = Depends(get_db)
):
    catalog_books = books_crud.get_catalog_books(db, skip=skip, limit=limit)
    return catalog_books

@router.get("/{book_id}")
async def get_book(
    book_id: int,
    db: Session = Depends(get_db)
):
    book = books_crud.get_book_with_details(db, book_id)
    if not book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Book not found"
        )
    return book

@router.put("/{book_id}")
async def update_book(
    book_id: int,
    book_data: BookUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    
    if (book.owner_id != current_user.id and 
        current_user.role not in [UserRole.MODERATOR, UserRole.ADMIN]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to update this book"
        )
    
    try:
        if any([book_data.title, book_data.author, book_data.description, book_data.cover_image_uri, book_data.status]):
            books_crud.update_book(db, book_id, book_data, current_user.id)
        
        if book_data.location_ids is not None:
            books_crud.update_book_locations(db, book_id, book_data.location_ids, current_user.id)

        book_with_details = books_crud.get_book_with_details(db, book_id)
        return book_with_details
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.delete("/{book_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_book(
    book_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    
    if (book.owner_id != current_user.id and 
        current_user.role != UserRole.ADMIN):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to delete this book"
        )
    
    try:
        success = books_crud.delete_book(db, book_id, current_user.id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Book not found"
            )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.get("/search/", response_model=List[Catalog])
async def search_books(
    query: str = Query(..., min_length=2, description="Поисковый запрос"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db)
):
    books = db.query(Book).filter(
        (Book.title.ilike(f"%{query}%")) | (Book.author.ilike(f"%{query}%")),
        Book.status == 'available'
    ).offset(skip).limit(limit).all()
    
    catalog_books = []
    for book in books:
        readers_count = books_crud.get_readers_count(db, book.id)
        catalog_books.append(Catalog(
            id=book.id,
            title=book.title,
            author=book.author,
            cover_image_uri=book.cover_image_uri or "",
            readers_count=readers_count
        ))
    
    return catalog_books

@router.get("/popular/", response_model=List[Catalog])
async def get_popular_books(
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db)
):
    return books_crud.get_catalog_books(db, limit=limit, sort_by="readers")

@router.post("/{book_id}/cover")
async def upload_book_cover(
    book_id: int,
    cover_image: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    
    if (book.owner_id != current_user.id and 
        current_user.role not in [UserRole.MODERATOR, UserRole.ADMIN]):
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    if not cover_image.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    file_extension = cover_image.filename.split('.')[-1]
    filename = f"{uuid.uuid4()}.{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(cover_image.file, buffer)
    
    book.cover_image_uri = f"/static/covers/{filename}"
    db.commit()
    
    return {"cover_image_uri": book.cover_image_uri}

@router.post("/{book_id}/mark-delete")
async def mark_delete_book(
    book_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role not in [UserRole.ADMIN, UserRole.MODERATOR]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin or Moderator role required")

    book = books_crud.update_status_by_admin(db, book_id, "marked_for_deletion")
    return book


@router.post("/{book_id}/unmark-delete")
async def unmark_delete_book(
    book_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin role required")

    book = books_crud.update_status_by_admin(db, book_id, "available")
    return book