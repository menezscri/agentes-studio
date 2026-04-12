"""
Auth helpers: JWT signing/verification + password hashing.
Uses PyJWT (already installed) and hashlib for bcrypt-like hashing.
"""
import os
import hashlib
import hmac
import secrets
import time
import json

try:
    import jwt as pyjwt
    # Quick smoke test to ensure the library is usable
    pyjwt.encode({"test": 1}, "key", algorithm="HS256")
    _USE_PYJWT = True
except BaseException:
    pyjwt = None
    _USE_PYJWT = False

JWT_SECRET = os.environ.get("JWT_SECRET", "splitz-dev-secret-key-change-in-production")
JWT_EXPIRY = 30 * 24 * 60 * 60  # 30 days in seconds


# ─── Password hashing ────────────────────────────────────────────────────────

def hash_password(password: str) -> str:
    """PBKDF2-HMAC-SHA256 password hash (iterations=260_000 per NIST 2023)."""
    salt = secrets.token_hex(16)
    key = hashlib.pbkdf2_hmac(
        "sha256", password.encode(), salt.encode(), 260_000
    )
    return f"pbkdf2:sha256:260000:{salt}:{key.hex()}"


def verify_password(password: str, hash_str: str) -> bool:
    try:
        _, algo, iterations, salt, stored_key = hash_str.split(":")
        candidate = hashlib.pbkdf2_hmac(
            "sha256", password.encode(), salt.encode(), int(iterations)
        )
        return hmac.compare_digest(candidate.hex(), stored_key)
    except Exception:
        return False


# ─── JWT ─────────────────────────────────────────────────────────────────────

import base64 as _b64

def _b64u_encode(data: bytes) -> str:
    return _b64.urlsafe_b64encode(data).rstrip(b"=").decode()

def _b64u_decode(s: str) -> bytes:
    s += "=" * (-len(s) % 4)
    return _b64.urlsafe_b64decode(s)


def sign_token(user_id: int, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "iat": int(time.time()),
        "exp": int(time.time()) + JWT_EXPIRY,
    }
    if _USE_PYJWT:
        try:
            return pyjwt.encode(payload, JWT_SECRET, algorithm="HS256")
        except Exception:
            pass
    # Pure-Python HS256 JWT
    header = _b64u_encode(json.dumps({"alg": "HS256", "typ": "JWT"}).encode())
    body   = _b64u_encode(json.dumps(payload).encode())
    sig    = _b64u_encode(
        hmac.new(JWT_SECRET.encode(), f"{header}.{body}".encode(), hashlib.sha256).digest()
    )
    return f"{header}.{body}.{sig}"


def verify_token(token: str) -> dict | None:
    try:
        if _USE_PYJWT:
            try:
                return pyjwt.decode(token, JWT_SECRET, algorithms=["HS256"])
            except Exception:
                pass
        # Pure-Python verify
        parts = token.split(".")
        if len(parts) != 3:
            return None
        header, body, sig = parts
        expected = hmac.new(JWT_SECRET.encode(), f"{header}.{body}".encode(), hashlib.sha256).digest()
        actual   = _b64u_decode(sig)
        if not hmac.compare_digest(expected, actual):
            return None
        payload = json.loads(_b64u_decode(body))
        if payload.get("exp", 0) < time.time():
            return None
        return payload
    except Exception:
        return None


def get_token_from_header(headers: dict) -> str | None:
    auth = headers.get("Authorization") or headers.get("authorization", "")
    if auth.startswith("Bearer "):
        return auth[7:]
    return None


def get_token_from_cookie(cookie_str: str) -> str | None:
    if not cookie_str:
        return None
    for part in cookie_str.split(";"):
        part = part.strip()
        if part.startswith("splitz_token="):
            return part[len("splitz_token="):]
    return None
