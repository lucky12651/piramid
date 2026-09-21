from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import func, text

from app.config import settings
from app.database import Base, SessionLocal, engine, ensure_postgres_columns
from app.errors import UserWalletError
from app.models import User  # noqa: F401 — register models
from app.models import TransactionLog  # noqa: F401
from app.routers import admin, auth, market, wallet
from app.security import hash_password


def ensure_env_admin():
    if not settings.ADMIN_EMAIL or not settings.ADMIN_PASSWORD:
        return
    db = SessionLocal()
    try:
        user = db.query(User).filter(func.lower(User.email) == settings.ADMIN_EMAIL).first()
        if user is None:
            base = (settings.ADMIN_EMAIL.split("@", 1)[0] or "admin")[:140]
            username = f"{base}_admin"
            i = 2
            while db.query(User).filter(User.username == username).first():
                username = f"{base}_admin{i}"
                i += 1
            user = User(
                username=username,
                email=settings.ADMIN_EMAIL,
                is_admin=True,
                is_active=True,
                password_hash=hash_password(settings.ADMIN_PASSWORD),
            )
            db.add(user)
            db.commit()
        else:
            if not user.is_admin:
                user.is_admin = True
                db.commit()
    except Exception as e:
        print(f"Admin bootstrap warning: {e}")
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    ensure_postgres_columns()
    print(f"Database: PostgreSQL → {settings.DATABASE_URL.split('@')[-1]}")
    ensure_env_admin()
    yield


app = FastAPI(
    title=settings.APP_NAME,
    description="Multi-chain crypto wallet API (BTC, LTC, ETH)",
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)


@app.middleware("http")
async def security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "same-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    if request.url.path.startswith("/api/auth/recovery"):
        response.headers["Cache-Control"] = "no-store"
    return response


@app.exception_handler(UserWalletError)
async def wallet_error_handler(_request: Request, exc: UserWalletError):
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.message})


app.include_router(auth.router)
app.include_router(wallet.router)
app.include_router(admin.router)
app.include_router(market.router)


@app.get("/api/health")
def health():
    db_ok = False
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
            db_ok = True
    except Exception:
        db_ok = False
    return {
        "status": "ok" if db_ok else "degraded",
        "app": settings.APP_NAME,
        "version": "2.0.0",
        "database": "up" if db_ok else "down",
    }
