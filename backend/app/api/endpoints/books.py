from fastapi import APIRouter, Body, Depends, HTTPException, status, Query, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.permissions import UserRole
from app.crud import book as books_crud
from app.core.db import get_db
from app.core.security import get_current_user
from app.models.books import Book
from app.models.users import User
from app.models.tags import Tag  
from app.schemas.books import BookCreate, BookUpdate, Catalog, TagInfo
import logging
from app.core.minio_client import minio_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/books", tags=["books"])


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_book(
    title: str = Form(..., description="Название книги"),
    author: str = Form(..., description="Автор книги"),
    description: Optional[str] = Form(None, description="Описание книги"),
    location_ids: List[int] = Form(..., description="ID локаций где находится книга"),
    tag_ids: Optional[List[int]] = Form(None, description="ID тегов книги"),
    cover_image: Optional[UploadFile] = File(None, description="Обложка книги"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    cover_image_key = None
    
    try:
        if cover_image:
            file_info = await minio_service.upload_file(cover_image)
            cover_image_key = file_info["filename"]
            logger.info(f"File uploaded to MinIO: {cover_image_key}")
        
        book_data = BookCreate(
            title=title,
            author=author,
            description=description or "",
            cover_image_key=cover_image_key,  
            location_ids=location_ids,
            tag_ids=tag_ids or [],    
        )
        
        created_book = books_crud.create_book(db, book_data, current_user.id)
        
        if not created_book:
            if cover_image_key:
                minio_service.delete_file(cover_image_key)
            raise HTTPException(500, "Failed to create book")
        
        book_response = books_crud.get_book_with_details(db, created_book.id)
        return book_response
        
    except HTTPException:
        if cover_image_key:
            try:
                minio_service.delete_file(cover_image_key)
            except:
                pass
        raise
    except Exception as e:
        if cover_image_key:
            try:
                minio_service.delete_file(cover_image_key)
            except:
                pass
        
        logger.error(f"Error in create_book: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error while creating book"
        )


@router.put("/{book_id}/cover")
async def replace_book_cover(
    book_id: int,
    cover_image: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Заменить обложку книги"""
    try:
        updated_book = await books_crud.replace_book_cover(db, book_id, cover_image, current_user.id)
        
        return {
            "message": "Cover replaced successfully",
            "cover_url": updated_book.cover_image_url,
            "cover_key": updated_book.cover_image_key
        }
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error replacing cover: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error replacing cover"
        )


@router.delete("/{book_id}/cover")
async def delete_book_cover(
    book_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Удалить обложку книги"""
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    
    if book.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    if book.cover_image_key:
        try:
            minio_service.delete_file(book.cover_image_key)
            
            book.cover_image_key = None
            book.cover_image_url = None
            book.cover_image_updated_at = None
            db.commit()
            
            return {"message": "Cover deleted successfully"}
        except Exception as e:
            logger.error(f"Error deleting cover: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error deleting file: {str(e)}"
            )
    else:
        return {"message": "No cover to delete"}


@router.get("/{book_id}/cover/refresh")
async def refresh_book_cover_url(
    book_id: int,
    db: Session = Depends(get_db)
):
    """Обновить URL обложки (если истек срок действия)"""
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    
    new_url = books_crud.get_book_cover_url(book, refresh=True)
    
    return {
        "book_id": book_id,
        "cover_url": new_url,
        "expires_in": "1 hour"
    }


@router.get("/catalog", response_model=List[Catalog])
async def get_catalog(
    skip: int = Query(0, ge=0, description="Смещение для пагинации"),
    limit: int = Query(100, ge=1, le=1000, description="Лимит записей"),
    tag_ids: Optional[List[int]] = Query(None, description="Фильтр по тегам"),
    db: Session = Depends(get_db)
):
    """Получить каталог книг"""
    if tag_ids:
        books = books_crud.search_books_by_tags(db, tag_ids, skip=skip, limit=limit)
        catalog_books = []
        for book in books:
            readers_count = books_crud.get_readers_count(db, book.id)
            tags = [TagInfo(id=tag.id, tag_name=tag.tag_name) for tag in book.tags]
            cover_url = books_crud.get_book_cover_url(book)  # Получаем актуальный URL
            catalog_books.append(Catalog(
                id=book.id,
                title=book.title,
                author=book.author,
                cover_image_uri=cover_url,
                readers_count=readers_count,
                tags=tags
            ))
        return catalog_books
    else:
        return books_crud.get_catalog_books(db, skip=skip, limit=limit)


@router.get("/{book_id}")
async def get_book(
    book_id: int,
    db: Session = Depends(get_db)
):
    """Получить детальную информацию о книге"""
    book = books_crud.get_book_with_details(db, book_id)
    if not book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Book not found"
        )
    return book


@router.put("/{book_id}", status_code=status.HTTP_200_OK)
async def update_book(
    book_id: int,
    title: Optional[str] = Form(None, description="Название книги"),
    author: Optional[str] = Form(None, description="Автор книги"),
    description: Optional[str] = Form(None, description="Описание книги"),
    location_ids: Optional[str] = Form(None, description="ID локаций (через запятую, например: 1,2,3)"),
    tag_ids: Optional[str] = Form(None, description="ID тегов (через запятую, например: 1,2,3)"),
    cover_image: Optional[UploadFile] = File(None, description="Новая обложка книги"),
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
    
    cover_image_key = None
    new_cover_uploaded = False
    
    def parse_ids(ids_str: Optional[str]) -> Optional[List[int]]:
        if not ids_str or ids_str.strip() == "":
            return None
        try:
            return [int(x.strip()) for x in ids_str.split(',') if x.strip()]
        except ValueError:
            return None
    
    try:
        if cover_image:
            file_info = await minio_service.upload_file(cover_image)
            cover_image_key = file_info["filename"]
            new_cover_uploaded = True
            logger.info(f"New cover uploaded for book {book_id}: {cover_image_key}")
        
        parsed_location_ids = parse_ids(location_ids)
        parsed_tag_ids = parse_ids(tag_ids)
        
        book_update_data = BookUpdate(
            title=title if title else None,
            author=author if author else None,
            description=description if description else None,
            cover_image_key=cover_image_key if new_cover_uploaded else None,
            location_ids=parsed_location_ids,
            tag_ids=parsed_tag_ids
        )
        
        has_updates = any([
            title is not None, author is not None, description is not None,
            status is not None, parsed_tag_ids is not None, new_cover_uploaded
        ])
        
        if has_updates:
            books_crud.update_book(db, book_id, book_update_data, current_user.id)
        
        if parsed_location_ids is not None:
            books_crud.update_book_locations(db, book_id, parsed_location_ids, current_user.id)
        
        book_with_details = books_crud.get_book_with_details(db, book_id)
        
        response_data = {
            "message": "Book updated successfully",
            "book": book_with_details
        }
        
        if new_cover_uploaded:
            response_data["cover_key"] = cover_image_key
            response_data["cover_url"] = book_with_details.get("cover_image_uri")
        
        return response_data
        
    except ValueError as e:
        if new_cover_uploaded and cover_image_key:
            try:
                minio_service.delete_file(cover_image_key)
            except:
                pass
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        if new_cover_uploaded and cover_image_key:
            try:
                minio_service.delete_file(cover_image_key)
            except:
                pass
        logger.error(f"Error updating book: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error while updating book"
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
    tag_ids: Optional[List[int]] = Query(None, description="Фильтр по тегам"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db)
):
    books_query = db.query(Book).filter(
        (Book.title.ilike(f"%{query}%")) | (Book.author.ilike(f"%{query}%")),
        Book.status == 'available'
    )
    
    if tag_ids:
        books_query = books_query.join(Book.tags).filter(Tag.id.in_(tag_ids)).group_by(Book.id)
    
    books = books_query.offset(skip).limit(limit).all()
    
    catalog_books = []
    for book in books:
        readers_count = books_crud.get_readers_count(db, book.id)
        tags = [TagInfo(id=tag.id, tag_name=tag.tag_name) for tag in book.tags]
        cover_url = books_crud.get_book_cover_url(book)  # Получаем актуальный URL
        catalog_books.append(Catalog(
            id=book.id,
            title=book.title,
            author=book.author,
            cover_image_uri=cover_url,
            readers_count=readers_count,
            tags=tags
        ))
    
    return catalog_books


@router.get("/popular/", response_model=List[Catalog])
async def get_popular_books(
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db)
):
    return books_crud.get_catalog_books(db, limit=limit, sort_by="readers")


@router.post("/{book_id}/tags")
async def add_tags_to_book(
    book_id: int,
    tag_ids: List[int] = Body(..., description="ID тегов для добавления"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    
    if book.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only owner can add tags to this book"
        )
    
    try:
        updated_book = books_crud.add_tags_to_book(db, book_id, tag_ids, current_user.id)
        return books_crud.get_book_with_details(db, book_id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.delete("/{book_id}/tags")
async def remove_tags_from_book(
    book_id: int,
    tag_ids: List[int] = Body(..., description="ID тегов для удаления"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    
    if book.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only owner can remove tags from this book"
        )
    
    try:
        updated_book = books_crud.remove_tags_from_book(db, book_id, tag_ids, current_user.id)
        return books_crud.get_book_with_details(db, book_id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/by-tags/", response_model=List[Catalog])
async def get_books_by_tags(
    tag_ids: List[int] = Query(..., description="ID тегов для поиска"),
    match_all: bool = Query(True, description="True - все теги, False - хотя бы один"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db)
):
    if match_all:
        books = books_crud.search_books_by_tags(db, tag_ids, skip=skip, limit=limit)
    else:
        books = db.query(Book).join(Book.tags).filter(
            Tag.id.in_(tag_ids)
        ).distinct().offset(skip).limit(limit).all()
    
    catalog_books = []
    for book in books:
        readers_count = books_crud.get_readers_count(db, book.id)
        tags = [TagInfo(id=tag.id, tag_name=tag.tag_name) for tag in book.tags]
        cover_url = books_crud.get_book_cover_url(book)  # Получаем актуальный URL
        catalog_books.append(Catalog(
            id=book.id,
            title=book.title,
            author=book.author,
            cover_image_uri=cover_url,
            readers_count=readers_count,
            tags=tags
        ))
    
    return catalog_books


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