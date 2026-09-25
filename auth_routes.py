# ============================================================
# AUTH ROUTES
# ============================================================
# Handles:
#   - User registration
#   - User login
#   - Current logged-in user
#
# Registration now preserves the role selected on the frontend.
# ============================================================

from fastapi import APIRouter, Depends, HTTPException, status

from database import user_collection
from models import RegisterRequest, LoginRequest, TokenResponse
from auth import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user,
)


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)


# ============================================================
# ALLOWED ROLES
# ============================================================

ALLOWED_ROLES = {
    "DEPARTMENT_STAFF",
    "SUPPORT_ENGINEER",
    "TEAM_LEAD",
    "ADMIN",
}


# ============================================================
# REGISTER
# ============================================================

@router.post(
    "/register",
    status_code=status.HTTP_201_CREATED,
)
def register_user(data: RegisterRequest):

    # --------------------------------------------------------
    # Validate role
    # --------------------------------------------------------

    if data.role not in ALLOWED_ROLES:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid role selected",
        )


    # --------------------------------------------------------
    # Check duplicate User ID
    # --------------------------------------------------------

    existing_user_id = user_collection.find_one(
        {
            "user_id": data.user_id
        }
    )

    if existing_user_id:

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User ID already exists",
        )


    # --------------------------------------------------------
    # Check duplicate Username
    # --------------------------------------------------------

    existing_username = user_collection.find_one(
        {
            "username": data.username
        }
    )

    if existing_username:

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Username already exists",
        )


    # --------------------------------------------------------
    # Create user
    # --------------------------------------------------------
    # IMPORTANT:
    #
    # Do NOT hard-code:
    #
    #     "role": "DEPARTMENT_STAFF"
    #
    # Instead use:
    #
    #     data.role
    #
    # This preserves the role selected in React.
    # --------------------------------------------------------

    user_data = {
        "user_id": data.user_id,
        "name": data.name,
        "username": data.username,

        # Selected role from frontend
        "role": data.role,

        # Department is optional during registration
        "department": data.department,

        # Store hashed password only
        "password_hash": hash_password(data.password),
    }


    # --------------------------------------------------------
    # Insert user
    # --------------------------------------------------------

    user_collection.insert_one(user_data)


    # --------------------------------------------------------
    # Response
    # --------------------------------------------------------

    return {
        "message": "Registration successful",
        "user_id": data.user_id,
        "username": data.username,
        "role": data.role,
    }


# ============================================================
# LOGIN
# ============================================================

@router.post(
    "/login",
    response_model=TokenResponse,
)
def login_user(data: LoginRequest):

    # --------------------------------------------------------
    # Find user
    # --------------------------------------------------------

    user = user_collection.find_one(
        {
            "username": data.username
        }
    )


    if user is None:

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
            headers={
                "WWW-Authenticate": "Bearer"
            },
        )


    # --------------------------------------------------------
    # Verify password
    # --------------------------------------------------------

    password_hash = user.get(
        "password_hash"
    )


    if not password_hash:

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
            headers={
                "WWW-Authenticate": "Bearer"
            },
        )


    if not verify_password(
        data.password,
        password_hash,
    ):

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
            headers={
                "WWW-Authenticate": "Bearer"
            },
        )


    # --------------------------------------------------------
    # Get user information
    # --------------------------------------------------------

    user_id = user.get(
        "user_id"
    )

    name = user.get(
        "name",
        "",
    )

    role = user.get(
        "role",
    )

    department = user.get(
        "department"
    )


    # --------------------------------------------------------
    # Validate role
    # --------------------------------------------------------

    if role not in ALLOWED_ROLES:

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User has an invalid role",
        )


    # --------------------------------------------------------
    # Create JWT
    # --------------------------------------------------------

    access_token = create_access_token(
        {
            "user_id": user_id,
            "username": data.username,
            "role": role,
        }
    )


    # --------------------------------------------------------
    # Return login response
    # --------------------------------------------------------

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        role=role,
        user_id=user_id,
        name=name,
        department=department,
    )


# ============================================================
# CURRENT USER
# ============================================================

@router.get(
    "/me",
)
def get_me(
    current_user: dict = Depends(
        get_current_user
    ),
):

    return current_user