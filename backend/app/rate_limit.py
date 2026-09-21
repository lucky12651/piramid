"""Simple in-process rate limiter for auth and send endpoints."""

from __future__ import annotations

import time
from collections import defaultdict

from fastapi import HTTPException, Request, status

_HITS: dict[str, list[float]] = defaultdict(list)


def client_ip(request: Request) -> str:
    forwarded = (request.headers.get("x-forwarded-for") or "").split(",")[0].strip()
    if forwarded:
        return forwarded
    if request.client:
        return request.client.host
    return "unknown"


def limit(key: str, max_hits: int, window_s: float) -> None:
    now = time.time()
    bucket = [t for t in _HITS[key] if now - t < window_s]
    if len(bucket) >= max_hits:
        _HITS[key] = bucket
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many attempts. Please wait a moment and try again.",
        )
    bucket.append(now)
    _HITS[key] = bucket


def limit_request(request: Request, name: str, max_hits: int, window_s: float) -> None:
    limit(f"{name}:{client_ip(request)}", max_hits, window_s)
