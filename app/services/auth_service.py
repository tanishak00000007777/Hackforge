from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from jose import JWTError

from app.models.user import User
from app.schemas.user import UserCreate, UserLogin, TokenResponse, GoogleLoginRequest
from app.utils.hashing import hash_password, verify_password
from app.core.security import create_access_token, create_refresh_token, decode_token


async def register_user(user_data: UserCreate, db: AsyncSession) -> User:
    # Check if email already exists
    result = await db.execute(
        select(User).where(User.email == user_data.email)
    )
    existing = result.scalar_one_or_none()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    new_user = User(
        email=user_data.email,
        full_name=user_data.full_name,
        hashed_password=hash_password(user_data.password),
        role=user_data.role,
        org_name=user_data.org_name,
    )

    db.add(new_user)
    await db.flush()
    await db.refresh(new_user)
    return new_user


async def login_user(login_data: UserLogin, db: AsyncSession) -> TokenResponse:
    # Find user
    result = await db.execute(
        select(User).where(User.email == login_data.email)
    )
    user = result.scalar_one_or_none()

    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated",
        )

    return TokenResponse(
        access_token=create_access_token(str(user.id)),
        refresh_token=create_refresh_token(str(user.id)),
    )


async def refresh_access_token(refresh_token: str, db: AsyncSession) -> TokenResponse:
    """Validate a refresh token and return a new access + refresh token pair."""
    try:
        payload = decode_token(refresh_token)
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token is invalid or expired",
        )

    if payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token is not a refresh token",
        )

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
        )

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is deactivated")

    return TokenResponse(
        access_token=create_access_token(str(user.id)),
        refresh_token=create_refresh_token(str(user.id)),
    )


async def login_google_user(data: GoogleLoginRequest, db: AsyncSession) -> TokenResponse:
    import httpx
    import secrets
    from app.config.settings import get_settings

    # 1. Fetch tokeninfo from Google API
    url = f"https://oauth2.googleapis.com/tokeninfo?id_token={data.id_token}"
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, timeout=10.0)
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Failed to connect to Google authentication services.",
            )

    if response.status_code != 200:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Google ID Token.",
        )

    payload = response.json()

    # 2. Check audience matches configured Client ID
    settings = get_settings()
    if settings.google_client_id:
        if payload.get("aud") != settings.google_client_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Google token audience mismatch.",
            )

    email = payload.get("email")
    full_name = payload.get("name") or "Google User"

    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Google account must share email address.",
        )

    # 3. Check if user already exists
    result = await db.execute(
        select(User).where(User.email == email)
    )
    user = result.scalar_one_or_none()

    if not user:
        # User not found and no role selected -> prompt frontend to ask for one
        if not data.role:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="USER_NOT_REGISTERED",
            )

        # Create new Google user
        user = User(
            email=email,
            full_name=full_name,
            hashed_password=hash_password(secrets.token_urlsafe(32)),
            role=data.role,
            org_name=data.org_name,
        )
        db.add(user)
        await db.flush()
        await db.refresh(user)

    elif not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated.",
        )

    # 4. Generate JWT tokens
    return TokenResponse(
        access_token=create_access_token(str(user.id)),
        refresh_token=create_refresh_token(str(user.id)),
    )