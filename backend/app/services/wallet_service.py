"""
Wallet create / balance / send / tx history / broadcast.

Broadcast explorers (same pattern as mempool for BTC):
  BTC  → https://mempool.space/api/tx
  LTC  → https://litecoinspace.org/api/tx   (Esplora-compatible, like mempool)
  DOGE → https://api.blockcypher.com/v1/doge/main/txs/push
  ETH  → Ethereum JSON-RPC eth_sendRawTransaction
  USDT → ERC-20 transfer on Ethereum (same broadcast path as ETH)
"""

from __future__ import annotations

import secrets
import string
from datetime import datetime, timezone
from typing import Any

import requests
from eth_account import Account

from app.addresses import validate_address
from app.config import settings
from app.crypto_box import reveal_secret, seal_secret
from app.errors import UserWalletError, public_error

try:
    from zoneinfo import ZoneInfo

    TZ = ZoneInfo("Asia/Kolkata")
except Exception:
    TZ = timezone.utc

# Wallet assets users can hold / send / receive
SUPPORTED_COINS = ("BTC", "LTC", "ETH", "DOGE", "USDT")

# USDT ERC-20 (Ethereum mainnet)
USDT_CONTRACT = "0xdAC17F958D2ee523a2206206994597C13D831ec7"
USDT_DECIMALS = 6

ERC20_ABI = [
    {
        "constant": True,
        "inputs": [{"name": "_owner", "type": "address"}],
        "name": "balanceOf",
        "outputs": [{"name": "balance", "type": "uint256"}],
        "type": "function",
    },
    {
        "constant": False,
        "inputs": [
            {"name": "_to", "type": "address"},
            {"name": "_value", "type": "uint256"},
        ],
        "name": "transfer",
        "outputs": [{"name": "", "type": "bool"}],
        "type": "function",
    },
]

DEFAULT_FEES = {
    "BTC": 0.0000060,
    "LTC": 0.00001,
    "DOGE": 1.0,
}

BROADCAST = {
    "BTC": {"url": "https://mempool.space/api/tx", "mode": "raw"},
    "LTC": {"url": "https://litecoinspace.org/api/tx", "mode": "raw"},
    "DOGE": {"url": "https://api.blockcypher.com/v1/doge/main/txs/push", "mode": "blockcypher"},
}


def _phrase(user) -> str:
    return reveal_secret(getattr(user, "passphrase", None))


def _phrase_eth(user) -> str:
    return reveal_secret(getattr(user, "passphrase_eth", None)) or _phrase(user)


def _eth_key(user) -> str:
    return reveal_secret(getattr(user, "private_key_eth", None))


def _wif(user, field: str) -> str:
    return reveal_secret(getattr(user, field, None))


def generate_wallet_name(length: int = 10) -> str:
    alphabet = string.ascii_letters + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(length))


def _extract_wif_from_key_obj(key_obj, network: str) -> str | None:
    """Return classic WIF for a bitcoinlib key (prefer single-key WIF over xprv)."""
    try:
        from bitcoinlib.keys import Key

        raw = getattr(key_obj, "key_private", None)
        if raw:
            try:
                kk = Key(raw, network=network)
                w = kk.wif()
                if w:
                    return str(w)
            except Exception:
                pass

        if hasattr(key_obj, "wif_private"):
            try:
                v = key_obj.wif_private()
                if v:
                    return str(v)
            except Exception:
                pass
        wif = getattr(key_obj, "wif", None)
        if wif and not callable(wif):
            return str(wif)
        if callable(wif):
            try:
                return str(wif())
            except Exception:
                pass
    except Exception:
        pass
    return None


def coin_to_network(coin: str) -> str:
    coin = (coin or "BTC").upper()
    mapping = {"BTC": "bitcoin", "LTC": "litecoin", "DOGE": "dogecoin"}
    if coin not in mapping:
        raise ValueError(f"No bitcoinlib network for {coin}")
    return mapping[coin]


def create_utxo_wallets(passphrase: str | None = None) -> dict[str, Any]:
    """BTC + LTC + DOGE from one BIP39 mnemonic (bitcoinlib)."""
    from bitcoinlib.mnemonic import Mnemonic
    from bitcoinlib.wallets import Wallet

    if not passphrase:
        passphrase = Mnemonic().generate()

    wallet_name = generate_wallet_name()

    wallet_btc = Wallet.create(wallet_name, keys=passphrase, network="bitcoin")
    key_btc = wallet_btc.get_key()

    wallet_name_ltc = f"{wallet_name}_ltc"
    wallet_ltc = Wallet.create(
        wallet_name_ltc, keys=passphrase, network="litecoin", witness_type="legacy"
    )
    key_ltc = wallet_ltc.get_key()

    wallet_name_doge = f"{wallet_name}_doge"
    wallet_doge = Wallet.create(
        wallet_name_doge, keys=passphrase, network="dogecoin", witness_type="legacy"
    )
    key_doge = wallet_doge.get_key()

    return {
        "passphrase": passphrase,
        "wallet_name": wallet_name,
        "wallet_name_ltc": wallet_name_ltc,
        "wallet_name_doge": wallet_name_doge,
        "wallet_address_btc": key_btc.address,
        "wallet_address_ltc": key_ltc.address,
        "wallet_address_doge": key_doge.address,
        "private_master_key_wif_btc": _extract_wif_from_key_obj(key_btc, "bitcoin"),
        "private_master_key_wif_ltc": _extract_wif_from_key_obj(key_ltc, "litecoin"),
        "private_master_key_wif_doge": _extract_wif_from_key_obj(key_doge, "dogecoin"),
    }


