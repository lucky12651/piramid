# 04 — API Reference

**Base URL (local):** `http://127.0.0.1:8000`  
**Interactive docs:** `http://127.0.0.1:8000/docs`  
**OpenAPI:** `http://127.0.0.1:8000/openapi.json`

Frontend dev proxies `/api` → backend via Vite.

---

## Conventions

| Item | Detail |
|------|--------|
| Format | JSON |
| Auth | `Authorization: Bearer <access_token>` |
| Errors | `{ "detail": "message" }` or validation array |
| Coins | `BTC`, `LTC`, `ETH`, `DOGE`, `USDT` |

---

## Health

### `GET /api/health`
No auth.

```json
{ "status": "ok", "app": "Piramid", "version": "2.0.0", "database": "up" }
```

---

## Auth — `/api/auth`

### `POST /api/auth/register`
Body:

```json
{
  "username": "satoshi",
  "email": "user@example.com",
  "password": "secret12",
  "agree_terms": true
}
```

Creates BTC/LTC/DOGE/ETH wallets, returns JWT + user.

### `POST /api/auth/login`
Body:

```json
{ "email": "user@example.com", "password": "secret12" }
```

Returns:

```json
{
  "access_token": "<jwt>",
  "token_type": "bearer",
  "user": { "id": 1, "username": "...", "email": "...", "is_admin": false, ... }
}
```

### `GET /api/auth/me`
Auth required. Current user profile (public fields).

### `POST /api/auth/change-password`
Auth required.

```json
{
  "current_password": "...",
  "new_password": "......"
}
```

### `POST /api/auth/recovery-phrase`
Auth required. **Sensitive.** Body: `{ "password": "..." }`. Re-checks the account password, then returns mnemonics, addresses, and private keys. GET is rejected (405).

---

## Wallet — `/api/wallet`

All routes require auth.

### `GET /api/wallet/addresses`
```json
{
  "BTC": "bc1...",
  "LTC": "L...",
  "DOGE": "D...",
  "ETH": "0x...",
  "USDT": "0x..."
}
```

### `GET /api/wallet/balance?coin=BTC`
```json
{
  "coin": "BTC",
  "balance": 0.0,
  "balance_raw": 0,
  "error": null
}
```

### `GET /api/wallet/balances`
Map of all supported coins → balance objects.

### `POST /api/wallet/send`
```json
{
  "coin": "BTC",
  "address": "bc1...",
  "amount": 0.0001,
  "fee": 0.000006
}
```

- `fee` used for UTXO coins (BTC/LTC/DOGE).  
- ETH/USDT fee estimated via gas on RPC.

Success:

```json
{
  "success": true,
  "txid": "...",
  "coin": "BTC",
  "amount": 0.0001,
  "fee": 0.000006,
  "recipient": "bc1...",
  "message": "..."
}
```

### `GET /api/wallet/transactions?coin=BTC`
Array of:

```json
{
  "coin": "BTC",
  "txid": "...",
  "status": "confirmed",
  "confirmations": 1,
  "date": "ISO-8601",
  "amount": 0.01,
  "transaction_type": "Received"
}
```

### `GET /api/wallet/send-history`
App-local send log for current user.

---

## Admin — `/api/admin`

Requires admin JWT.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/admin/stats` | Platform counts |
| GET | `/api/admin/users?q=` | List/search users |
| GET | `/api/admin/users/{id}` | User detail |
| PATCH | `/api/admin/users/{id}` | `{ is_admin?, is_active? }` |
| DELETE | `/api/admin/users/{id}` | Delete user + best-effort wallet cleanup |
| GET | `/api/admin/transactions?limit=50` | Global send log |

---

## Market — `/api/market`

### `GET /api/market/prices`
No auth. CoinGecko markets list (BTC, ETH, USDT, DOGE, LTC, and many more for ticker).

### `GET /api/market/broadcast-info`
Documents balance/broadcast explorers per coin (documentation helper).

---

## Status codes

| Code | Meaning |
|------|---------|
| 200 | OK |
| 400 | Validation / business error |
| 401 | Missing/invalid token or bad login |
| 403 | Forbidden (disabled or not admin) |
| 500 | Server / wallet / broadcast failure |

---

## Related docs

- [Architecture](./02-ARCHITECTURE.md)  
- [Wallet & Crypto](./06-WALLET-CRYPTO.md)  
