import time

import requests
from fastapi import APIRouter

router = APIRouter(prefix="/api/market", tags=["market"])

_PRICE_CACHE = {"at": 0.0, "data": None}
_PRICE_TTL = 25.0

# Broad market set for ticker + portfolio prices
COINGECKO_IDS = (
    "bitcoin,ethereum,tether,binancecoin,solana,ripple,usd-coin,cardano,"
    "dogecoin,tron,avalanche-2,shiba-inu,polkadot,chainlink,litecoin,"
    "bitcoin-cash,uniswap,near,matic-network,internet-computer,aptos,"
    "stellar,cosmos,filecoin,hedera-hashgraph,arbitrum,optimism,"
    "vechain,injective-protocol,render-token"
)

SYMBOL_OVERRIDE = {
    "bitcoin": "BTC",
    "ethereum": "ETH",
    "tether": "USDT",
    "binancecoin": "BNB",
    "solana": "SOL",
    "ripple": "XRP",
    "usd-coin": "USDC",
    "cardano": "ADA",
    "dogecoin": "DOGE",
    "tron": "TRX",
    "avalanche-2": "AVAX",
    "shiba-inu": "SHIB",
    "polkadot": "DOT",
    "chainlink": "LINK",
    "litecoin": "LTC",
    "bitcoin-cash": "BCH",
    "uniswap": "UNI",
    "near": "NEAR",
    "matic-network": "MATIC",
    "internet-computer": "ICP",
    "aptos": "APT",
    "stellar": "XLM",
    "cosmos": "ATOM",
    "filecoin": "FIL",
    "hedera-hashgraph": "HBAR",
    "arbitrum": "ARB",
    "optimism": "OP",
    "vechain": "VET",
    "injective-protocol": "INJ",
    "render-token": "RNDR",
}


@router.get("/prices")
def prices():
    now = time.time()
    cached = _PRICE_CACHE.get("data")
    if cached and now - _PRICE_CACHE["at"] < _PRICE_TTL:
        return cached
    try:
        url = (
            "https://api.coingecko.com/api/v3/coins/markets"
            f"?vs_currency=usd&ids={COINGECKO_IDS}&order=market_cap_desc"
            "&per_page=50&sparkline=false&price_change_percentage=24h"
        )
        resp = requests.get(url, timeout=8)
        resp.raise_for_status()
        data = resp.json()
        out = []
        for item in data:
            cid = item.get("id") or ""
            out.append(
                {
                    "id": cid,
                    "symbol": SYMBOL_OVERRIDE.get(cid) or (item.get("symbol") or "").upper(),
                    "name": item.get("name"),
                    "price_usd": float(item.get("current_price") or 0),
                    "change_24h": item.get("price_change_percentage_24h"),
                    "market_cap": item.get("market_cap"),
                    "image": item.get("image"),
                    "volume_24h": item.get("total_volume"),
                }
            )
        if out:
            _PRICE_CACHE["data"] = out
            _PRICE_CACHE["at"] = now
        return out
    except Exception as e:
        if cached:
            return cached
        return []


@router.get("/broadcast-info")
def broadcast_info():
    """Document where each chain is broadcast / balance is read."""
    return {
        "BTC": {
            "balance": "https://mempool.space/api/address/{addr}",
            "broadcast": "https://mempool.space/api/tx",
            "explorer": "https://mempool.space",
        },
        "LTC": {
            "balance": "https://litecoinspace.org/api/address/{addr}",
            "broadcast": "https://litecoinspace.org/api/tx",
            "explorer": "https://litecoinspace.org",
            "note": "Litecoin Space is Esplora-compatible (same API shape as mempool.space).",
        },
        "DOGE": {
            "balance": "https://api.blockcypher.com/v1/doge/main/addrs/{addr}/balance",
            "broadcast": "https://api.blockcypher.com/v1/doge/main/txs/push",
            "explorer": "https://live.blockcypher.com/doge",
        },
        "ETH": {
            "balance": "Ethereum JSON-RPC eth_getBalance",
            "broadcast": "Ethereum JSON-RPC eth_sendRawTransaction",
            "explorer": "https://etherscan.io",
        },
        "USDT": {
            "balance": "ERC-20 balanceOf on Ethereum (contract 0xdAC17F958D2ee523a2206206994597C13D831ec7)",
            "broadcast": "ERC-20 transfer via Ethereum RPC",
            "explorer": "https://etherscan.io",
            "note": "Same address & key as ETH",
        },
    }
