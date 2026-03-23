from typing import List, Optional

from fastapi import HTTPException,status
from requests import Session
from sqlalchemy import func
from sqlalchemy.exc import SQLAlchemyError
from app.schemas.tags import TagResponse, CreateTag, TagUpdate
from app.models.tags import Tag
from app.core.db import association_table


def create_tag(db: Session, tag_data: CreateTag, user_id: int) -> TagResponse:
    existing_tag = db.query(Tag).filter(Tag.tag_name == tag_data.tag_name).first()
    if existing_tag:
        raise ValueError(f"Tag with name '{tag_data.name}' already exists")
    
    db_tag = Tag(
        tag_name=tag_data.tag_name,
        description=tag_data.description
    )

    db.add(db_tag)
    db.commit()
    db.refresh(db_tag)
    
    return TagResponse.model_validate(db_tag)


def update_tag(db:Session, tag_id: int, tag_data: TagUpdate) -> TagResponse:
    db_tag = db.query(Tag).filter(Tag.id == tag_id).first()
    if not db_tag:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Tag {tag_id} is not found"
        )
    
    if tag_data.tag_name is not None:
        db_tag.tag_name == tag_data.tag_name

    if tag_data.description is not None:
        db_tag.description == tag_data.description

    try:
        db.commit()
        db.refresh(db_tag)
        return TagResponse.model_validate(db_tag)
    
    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erorr in database"
        )

def delete_tag(db: Session, tag_id: int) -> bool:
    db_tag = db.query(Tag).filter(Tag.id == tag_id).first()
    if not db_tag:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Tag {tag_id} is not found"
        )
    
    try:
        db.delete(db_tag)
        db.commit()
        return True
    
    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting tag: {str(e)}"
        )
    
def get_tag_by_name(db:Session, name: str) -> TagResponse:
    db_tag = db.query(Tag).filter(Tag.tag_name == name).first()
    if not db_tag:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Tag {name} is not found"
        )

    return TagResponse.model_validate(db_tag)

def get_tags(db: Session, names: Optional[List[str]] = None) -> List[TagResponse]:
    query = db.query(Tag)
    
    if names:
        query = query.filter(Tag.tag_name.in_(names))
    
    db_tags = query.all()
    
    if not db_tags:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No tags found"
        )
    return [TagResponse.model_validate(tag) for tag in db_tags]

def get_tag_by_id(db:Session, tag_id: int) -> TagResponse:
    db_tag = db.query(Tag).filter(Tag.id == tag_id).first()
    if not db_tag:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Tag {tag_id} is not found"
        )

    return TagResponse.model_validate(db_tag)

def get_all_tags(db:Session, skip: int = 0, limit: int = 100) -> List[TagResponse]:
    tags = db.query(Tag).offset(skip).limit(limit).all()
    
    list_tags = []
    for task in tags:
        list_tags.append(TagResponse.model_validate(task))
    return list_tags


def search_tags_by_name(
    db: Session, 
    search_term: str, 
    skip: int = 0, 
    limit: int = 100
) -> List[TagResponse]:

    tags = db.query(Tag).filter(
        Tag.tag_name.ilike(f"%{search_term}%")
    ).offset(skip).limit(limit).all()
    
    return [TagResponse.model_validate(tag) for tag in tags]

def get_popular_tags(db: Session, limit: int = 20) -> List[TagResponse]:
    popular_tags = db.query(
        Tag, func.count(association_table.c.book_id).label('book_count')
    ).outerjoin(
        association_table, Tag.id == association_table.c.tag_id
    ).group_by(Tag.id).order_by(
        func.count(association_table.c.book_id).desc()
    ).limit(limit).all()
    
    return [TagResponse.model_validate(tag) for tag, _ in popular_tags]

def get_tags_by_names(db: Session, names: List[str]) -> List[TagResponse]:

    tags = db.query(Tag).filter(Tag.tag_name.in_(names)).all()
    
    if not tags:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No tags found with the specified names"
        )
    
    found_names = {tag.name for tag in tags}
    missing_names = set(names) - found_names
    
    if missing_names:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Tags not found: {missing_names}"
        )
    
    return [TagResponse.model_validate(tag) for tag in tags]