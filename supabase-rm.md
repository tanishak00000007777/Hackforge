# Rm-supabase

This file records the PostgreSQL cleanup changes that were made without changing the main `Readme.md`.

## Summary

The codebase has been aligned to use PostgreSQL directly instead of provider-specific integration settings.

## Changes Made

### 1. Removed provider-specific app settings

File: `app/config/settings.py`

- Removed `supabase_url`
- Removed `supabase_service_role_key`
- Kept `database_url` as the single database connection setting

### 2. Removed unused dependency

File: `requirements.txt`

- Removed `supabase==2.5.0`
- Updated the `asyncpg` comment so it now describes plain PostgreSQL usage

### 3. Standardized environment template

File: `.env.example`

- Added a clean PostgreSQL-only example configuration
- Kept `DATABASE_URL` in `postgresql+asyncpg://...` format
- Did not include any provider-specific keys

### 4. Updated supporting documentation

Files:

- `HackForge_Backend_Code.md`
- `PROJECT_CONTEXT.md`

Changes:

- Rewrote the setup and architecture notes to describe PostgreSQL-only usage
- Removed provider-specific references from those docs

### 5. Restored the main README

File: `Readme.md`

- Reverted the main README back as requested
- Moved the change summary into this `README2.md` file instead

## Current Result

- Main project README is back in place
- PostgreSQL is the active documented database path for the cleanup notes
- `README2.md` now contains the change log
