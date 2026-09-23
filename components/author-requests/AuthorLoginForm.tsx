"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export function AuthorLoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [authorName, setAuthorName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "author", authorName: authorName.trim(), password }),
      });
      const data = await res.json().catch(() => ({}));
      setLoading(false);

      if (res.ok) {
        router.push(params.get("next") || "/admin");
        router.refresh();
      } else {
        setError(data.error || "Login failed. Please check your credentials.");
      }
    } catch {
      setLoading(false);
      setError("Network error. Please try again.");
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
            Author Name
          </label>
          <input
            type="text"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            placeholder="e.g. John Doe"
            autoFocus
            required
            className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-crimson-700"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-crimson-700"
          />
        </div>

        <p className="text-[11px] text-slate-400">
          First time in? Use the password we sent you when your request was approved - you can change it once you&apos;re in.
        </p>

        {error && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded p-2">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-crimson-800 hover:bg-crimson-700 text-white text-sm font-bold py-2 rounded transition-colors disabled:opacity-50"
        >
          {loading ? "Checking…" : "Log In"}
        </button>
      </form>

      <p className="text-center text-xs text-slate-400 mt-5">
        Not registered yet?{" "}
        <Link href="/become-author" className="text-crimson-800 font-semibold hover:underline">
          Request author access
        </Link>
      </p>
    </>
  );
}
