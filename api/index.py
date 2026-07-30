"""Vercel serverless entrypoint.

Vercel's Python runtime looks for an ASGI application named `app` in a module
under api/. Re-exporting keeps app/main.py as the single source of truth --
this file exists only so the platform has something to import.
"""

from app.main import app

__all__ = ["app"]
