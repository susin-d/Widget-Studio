from datetime import datetime
from typing import List, Dict, Any, Optional, Literal
from uuid import UUID
from pydantic import BaseModel, EmailStr, Field

class UserCreate(BaseModel):
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: UUID
    email: EmailStr
    created_at: datetime

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    email: str

class LayoutSyncRequest(BaseModel):
    widgets: List[Dict[str, Any]]
    settings: Dict[str, Any]
    updated_at: Optional[datetime] = None

class LayoutSyncResponse(BaseModel):
    widgets: List[Dict[str, Any]]
    settings: Dict[str, Any]
    updated_at: datetime

    class Config:
        from_attributes = True

class ChatMessage(BaseModel):
    role: str
    text: str = Field(min_length=1, max_length=4000)

    class Config:
        str_strip_whitespace = True

class ChatRequest(BaseModel):
    messages: List[ChatMessage] = Field(min_length=1, max_length=50)
    persona: str = "assistant"
    reasoning_effort: Literal["low", "medium", "high", "max"] = "high"

class ChatResponse(BaseModel):
    reply: str
