from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_admin
from app.models import TransactionLog, User
from app.schemas import AdminUpdateUserRequest, MessageResponse, PlatformStats, UserAdminView
from app.services import wallet_service

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.get("/stats", response_model=PlatformStats)
def stats(admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    total = db.query(User).count()
    active = db.query(User).filter(User.is_active.is_(True)).count()
    admins = db.query(User).filter(User.is_admin.is_(True)).count()
    btc = db.query(User).filter(User.wallet_address_btc.isnot(None), User.wallet_address_btc != "").count()
    ltc = db.query(User).filter(User.wallet_address_ltc.isnot(None), User.wallet_address_ltc != "").count()
    doge = db.query(User).filter(User.wallet_address_doge.isnot(None), User.wallet_address_doge != "").count()
    eth = db.query(User).filter(User.wallet_address_eth.isnot(None), User.wallet_address_eth != "").count()
    recent = db.query(TransactionLog).count()
    return PlatformStats(
        total_users=total,
        active_users=active,
        admin_users=admins,
        wallets_btc=btc,
        wallets_ltc=ltc,
        wallets_doge=doge,
        wallets_eth=eth,
        recent_sends=recent,
    )


@router.get("/users", response_model=list[UserAdminView])
def list_users(
    q: str | None = Query(None),
    limit: int = Query(200, ge=1, le=500),
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    query = db.query(User).order_by(User.id.asc())
    if q:
        like = f"%{q.strip()}%"
        query = query.filter(
            (User.username.ilike(like))
            | (User.email.ilike(like))
            | (User.wallet_address_btc.ilike(like))
            | (User.wallet_address_ltc.ilike(like))
            | (User.wallet_address_eth.ilike(like))
            | (User.wallet_address_doge.ilike(like))
        )
    return [UserAdminView.model_validate(u) for u in query.limit(limit).all()]


@router.get("/users/{user_id}", response_model=UserAdminView)
def get_user(user_id: int, admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return UserAdminView.model_validate(user)


@router.patch("/users/{user_id}", response_model=UserAdminView)
def update_user(
    user_id: int,
    body: AdminUpdateUserRequest,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if body.is_admin is not None:
        if user.id == admin.id and body.is_admin is False:
            raise HTTPException(status_code=400, detail="You cannot remove your own admin role")
        user.is_admin = body.is_admin

    if body.is_active is not None:
        if user.id == admin.id and body.is_active is False:
            raise HTTPException(status_code=400, detail="You cannot disable your own account")
        user.is_active = body.is_active

    db.commit()
    db.refresh(user)
    return UserAdminView.model_validate(user)


@router.delete("/users/{user_id}", response_model=MessageResponse)
def delete_user(
    user_id: int,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == admin.id:
        raise HTTPException(status_code=400, detail="You cannot delete your own admin account")

    wallet_service.delete_bitcoinlib_wallets(
        user.wallet_name,
        user.wallet_name_ltc,
        getattr(user, "wallet_name_doge", None),
    )
    db.delete(user)
    db.commit()
    return MessageResponse(success=True, message=f"Deleted user {user.username}")


@router.get("/transactions")
def all_transactions(
    limit: int = Query(50, ge=1, le=200),
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    rows = (
        db.query(TransactionLog, User)
        .join(User, User.id == TransactionLog.user_id)
        .order_by(TransactionLog.created_at.desc())
        .limit(limit)
        .all()
    )
    return [
        {
            "id": log.id,
            "user_id": log.user_id,
            "username": u.username,
            "email": u.email,
            "coin": log.coin,
            "txid": log.txid,
            "recipient": log.recipient,
            "amount": log.amount,
            "fee": log.fee,
            "status": log.status,
            "created_at": log.created_at.isoformat() if log.created_at else None,
        }
        for log, u in rows
    ]
