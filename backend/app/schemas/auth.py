import re
from pydantic import BaseModel, EmailStr, Field, field_validator, ValidationError


class UserRegister(BaseModel):
    username: str
    email: EmailStr
    password: str

    @field_validator("password")
    @classmethod
    def validate_password(cls, value:str) -> str:
        if len(value) < 8:
            raise ValueError("Пароль должен содержать минимум 8 символов")
        if not re.search(r'/d', value):
            raise ValueError("Пароль должен содержать хотя бы одну цифру")
        if not re.match(r'^[A-Za-z0-9!@#$%^&*()_+\-=\[\]{};\':"\\|,.<>/?]+$',value):
            raise ValueError("Пароль должен содержать только латинские буквы, цифры и специальные символы")
        return value

class UserLogin(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    is_active: bool