def create_eth_wallet(passphrase: str | None = None) -> dict[str, str]:
    """ETH (+ USDT same address) from BIP39 mnemonic when possible."""
    Account.enable_unaudited_hdwallet_features()
    if passphrase:
        try:
            acct = Account.from_mnemonic(passphrase, account_path="m/44'/60'/0'/0/0")
            return {
                "wallet_address_eth": acct.address,
                "private_key_eth": acct.key.hex(),
                "passphrase_eth": passphrase,
            }
        except Exception:
            pass
    acct = Account.create()
    return {
        "wallet_address_eth": acct.address,
        "private_key_eth": acct.key.hex(),
        "passphrase_eth": passphrase or "",
    }


def create_all_wallets() -> dict[str, Any]:
    data = create_utxo_wallets()
    # Same recovery phrase derives ETH/USDT so one backup covers all assets
    data.update(create_eth_wallet(data.get("passphrase")))
    return data


def delete_bitcoinlib_wallets(
    wallet_name: str | None,
    wallet_name_ltc: str | None,
    wallet_name_doge: str | None = None,
) -> None:
    try:
        from bitcoinlib.wallets import wallet_delete
    except Exception:
        return
    for name in [
        (wallet_name or "").strip(),
        (wallet_name_ltc or "").strip(),
        (wallet_name_doge or "").strip(),
    ]:
        if not name:
            continue
        try:
            wallet_delete(name)
        except Exception:
            pass


def _base_name(user) -> str:
    return (user.wallet_name or "").strip() or f"user_{user.id or 'unknown'}"


def ensure_wallet(user, coin: str):
    """Open (or lazily create) a bitcoinlib Wallet for UTXO coins."""
    from bitcoinlib.wallets import Wallet

    coin = (coin or "BTC").upper()
    if coin == "BTC":
        name = user.wallet_name
        if not name:
            raise ValueError("BTC wallet not initialized for this user")
        wallet = Wallet(name)
    elif coin == "LTC":
        name = (getattr(user, "wallet_name_ltc", None) or "").strip() or f"{_base_name(user)}_ltc"
        try:
            wallet = Wallet(name)
        except Exception:
            if not _phrase(user):
                raise ValueError("LTC wallet not initialized for this user")
            wallet = Wallet.create(
                name, keys=_phrase(user), network="litecoin", witness_type="legacy"
            )
        if (getattr(user, "wallet_name_ltc", None) or "").strip() != name:
            user.wallet_name_ltc = name
        if getattr(wallet, "network", None) and getattr(wallet.network, "name", "").lower() != "litecoin":
            raise ValueError("Wallet is not on the Litecoin network")
    elif coin == "DOGE":
        name = (getattr(user, "wallet_name_doge", None) or "").strip() or f"{_base_name(user)}_doge"
        try:
            wallet = Wallet(name)
        except Exception:
            if not _phrase(user):
                raise ValueError("DOGE wallet not initialized for this user")
            wallet = Wallet.create(
                name, keys=_phrase(user), network="dogecoin", witness_type="legacy"
            )
        if (getattr(user, "wallet_name_doge", None) or "").strip() != name:
            user.wallet_name_doge = name
    else:
        raise ValueError(f"bitcoinlib does not support {coin}")

    try:
        wallet.scan()
    except Exception:
        pass
    try:
        if hasattr(wallet, "utxos_update"):
            wallet.utxos_update()
    except Exception:
        pass
    return wallet


def get_user_address(user, coin: str) -> str:
    coin = (coin or "BTC").upper()
    if coin == "BTC":
        return user.wallet_address_btc or ""
    if coin == "LTC":
        return user.wallet_address_ltc or ""
    if coin == "DOGE":
        return getattr(user, "wallet_address_doge", None) or ""
    if coin in ("ETH", "USDT"):
        return user.wallet_address_eth or ""
    return ""


def litecoinspace_get_json(path: str, timeout: int = 15):
    url = f"https://litecoinspace.org{path}"
    resp = requests.get(url, timeout=timeout)
    resp.raise_for_status()
    return resp.json()


