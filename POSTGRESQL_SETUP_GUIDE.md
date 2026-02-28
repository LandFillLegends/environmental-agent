# 📚 PostgreSQL + FastAPI Setup Guide

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

## 🎯 Step-by-Step: Setting Up PostgreSQL with FastAPI

### **STEP 1: Install PostgreSQL on macOS**

**Option A: Using Homebrew (Recommended)**

```bash
# Install Homebrew if you don't have it
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install PostgreSQL
brew install postgresql@15

# Start PostgreSQL service
brew services start postgresql@15

# Check if it's running
brew services list
```

**Option B: Download PostgreSQL App**

- Go to: https://postgresapp.com/
- Download and install Postgres.app
- Open the app and initialize a server

---

### **STEP 2: Create a Database**

```bash
# Access PostgreSQL command line
psql postgres

# Once in psql, run these commands:
CREATE DATABASE landfill_legends;

# Create a user (optional but recommended)
CREATE USER landfill_user WITH PASSWORD 'your_secure_password';

# Grant privileges to the user
GRANT ALL PRIVILEGES ON DATABASE landfill_legends TO landfill_user;

# Exit psql
\q
```

**Verify your database:**

```bash
psql -d landfill_legends
\dt  # List tables (will be empty for now)
\q   # Exit
```

---

### **STEP 3: Install Required Python Packages**

Add these to your `requirements.txt`:

```txt
# Database packages
psycopg2-binary==2.9.9      # PostgreSQL adapter
sqlalchemy==2.0.25          # ORM
alembic==1.13.1             # Database migrations
```

**Install them:**

```bash
cd backend
source venv/bin/activate
pip install psycopg2-binary sqlalchemy alembic
```

---

### **STEP 4: Configure Database Connection**

**A) Update `.env` file:**

```env
# PostgreSQL Database URL
DATABASE_URL=postgresql://landfill_user:your_secure_password@localhost:5432/landfill_legends

# Or if you're using the default postgres user:
DATABASE_URL=postgresql://postgres@localhost:5432/landfill_legends
```

**B) Create `app/core/config.py`:**

```python
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # Database
    DATABASE_URL: str

    # API
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "Landfill Legends"

    # OpenAI
    OPENAI_API_KEY: Optional[str] = None

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
```

**C) Create `app/database.py`:**

```python
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

# Create database engine
engine = create_engine(settings.DATABASE_URL)

# Create SessionLocal class
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create Base class for models
Base = declarative_base()

# Dependency to get database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

---

### **STEP 5: Create Your First Model**

**Edit `app/models/user.py`:**

```python
from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
```

---

### **STEP 6: Create Pydantic Schemas**

**Edit `app/schemas/user.py`:**

```python
from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional

# Base schema
class UserBase(BaseModel):
    email: EmailStr
    username: str

# Schema for creating a user
class UserCreate(UserBase):
    password: str

# Schema for updating a user
class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    username: Optional[str] = None
    password: Optional[str] = None

# Schema for response (what API returns)
class UserResponse(UserBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True  # Allows reading from ORM models
```

---

### **STEP 7: Initialize Database with Alembic**

```bash
cd backend

# Initialize Alembic
alembic init alembic

# Edit alembic.ini - find this line:
sqlalchemy.url = driver://user:pass@localhost/dbname

# Replace it with:
sqlalchemy.url = postgresql://landfill_user:your_secure_password@localhost:5432/landfill_legends
```

**Edit `alembic/env.py`:**
Find this line:

```python
target_metadata = None
```

Replace with:

```python
from app.database import Base
from app.models import user  # Import all models
target_metadata = Base.metadata
```

**Create first migration:**

```bash
alembic revision --autogenerate -m "Create users table"

# Apply migration
alembic upgrade head
```

**Verify in database:**

```bash
psql -d landfill_legends
\dt  # Should show 'users' table
\d users  # Show table structure
\q
```

---

### **STEP 8: Create API Routes**

**Edit `app/routes/user.py`:**

```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.user import UserCreate, UserResponse
from app.models.user import User

router = APIRouter(prefix="/users", tags=["users"])

@router.post("/", response_model=UserResponse)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    # Check if user exists
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Create new user (you should hash the password!)
    new_user = User(
        email=user.email,
        username=user.username,
        hashed_password=user.password  # TODO: Hash this!
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.get("/{user_id}", response_model=UserResponse)
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
```

---

### **STEP 9: Update Main App**

**Edit `app/main.py`:**

```python
from fastapi import FastAPI
from app.routes import user
from app.database import engine, Base

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Landfill Legends API")

# Include routers
app.include_router(user.router, prefix="/api/v1")

@app.get("/")
def root():
    return {"message": "Landfill Legends API is running"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}
```

---

### **STEP 10: Test Your API**

```bash
# Start the server
cd backend
source venv/bin/activate
uvicorn main:app --reload --port 8000
```

**Visit:**

- API Docs: http://localhost:8000/docs
- Create a user via POST `/api/v1/users/`
- Get a user via GET `/api/v1/users/1`

---

## 📝 Key Concepts to Understand

### **1. SQLAlchemy Models vs Pydantic Schemas**

- **Models** (`app/models/`): Database tables (ORM)
- **Schemas** (`app/schemas/`): Data validation for API requests/responses

### **2. Database Session Management**

```python
def get_db():
    db = SessionLocal()
    try:
        yield db  # Provides session to route
    finally:
        db.close()  # Always closes after use
```

### **3. Alembic Migrations**

- `alembic revision --autogenerate -m "message"` - Create migration
- `alembic upgrade head` - Apply migrations
- `alembic downgrade -1` - Rollback last migration

### **4. Database URL Format**

```
postgresql://username:password@host:port/database_name
```

---

## 🔧 Common Issues & Solutions

**Issue: "psycopg2" installation fails**

```bash
# Use binary version instead
pip install psycopg2-binary
```

**Issue: Can't connect to PostgreSQL**

```bash
# Check if PostgreSQL is running
brew services list

# Restart it
brew services restart postgresql@15
```

**Issue: Permission denied for database**

```sql
-- In psql, grant all privileges
GRANT ALL PRIVILEGES ON DATABASE landfill_legends TO landfill_user;
GRANT ALL ON SCHEMA public TO landfill_user;
```

---

## 📚 Next Steps

1. ✅ Follow steps 1-10 above
2. Add password hashing (bcrypt)
3. Add authentication (JWT tokens)
4. Create more models (games, scores, etc.)
5. Add relationship between models
6. Implement proper error handling

---

## 🎓 Learning Resources

- **SQLAlchemy Docs**: https://docs.sqlalchemy.org/
- **FastAPI DB Tutorial**: https://fastapi.tiangolo.com/tutorial/sql-databases/
- **Alembic Docs**: https://alembic.sqlalchemy.org/
- **PostgreSQL Tutorial**: https://www.postgresqltutorial.com/

---

**Good luck! Take it step by step and test after each stage.** 🚀
