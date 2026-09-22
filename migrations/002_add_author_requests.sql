-- Migration: author signup requests (self-serve "become an author" flow).
-- Public users submit a request, verify their email via a tokenized link,
-- then an admin approves or rejects it from a queue. Approval creates a real
-- authors row and links back here via author_id.
-- Safe to run multiple times (IF NOT EXISTS throughout).

CREATE TABLE IF NOT EXISTS author_requests (
  id bigserial PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL,
  message text,
  -- pending_verification -> pending_review -> approved | rejected
  status text NOT NULL DEFAULT 'pending_verification',
  verify_token text,
  verify_token_expires_at timestamptz,
  verified_at timestamptz,
  decided_at timestamptz,
  rejection_reason text,
  author_id bigint REFERENCES authors(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS author_requests_status_idx ON author_requests (status);
CREATE UNIQUE INDEX IF NOT EXISTS author_requests_verify_token_idx ON author_requests (verify_token) WHERE verify_token IS NOT NULL;
