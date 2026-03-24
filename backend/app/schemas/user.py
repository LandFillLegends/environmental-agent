# User Pydantic schemas
from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional
import uuid

# Base schema
class UserBase(BaseModel):
    email: EmailStr
    username: Optional[str] = None

# Schema for creating a user
class UserCreate(UserBase):
    id: uuid.UUID  # comes from Supabase Auth

# Schema for updating a user
class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None

# Schema for response (what API returns)
class UserResponse(UserBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True # Allows reading from ORM models