def mempool_get_json(path: str, timeout: int = 15):
    url = f"https://mempool.space{path}"
    resp = requests.get(url, timeout=timeout)
    resp.raise_for_status()
    return resp.json()


def _web3():
    from web3 import Web3

    return Web3(Web3.HTTPProvider(settings.ETH_RPC_URL, request_kwargs={"timeout": 25}))


def get_balance(user, coin: str) -> dict[str, Any]:
    coin = (coin or "BTC").upper()
    address = get_user_address(user, coin)
    if not address:
        return {"coin": coin, "balance": 0.0, "balance_raw": 0, "error": "Address not found"}

    if coin == "ETH":
        return _eth_balance(address)
    if coin == "USDT":
        return _usdt_balance(address)
    if coin == "LTC":
        return _esplora_balance(address, coin, "https://litecoinspace.org")
    if coin == "BTC":
        try:
            return _esplora_balance(address, coin, "https://mempool.space")
        except Exception:
            return _bitcoinlib_balance(user, coin, address)
    if coin == "DOGE":
        return _doge_balance(address)

    return {"coin": coin, "balance": 0.0, "balance_raw": 0, "error": "Unsupported coin"}


def _esplora_balance(address: str, coin: str, base: str) -> dict[str, Any]:
    resp = requests.get(f"{base}/api/address/{address}", timeout=15)
    resp.raise_for_status()
    data = resp.json()
    chain = data.get("chain_stats") or {}
    mempool = data.get("mempool_stats") or {}
    funded = int(chain.get("funded_txo_sum", 0)) + int(mempool.get("funded_txo_sum", 0))
    spent = int(chain.get("spent_txo_sum", 0)) + int(mempool.get("spent_txo_sum", 0))
    balance_raw = max(0, funded - spent)
    return {"coin": coin, "balance": balance_raw / 1e8, "balance_raw": balance_raw}


def _bitcoinlib_balance(user, coin: str, address: str) -> dict[str, Any]:
    from bitcoinlib.services.services import Service
    from bitcoinlib.wallets import Wallet

    network = coin_to_network(coin)
    service = Service(network=network)
    balance_raw = None
    if hasattr(service, "getbalance"):
        balance_raw = service.getbalance(address)
    elif hasattr(service, "getaddressbalance"):
        balance_raw = service.getaddressbalance(address)

    if balance_raw is None and coin == "BTC" and user.wallet_name:
        wallet = Wallet(user.wallet_name)
        try:
            wallet.scan()
        except Exception:
            pass
        balance_raw = wallet.balance()

    if isinstance(balance_raw, int):
        return {"coin": coin, "balance": balance_raw / 1e8, "balance_raw": balance_raw}
    balance = float(balance_raw or 0)
    return {"coin": coin, "balance": balance, "balance_raw": int(balance * 1e8)}


def _doge_balance(address: str) -> dict[str, Any]:
    try:
        url = f"https://api.blockcypher.com/v1/doge/main/addrs/{address}/balance"
        resp = requests.get(url, timeout=15)
        resp.raise_for_status()
        data = resp.json()
        # balance is satoshi-like (1 DOGE = 1e8)
        raw = int(data.get("final_balance") or data.get("balance") or 0)
        return {"coin": "DOGE", "balance": raw / 1e8, "balance_raw": raw}
    except Exception as e:
        try:
            url = f"https://dogechain.info/api/v1/address/balance/{address}"
            resp = requests.get(url, timeout=15)
            data = resp.json()
            bal = float(data.get("balance") or 0)
            return {"coin": "DOGE", "balance": bal, "balance_raw": int(bal * 1e8)}
        except Exception:
            return {"coin": "DOGE", "balance": 0.0, "balance_raw": 0, "error": str(e)}


def _eth_balance(address: str) -> dict[str, Any]:
    try:
        from web3 import Web3

        w3 = _web3()
        wei = w3.eth.get_balance(Web3.to_checksum_address(address))
        eth = float(w3.from_wei(wei, "ether"))
        return {"coin": "ETH", "balance": eth, "balance_raw": int(wei)}
    except Exception as e:
        return {"coin": "ETH", "balance": 0.0, "balance_raw": 0, "error": str(e)}


def _usdt_balance(address: str) -> dict[str, Any]:
    try:
        from web3 import Web3

        w3 = _web3()
        contract = w3.eth.contract(
            address=Web3.to_checksum_address(USDT_CONTRACT), abi=ERC20_ABI
        )
        raw = int(contract.functions.balanceOf(Web3.to_checksum_address(address)).call())
        return {"coin": "USDT", "balance": raw / (10**USDT_DECIMALS), "balance_raw": raw}
    except Exception as e:
        return {"coin": "USDT", "balance": 0.0, "balance_raw": 0, "error": str(e)}


