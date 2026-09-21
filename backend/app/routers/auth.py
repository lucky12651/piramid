from datetime import datetime, timezone
import re

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.config import settings
from app.crypto_box import seal_secret
from app.database import get_db
from app.deps import get_current_user
from app.models import User
from app.rate_limit import limit_request
from app.schemas import (
    ChangePasswordRequest,
    LoginRequest,
    MessageResponse,
    RegisterRequest,
    RevealSecretsRequest,
    TokenResponse,
    UserMe,
    UserPublic,
)
from app.security import (
    create_access_token,
    hash_password,
    password_issues,
    verify_password,
)
from app.services import wallet_service

router = APIRouter(prefix="/api/auth", tags=["auth"])

_USERNAME_OK = re.compile(r"^[a-zA-Z0-9_.-]{3,80}$")


def _to_public(user: User) -> UserPublic:
    return UserPublic.model_validate(user)


def _token(user: User) -> str:
    return create_access_token(
        user.id, user.email, user.is_admin, getattr(user, "token_version", 0) or 0
    )


@router.post("/register", response_model=TokenResponse)
def register(body: RegisterRequest, request: Request, db: Session = Depends(get_db)):
    limit_request(request, "register", 5, 600)
    if not body.agree_terms:
        raise HTTPException(status_code=400, detail="You must agree to the terms")

    issue = password_issues(body.password)
    if issue:
        raise HTTPException(status_code=400, detail=issue)

    email = body.email.strip().lower()
    username = body.username.strip()
    if not _USERNAME_OK.match(username):
        raise HTTPException(
            status_code=400,
            detail="Username may only contain letters, numbers, dots, underscores, and hyphens.",
        )

    if db.query(User).filter((User.username == username) | (func.lower(User.email) == email)).first():
        raise HTTPException(status_code=400, detail="Username or email already exists")

    is_first_user = db.query(User).count() == 0
    is_admin = bool(
        (settings.ADMIN_EMAIL and email == settings.ADMIN_EMAIL) or (not settings.ADMIN_EMAIL and is_first_user)
    )

    try:
        wallets = wallet_service.create_all_wallets()
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail="Wallet creation failed. Please try again in a moment.",
        ) from e

    user = User(
        username=username,
        email=email,
        is_admin=is_admin,
        is_active=True,
        password_hash=hash_password(body.password),
        wallet_name=wallets.get("wallet_name"),
        wallet_name_ltc=wallets.get("wallet_name_ltc"),
        wallet_name_doge=wallets.get("wallet_name_doge"),
        wallet_address_btc=wallets.get("wallet_address_btc"),
        wallet_address_ltc=wallets.get("wallet_address_ltc"),
        wallet_address_doge=wallets.get("wallet_address_doge"),
        wallet_address_eth=wallets.get("wallet_address_eth"),
        passphrase=seal_secret(wallets.get("passphrase")),
        passphrase_eth=seal_secret(wallets.get("passphrase_eth") or wallets.get("passphrase")),
        private_master_key_wif_btc=seal_secret(wallets.get("private_master_key_wif_btc")),
        private_master_key_wif_ltc=seal_secret(wallets.get("private_master_key_wif_ltc")),
        private_master_key_wif_doge=seal_secret(wallets.get("private_master_key_wif_doge")),
        private_key_eth=seal_secret(wallets.get("private_key_eth")),
        token_version=0,
        created_at=datetime.now(timezone.utc),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return TokenResponse(access_token=_token(user), user=_to_public(user))


@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest, request: Request, db: Session = Depends(get_db)):
    limit_request(request, "login", 12, 300)
    email = body.email.strip().lower()
    user = db.query(User).filter(func.lower(User.email) == email).first()
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    if not getattr(user, "is_active", True):
        raise HTTPException(status_code=403, detail="Account is disabled")

    if settings.ADMIN_EMAIL and email == settings.ADMIN_EMAIL and not user.is_admin:
        user.is_admin = True

    user.last_login = datetime.now(timezone.utc)
    db.commit()
    db.refresh(user)

    return TokenResponse(access_token=_token(user), user=_to_public(user))


@router.get("/me", response_model=UserMe)
def me(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    wallet_service.ensure_addresses_backfill(user, db)
    return UserMe.model_validate(user)


@router.post("/change-password", response_model=MessageResponse)
def change_password(
    body: ChangePasswordRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not verify_password(body.current_password, user.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    issue = password_issues(body.new_password)
    if issue:
        raise HTTPException(status_code=400, detail=issue)
    if verify_password(body.new_password, user.password_hash):
        raise HTTPException(status_code=400, detail="New password must be different from the current password")
    user.password_hash = hash_password(body.new_password)
    user.token_version = int(getattr(user, "token_version", 0) or 0) + 1
    db.commit()
    return MessageResponse(success=True, message="Password updated. Please sign in again.")


@router.post("/recovery-phrase")
def recovery_phrase(
    body: RevealSecretsRequest,
    request: Request,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return recovery material after password confirmation. Highly sensitive."""
    limit_request(request, f"reveal:{user.id}", 6, 300)
    if not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=400, detail="Password is incorrect")
    wallet_service.ensure_addresses_backfill(user, db)
    db.refresh(user)
    bundle = wallet_service.recovery_bundle(user)
    bundle["passphrase"] = bundle["mnemonic_utxo"]["passphrase"]
    bundle["passphrase_eth"] = bundle["mnemonic_evm"]["passphrase"]
    return bundle


@router.get("/recovery-phrase")
def recovery_phrase_get():
    raise HTTPException(
        status_code=405,
        detail="Recovery data requires a POST with your password.",
    )
