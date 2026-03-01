# 📚 PostgreSQL + FastAPI + Supabase Setup Guide

## ✅ Current Backend Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI app entry point
│   ├── database.py          # Database connection setup
│   ├── models/              # SQLAlchemy ORM models
│   │   ├── __init__.py
│   │   └── user.py
│   ├── schemas/             # Pydantic validation schemas
│   │   ├── __init__.py
│   │   └── user.py
│   ├── routes/              # API endpoints
│   │   ├── __init__.py
│   │   └── user.py
│   ├── services/            # Business logic
│   │   ├── __init__.py
│   │   └── agent.py
│   └── core/                # Configuration
│       ├── __init__.py
│       └── config.py
│
├── .env                     # Environment variables
├── .env.example
├── .gitignore
├── requirements.txt
└── README.md
```

---

## 🎯 Step-by-Step: Setting Up PostgreSQL with FastAPI + Supabase

### **STEP 1: Create a Supabase Project**

> ✅ Skip local PostgreSQL installation — Supabase IS your PostgreSQL database.

1. Go to [supabase.com](https://supabase.com) → New Project
2. Fill in your project name and **save your database password** — you can't retrieve it later
3. Wait ~2 minutes for provisioning

---

### **STEP 2: Get Your Connection String**

1. Go to **Settings → Database → Connection String → URI tab**
2. Copy the connection string and replace `[YOUR-PASSWORD]` with your saved password:

```env
postgresql://postgres.[project-ref]:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres
```

---

### **STEP 3: Install Required Python Packages**

Add these to your `requirements.txt`:

```txt
psycopg2-binary==2.9.9
sqlalchemy==2.0.25
alembic==1.13.1
python-jose[cryptography]
httpx
```

Install them:

```bash
cd backend
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install psycopg2-binary sqlalchemy alembic python-jose httpx
```

---

### **STEP 4: Configure Database Connection**

**A) Update `.env` file:**

```env
DATABASE_URL=postgresql://postgres.[project-ref]:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres
SUPABASE_JWT_SECRET=your-jwt-secret   # Settings → API → JWT Secret
```

**B) `app/core/config.py`:**

```python
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    DATABASE_URL: str
    SUPABASE_JWT_SECRET: str

    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "Your App Name"

    OPENAI_API_KEY: Optional[str] = None

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
```

**C) `app/database.py`:**

```python
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"sslmode": "require"},  # Required for Supabase
    pool_pre_ping=True                    # Handles dropped connections
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

---

### **STEP 5: Create Your User Model**

**`app/models/user.py`:**

```python
from sqlalchemy import Column, String, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=True)  # nullable for Google users
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # No hashed_password — Supabase Auth handles authentication
```

---

### **STEP 6: Create Pydantic Schemas**

**`app/schemas/user.py`:**

```python
from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional
import uuid

class UserBase(BaseModel):
    email: EmailStr
    username: Optional[str] = None

class UserCreate(UserBase):
    id: uuid.UUID  # comes from Supabase Auth

class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None

class UserResponse(UserBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
```

---

### **STEP 7: Set Up Alembic Migrations**

```bash
cd backend
alembic init alembic
```

**Comment out the URL in `alembic.ini`:**

```ini
# sqlalchemy.url = driver://user:pass@localhost/dbname
```

**Edit `alembic/env.py` — replace `target_metadata` and update `run_migrations_online()`:**

```python
from app.database import Base
from app.models import user
target_metadata = Base.metadata

def run_migrations_online():
    from app.core.config import settings

    connectable = engine_from_config(
        {"sqlalchemy.url": settings.DATABASE_URL},
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
```

**Create and apply migration:**

```bash
alembic revision --autogenerate -m "create users table with uuid"
alembic upgrade head
```

**Verify in Supabase Dashboard → Table Editor** — you should see your `users` table.

---

### **STEP 8: Set Up Supabase Auth Trigger**

Run this in **Supabase Dashboard → SQL Editor** to auto-create a row in `public.users` when someone signs in with Google:

```sql
-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Auto-create user on Google sign in
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (new.id, new.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

---

### **STEP 9: Protect API Routes with Supabase JWT**

**Create `app/core/auth.py`:**

```python
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from app.core.config import settings

security = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        payload = jwt.decode(
            token,
            settings.SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            audience="authenticated"
        )
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
```

Use it on any protected route:

```python
@router.get("/protected")
def protected_route(user=Depends(get_current_user)):
    return {"user_id": user["sub"]}
```

---

### **STEP 10: Update API Routes**

**`app/routes/user.py`:**

```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.user import UserCreate, UserResponse
from app.models.user import User
from app.core.auth import get_current_user

router = APIRouter(prefix="/users", tags=["users"])

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

@router.get("/me", response_model=UserResponse)
def get_me(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == current_user["sub"]).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
```

---

### **STEP 11: Update Main App**

**`app/main.py`:**

```python
from fastapi import FastAPI
from app.routes import user
from app.database import engine, Base

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Your App API")

app.include_router(user.router, prefix="/api/v1")

@app.get("/")
def root():
    return {"message": "API is running"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}
```

---

### **STEP 12: Test Your API**

```bash
cd backend
venv\Scripts\activate  # Windows
uvicorn app.main:app --reload --port 8000
```

Visit:
- API Docs: http://localhost:8000/docs
- Health check: http://localhost:8000/health

---

## 📝 Key Concepts

### SQLAlchemy Models vs Pydantic Schemas
- **Models** (`app/models/`): Define database tables
- **Schemas** (`app/schemas/`): Validate API requests/responses

### Supabase Auth vs Your `public.users` Table
- **`auth.users`**: Managed by Supabase — stores login credentials and Google OAuth info
- **`public.users`**: Your table — stores app-specific user data, linked by UUID

### Alembic Migration Commands
- `alembic revision --autogenerate -m "message"` — Create migration
- `alembic upgrade head` — Apply migrations
- `alembic downgrade -1` — Rollback last migration
- `alembic stamp base` — Reset migration tracking

---

## 🔧 Common Issues & Solutions

**`window is not defined` on Expo web**
Use `Platform.OS` check in `lib/supabase.ts` to conditionally use `AsyncStorage` only on mobile.

**`cannot cast type integer to uuid`**
Drop the SERIAL default before converting: `ALTER TABLE users ALTER COLUMN id DROP DEFAULT` then use `USING id::text::uuid`.

**`Target database is not up to date`**
Run `alembic stamp base` to reset tracking, then delete old migration files and start fresh.

**`Extra inputs are not permitted` in Pydantic**
Your `.env` has a field not defined in your `Settings` class. Add it as `Optional[str] = None` or remove it from `.env`.

**SSL connection error to Supabase**
Add `connect_args={"sslmode": "require"}` to your `create_engine()` call.

---

## 🎓 Learning Resources

- **SQLAlchemy Docs**: https://docs.sqlalchemy.org/
- **FastAPI DB Tutorial**: https://fastapi.tiangolo.com/tutorial/sql-databases/
- **Alembic Docs**: https://alembic.sqlalchemy.org/
- **Supabase Auth Docs**: https://supabase.com/docs/guides/auth
- **Expo + Supabase**: https://supabase.com/docs/guides/getting-started/tutorials/with-expo-react-native

---

**Good luck! Take it step by step and test after each stage.** 🚀