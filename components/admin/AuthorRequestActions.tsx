"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X, Loader2 } from "lucide-react";

export function AuthorRequestActions({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<"approve" | "reject" | null>(null);
  const [error, setError] = useState("");
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");

  async function approve() {
    setBusy("approve");
    setError("");
    try {
      const res = await fetch(`/api/admin/author-requests/${id}/approve`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to approve");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to approve");
    } finally {
      setBusy(null);
    }
  }

  async function reject() {
    setBusy("reject");
    setError("");
    try {
      const res = await fetch(`/api/admin/author-requests/${id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to reject");
      setRejecting(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reject");
    } finally {
      setBusy(null);
    }
  }

  if (rejecting) {
    return (
      <div className="flex items-center gap-1.5 justify-end">
        <input
          type="text"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Reason (optional)"
          autoFocus
          className="border border-slate-300 rounded px-2 py-1 text-xs w-40 focus:outline-none focus:border-crimson-700"
        />
        <button
          type="button"
          disabled={busy !== null}
          onClick={reject}
          className="px-2 py-1 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded transition-colors disabled:opacity-50"
        >
          {busy === "reject" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Confirm"}
        </button>
        <button
          type="button"
          disabled={busy !== null}
          onClick={() => setRejecting(false)}
          className="px-2 py-1 text-xs font-semibold text-slate-600 hover:text-slate-900"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-1.5 justify-end">
        <button
          type="button"
          title={`Approve "${name}"`}
          disabled={busy !== null}
          onClick={approve}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded transition-colors disabled:opacity-50"
        >
          {busy === "approve" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
          <span>Approve</span>
        </button>
        <button
          type="button"
          title={`Reject "${name}"`}
          disabled={busy !== null}
          onClick={() => setRejecting(true)}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-red-50 hover:text-red-700 rounded transition-colors disabled:opacity-50"
        >
          <X className="w-3.5 h-3.5" />
          <span>Reject</span>
        </button>
      </div>
      {error && <span className="text-[11px] text-red-600">{error}</span>}
    </div>
  );
}
