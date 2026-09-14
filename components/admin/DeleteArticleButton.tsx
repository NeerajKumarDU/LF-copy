"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, AlertTriangle, Loader2 } from "lucide-react";

interface DeleteArticleButtonProps {
  id: string;
  title: string;
  variant?: "icon" | "button";
  onSuccess?: () => void;
  className?: string;
}

export function DeleteArticleButton({
  id,
  title,
  variant = "icon",
  onSuccess,
  className = "",
}: DeleteArticleButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    setDeleting(true);
    setError("");

    try {
      const res = await fetch(`/api/admin/posts/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || "Failed to delete article");
      }

      setIsOpen(false);
      if (onSuccess) {
        onSuccess();
      } else {
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete article");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      {variant === "icon" ? (
        <button
          type="button"
          onClick={() => {
            setError("");
            setIsOpen(true);
          }}
          title={`Delete "${title}"`}
          aria-label={`Delete "${title}"`}
          className={`p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors ${className}`}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => {
            setError("");
            setIsOpen(true);
          }}
          className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded transition-colors ${className}`}
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Delete Article</span>
        </button>
      )}

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150 whitespace-normal text-left"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-dialog-title"
        >
          <div
            className="bg-white rounded-lg border border-slate-200 shadow-2xl max-w-md w-full p-6 text-left whitespace-normal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 id="delete-dialog-title" className="text-base font-bold text-slate-900 break-words">
                  Delete Article
                </h2>
                <p className="text-sm text-slate-600 mt-1.5 whitespace-normal leading-relaxed break-words">
                  Are you sure you want to delete{" "}
                  <span className="font-semibold text-slate-900">
                    &ldquo;{title}&rdquo;
                  </span>
                  ? This will permanently delete the article and all associated comments. This action cannot be undone.
                </p>
              </div>
            </div>

            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                {error}
              </div>
            )}

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 border border-slate-300 hover:border-slate-400 rounded transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDelete}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded transition-colors disabled:opacity-50"
              >
                {deleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {deleting ? "Deleting…" : "Delete Article"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
