from pydantic_settings import BaseSettings
from typing import Optional
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7 
    
    class Config:
        env_file = ".env"
        case_sensitive = True
    
    @property
    def database_url(self):
        return self.DATABASE_URL

settings = Settings()