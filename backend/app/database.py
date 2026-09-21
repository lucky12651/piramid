from sqlalchemy import create_engine, text, inspect
from sqlalchemy.orm import sessionmaker, DeclarativeBase

from app.config import settings

# pool_pre_ping keeps remote Postgres connections healthy
engine = create_engine(
    settings.DATABASE_URL,
    future=True,
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def ensure_postgres_columns():
    """Add any missing columns on Postgres without Alembic."""
    try:
        insp = inspect(engine)
        if "user" not in insp.get_table_names():
            return
        existing = {c["name"] for c in insp.get_columns("user")}
        needed = {
            "wallet_name_doge": 'ALTER TABLE "user" ADD COLUMN IF NOT EXISTS wallet_name_doge VARCHAR(150)',
            "wallet_address_doge": 'ALTER TABLE "user" ADD COLUMN IF NOT EXISTS wallet_address_doge VARCHAR(150)',
            "private_master_key_wif_doge": 'ALTER TABLE "user" ADD COLUMN IF NOT EXISTS private_master_key_wif_doge TEXT',
            "passphrase_eth": 'ALTER TABLE "user" ADD COLUMN IF NOT EXISTS passphrase_eth TEXT',
            "is_active": 'ALTER TABLE "user" ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE',
            "created_at": 'ALTER TABLE "user" ADD COLUMN IF NOT EXISTS created_at TIMESTAMP',
            "last_login": 'ALTER TABLE "user" ADD COLUMN IF NOT EXISTS last_login TIMESTAMP',
            "token_version": 'ALTER TABLE "user" ADD COLUMN IF NOT EXISTS token_version INTEGER NOT NULL DEFAULT 0',
        }
        widen = (
            'ALTER TABLE "user" ALTER COLUMN passphrase TYPE TEXT',
            'ALTER TABLE "user" ALTER COLUMN passphrase_eth TYPE TEXT',
            'ALTER TABLE "user" ALTER COLUMN private_master_key_wif_btc TYPE TEXT',
            'ALTER TABLE "user" ALTER COLUMN private_master_key_wif_ltc TYPE TEXT',
            'ALTER TABLE "user" ALTER COLUMN private_master_key_wif_doge TYPE TEXT',
            'ALTER TABLE "user" ALTER COLUMN private_key_eth TYPE TEXT',
        )
        with engine.begin() as conn:
            for col, sql in needed.items():
                if col not in existing:
                    conn.execute(text(sql))
                    print(f"Postgres: added column {col}")
            for sql in widen:
                try:
                    conn.execute(text(sql))
                except Exception:
                    pass
    except Exception as e:
        print(f"Postgres migration warning: {e}")
