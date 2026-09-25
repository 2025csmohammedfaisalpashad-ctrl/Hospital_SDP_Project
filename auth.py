# ============================================================
# AUTHENTICATION
# ============================================================
# Password hashing, JWT creation/verification, and the two
# FastAPI dependencies every protected route uses:
#   - get_current_user   -> who is calling, based on their token
#   - require_role(...)  -> is that user allowed to be here
#
# The identity always comes from the TOKEN, never from anything
# the frontend puts in a URL or request body.

import os
from datetime import datetime, timedelta

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
import bcrypt

from database import user_collection

# --- Configuration ------------------------------------------------
# In production this MUST come from the environment. A fallback is
# provided only so the app doesn't crash if someone forgets to set
# it locally -- but you should always set JWT_SECRET_KEY in .env.
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "dev-only-insecure-secret-change-me")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 480  # 8 hours - long enough for a class/demo session

bearer_scheme = HTTPBearer()


# --- Password hashing ----------------------------------------------
# Using the bcrypt library directly (not passlib) -- passlib's bcrypt
# backend breaks on newer bcrypt versions (version-detection bug).
def hash_password(password: str) -> str:
    hashed = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt())
    return hashed.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except ValueError:
        return False


# --- JWT -------------------------------------------------------------
def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str) -> dict:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )


# --- Dependencies ----------------------------------------------------
def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> dict:
    """Resolves the logged-in user from the Bearer token. Raises 401 if
    the token is missing/invalid/expired, or the user no longer exists."""

    payload = decode_access_token(credentials.credentials)
    user_id = payload.get("user_id")

    if user_id is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    # password_hash is NEVER returned to any route from here.
    user = user_collection.find_one({"user_id": user_id}, {"_id": 0, "password_hash": 0})

    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User no longer exists")

    return user


def require_role(*allowed_roles: str):
    """Use as a route dependency: Depends(require_role(ROLE_ADMIN)).
    Raises 403 if the authenticated user's role isn't in allowed_roles."""

    def _dependency(current_user: dict = Depends(get_current_user)) -> dict:
        if current_user.get("role") not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to perform this action",
            )
        return current_user

    return _dependency