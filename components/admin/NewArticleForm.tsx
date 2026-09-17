"use client";

import { ArticleForm } from "./ArticleForm";
import type { Category } from "@/lib/posts";
import type { AdminAuthor } from "@/lib/admin-posts";
import type { SessionUser } from "@/lib/adminAuth";

export function NewArticleForm({
  categories,
  authors,
  currentUser,
}: {
  categories: Category[];
  authors: AdminAuthor[];
  currentUser?: SessionUser;
}) {
  return (
    <ArticleForm
      categories={categories}
      authors={authors}
      currentUser={currentUser}
    />
  );
}
