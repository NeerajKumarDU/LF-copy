import { scryptSync, randomBytes, timingSafeEqual } from "node:crypto";

const KEY_LEN = 64;

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = scryptSync(password, salt, KEY_LEN).toString("hex");
  return `${salt}:${derivedKey}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const [salt, key] = storedHash.split(":");
    if (!salt || !key) return false;
    const keyBuffer = Buffer.from(key, "hex");
    const derivedKeyBuffer = scryptSync(password, salt, KEY_LEN);
    return timingSafeEqual(keyBuffer, derivedKeyBuffer);
  } catch {
    return false;
  }
}

export function getDefaultAuthorPassword(): string {
  return process.env.DEFAULT_AUTHOR_PASSWORD || process.env.AUTHOR_PASSWORD || "author123";
}

export function verifyAuthorPassword(inputPassword: string, authorPasswordHash: string | null | undefined): boolean {
  if (typeof inputPassword !== "string" || !inputPassword) return false;

  // If author has set a custom password hash in the database, verify against it
  if (authorPasswordHash) {
    return verifyPassword(inputPassword, authorPasswordHash);
  }

  // Otherwise, fallback to the default author password from environment variables
  const defaultPassword = getDefaultAuthorPassword();
  return inputPassword === defaultPassword;
}
