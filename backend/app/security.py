from datetime import datetime, timedelta, timezone
from typing import Optional

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def _bcrypt_secret(password: str) -> str:
    raw = (password or "").encode("utf-8")[:72]
    return raw.decode("utf-8", "ignore")


def hash_password(password: str) -> str:
    return pwd_context.hash(_bcrypt_secret(password))


def verify_password(password: str, password_hash: str) -> bool:
    if not password_hash:
        return False
    try:
        return pwd_context.verify(_bcrypt_secret(password), password_hash)
    except Exception:
        try:
            from werkzeug.security import check_password_hash

            return check_password_hash(password_hash, password)
        except Exception:
            return False


def password_issues(password: str) -> str | None:
    pw = password or ""
    if len(pw) < settings.PASSWORD_MIN_LENGTH:
        return f"Password must be at least {settings.PASSWORD_MIN_LENGTH} characters."
    if pw.strip() != pw:
        return "Password cannot start or end with spaces."
    if pw.lower() in {"password", "12345678", "qwerty123", "letmein1"}:
        return "Choose a stronger password."
    return None


def create_access_token(
    user_id: int, email: str, is_admin: bool = False, token_version: int = 0
) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.JWT_EXPIRE_MINUTES)
    payload = {
        "sub": str(user_id),
        "email": email,
        "is_admin": is_admin,
        "tv": int(token_version or 0),
        "exp": expire,
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm="HS256")


def decode_access_token(token: str) -> Optional[dict]:
    try:
        return jwt.decode(token, settings.JWT_SECRET, algorithms=["HS256"])
    except JWTError:
        return None
