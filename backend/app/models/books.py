from backend.app.models import users
from db import Base
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.sql import func


class Books(Base):
    __tablename__ = "books"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False, index=True)
    author = Column(String(255), nullable=False, index=True)
    description = Column(Text)
    cover_image_uri = Column(String(500))
    owner_id = Column(Integer, ForeignKey(users.id), nullable=False)
    status = Column(String(20), default="available")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

