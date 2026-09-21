"""Encrypt wallet secrets at rest. Plaintext rows (no prefix) still decrypt as-is."""

from __future__ import annotations

import base64
import hashlib
from functools import lru_cache

from cryptography.fernet import Fernet, InvalidToken

PREFIX = "encv1:"


@lru_cache(maxsize=1)
def _fernet() -> Fernet:
    from app.config import settings

    material = (settings.SECRET_KEY or "piramid-dev-only").encode("utf-8")
    digest = hashlib.sha256(material).digest()
    return Fernet(base64.urlsafe_b64encode(digest))


def seal_secret(value: str | None) -> str | None:
    if value is None:
        return None
    text = str(value)
    if not text:
        return text
    if text.startswith(PREFIX):
        return text
    token = _fernet().encrypt(text.encode("utf-8")).decode("ascii")
    return PREFIX + token


def reveal_secret(value: str | None) -> str:
    if not value:
        return ""
    text = str(value)
    if not text.startswith(PREFIX):
        return text
    blob = text[len(PREFIX) :].encode("ascii")
    try:
        return _fernet().decrypt(blob).decode("utf-8")
    except (InvalidToken, ValueError, TypeError):
        return ""


def secret_field(user, name: str) -> str:
    return reveal_secret(getattr(user, name, None))


def set_secret_field(user, name: str, value: str | None) -> None:
    setattr(user, name, seal_secret(value) if value else value)
