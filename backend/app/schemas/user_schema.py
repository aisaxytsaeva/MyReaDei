from pydantic import BaseModel, EmailStr

class UserProfile(BaseModel):
    id: int
    username: str
    email: EmailStr
    book_added: int 
    book_borrowed: int 