def _broadcast_raw(coin: str, raw_tx_hex: str) -> dict[str, Any]:
    """Push signed hex to public explorers (mempool-style)."""
    cfg = BROADCAST.get(coin)
    if not cfg:
        return {"success": False, "error": f"No broadcast endpoint for {coin}"}

    if cfg["mode"] == "raw":
        # mempool.space & litecoinspace.org both accept raw hex body
        resp = requests.post(cfg["url"], data=raw_tx_hex, timeout=30)
        if resp.status_code == 200:
            return {"success": True, "txid": resp.text.strip()}
        return {"success": False, "error": f"Broadcasting error ({cfg['url']}): {resp.text}"}

    if cfg["mode"] == "blockcypher":
        hex_clean = raw_tx_hex[2:] if raw_tx_hex.startswith("0x") else raw_tx_hex
        resp = requests.post(cfg["url"], json={"tx": hex_clean}, timeout=30)
        if resp.status_code in (200, 201):
            data = resp.json()
            txid = (data.get("tx") or {}).get("hash") or data.get("hash") or ""
            return {"success": True, "txid": txid}
        return {"success": False, "error": f"Broadcasting error: {resp.text}"}

    return {"success": False, "error": "Unknown broadcast mode"}


def send_crypto(user, coin: str, recipient: str, amount: float, fee: float | None = None) -> dict[str, Any]:
    coin = (coin or "BTC").upper()
    recipient = (recipient or "").strip()
    if coin not in SUPPORTED_COINS:
        raise UserWalletError("This asset is not supported.")
    ok, err = validate_address(coin, recipient)
    if not ok:
        raise UserWalletError(err)
    if amount is None or float(amount) <= 0:
        raise UserWalletError("Amount must be greater than 0.")

    amount = float(amount)
    own = get_user_address(user, coin)
    if own and own.lower() == recipient.lower():
        raise UserWalletError("You cannot send to your own deposit address.")

    if coin == "ETH":
        return _send_eth(user, recipient, amount)
    if coin == "USDT":
        return _send_usdt(user, recipient, amount)

    if fee is None:
        fee = DEFAULT_FEES.get(coin, 0.00001)
    fee = float(fee)
    if fee < 0:
        raise UserWalletError("Network fee cannot be negative.")

    try:
        bal = get_balance(user, coin)
        available = float(bal.get("balance") or 0)
        if amount + fee > available + 1e-12:
            raise UserWalletError(
                f"Insufficient {coin} balance. Available {available:.8f}, need {amount + fee:.8f} including fee."
            )

        wallet = ensure_wallet(user, coin)
        amount_units = int(round(amount * 1e8))
        fee_units = int(round(fee * 1e8))
        if amount_units <= 0:
            raise UserWalletError("This amount is too small for the network.")

        tx = wallet.transaction_create([(recipient, amount_units)], fee=fee_units)
        tx.sign()
        raw_tx_hex = tx.raw_hex()

        result = _broadcast_raw(coin, raw_tx_hex)
        if result.get("success"):
            return {
                "success": True,
                "txid": result.get("txid"),
                "coin": coin,
                "amount": amount,
                "fee": fee,
                "recipient": recipient,
                "message": f"{coin} sent. Wait for network confirmation.",
            }
        raise UserWalletError(
            public_error(Exception(result.get("error") or "broadcast failed"), "Broadcast failed. Please try again."),
            status_code=502,
        )
    except UserWalletError:
        raise
    except Exception as e:
        raise UserWalletError(
            public_error(e, "Unable to create this transaction. Check the amount, fee, and balance."),
            status_code=400,
        ) from e


def _send_eth(user, recipient: str, amount_eth: float) -> dict[str, Any]:
    key = _eth_key(user)
    if not key:
        raise UserWalletError("ETH key is not available for this account.")
    try:
        from web3 import Web3

        w3 = _web3()
        if not w3.is_connected():
            raise UserWalletError("Unable to reach Ethereum right now. Please try again.", status_code=502)

        account = Account.from_key(key)
        to_addr = Web3.to_checksum_address(recipient)
        value = w3.to_wei(amount_eth, "ether")
        nonce = w3.eth.get_transaction_count(account.address)
        gas_price = w3.eth.gas_price
        gas = 21000
        fee_wei = gas * gas_price
        bal_wei = w3.eth.get_balance(account.address)
        if value + fee_wei > bal_wei:
            raise UserWalletError("Insufficient ETH to cover this amount plus gas.")
        tx = {
            "nonce": nonce,
            "to": to_addr,
            "value": value,
            "gas": gas,
            "gasPrice": gas_price,
            "chainId": w3.eth.chain_id,
        }
        signed = account.sign_transaction(tx)
        raw = getattr(signed, "rawTransaction", None) or getattr(signed, "raw_transaction", None)
        tx_hash = w3.eth.send_raw_transaction(raw)
        fee_eth = float(w3.from_wei(fee_wei, "ether"))
        hx = tx_hash.hex() if hasattr(tx_hash, "hex") else str(tx_hash)
        if not hx.startswith("0x"):
            hx = "0x" + hx
        return {
            "success": True,
            "txid": hx,
            "coin": "ETH",
            "amount": amount_eth,
            "fee": fee_eth,
            "recipient": recipient,
            "message": "ETH sent. Wait for network confirmation.",
        }
    except UserWalletError:
        raise
    except Exception as e:
        raise UserWalletError(
            public_error(e, "Unable to send ETH right now. Please try again."),
            status_code=502,
        ) from e


