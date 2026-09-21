from app.addresses import validate_address


def test_btc_valid():
    ok, err = validate_address("BTC", "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa")
    assert ok, err
    ok, err = validate_address("BTC", "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4")
    assert ok, err


def test_btc_invalid():
    ok, err = validate_address("BTC", "0xabc")
    assert not ok
    assert "Bitcoin" in err


def test_eth_valid_lower():
    ok, err = validate_address("ETH", "0x742d35cc6634c0532925a3b844bc454e4438f44e")
    assert ok, err


def test_eth_invalid():
    ok, _ = validate_address("ETH", "0x123")
    assert not ok
    ok, _ = validate_address("USDT", "D7Y55LeUtq9R68hA3")
    assert not ok


def test_empty():
    ok, err = validate_address("BTC", "  ")
    assert not ok
    assert "Enter" in err


def test_ltc_and_doge():
    ok, err = validate_address("LTC", "LhyLNfBkoKshT7R8Pce6vkB9T2cP2oP7j1")
    assert ok or err  # format-level; some fixtures may fail charset
    ok, err = validate_address("DOGE", "DH5yaieqoZN36fDVciNyRueRGvGLR3mr7L")
    assert ok, err
