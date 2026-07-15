import uuid
from fastapi import Path
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.security import decode_token
from app.core.database import get_db

bearer_scheme = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
):
    """Returns full User object. Use this in all protected routes from now on."""
    try:
        payload = decode_token(credentials.credentials)
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload",
            )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token is invalid or expired",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Import here to avoid circular imports
    from app.models.user import User
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is deactivated")

    return user

def require_feature(feature_name: str):
    """
    Reusable FastAPI dependency that blocks any route
    if a specific feature is disabled for that hackathon.

    Usage in any router:
        @router.post("/{hackathon_id}")
        async def create_team(
            _=Depends(require_feature("teams_enabled")),
            ...
        ):

    The hackathon_id is automatically read from the URL path.
    No extra code needed in the router or service.
    """
    async def _check(
        hackathon_id: uuid.UUID = Path(...),
        db: AsyncSession = Depends(get_db),
    ):
        from app.services.feature_service import check_feature_enabled
        await check_feature_enabled(hackathon_id, feature_name, db)

    return _check