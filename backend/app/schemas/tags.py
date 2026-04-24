from typing import Optional
from pydantic import BaseModel, ConfigDict


class CreateTag(BaseModel):
    tag_name: str
    description: str


class TagResponse(BaseModel):
    id: int
    tag_name: str
    description: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)


class TagUpdate(BaseModel):
    tag_name: Optional[str] = None
    description: Optional[str] = None