def _send_usdt(user, recipient: str, amount_usdt: float) -> dict[str, Any]:
    key = _eth_key(user)
    if not key:
        raise UserWalletError("ETH key is required to send USDT.")
    try:
        from web3 import Web3

        w3 = _web3()
        if not w3.is_connected():
            raise UserWalletError("Unable to reach Ethereum right now. Please try again.", status_code=502)

        account = Account.from_key(key)
        contract = w3.eth.contract(
            address=Web3.to_checksum_address(USDT_CONTRACT), abi=ERC20_ABI
        )
        value = int(round(amount_usdt * (10**USDT_DECIMALS)))
        if value <= 0:
            raise UserWalletError("This USDT amount is too small.")
        token_bal = int(contract.functions.balanceOf(account.address).call())
        if value > token_bal:
            raise UserWalletError("Insufficient USDT balance.")
        nonce = w3.eth.get_transaction_count(account.address)
        gas_price = w3.eth.gas_price
        gas = 100000
        eth_bal = w3.eth.get_balance(account.address)
        if eth_bal < gas * gas_price:
            raise UserWalletError("You need a small amount of ETH to pay gas for this USDT transfer.")
        tx = contract.functions.transfer(
            Web3.to_checksum_address(recipient), value
        ).build_transaction(
            {
                "from": account.address,
                "nonce": nonce,
                "gas": gas,
                "gasPrice": gas_price,
                "chainId": w3.eth.chain_id,
            }
        )
        signed = account.sign_transaction(tx)
        raw = getattr(signed, "rawTransaction", None) or getattr(signed, "raw_transaction", None)
        tx_hash = w3.eth.send_raw_transaction(raw)
        fee_eth = float(w3.from_wei(gas * gas_price, "ether"))
        hx = tx_hash.hex() if hasattr(tx_hash, "hex") else str(tx_hash)
        if not hx.startswith("0x"):
            hx = "0x" + hx
        return {
            "success": True,
            "txid": hx,
            "coin": "USDT",
            "amount": amount_usdt,
            "fee": fee_eth,
            "recipient": recipient,
            "message": "USDT sent on Ethereum. Wait for confirmation.",
        }
    except UserWalletError:
        raise
    except Exception as e:
        raise UserWalletError(
            public_error(e, "Unable to send USDT right now. Please try again."),
            status_code=502,
        ) from e


def get_transactions(user, coin: str) -> list[dict[str, Any]]:
    coin = (coin or "BTC").upper()
    address = get_user_address(user, coin)
    if not address:
        return []

    if coin == "ETH":
        return _eth_transactions(address)
    if coin == "USDT":
        return _usdt_transactions(address)
    if coin == "LTC":
        return _esplora_transactions(address, coin, base="https://litecoinspace.org")
    if coin == "DOGE":
        return _doge_transactions(address)
    # BTC
    try:
        return _esplora_transactions(address, coin, base="https://mempool.space")
    except Exception:
        return _bitcoinlib_transactions(user, address, coin)


def _esplora_transactions(address: str, coin: str, base: str) -> list[dict[str, Any]]:
    resp = requests.get(f"{base}/api/address/{address}/txs", timeout=20)
    resp.raise_for_status()
    txs = resp.json() or []
    out: list[dict[str, Any]] = []
    for tx in txs:
        txid = tx.get("txid", "")
        status_obj = tx.get("status") or {}
        confirmed = bool(status_obj.get("confirmed"))
        block_time = status_obj.get("block_time")
        if confirmed and block_time:
            date_iso = datetime.fromtimestamp(int(block_time), tz=TZ).isoformat()
            status = "confirmed"
        else:
            date_iso = datetime.now(tz=TZ).isoformat()
            status = "mempool"

        vin = tx.get("vin") or []
        vout = tx.get("vout") or []
        in_value = 0
        for i in vin:
            prev = i.get("prevout") or {}
            if prev.get("scriptpubkey_address") == address:
                in_value += int(prev.get("value") or 0)
        out_value = 0
        for o in vout:
            if o.get("scriptpubkey_address") == address:
                out_value += int(o.get("value") or 0)

        net = out_value - in_value
        out.append(
            {
                "coin": coin,
                "txid": txid,
                "status": status,
                "confirmations": 1 if confirmed else 0,
                "date": date_iso,
                "amount": abs(net) / 1e8,
                "transaction_type": "Received" if net > 0 else "Sent",
            }
        )
    return out


