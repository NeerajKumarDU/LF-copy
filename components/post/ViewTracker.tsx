"use client";

import { useEffect } from "react";

const STORAGE_KEY = "lf_viewed_posts";
// Cap so the array doesn't grow forever for a heavy reader - FIFO drop of the oldest ids once full.
const MAX_TRACKED = 1000;

// Fires once per postId per browser. Writes to localStorage BEFORE the fetch
// resolves (not after) so React StrictMode's dev-only double-effect invoke
// sees the id already recorded on its second pass and skips the double count.
export function ViewTracker({ postId }: { postId: string }) {
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const viewed: string[] = raw ? JSON.parse(raw) : [];
      if (viewed.includes(postId)) return;

      const next = [...viewed, postId].slice(-MAX_TRACKED);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));

      fetch(`/api/posts/${postId}/view`, { method: "POST" }).catch(() => {});
    } catch {
      // localStorage unavailable (private mode, blocked) - skip tracking rather than error.
    }
  }, [postId]);

  return null;
}
