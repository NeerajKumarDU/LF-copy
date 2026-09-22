"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Scale, UserPen, Shield } from "lucide-react";

function LoginForm() {
  const [role, setRole] = useState<"admin" | "author">("admin");
  const [authorName, setAuthorName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const params = useSearchParams();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const payload =
      role === "author"
        ? { role: "author", authorName: authorName.trim(), password }
        : { role: "admin", password };

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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
    <div className="w-full max-w-sm bg-white rounded-md p-8 shadow-xl space-y-5">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-8 h-8 rounded bg-crimson-800 text-white flex items-center justify-center">
          <Scale className="w-5 h-5" />
        </div>
        <span className="font-serif text-lg font-extrabold text-slate-900">LawsForum</span>
      </div>

      {/* Role Switcher Tabs */}
      <div className="flex border border-slate-200 rounded p-1 bg-slate-100/70 text-xs font-semibold">
        <button
          type="button"
          onClick={() => {
            setRole("admin");
            setError("");
          }}
          className={`flex-1 py-1.5 rounded flex items-center justify-center gap-1.5 transition-all ${
            role === "admin"
              ? "bg-white text-slate-900 shadow-sm font-bold"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <Shield className="w-3.5 h-3.5 text-crimson-800" />
          <span>Admin</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setRole("author");
            setError("");
          }}
          className={`flex-1 py-1.5 rounded flex items-center justify-center gap-1.5 transition-all ${
            role === "author"
              ? "bg-white text-slate-900 shadow-sm font-bold"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <UserPen className="w-3.5 h-3.5 text-crimson-800" />
          <span>Author</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {role === "author" && (
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
        )}

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={role === "admin" ? "Admin Password" : "Password"}
            autoFocus={role === "admin"}
            required
            className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-crimson-700"
          />
        </div>

        {role === "author" && (
          <p className="text-[11px] text-slate-400">
            First-time login? Use your organization&apos;s default author password. You can change it after logging in.
          </p>
        )}

        {error && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded p-2">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-crimson-800 hover:bg-crimson-700 text-white text-sm font-bold py-2 rounded transition-colors disabled:opacity-50"
        >
          {loading ? "Checking…" : role === "author" ? "Log In as Author" : "Log In as Admin"}
        </button>
      </form>

      <p className="text-center text-xs text-slate-400">
        Want to write for us?{" "}
        <Link href="/become-author" className="text-crimson-800 font-semibold hover:underline">
          Request author access
        </Link>
      </p>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