def _bitcoinlib_transactions(user, address: str, coin: str) -> list[dict[str, Any]]:
    from bitcoinlib.services.services import Service

    network = coin_to_network(coin)
    service = Service(network=network)
    txs = []
    if hasattr(service, "gettransactions"):
        txs = service.gettransactions(address) or []

    out: list[dict[str, Any]] = []
    for tx in txs:
        txid = getattr(tx, "txid", None) or getattr(tx, "hash", None) or ""
        confirmations = int(getattr(tx, "confirmations", 0) or 0)
        status = getattr(tx, "status", "unknown")
        tx_date = getattr(tx, "date", None)
        if tx_date is None:
            date_iso = datetime.now(tz=TZ).isoformat()
        else:
            try:
                date_iso = tx_date.astimezone(TZ).isoformat()
            except Exception:
                date_iso = str(tx_date)

        inputs = getattr(tx, "inputs", []) or []
        outputs = getattr(tx, "outputs", []) or []

        def _addr(obj):
            return getattr(obj, "address", None) or ""

        def _val(obj):
            v = getattr(obj, "value", 0) or 0
            try:
                return int(v)
            except Exception:
                try:
                    return int(float(v))
                except Exception:
                    return 0

        in_value = sum(_val(i) for i in inputs if _addr(i) == address)
        out_value = sum(_val(o) for o in outputs if _addr(o) == address)
        net = out_value - in_value
        out.append(
            {
                "coin": coin,
                "txid": txid,
                "status": status,
                "confirmations": confirmations,
                "date": date_iso,
                "amount": abs(net) / 1e8,
                "transaction_type": "Received" if net > 0 else "Sent",
            }
        )
    out.reverse()
    return out


def _doge_transactions(address: str) -> list[dict[str, Any]]:
    try:
        url = f"https://api.blockcypher.com/v1/doge/main/addrs/{address}/full?limit=25"
        resp = requests.get(url, timeout=20)
        resp.raise_for_status()
        data = resp.json()
        txs = data.get("txs") or []
        out = []
        for tx in txs:
            txid = tx.get("hash") or ""
            conf = int(tx.get("confirmations") or 0)
            received = tx.get("received") or tx.get("confirmed")
            try:
                date_iso = datetime.fromisoformat(received.replace("Z", "+00:00")).astimezone(TZ).isoformat()
            except Exception:
                date_iso = datetime.now(tz=TZ).isoformat()

            inputs = tx.get("inputs") or []
            outputs = tx.get("outputs") or []
            in_value = 0
            for i in inputs:
                addrs = i.get("addresses") or []
                if address in addrs:
                    in_value += int(i.get("output_value") or 0)
            out_value = 0
            for o in outputs:
                addrs = o.get("addresses") or []
                if address in addrs:
                    out_value += int(o.get("value") or 0)
            net = out_value - in_value
            out.append(
                {
                    "coin": "DOGE",
                    "txid": txid,
                    "status": "confirmed" if conf > 0 else "mempool",
                    "confirmations": conf,
                    "date": date_iso,
                    "amount": abs(net) / 1e8,
                    "transaction_type": "Received" if net > 0 else "Sent",
                }
            )
        return out
    except Exception:
        return []


def _eth_transactions(address: str) -> list[dict[str, Any]]:
    try:
        url = (
            "https://eth.blockscout.com/api"
            f"?module=account&action=txlist&address={address}&sort=desc&page=1&offset=25"
        )
        resp = requests.get(url, timeout=20)
        data = resp.json()
        result = data.get("result") or []
        if not isinstance(result, list):
            return []
        out = []
        addr_l = address.lower()
        for tx in result:
            try:
                value_wei = int(tx.get("value") or 0)
                amount = value_wei / 1e18
                from_a = (tx.get("from") or "").lower()
                to_a = (tx.get("to") or "").lower()
                if from_a == addr_l:
                    ttype = "Sent"
                elif to_a == addr_l:
                    ttype = "Received"
                else:
                    continue
                ts = int(tx.get("timeStamp") or 0)
                date_iso = (
                    datetime.fromtimestamp(ts, tz=TZ).isoformat()
                    if ts
                    else datetime.now(tz=TZ).isoformat()
                )
                out.append(
                    {
                        "coin": "ETH",
                        "txid": tx.get("hash") or "",
                        "status": "confirmed" if tx.get("txreceipt_status", "1") == "1" else "failed",
                        "confirmations": int(tx.get("confirmations") or 0),
                        "date": date_iso,
                        "amount": amount,
                        "transaction_type": ttype,
                    }
                )
            except Exception:
                continue
        return out
    except Exception:
        return []


