
from core.permissions import UserRole
from core.db import Base
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

class User(Base):

    __tablename__="users"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), default=UserRole.USER)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    is_active = Column(Boolean, default=True)


    books = relationship("Book", back_populates="owner")
    reservations = relationship("Reservation", back_populates="borrower")


    def is_admin(self) -> bool:
        return self.role == UserRole.ADMIN
    
    def is_moderator(self) -> bool:
        return self.role == UserRole.MODERATOR
    
    def is_user(self) -> bool:
        return self.role == UserRole.USER
    
    def has_role(self, role: UserRole) -> bool:
        return self.role == role
    
    def __str__(self):
        return f"User(id={self.id}, username={self.username}, role={self.role})"