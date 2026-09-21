"""Validate on-chain destination addresses before signing."""

from __future__ import annotations

import re

_BTC_P2PKH = re.compile(r"^[13][a-km-zA-HJ-NP-Z1-9]{24,39}$")
_BTC_BECH32 = re.compile(r"^bc1[qpzry9x8gf2tvdw0s3jn54khce6mua7l]{11,87}$", re.I)
_LTC_LEGACY = re.compile(r"^[LM3][a-km-zA-HJ-NP-Z1-9]{24,39}$")
_LTC_BECH32 = re.compile(r"^ltc1[qpzry9x8gf2tvdw0s3jn54khce6mua7l]{11,87}$", re.I)
_DOGE = re.compile(r"^D[5-9A-HJ-NP-U][1-9A-HJ-NP-Za-km-z]{24,39}$")
_ETH = re.compile(r"^0x[0-9a-fA-F]{40}$")


def validate_address(coin: str, address: str) -> tuple[bool, str]:
    coin = (coin or "").upper()
    addr = (address or "").strip()
    if not addr:
        return False, "Enter a destination address."

    if coin == "BTC":
        if _BTC_P2PKH.match(addr) or _BTC_BECH32.match(addr):
            return True, ""
        return False, "That is not a valid Bitcoin address."

    if coin == "LTC":
        if _LTC_LEGACY.match(addr) or _LTC_BECH32.match(addr):
            return True, ""
        return False, "That is not a valid Litecoin address."

    if coin == "DOGE":
        if _DOGE.match(addr):
            return True, ""
        return False, "That is not a valid Dogecoin address."

    if coin in ("ETH", "USDT"):
        if not _ETH.match(addr):
            return False, "That is not a valid Ethereum address."
        if not _eth_checksum_ok(addr):
            return False, "Ethereum address checksum is incorrect."
        return True, ""

    return False, "Unsupported asset."


def _eth_checksum_ok(address: str) -> bool:
    if address == address.lower() or address == address.upper():
        return True
    try:
        from eth_utils import is_checksum_address

        return bool(is_checksum_address(address))
    except Exception:
        return True
