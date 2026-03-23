from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from requests import Session

from app.schemas.tags import CreateTag, TagResponse, TagUpdate
from app.core.db import get_db

from app.models.users import User
from app.crud import tags as tags_crud
from app.core.dependencies import require_moderator
from app.models.books import association_table

router = APIRouter(prefix="/tags", tags=["tags"])

@router.post("/", status_code=status.HTTP_201_CREATED, response_model= TagResponse)
def create_new_tag(
    tag_data: CreateTag,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_moderator)
):
    try:

        new_tag = tags_crud.create_tag(db, tag_data, current_user.id)
        return new_tag 
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    
@router.get("/", response_model=List[TagResponse])
def read_tags(
    skip: int = Query(0, ge=0, description="Смещение для пагинации"),
    limit: int = Query(100, ge=1, le=500, description="Лимит записей"),
    search: Optional[str] = Query(None, description="Поиск по названию тега"),
    db: Session = Depends(get_db)
):

    if search:
        return tags_crud.search_tags_by_name(db, search, skip, limit)
    else:
        return tags_crud.get_all_tags(db, skip=skip, limit=limit)

@router.get("/by-names/", response_model=List[TagResponse])
def read_tags_by_names(
    names: List[str] = Query(..., description="Список имен тегов"),
    db: Session = Depends(get_db)
):

    try:
        return tags_crud.get_tags_by_names(db, names=names)
    except HTTPException as e:
        raise e

@router.get("/search/", response_model=List[TagResponse])
def search_tags(
    query: str = Query(..., min_length=2, description="Поисковый запрос"),
    limit: int = Query(10, ge=1, le=50, description="Максимальное количество результатов"),
    db: Session = Depends(get_db)
):

    return tags_crud.search_tags_by_name(db, query, skip=0, limit=limit)

@router.get("/popular/", response_model=List[TagResponse])
def get_popular_tags(
    limit: int = Query(20, ge=1, le=100, description="Количество популярных тегов"),
    db: Session = Depends(get_db)
):

    return tags_crud.get_popular_tags(db, limit)

@router.get("/{tag_id}", response_model=TagResponse)
def read_tag_by_id(
    tag_id: int,
    db: Session = Depends(get_db)
):

    return tags_crud.get_tag_by_id(db, tag_id)

@router.get("/name/{name}", response_model=TagResponse)
def read_tag_by_name(
    name: str,
    db: Session = Depends(get_db)
):
    return tags_crud.get_tag_by_name(db, name)

@router.put("/{tag_id}", response_model=TagResponse)
def update_tag(
    tag_id: int,
    tag_data: TagUpdate,
    current_user: User = Depends(require_moderator),  
    db: Session = Depends(get_db)
):
    return tags_crud.update_tag(db, tag_id, tag_data)

@router.delete("/{tag_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_tag(
    tag_id: int,
    force: bool = Query(False, description="Принудительно удалить тег, даже если он используется в книгах"),
    current_user: User = Depends(require_moderator),  
    db: Session = Depends(get_db)
):

    try:
        
        books_count = db.query(association_table).filter(
            association_table.c.tag_id == tag_id
        ).count()
        
        if books_count > 0 and not force:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={
                    "message": f"Tag is used by {books_count} books",
                    "books_count": books_count,
                    "force_delete_available": True,
                    "instruction": "Use force=true parameter to delete anyway"
                }
            )
        
        success = tags_crud.delete_tag(db, tag_id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Tag not found"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting tag: {str(e)}"
        )