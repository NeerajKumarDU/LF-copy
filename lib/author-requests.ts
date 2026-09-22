// Data layer for the public "become an author" flow: submit -> verify email
// -> admin approves/rejects. See migrations/002_add_author_requests.sql.
import { randomBytes } from "node:crypto";
import { query } from "./db";
import { createAuthorAccount } from "./admin-posts";
import { hashPassword } from "./passwords";

const VERIFY_TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24h

export type AuthorRequestStatus = "pending_verification" | "pending_review" | "approved" | "rejected";

export interface AuthorRequest {
  id: string;
  name: string;
  email: string;
  message: string | null;
  status: AuthorRequestStatus;
  verifiedAt: string | null;
  decidedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
}

type AuthorRequestRow = {
  id: number;
  name: string;
  email: string;
  message: string | null;
  status: AuthorRequestStatus;
  verify_token: string | null;
  verify_token_expires_at: string | null;
  verified_at: string | null;
  decided_at: string | null;
  rejection_reason: string | null;
  author_id: number | null;
  created_at: string;
};

function mapRow(r: AuthorRequestRow): AuthorRequest {
  return {
    id: String(r.id),
    name: r.name,
    email: r.email,
    message: r.message,
    status: r.status,
    verifiedAt: r.verified_at,
    decidedAt: r.decided_at,
    rejectionReason: r.rejection_reason,
    createdAt: r.created_at,
  };
}

// Re-submitting with the same email while an earlier request is still in
// flight (unverified or awaiting review) refreshes that same row instead of
// piling up duplicates - handles "the verification email never arrived".
export async function createAuthorRequest(opts: { name: string; email: string; message?: string }): Promise<{ token: string }> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + VERIFY_TOKEN_TTL_MS);
  const email = opts.email.trim().toLowerCase();
  const name = opts.name.trim();
  const message = opts.message?.trim() || null;

  const { rows: existing } = await query<{ id: number }>(
    `SELECT id FROM author_requests WHERE lower(email) = $1 AND status IN ('pending_verification', 'pending_review') LIMIT 1`,
    [email]
  );

  if (existing[0]) {
    await query(
      `UPDATE author_requests
       SET name = $1, message = $2, status = 'pending_verification',
           verify_token = $3, verify_token_expires_at = $4, verified_at = NULL
       WHERE id = $5`,
      [name, message, token, expiresAt, existing[0].id]
    );
  } else {
    await query(
      `INSERT INTO author_requests (name, email, message, status, verify_token, verify_token_expires_at)
       VALUES ($1, $2, $3, 'pending_verification', $4, $5)`,
      [name, email, message, token, expiresAt]
    );
  }

  return { token };
}

export type VerifyResult =
  | { ok: true; alreadyVerified: boolean }
  | { ok: false; reason: "invalid" | "expired" };

export async function verifyAuthorRequestByToken(token: string): Promise<VerifyResult> {
  const { rows } = await query<AuthorRequestRow>(`SELECT * FROM author_requests WHERE verify_token = $1 LIMIT 1`, [token]);
  const row = rows[0];
  if (!row) return { ok: false, reason: "invalid" };

  if (row.status !== "pending_verification") {
    // Link already used - treat as success so a double-click / re-open isn't an error.
    return { ok: true, alreadyVerified: true };
  }
  if (row.verify_token_expires_at && new Date(row.verify_token_expires_at).getTime() < Date.now()) {
    return { ok: false, reason: "expired" };
  }

  await query(`UPDATE author_requests SET status = 'pending_review', verified_at = now() WHERE id = $1`, [row.id]);
  return { ok: true, alreadyVerified: false };
}

export async function listPendingAuthorRequests(): Promise<AuthorRequest[]> {
  const { rows } = await query<AuthorRequestRow>(
    `SELECT * FROM author_requests WHERE status = 'pending_review' ORDER BY verified_at ASC`
  );
  return rows.map(mapRow);
}

async function getAuthorRequestById(id: string): Promise<AuthorRequestRow | null> {
  if (!id || isNaN(Number(id))) return null;
  const { rows } = await query<AuthorRequestRow>(`SELECT * FROM author_requests WHERE id = $1::bigint LIMIT 1`, [id]);
  return rows[0] ?? null;
}

// Generates a one-time temp password for the new account - emailed to the
// requester, who's expected to change it via the existing author
// change-password flow right after logging in.
function generateTempPassword(): string {
  return randomBytes(9).toString("base64url"); // ~12 url-safe chars
}

export async function approveAuthorRequest(
  id: string
): Promise<{ authorName: string; email: string; tempPassword: string } | null> {
  const request = await getAuthorRequestById(id);
  if (!request || request.status !== "pending_review") return null;

  const tempPassword = generateTempPassword();
  const account = await createAuthorAccount(request.name, hashPassword(tempPassword));

  await query(`UPDATE author_requests SET status = 'approved', decided_at = now(), author_id = $1 WHERE id = $2`, [
    account.id,
    request.id,
  ]);

  return { authorName: account.name, email: request.email, tempPassword };
}

export async function rejectAuthorRequest(id: string, reason?: string): Promise<{ email: string; name: string } | null> {
  const request = await getAuthorRequestById(id);
  if (!request || request.status !== "pending_review") return null;

  await query(`UPDATE author_requests SET status = 'rejected', decided_at = now(), rejection_reason = $1 WHERE id = $2`, [
    reason?.trim() || null,
    request.id,
  ]);

  return { email: request.email, name: request.name };
}
