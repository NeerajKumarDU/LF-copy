"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Scale } from "lucide-react";
import { PasswordInput } from "@/components/ui/PasswordInput";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
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
        body: JSON.stringify({ role: "admin", password }),
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

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
            Password
          </label>
          <PasswordInput
            value={password}
            onChange={setPassword}
            placeholder="Admin Password"
            autoFocus
            required
            className="py-2"
          />
        </div>

        {error && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded p-2">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-crimson-800 hover:bg-crimson-700 text-white text-sm font-bold py-2 rounded transition-colors disabled:opacity-50"
        >
          {loading ? "Checking…" : "Log In"}
        </button>
      </form>
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
