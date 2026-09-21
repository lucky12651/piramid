from datetime import datetime, timezone

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.database import Base


def utcnow():
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "user"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(150), unique=True, nullable=False, index=True)
    email = Column(String(150), unique=True, nullable=False, index=True)
    is_admin = Column(Boolean, default=False, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    password_hash = Column(String(255), nullable=False)

    wallet_name = Column(String(150), unique=True)
    wallet_name_ltc = Column(String(150), unique=True)
    wallet_name_doge = Column(String(150), unique=True)
    wallet_address_btc = Column(String(150))
    wallet_address_ltc = Column(String(150))
    wallet_address_doge = Column(String(150))
    wallet_address_eth = Column(String(150))
    passphrase = Column(Text)
    passphrase_eth = Column(Text)
    private_master_key_wif_btc = Column(Text)
    private_master_key_wif_ltc = Column(Text)
    private_master_key_wif_doge = Column(Text)
    private_key_eth = Column(Text)
    token_version = Column(Integer, default=0, nullable=False)

    created_at = Column(DateTime, default=utcnow)
    last_login = Column(DateTime, nullable=True)

    send_logs = relationship("TransactionLog", back_populates="user", cascade="all, delete-orphan")


class TransactionLog(Base):
    __tablename__ = "transaction_log"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("user.id"), nullable=False, index=True)
    coin = Column(String(10), nullable=False)
    txid = Column(String(120), nullable=True)
    recipient = Column(String(200), nullable=False)
    amount = Column(String(50), nullable=False)
    fee = Column(String(50), nullable=True)
    status = Column(String(40), default="broadcast")
    created_at = Column(DateTime, default=utcnow)

    user = relationship("User", back_populates="send_logs")
