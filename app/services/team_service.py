import uuid
import secrets
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models.team import Team
from app.models.team_member import TeamMember
from app.models.hackathon import Hackathon
from app.models.registration import Registration, RegistrationStatus
from app.models.user import User
from app.schemas.team import TeamCreate


def _generate_invite_code() -> str:
    return secrets.token_urlsafe(6)[:8].upper()


async def _get_user_team(
    hackathon_id: uuid.UUID,
    user_id: uuid.UUID,
    db: AsyncSession,
) -> Team | None:
    result = await db.execute(
        select(Team)
        .join(TeamMember, TeamMember.team_id == Team.id)
        .where(
            Team.hackathon_id == hackathon_id,
            TeamMember.user_id == user_id,
        )
    )
    return result.scalar_one_or_none()


async def create_team(
    hackathon_id: uuid.UUID,
    data: TeamCreate,
    current_user: User,
    db: AsyncSession,
) -> Team:
    # Must be registered and approved
    result = await db.execute(
        select(Registration).where(
            Registration.hackathon_id == hackathon_id,
            Registration.user_id == current_user.id,
            Registration.status == RegistrationStatus.approved,
        )
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=403, detail="You must be approved to create a team")

    # Check not already in a team
    if await _get_user_team(hackathon_id, current_user.id, db):
        raise HTTPException(status_code=400, detail="Already in a team")

    # Check duplicate team name in same hackathon
    result = await db.execute(
        select(Team).where(
            Team.hackathon_id == hackathon_id,
            Team.name == data.name,
        )
    )
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Team name already taken")

    invite_code = _generate_invite_code()

    team = Team(
        hackathon_id=hackathon_id,
        name=data.name,
        invite_code=invite_code,
        leader_id=current_user.id,
    )
    db.add(team)
    await db.flush()

    # Add creator as first member
    member = TeamMember(team_id=team.id, user_id=current_user.id)
    db.add(member)
    await db.flush()
    await db.refresh(team)
    return team


async def join_team(
    hackathon_id: uuid.UUID,
    invite_code: str,
    current_user: User,
    db: AsyncSession,
) -> Team:
    # Must be registered and approved
    result = await db.execute(
        select(Registration).where(
            Registration.hackathon_id == hackathon_id,
            Registration.user_id == current_user.id,
            Registration.status == RegistrationStatus.approved,
        )
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=403, detail="You must be approved to join a team")

    # Check not already in a team
    if await _get_user_team(hackathon_id, current_user.id, db):
        raise HTTPException(status_code=400, detail="Already in a team")

    # Find team by invite code
    result = await db.execute(
        select(Team).where(
            Team.invite_code == invite_code,
            Team.hackathon_id == hackathon_id,
        )
    )
    team = result.scalar_one_or_none()
    if not team:
        raise HTTPException(status_code=404, detail="Invalid invite code")

    # Check team size limit
    hackathon_result = await db.execute(
        select(Hackathon).where(Hackathon.id == hackathon_id)
    )
    hackathon = hackathon_result.scalar_one_or_none()

    count_result = await db.execute(
        select(func.count()).select_from(TeamMember).where(TeamMember.team_id == team.id)
    )
    member_count = count_result.scalar()

    if hackathon and member_count >= hackathon.max_team_size:
        raise HTTPException(status_code=400, detail="Team is full")

    member = TeamMember(team_id=team.id, user_id=current_user.id)
    db.add(member)
    await db.flush()
    await db.refresh(team)
    return team


async def get_my_team(
    hackathon_id: uuid.UUID,
    current_user: User,
    db: AsyncSession,
) -> Team:
    team = await _get_user_team(hackathon_id, current_user.id, db)
    if not team:
        raise HTTPException(status_code=404, detail="Not in a team")
    return team

async def leave_team(
    hackathon_id: uuid.UUID,
    current_user: User,
    db: AsyncSession,
) -> dict:
    team = await _get_user_team(hackathon_id, current_user.id, db)
    if not team:
        raise HTTPException(status_code=404, detail="Not in a team")

    # Delete member record
    result = await db.execute(
        select(TeamMember).where(
            TeamMember.team_id == team.id,
            TeamMember.user_id == current_user.id,
        )
    )
    member = result.scalar_one_or_none()
    if member:
        await db.delete(member)
        await db.flush()

    # If leader left, reassign or dissolve
    if team.leader_id == current_user.id:
        remaining = await db.execute(
            select(TeamMember).where(TeamMember.team_id == team.id)
        )
        remaining_members = remaining.scalars().all()
        if remaining_members:
            team.leader_id = remaining_members[0].user_id
            await db.flush()
        else:
            await db.delete(team)
            await db.flush()
            return {"detail": "Team dissolved"}

    return {"detail": "Left team successfully"}