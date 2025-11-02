from db import Base
from sqlalchemy import Column, Integer, String, DateTime, Float, Boolean, ForeignKey
from sqlalchemy.sql import func

class Locations(Base):
    __tablename__ = "locations"

    id = Column(Integer, primary_key=True, nullable=False)
    name = Column(String(100), nullable=False)
    address = Column(String(255), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    created_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"))
    is_approved = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())