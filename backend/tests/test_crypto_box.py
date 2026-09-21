import os

os.environ.setdefault("SECRET_KEY", "unit-test-secret-key-not-for-prod")
os.environ.setdefault("POSTGRES_HOST", "127.0.0.1")
os.environ.setdefault("POSTGRES_DB", "crypto-wallet")

from app.crypto_box import PREFIX, reveal_secret, seal_secret


def test_roundtrip():
    sealed = seal_secret("alpha beta gamma")
    assert sealed.startswith(PREFIX)
    assert reveal_secret(sealed) == "alpha beta gamma"


def test_plaintext_passthrough():
    assert reveal_secret("legacy-seed-words-here") == "legacy-seed-words-here"


def test_empty():
    assert reveal_secret(None) == ""
    assert reveal_secret("") == ""
    assert seal_secret("") == ""
    assert seal_secret(None) is None


def test_double_seal_is_idempotent():
    once = seal_secret("hello")
    twice = seal_secret(once)
    assert once == twice
    assert reveal_secret(twice) == "hello"
