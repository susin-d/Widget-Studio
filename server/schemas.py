from datetime import datetime
from typing import List, Dict, Any, Optional
from uuid import UUID
from pydantic import BaseModel, EmailStr

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

class LayoutSyncResponse(BaseModel):
    widgets: List[Dict[str, Any]]
    settings: Dict[str, Any]
    updated_at: datetime

    class Config:
        from_attributes = True

class ChatMessage(BaseModel):
    role: str
    text: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    persona: str = "assistant"

class ChatResponse(BaseModel):
    reply: str
