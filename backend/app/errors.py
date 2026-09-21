"""Map internal wallet errors to user-facing messages. Never leak RPC URLs or keys."""

from __future__ import annotations

import re

_SECRETISH = re.compile(
    r"(0x[a-fA-F0-9]{64}|xprv|yprv|zprv|mnemonic|passphrase|private.?key|wif)",
    re.I,
)


class UserWalletError(Exception):
    def __init__(self, message: str, status_code: int = 400):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


def public_error(exc: BaseException, fallback: str) -> str:
    text = str(exc or "")
    if _SECRETISH.search(text):
        return fallback
    lowered = text.lower()
    if "insufficient" in lowered or "not enough" in lowered:
        return "Insufficient balance to cover this amount and the network fee."
    if "invalid address" in lowered or "checksum" in lowered:
        return "That destination address is not valid for this network."
    if "nonce" in lowered:
        return "The network rejected this transaction. Wait a few seconds and try again."
    if "gas" in lowered and "too low" in lowered:
        return "Network fee is too low. Increase the fee and try again."
    if "timeout" in lowered or "timed out" in lowered:
        return "The network took too long to respond. Please try again."
    if "connection" in lowered or "rpc" in lowered:
        return "Unable to reach the blockchain right now. Please try again."
    if "dust" in lowered:
        return "This amount is too small for the network (dust)."
    if len(text) > 180 or "http" in lowered:
        return fallback
    return text.strip() or fallback
