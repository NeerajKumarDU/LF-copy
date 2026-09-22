"use client";

import { useState } from "react";
import { Loader2, MailCheck } from "lucide-react";

export function BecomeAuthorForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/author-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Something went wrong. Please try again.");
      setSubmittedEmail(email.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submittedEmail) {
    return (
      <div className="text-center py-6">
        <MailCheck className="w-10 h-10 text-emerald-600 mx-auto mb-3" />
        <h2 className="font-serif text-lg font-bold text-slate-900">Check your inbox</h2>
        <p className="text-sm text-slate-600 mt-2">
          We sent a verification link to <span className="font-semibold text-slate-900">{submittedEmail}</span>. Click it to
          move your request into our review queue.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Full name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-crimson-700"
        />
      </div>

      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-crimson-700"
        />
      </div>

      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
          Why do you want to write for us? (optional)
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          placeholder="A line or two about your background and what you'd like to write about"
          className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-crimson-700"
        />
      </div>

      {error && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded p-2">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="w-full inline-flex items-center justify-center gap-2 bg-crimson-800 hover:bg-crimson-700 text-white text-sm font-bold py-2.5 rounded transition-colors disabled:opacity-50"
      >
        {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
        {submitting ? "Submitting…" : "Request author access"}
      </button>
    </form>
  );
}
