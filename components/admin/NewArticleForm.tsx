"use client";

import { ArticleForm } from "./ArticleForm";
import type { Category } from "@/lib/posts";
import type { AdminAuthor } from "@/lib/admin-posts";

export function NewArticleForm({
  categories,
  authors,
}: {
  categories: Category[];
  authors: AdminAuthor[];
}) {
  return <ArticleForm categories={categories} authors={authors} />;
}