def _usdt_transactions(address: str) -> list[dict[str, Any]]:
    try:
        url = (
            "https://eth.blockscout.com/api"
            f"?module=account&action=tokentx&contractaddress={USDT_CONTRACT}"
            f"&address={address}&sort=desc&page=1&offset=25"
        )
        resp = requests.get(url, timeout=20)
        data = resp.json()
        result = data.get("result") or []
        if not isinstance(result, list):
            return []
        out = []
        addr_l = address.lower()
        for tx in result:
            try:
                raw = int(tx.get("value") or 0)
                decimals = int(tx.get("tokenDecimal") or USDT_DECIMALS)
                amount = raw / (10**decimals)
                from_a = (tx.get("from") or "").lower()
                to_a = (tx.get("to") or "").lower()
                if from_a == addr_l:
                    ttype = "Sent"
                elif to_a == addr_l:
                    ttype = "Received"
                else:
                    continue
                ts = int(tx.get("timeStamp") or 0)
                date_iso = (
                    datetime.fromtimestamp(ts, tz=TZ).isoformat()
                    if ts
                    else datetime.now(tz=TZ).isoformat()
                )
                out.append(
                    {
                        "coin": "USDT",
                        "txid": tx.get("hash") or "",
                        "status": "confirmed",
                        "confirmations": int(tx.get("confirmations") or 0),
                        "date": date_iso,
                        "amount": amount,
                        "transaction_type": ttype,
                    }
                )
            except Exception:
                continue
        return out
    except Exception:
        return []


def sync_private_keys(user) -> bool:
    """Load missing WIF / ETH keys from live wallets into the user row. Returns True if changed."""
    changed = False
    coin_field = {
        "BTC": ("private_master_key_wif_btc", "bitcoin"),
        "LTC": ("private_master_key_wif_ltc", "litecoin"),
        "DOGE": ("private_master_key_wif_doge", "dogecoin"),
    }
    for coin, (field, network) in coin_field.items():
        current = _wif(user, field)
        needs = not current or current.startswith(("xprv", "yprv", "zprv", "tprv", "Ltpv", "dgub", "dgpv"))
        if not needs:
            continue
        try:
            wallet = ensure_wallet(user, coin)
            key = wallet.get_key()
            wif = _extract_wif_from_key_obj(key, network)
            if wif:
                setattr(user, field, seal_secret(wif))
                changed = True
            addr_field = {
                "BTC": "wallet_address_btc",
                "LTC": "wallet_address_ltc",
                "DOGE": "wallet_address_doge",
            }[coin]
            if not (getattr(user, addr_field, None) or "").strip():
                setattr(user, addr_field, key.address)
                changed = True
        except Exception:
            pass

    if not _eth_key(user):
        try:
            phrase = _phrase_eth(user)
            if phrase:
                eth = create_eth_wallet(phrase)
                user.private_key_eth = seal_secret(eth["private_key_eth"])
                if not (user.wallet_address_eth or "").strip():
                    user.wallet_address_eth = eth["wallet_address_eth"]
                if hasattr(user, "passphrase_eth") and not _phrase_eth(user):
                    user.passphrase_eth = seal_secret(phrase)
                changed = True
        except Exception:
            pass

    return changed


def ensure_addresses_backfill(user, db_session=None) -> bool:
    """Backfill missing addresses and private keys for legacy users."""
    changed = False
    try:
        if not (user.wallet_address_btc or "").strip() and (user.wallet_name or "").strip():
            w = ensure_wallet(user, "BTC")
            user.wallet_address_btc = w.get_key().address
            changed = True
        if not (user.wallet_address_ltc or "").strip() and _phrase(user):
            w = ensure_wallet(user, "LTC")
            user.wallet_address_ltc = w.get_key().address
            changed = True
        if not (getattr(user, "wallet_address_doge", None) or "").strip() and _phrase(user):
            w = ensure_wallet(user, "DOGE")
            user.wallet_address_doge = w.get_key().address
            changed = True
        if not (user.wallet_address_eth or "").strip():
            eth = create_eth_wallet(_phrase(user) or None)
            user.wallet_address_eth = eth["wallet_address_eth"]
            user.private_key_eth = seal_secret(eth["private_key_eth"])
            if hasattr(user, "passphrase_eth"):
                user.passphrase_eth = seal_secret(eth.get("passphrase_eth") or _phrase(user))
            changed = True
        elif hasattr(user, "passphrase_eth") and not _phrase_eth(user) and _phrase(user):
            user.passphrase_eth = seal_secret(_phrase(user))
            changed = True

        if sync_private_keys(user):
            changed = True
    except Exception as e:
        print(f"ensure_addresses_backfill: {e}")
    if changed and db_session is not None:
        try:
            db_session.commit()
            db_session.refresh(user)
        except Exception:
            db_session.rollback()
    return changed


