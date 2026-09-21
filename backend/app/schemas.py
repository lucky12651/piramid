from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field


class RegisterRequest(BaseModel):
    username: str = Field(min_length=3, max_length=80)
    email: EmailStr
    password: str = Field(min_length=8, max_length=72)
    agree_terms: bool = True


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserPublic"


class UserPublic(BaseModel):
    id: int
    username: str
    email: str
    is_admin: bool = False
    is_active: bool = True
    wallet_address_btc: Optional[str] = None
    wallet_address_ltc: Optional[str] = None
    wallet_address_doge: Optional[str] = None
    wallet_address_eth: Optional[str] = None
    created_at: Optional[datetime] = None
    last_login: Optional[datetime] = None

    class Config:
        from_attributes = True


class UserAdminView(UserPublic):
    wallet_name: Optional[str] = None
    wallet_name_ltc: Optional[str] = None
    wallet_name_doge: Optional[str] = None


class UserMe(UserPublic):
    wallet_name: Optional[str] = None


class AddressesResponse(BaseModel):
    BTC: Optional[str] = None
    LTC: Optional[str] = None
    DOGE: Optional[str] = None
    ETH: Optional[str] = None
    USDT: Optional[str] = None


class BalanceResponse(BaseModel):
    coin: str
    balance: float
    balance_raw: int = 0
    error: Optional[str] = None


class SendRequest(BaseModel):
    coin: str = "BTC"
    address: str = Field(min_length=8, max_length=128)
    amount: float = Field(gt=0, le=21_000_000)
    fee: Optional[float] = Field(default=None, ge=0, le=100)


class SendResponse(BaseModel):
    success: bool
    txid: Optional[str] = None
    coin: Optional[str] = None
    amount: Optional[float] = None
    fee: Optional[float] = None
    recipient: Optional[str] = None
    message: Optional[str] = None
    error: Optional[str] = None


class TransactionItem(BaseModel):
    coin: str
    txid: str
    status: str = "unknown"
    confirmations: int = 0
    date: str
    amount: float
    transaction_type: str


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8, max_length=72)


class RevealSecretsRequest(BaseModel):
    password: str


class AddressCheckRequest(BaseModel):
    coin: str
    address: str


class AddressCheckResponse(BaseModel):
    ok: bool
    coin: str
    address: str
    error: Optional[str] = None


class FeeEstimateResponse(BaseModel):
    coin: str
    fee: Optional[float] = None
    unit: str = ""
    note: Optional[str] = None
    gwei: Optional[float] = None
    transfer_eth: Optional[float] = None


class AdminUpdateUserRequest(BaseModel):
    is_admin: Optional[bool] = None
    is_active: Optional[bool] = None


class PlatformStats(BaseModel):
    total_users: int
    active_users: int
    admin_users: int
    wallets_btc: int
    wallets_ltc: int
    wallets_doge: int
    wallets_eth: int
    recent_sends: int


class PriceItem(BaseModel):
    id: str
    symbol: str
    name: str
    price_usd: float
    change_24h: Optional[float] = None
    market_cap: Optional[float] = None
    image: Optional[str] = None


class MessageResponse(BaseModel):
    success: bool
    message: str


TokenResponse.model_rebuild()
