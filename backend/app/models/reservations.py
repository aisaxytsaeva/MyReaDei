from backend.app.models import books, locations, users
from db import Base
from sqlalchemy import Column, Integer, ForeignKey, String, DateTime
from sqlalchemy.sql import func

class Reservations(Base):
    __tablename__ = "reservations"

    id = Column(Integer, primary_key=True, index=True)
    book_id = Column(Integer, ForeignKey(books.id), nullable=False)
    borrower_id = Column(Integer, ForeignKey(users.id), nullable=False)
    selected_location = Column(Integer, ForeignKey(locations.id))
    status = Column(String(20), default="pending")
    planned_return_days = Column(Integer, nullable=False)
    returned_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True),server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now())