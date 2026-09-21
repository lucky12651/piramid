from app.errors import public_error


def test_insufficient():
    msg = public_error(Exception("Insufficient funds for this fee"), "fallback")
    assert "Insufficient" in msg


def test_strips_keys():
    msg = public_error(Exception("bad key 0x" + "ab" * 32), "safe")
    assert msg == "safe"


def test_strips_urls():
    msg = public_error(Exception("failed https://eth.llamarpc.com/v1"), "safe")
    assert "http" not in msg.lower()
    assert "llamarpc" not in msg.lower()
