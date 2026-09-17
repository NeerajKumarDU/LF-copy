// Minimal, stateless admin & author auth:
// - Admin logs in via shared ADMIN_PASSWORD
// - Author logs in via author display_name + custom password or DEFAULT_AUTHOR_PASSWORD
// Uses HMAC signed cookies so sessions work seamlessly across Edge middleware and Node handlers.
// Uses Web Crypto (crypto.subtle) rather than node:crypto so the exact same
// code runs in both Edge middleware and normal Node route handlers.

export type SessionRole = "admin" | "author";

export interface SessionUser {
  role: SessionRole;
  authorId?: string;
  authorName?: string;
}

const COOKIE_NAME = "admin_session";
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function getSecret(): string {
  const secret = process.env.SESSION_SECRET || process.env.ADMIN_PASSWORD;
  if (!secret) {
    throw new Error("ADMIN_PASSWORD is not set (see lawsforum-web/.env.local)");
  }
  return secret;
}

async function hmacKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
}

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function utf8ToBase64Url(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlToUtf8(str: string): string {
  let s = str.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  const binary = atob(s);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

export async function createAdminSessionToken(): Promise<string> {
  const payload = {
    role: "admin",
    exp: Date.now() + SESSION_TTL_MS,
  };
  const payloadStr = utf8ToBase64Url(JSON.stringify(payload));
  const key = await hmacKey();
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payloadStr));
  return `${payloadStr}.${toHex(sig)}`;
}

export async function createAuthorSessionToken(author: { id: string; name: string }): Promise<string> {
  const payload = {
    role: "author",
    authorId: String(author.id),
    authorName: author.name,
    exp: Date.now() + SESSION_TTL_MS,
  };
  const payloadStr = utf8ToBase64Url(JSON.stringify(payload));
  const key = await hmacKey();
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payloadStr));
  return `${payloadStr}.${toHex(sig)}`;
}

// Alias for backward compatibility
export async function createSessionToken(): Promise<string> {
  return createAdminSessionToken();
}

export async function getSessionUser(token: string | undefined | null): Promise<SessionUser | null> {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [dataPart, sigHex] = parts;
  if (!dataPart || !sigHex) return null;

  try {
    const key = await hmacKey();
    const expectedSig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(dataPart));
    if (toHex(expectedSig) !== sigHex) return null;

    // Backward compatibility for old admin tokens: `${expires}.${sigHex}`
    if (/^\d+$/.test(dataPart)) {
      const expires = Number(dataPart);
      if (!Number.isFinite(expires) || Date.now() > expires) return null;
      return { role: "admin" };
    }

    // New format: base64url JSON payload
    const jsonStr = base64UrlToUtf8(dataPart);
    const payload = JSON.parse(jsonStr);
    if (!payload || typeof payload !== "object") return null;
    if (typeof payload.exp !== "number" || Date.now() > payload.exp) return null;
    if (payload.role !== "admin" && payload.role !== "author") return null;

    return {
      role: payload.role as SessionRole,
      authorId: payload.authorId ? String(payload.authorId) : undefined,
      authorName: payload.authorName ? String(payload.authorName) : undefined,
    };
  } catch {
    return null;
  }
}

export async function isValidSessionToken(token: string | undefined | null): Promise<boolean> {
  const user = await getSessionUser(token);
  return user !== null;
}

// Server Component / Route Handler helper to get current session user
export async function getCurrentSessionUser(): Promise<SessionUser | null> {
  try {
    const { cookies } = await import("next/headers");
    const token = cookies().get(COOKIE_NAME)?.value;
    return getSessionUser(token);
  } catch {
    return null;
  }
}

export function checkPassword(input: string): boolean {
  const real = process.env.ADMIN_PASSWORD;
  return typeof input === "string" && !!real && input === real;
}

export const ADMIN_COOKIE_NAME = COOKIE_NAME;
export const ADMIN_COOKIE_MAX_AGE_SECONDS = SESSION_TTL_MS / 1000;
