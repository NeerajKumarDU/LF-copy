// Singleton pg Pool. Cached on globalThis in dev so Next.js HMR doesn't open a
// fresh pool (and exhaust Postgres connections) on every module reload.
import { Pool } from "pg";

declare global {
  // eslint-disable-next-line no-var
  var __pgPool: Pool | undefined;
}

function createPool() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set (see lawsforum-web/.env.local)");
  }
  const isLocal = /localhost|127\.0\.0\.1/.test(connectionString);
  const pool = new Pool({
    connectionString,
    // `next build` runs static generation across several worker processes, each
    // with its own Pool instance (globalThis caching only helps within one process).
    // Keep per-pool max low so N workers together stay well under the DB's
    // max_connections — a single worker generating one page at a time never
    // needs more than a couple of connections anyway.
    max: 4,
    idleTimeoutMillis: 10_000,
    // Hosted providers (Neon, Supabase, etc.) sit behind TLS; local dev Postgres
    // doesn't. Skip strict CA checks for the hosted case.
    ssl: isLocal ? undefined : { rejectUnauthorized: false },
    // Neon (unlike stock Postgres/local dev) hands new connections an EMPTY
    // search_path by default, so unqualified table names 404 even though the
    // tables exist. Set via the Postgres startup 'options' param, not a
    // post-connect client.query() — the latter races any query a caller fires
    // on that same client immediately after it's handed out of the pool
    // (surfaces as "client.query() when already executing" + corrupted
    // results once enough requests run their queries concurrently, e.g. a
    // page's Promise.all).
    options: "-c search_path=public",
  });
  return pool;
}

export const pool = globalThis.__pgPool ?? createPool();

if (process.env.NODE_ENV !== "production") {
  globalThis.__pgPool = pool;
}

export function query<T extends Record<string, unknown> = Record<string, unknown>>(
  text: string,
  params?: unknown[]
) {
  return pool.query<T>(text, params);
}
