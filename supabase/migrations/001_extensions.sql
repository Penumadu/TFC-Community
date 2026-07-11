-- ============================================================
-- Migration 001: Enable Required Extensions
-- Run this first in Supabase SQL Editor
-- ============================================================

-- UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Encryption (for pgcrypto functions)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- PostGIS: Geospatial support (geography columns, ST_DWithin, ST_Buffer, etc.)
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Verify extensions are installed
SELECT name, default_version, installed_version
FROM pg_available_extensions
WHERE name IN ('uuid-ossp', 'pgcrypto', 'postgis')
ORDER BY name;
