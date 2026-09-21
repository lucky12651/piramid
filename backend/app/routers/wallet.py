from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session

from app.addresses import validate_address
from app.database import get_db
from app.deps import get_current_user
from app.errors import UserWalletError, public_error
from app.models import TransactionLog, User
from app.rate_limit import limit_request
from app.schemas import (
    AddressCheckRequest,
    AddressCheckResponse,
    AddressesResponse,
    BalanceResponse,
    FeeEstimateResponse,
    SendRequest,
    SendResponse,
    TransactionItem,
)
from app.services import wallet_service

router = APIRouter(prefix="/api/wallet", tags=["wallet"])


@router.get("/addresses", response_model=AddressesResponse)
def addresses(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    wallet_service.ensure_addresses_backfill(user, db)
    return AddressesResponse(
        BTC=user.wallet_address_btc,
        LTC=user.wallet_address_ltc,
        DOGE=getattr(user, "wallet_address_doge", None),
        ETH=user.wallet_address_eth,
        USDT=user.wallet_address_eth,
    )


@router.get("/balance", response_model=BalanceResponse)
def balance(
    coin: str = Query("BTC"),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    wallet_service.ensure_addresses_backfill(user, db)
    coin = coin.upper()
    if coin not in wallet_service.SUPPORTED_COINS:
        raise HTTPException(status_code=400, detail="Unsupported coin")
    try:
        data = wallet_service.get_balance(user, coin)
        if data.get("error"):
            data["error"] = public_error(Exception(data["error"]), "Unable to retrieve this balance right now.")
        return BalanceResponse(**data)
    except Exception as e:
        return BalanceResponse(
            coin=coin,
            balance=0,
            balance_raw=0,
            error=public_error(e, "Unable to retrieve this balance right now."),
        )


@router.get("/balances")
def balances(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    wallet_service.ensure_addresses_backfill(user, db)
    result = {}
    for coin in wallet_service.SUPPORTED_COINS:
        try:
            data = wallet_service.get_balance(user, coin)
            if data.get("error"):
                data["error"] = public_error(
                    Exception(data["error"]), "Unable to retrieve this balance right now."
                )
            result[coin] = data
        except Exception as e:
            result[coin] = {
                "coin": coin,
                "balance": 0,
                "balance_raw": 0,
                "error": public_error(e, "Unable to retrieve this balance right now."),
            }
    return result


@router.post("/validate-address", response_model=AddressCheckResponse)
def check_address(body: AddressCheckRequest, user: User = Depends(get_current_user)):
    coin = (body.coin or "").upper()
    ok, err = validate_address(coin, body.address)
    return AddressCheckResponse(ok=ok, coin=coin, address=(body.address or "").strip(), error=err or None)


@router.get("/estimate-fee", response_model=FeeEstimateResponse)
def estimate_fee(coin: str = Query("BTC"), user: User = Depends(get_current_user)):
    coin = (coin or "BTC").upper()
    if coin not in wallet_service.SUPPORTED_COINS:
        raise HTTPException(status_code=400, detail="Unsupported coin")
    if coin in ("ETH", "USDT"):
        gas = wallet_service.get_eth_gas()
        return FeeEstimateResponse(
            coin=coin,
            fee=gas.get("transfer_eth") if coin == "ETH" else None,
            unit="ETH",
            gwei=gas.get("gwei"),
            transfer_eth=gas.get("transfer_eth"),
            note="USDT also needs a small amount of ETH for gas.",
        )
    fee = wallet_service.DEFAULT_FEES.get(coin, 0.00001)
    return FeeEstimateResponse(coin=coin, fee=fee, unit=coin, note="Network miner fee (not a platform fee).")


@router.post("/send", response_model=SendResponse)
def send(
    body: SendRequest,
    request: Request,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    limit_request(request, f"send:{user.id}", 8, 60)
    coin = (body.coin or "BTC").upper()
    ok, err = validate_address(coin, body.address)
    if not ok:
        raise HTTPException(status_code=400, detail=err)
    try:
        result = wallet_service.send_crypto(user, coin, body.address, body.amount, body.fee)
    except UserWalletError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message) from e
    except Exception as e:
        raise HTTPException(
            status_code=502,
            detail=public_error(e, "Unable to send this transaction right now. Please try again."),
        ) from e

    if not result.get("success"):
        raise HTTPException(
            status_code=400,
            detail=public_error(
                Exception(result.get("error") or "Send failed"),
                "Unable to send this transaction. Check the address, amount, and balance.",
            ),
        )

    log = TransactionLog(
        user_id=user.id,
        coin=coin,
        txid=result.get("txid"),
        recipient=body.address.strip(),
        amount=str(body.amount),
        fee=str(result.get("fee") or body.fee or ""),
        status="broadcast",
    )
    db.add(log)
    db.commit()
    result.pop("broadcast_via", None)
    return SendResponse(**result)


@router.get("/transactions", response_model=list[TransactionItem])
def transactions(
    coin: str = Query("BTC"),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    wallet_service.ensure_addresses_backfill(user, db)
    coin = coin.upper()
    if coin not in wallet_service.SUPPORTED_COINS:
        raise HTTPException(status_code=400, detail="Unsupported coin")
    try:
        txs = wallet_service.get_transactions(user, coin)
        return [TransactionItem(**t) for t in txs]
    except Exception as e:
        raise HTTPException(
            status_code=502,
            detail=public_error(e, "Unable to load transaction history right now."),
        ) from e


@router.get("/send-history")
def send_history(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rows = (
        db.query(TransactionLog)
        .filter(TransactionLog.user_id == user.id)
        .order_by(TransactionLog.created_at.desc())
        .limit(50)
        .all()
    )
    return [
        {
            "id": r.id,
            "coin": r.coin,
            "txid": r.txid,
            "recipient": r.recipient,
            "amount": r.amount,
            "fee": r.fee,
            "status": r.status,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        }
        for r in rows
    ]


@router.get("/gas")
def gas():
    data = wallet_service.get_eth_gas()
    data.pop("source", None)
    if not data.get("ok"):
        data["error"] = "Unable to fetch Ethereum gas right now."
    return data


@router.get("/nfts")
def nfts(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    wallet_service.ensure_addresses_backfill(user, db)
    addr = user.wallet_address_eth
    return {"address": addr, "items": wallet_service.get_nfts(addr or "")}
