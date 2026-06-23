from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.schemas.organization import OrganizationCreate, OrganizationResponse
from app.services.organization_service import create_organization, get_my_organizations

router = APIRouter(prefix="/organizations", tags=["Organizations"])


@router.post("/", response_model=OrganizationResponse, status_code=201)
async def create_org(
    data: OrganizationCreate,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await create_organization(data, current_user, db)


@router.get("/me", response_model=list[OrganizationResponse])
async def my_organizations(
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await get_my_organizations(current_user, db)