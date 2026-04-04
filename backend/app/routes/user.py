# User API routes

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from app.database import get_db
from app.schemas.user import UserCreate, UserResponse
from app.models.user import User
from app.core.auth import get_current_user

router = APIRouter(prefix="/users", tags=["users"])


class TokenStore(BaseModel):
    google_access_token: str
    google_refresh_token: Optional[str] = None


@router.get("/me", response_model=UserResponse)
def get_me(user=Depends(get_current_user), db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.id == user["sub"]).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user


@router.post("/", response_model=UserResponse)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    new_user = User(id=user.id, email=user.email, username=user.username)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@router.patch("/me", response_model=UserResponse)
def update_me(
    updates: dict,
    user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_user = db.query(User).filter(User.id == user["sub"]).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    for key, value in updates.items():
        setattr(db_user, key, value)
    db.commit()
    db.refresh(db_user)
    return db_user


@router.post("/store-tokens")
def store_tokens(
    tokens: TokenStore,
    user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_user = db.query(User).filter(User.id == user["sub"]).first()
    if not db_user:
        # First sign-in via Google OAuth — create the user row automatically
        email = user.get("email", "")
        username = (email.split("@")[0] if email else None) or user.get("name", "user")
        db_user = User(id=user["sub"], email=email, username=username)
        db.add(db_user)

    db_user.google_access_token = tokens.google_access_token
    if tokens.google_refresh_token:
        db_user.google_refresh_token = tokens.google_refresh_token
    db.commit()
    return {"status": "tokens stored"}