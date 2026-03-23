
from sqlalchemy import Column, Integer, String, Text
from sqlalchemy.orm import relationship
from app.core.db import Base, association_table


class Tag(Base):
    __tablename__ = "tags"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    tag_name = Column(String, nullable=False, unique=True)
    description = Column(Text)


    books = relationship(
        "Book", 
        secondary=association_table, 
        back_populates="tags",
        cascade="all, delete"  
    )