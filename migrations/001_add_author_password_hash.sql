-- Migration: Add password_hash column to authors table for author credentials
-- Safe to run multiple times; nullable so existing authors default to env password.

ALTER TABLE authors ADD COLUMN IF NOT EXISTS password_hash text;