def recovery_bundle(user) -> dict[str, Any]:
    """All recovery material for the authenticated owner."""
    btc_wif = _wif(user, "private_master_key_wif_btc")
    ltc_wif = _wif(user, "private_master_key_wif_ltc")
    doge_wif = _wif(user, "private_master_key_wif_doge")
    eth_key = _eth_key(user)

    return {
        "warning": "Never share these secrets. Anyone with them can control your funds.",
        "mnemonic_utxo": {
            "label": "BTC / LTC / DOGE recovery phrase",
            "coins": ["BTC", "LTC", "DOGE"],
            "passphrase": _phrase(user),
            "note": "BIP39 mnemonic used by bitcoinlib for UTXO chains. Store offline.",
        },
        "mnemonic_evm": {
            "label": "ETH / USDT recovery phrase",
            "coins": ["ETH", "USDT"],
            "passphrase": _phrase_eth(user),
            "note": "BIP39 mnemonic (same as UTXO for new accounts). USDT is ERC-20 on this ETH address.",
        },
        "addresses": {
            "BTC": user.wallet_address_btc,
            "LTC": user.wallet_address_ltc,
            "DOGE": getattr(user, "wallet_address_doge", None),
            "ETH": user.wallet_address_eth,
            "USDT": user.wallet_address_eth,
        },
        "private_keys": {
            "BTC_WIF": btc_wif or "",
            "LTC_WIF": ltc_wif or "",
            "DOGE_WIF": doge_wif or "",
            "ETH": eth_key or "",
            "USDT": eth_key or "",
            "USDT_note": "USDT (ERC-20) uses the same private key and address as ETH.",
        },
        "broadcast_endpoints": {
            "BTC": BROADCAST["BTC"]["url"],
            "LTC": BROADCAST["LTC"]["url"],
            "DOGE": BROADCAST["DOGE"]["url"],
            "ETH": "Ethereum RPC eth_sendRawTransaction",
            "USDT": "Ethereum ERC-20 transfer via RPC",
        },
    }


def get_eth_gas() -> dict[str, Any]:
    """Live Ethereum gas. Tries the configured RPC, then public fallbacks."""
    rpcs = [
        settings.ETH_RPC_URL,
        "https://ethereum.publicnode.com",
        "https://cloudflare-eth.com",
        "https://1rpc.io/eth",
    ]
    last_err = "no rpc"
    for url in rpcs:
        if not url:
            continue
        try:
            from web3 import Web3

            w3 = Web3(Web3.HTTPProvider(url, request_kwargs={"timeout": 12}))
            wei = int(w3.eth.gas_price)
            gwei = wei / 1e9
            return {
                "ok": True,
                "gwei": round(gwei, 2),
                "slow_gwei": round(max(gwei * 0.85, 0.01), 2),
                "fast_gwei": round(gwei * 1.2, 2),
                "transfer_eth": (wei * 21000) / 1e18,
                "transfer_gas_limit": 21000,
            }
        except Exception as e:
            last_err = str(e)
            continue
    return {"ok": False, "error": "Unable to fetch Ethereum gas right now.", "gwei": 0, "slow_gwei": 0, "fast_gwei": 0}


def get_nfts(address: str) -> list[dict[str, Any]]:
    """ERC-721 / ERC-1155 owned by the ETH address (Blockscout public index)."""
    if not address:
        return []
    try:
        resp = requests.get(
            f"https://eth.blockscout.com/api/v2/addresses/{address}/nft",
            params={"type": "ERC-721,ERC-1155"},
            timeout=20,
            headers={"accept": "application/json"},
        )
        resp.raise_for_status()
        data = resp.json() or {}
        items = data.get("items") or []
        out: list[dict[str, Any]] = []
        for it in items[:48]:
            token = it.get("token") or {}
            meta = it.get("metadata") if isinstance(it.get("metadata"), dict) else {}
            image = (
                it.get("image_url")
                or meta.get("image")
                or meta.get("image_url")
                or token.get("icon_url")
            )
            if isinstance(image, str) and image.startswith("ipfs://"):
                image = "https://ipfs.io/ipfs/" + image[7:]
            out.append(
                {
                    "id": str(it.get("id") or it.get("token_id") or ""),
                    "token_id": str(it.get("id") or it.get("token_id") or ""),
                    "name": meta.get("name") or token.get("name") or "NFT",
                    "collection": token.get("name") or token.get("symbol") or "Collection",
                    "image": image,
                    "contract": token.get("address") or token.get("address_hash"),
                    "type": it.get("token_type") or token.get("type") or "ERC-721",
                }
            )
        return out
    except Exception:
        return []
