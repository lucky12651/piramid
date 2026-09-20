import os
from pathlib import Path
from urllib.parse import quote_plus

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")


def _build_database_url() -> str:
    """Prefer DATABASE_URL; else build from POSTGRES_* env (required)."""
    explicit = (os.environ.get("DATABASE_URL") or "").strip()
    if explicit:
        return explicit

    host = (os.environ.get("POSTGRES_HOST") or "").strip()
    if not host:
        raise RuntimeError(
            "No database configured. Set POSTGRES_HOST / POSTGRES_* in backend/.env "
            "or set DATABASE_URL (PostgreSQL)."
        )

    user = quote_plus(os.environ.get("POSTGRES_USER", "postgres"))
    password = quote_plus(os.environ.get("POSTGRES_PASSWORD", ""))
    port = os.environ.get("POSTGRES_PORT", "5432")
    db = os.environ.get("POSTGRES_DB", "crypto-wallet")
    return f"postgresql+psycopg2://{user}:{password}@{host}:{port}/{db}"


class Settings:
    SECRET_KEY: str = os.environ.get("SECRET_KEY", "cryptowallet-dev-secret-change-me")
    JWT_SECRET: str = os.environ.get(
        "JWT_SECRET", os.environ.get("SECRET_KEY", "cryptowallet-jwt-secret")
    )
    JWT_EXPIRE_MINUTES: int = int(os.environ.get("JWT_EXPIRE_MINUTES", "10080"))  # 7 days
    DATABASE_URL: str = _build_database_url()
    ADMIN_EMAIL: str = (os.environ.get("ADMIN_EMAIL") or "").strip().lower()
    ADMIN_PASSWORD: str = (os.environ.get("ADMIN_PASSWORD") or "").strip()
    CORS_ORIGINS: list[str] = [
        o.strip()
        for o in os.environ.get(
            "CORS_ORIGINS",
            "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000",
        ).split(",")
        if o.strip()
    ]
    ETH_RPC_URL: str = os.environ.get(
        "ETH_RPC_URL",
        "https://eth.llamarpc.com",
    )
    APP_NAME: str = "Piramid"

    @property
    def is_postgres(self) -> bool:
        return self.DATABASE_URL.startswith("postgresql")


settings = Settings()
