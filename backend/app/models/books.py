from app.core.db import Base, association_table
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from .tags import Tag


class Book(Base):
    __tablename__ = "books"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    title = Column(String(255), nullable=False, index=True)
    author = Column(String(255), nullable=False, index=True)
    description = Column(Text)
    
    cover_image_key = Column(String(500), nullable=True)  
    cover_image_url = Column(String(1000), nullable=True)  
    cover_image_updated_at = Column(DateTime, nullable=True)  #
    
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(String(20), default="available")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    owner = relationship("User", back_populates="books")
    reservations = relationship("Reservation", back_populates="book")
    tags = relationship("Tag", secondary=association_table, back_populates="books")