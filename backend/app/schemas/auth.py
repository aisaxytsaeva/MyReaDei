import re
from pydantic import BaseModel, EmailStr, Field, field_validator, ValidationError


class UserBase(BaseModel):
    username: str
    email: EmailStr


class UserResponse(UserBase):
    id: int
    is_active: bool
    
    class Config:
        from_attributes = True

class UserRegister(BaseModel):
    username: str
    email: EmailStr
    password: str

    @field_validator("password")
    @classmethod
    def validate_password(cls, value:str) -> str:
        if len(value) < 8:
            raise ValueError("Пароль должен содержать минимум 8 символов")
        if not re.search(r'\d', value):
            raise ValueError("Пароль должен содержать хотя бы одну цифру")


class UserLogin(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: str | None = None


class OAuth2PasswordRequestForm:
    def __init__(
        self,
        username: str,
        password: str,
        scope: str = "",
        client_id: str | None = None,
        client_secret: str | None = None,
    ):
        self.username = username
        self.password = password
        self.scopes = scope.split()
        self.client_id = client_id
        self.client_secret = client_secret

