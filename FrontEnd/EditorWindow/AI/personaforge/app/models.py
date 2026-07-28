import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, JSON, Text, Boolean
from sqlalchemy.orm import relationship

from .database import Base


def new_id() -> str:
    return uuid.uuid4().hex


def now() -> datetime:
    return datetime.now(timezone.utc)


class Project(Base):
    __tablename__ = "projects"

    id = Column(String, primary_key=True, default=new_id)
    name = Column(String, nullable=False)
    entry_file = Column(String, nullable=False)
    manifest = Column(JSON, nullable=False)
    current_version = Column(Integer, default=1)
    created_at = Column(DateTime, default=now)

    versions = relationship("Version", back_populates="project", cascade="all, delete-orphan")
    jobs = relationship("Job", back_populates="project", cascade="all, delete-orphan")


class Version(Base):
    __tablename__ = "versions"

    id = Column(String, primary_key=True, default=new_id)
    project_id = Column(String, ForeignKey("projects.id"), nullable=False)
    number = Column(Integer, nullable=False)
    job_id = Column(String, ForeignKey("jobs.id"), nullable=True)
    prompt = Column(Text, nullable=True)
    summary = Column(Text, nullable=True)
    changed_files = Column(JSON, default=list)
    validation_result = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=now)

    project = relationship("Project", back_populates="versions")


class Job(Base):
    __tablename__ = "jobs"

    id = Column(String, primary_key=True, default=new_id)
    project_id = Column(String, ForeignKey("projects.id"), nullable=False)
    prompt = Column(Text, nullable=False)
    settings = Column(JSON, default=dict)
    state = Column(String, default="queued")
    stage = Column(String, default="queued")
    error_message = Column(Text, nullable=True)
    intent = Column(JSON, nullable=True)
    edit_plan = Column(JSON, nullable=True)
    operations = Column(JSON, nullable=True)
    changed_files = Column(JSON, default=list)
    validation_result = Column(JSON, nullable=True)
    diffs = Column(JSON, nullable=True)
    repaired = Column(Boolean, default=False)
    created_at = Column(DateTime, default=now)
    updated_at = Column(DateTime, default=now, onupdate=now)

    project = relationship("Project", back_populates="jobs")
