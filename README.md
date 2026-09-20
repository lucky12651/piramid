# Piramid — Multi-chain Crypto Wallet

> **Full documentation:** see the [`docs/`](./docs/) folder  
> (overview, architecture, database, API, frontend, wallets, setup)


https://github.com/user-attachments/assets/749e1a43-841c-4215-ba66-31b4d668e72d




Modern rebuild of the original Flask + HTML wallet:

| Layer | Stack |
|-------|--------|
| Frontend | **React 18** + Vite + Tailwind (dark professional UI) |
| Backend | **FastAPI** + SQLAlchemy + JWT |
| BTC / LTC | **bitcoinlib** (same create / sign / broadcast flow as `btc/` scripts) |
| ETH | **eth-account** + **web3** |

## Features

### Users
- Register / login (JWT)
- Auto-created **BTC**, **LTC**, and **ETH** wallets
- Portfolio overview with live CoinGecko prices
- Send & receive (QR + copy)
- On-chain activity history
- Change password & reveal recovery phrase (BTC/LTC mnemonic)

### Admins
- Platform stats (users, wallets, send logs)
- Search users by name / email / address
- Promote / revoke admin, enable / disable accounts
- Delete users (with bitcoinlib wallet cleanup)
- Application send.

## Project layout

```
CryptoWallet/
├── backend/                 # FastAPI API
│   ├── app/
│   │   ├── main.py
│   │   ├── routers/         # auth, wallet, admin, market
│   │   └── services/        # wallet_service (BTC/LTC/ETH)
│   ├── bootstrap_admin.py
│   ├── run.py
│   └── requirements.txt
├── frontend/                # React SPA
│   └── src/
└── btc/                     # Reference wallet scripts (BTC/LTC)
```

## Quick start

### 1. Backend

```bash
cd backend
python -m venv .venv

# Windows
.venv\Scripts\activate

# macOS / Linux
# source .venv/bin/activate

pip install -r requirements.txt
```

#### Database (PostgreSQL)

```bash
cd backend
copy .env.example .env   # Windows — then edit with real secrets
```

**`backend/.env` is gitignored** (never commit real passwords). Only `backend/.env.example` (placeholders) is safe for git.

See [docs/08-SECURITY.md](./docs/08-SECURITY.md) before making the repo public.

Tables are created automatically on API startup (`user`, `transaction_log`).

```bash
python run.py
```

API: **http://127.0.0.1:8000**  
Docs: **http://127.0.0.1:8000/docs**

Optional env vars:

```bash
set SECRET_KEY=change-me
set JWT_SECRET=change-me-too
set ADMIN_EMAIL=admin@example.com
set ADMIN_PASSWORD=your-strong-password
set ETH_RPC_URL=https://eth.llamarpc.com
```

Bootstrap an admin without env:

```bash
python bootstrap_admin.py admin@example.com yourpassword
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

App: **http://127.0.0.1:5173**  
Vite proxies `/api` → FastAPI.

## API overview

| Method | Path | Auth |
|--------|------|------|
| POST | `/api/auth/register` | — |
| POST | `/api/auth/login` | — |
| GET | `/api/auth/me` | JWT |
| GET | `/api/wallet/addresses` | JWT |
| GET | `/api/wallet/balances` | JWT |
| POST | `/api/wallet/send` | JWT |
| GET | `/api/wallet/transactions?coin=BTC` | JWT |
| GET | `/api/admin/stats` | Admin |
| GET | `/api/admin/users` | Admin |
| GET | `/api/market/prices` | — |

## Wallet logic (BTC / LTC)

Matches `btc/bitcoin_transaction_broadcaster.py` and `btc/litecoin_transaction_creator.py`:

1. `Wallet` / `Wallet.create` via bitcoinlib  
2. `transaction_create` → `sign` → `raw_hex`  
3. Broadcast to `mempool.space` (BTC) or `litecoinspace.org` (LTC)

## Notes

- First registered user becomes admin if `ADMIN_EMAIL` is not set.
- Data lives in **PostgreSQL** only (`crypto-wallet` database).
- Storing seed phrases / private keys in the DB is for demo only — use encryption and HSM/KMS for production.

## License

Same as the original WebWise Media project repository.
