"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  UploadCloud,
  CheckCircle2,
  XCircle,
  Loader2,
  ArrowLeft,
  ExternalLink,
} from "lucide-react";
import { slugify } from "@/lib/slugify";
import { RichTextEditor } from "./RichTextEditor";
import { CategoryPicker, type SelectedCategory } from "./CategoryPicker";
import { DeleteArticleButton } from "./DeleteArticleButton";
import type { Category } from "@/lib/posts";
import type { AdminAuthor } from "@/lib/admin-posts";

type SlugStatus = "idle" | "checking" | "available" | "taken";

export interface ArticleFormProps {
  initialData?: {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    status: "draft" | "published" | "private";
    authorName: string;
    categories: SelectedCategory[];
    featuredMediaId?: string | null;
    coverImage?: string | null;
  };
  categories: Category[];
  authors: AdminAuthor[];
}

export function ArticleForm({ initialData, categories, authors }: ArticleFormProps) {
  const router = useRouter();
  const isEdit = Boolean(initialData);

  const [title, setTitle] = useState(initialData?.title ?? "");
  const [slug, setSlug] = useState(initialData?.slug ?? "");
  const [slugEditedManually, setSlugEditedManually] = useState(Boolean(initialData));
  const [slugStatus, setSlugStatus] = useState<SlugStatus>(initialData ? "available" : "idle");
  const [excerpt, setExcerpt] = useState(initialData?.excerpt ?? "");
  const [content, setContent] = useState(initialData?.content ?? "");
  const [selectedCategories, setSelectedCategories] = useState<SelectedCategory[]>(
    initialData?.categories && initialData.categories.length > 0
      ? initialData.categories
      : categories[0]
      ? [{ name: categories[0].name, isPrimary: true }]
      : []
  );
  const [authorName, setAuthorName] = useState(
    initialData?.authorName || (authors[0]?.name ?? "")
  );
  const [status, setStatus] = useState<"draft" | "published" | "private">(
    initialData?.status ?? "draft"
  );

  const [coverPreview, setCoverPreview] = useState<string | null>(initialData?.coverImage ?? null);
  const [coverMediaId, setCoverMediaId] = useState<string | null>(initialData?.featuredMediaId ?? null);
  const [coverUploading, setCoverUploading] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const slugCheckSeq = useRef(0);
  useEffect(() => {
    if (!slug) {
      setSlugStatus("idle");
      return;
    }
    if (initialData && slug === initialData.slug) {
      setSlugStatus("available");
      return;
    }

    setSlugStatus("checking");
    const seq = ++slugCheckSeq.current;
    const timer = setTimeout(async () => {
      try {
        const excludeParam = initialData ? `&excludeId=${encodeURIComponent(initialData.id)}` : "";
        const res = await fetch(`/api/admin/slug-check?slug=${encodeURIComponent(slug)}${excludeParam}`);
        const data = await res.json();
        if (seq === slugCheckSeq.current) setSlugStatus(data.taken ? "taken" : "available");
      } catch {
        if (seq === slugCheckSeq.current) setSlugStatus("idle");
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [slug, initialData]);

  function handleTitleChange(value: string) {
    setTitle(value);
    if (!slugEditedManually) setSlug(slugify(value));
  }

  function handleSlugChange(value: string) {
    setSlugEditedManually(true);
    setSlug(slugify(value));
  }

  async function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverPreview(URL.createObjectURL(file));
    setCoverUploading(true);
    setFormError("");
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setCoverMediaId(data.mediaId);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Cover image upload failed");
      setCoverPreview(initialData?.coverImage ?? null);
      setCoverMediaId(initialData?.featuredMediaId ?? null);
    } finally {
      setCoverUploading(false);
    }
  }

  function handleRemoveCover() {
    setCoverPreview(null);
    setCoverMediaId(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");

    if (!title.trim()) return setFormError("Title is required.");
    if (!slug.trim()) return setFormError("Slug is required.");
    if (slugStatus === "taken") return setFormError("That slug is already in use - change it before saving.");
    if (!content.trim()) return setFormError("Article content can't be empty.");
    if (selectedCategories.length === 0) return setFormError("Add at least one category.");
    if (!authorName.trim()) return setFormError("Author is required.");

    setSubmitting(true);
    try {
      const url = isEdit
        ? `/api/admin/posts/${encodeURIComponent(initialData!.id)}`
        : "/api/admin/posts";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: initialData?.id,
          title,
          slug,
          excerpt,
          content,
          status,
          authorName,
          categories: selectedCategories,
          featuredMediaId: coverMediaId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save article");

      router.push("/admin");
      router.refresh();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to save article");
    } finally {
      setSubmitting(false);
    }
  }

  // Determine live preview link if published
  const primaryCategory = selectedCategories.find((c) => c.isPrimary);
  const matchedCategory = primaryCategory
    ? categories.find((c) => c.name.toLowerCase() === primaryCategory.name.toLowerCase())
    : null;
  const primaryCategorySlug = matchedCategory?.slug ?? (primaryCategory ? slugify(primaryCategory.name) : "");
  const publicUrl = primaryCategorySlug && slug ? `/${primaryCategorySlug}/${slug}` : null;

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <div className="flex items-center gap-3">
          {isEdit && (
            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors py-1 px-2 rounded hover:bg-slate-200/60"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </Link>
          )}
          <h1 className="font-serif text-xl font-bold text-slate-900">
            {isEdit ? "Edit Article" : "New Article"}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {isEdit && initialData?.status === "published" && publicUrl && (
            <Link
              href={publicUrl}
              target="_blank"
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-crimson-800 bg-white border border-slate-300 hover:border-slate-400 px-3 py-1.5 rounded transition-colors"
            >
              <span>View live</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          )}
          {isEdit && initialData && (
            <DeleteArticleButton
              id={initialData.id}
              title={initialData.title}
              variant="button"
              onSuccess={() => {
                router.push("/admin");
                router.refresh();
              }}
            />
          )}
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
          Title
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          required
          className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-crimson-700"
        />
      </div>

      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
          Slug
        </label>
        <div className="relative">
          <input
            type="text"
            value={slug}
            onChange={(e) => handleSlugChange(e.target.value)}
            required
            className="w-full border border-slate-300 rounded px-3 py-2 pr-9 text-sm font-mono focus:outline-none focus:border-crimson-700"
          />
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2">
            {slugStatus === "checking" && <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />}
            {slugStatus === "available" && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
            {slugStatus === "taken" && <XCircle className="w-4 h-4 text-red-600" />}
          </span>
        </div>
        {slugStatus === "taken" && (
          <p className="text-xs text-red-600 mt-1">Already used by another article.</p>
        )}
        {publicUrl && (
          <p className="text-xs text-slate-400 mt-1 font-mono">
            {publicUrl}
          </p>
        )}
      </div>

      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
          Categories
        </label>
        <CategoryPicker
          availableCategories={categories}
          selected={selectedCategories}
          onChange={setSelectedCategories}
        />
      </div>

      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
          Author
        </label>
        <input
          type="text"
          list="author-suggestions"
          value={authorName}
          onChange={(e) => setAuthorName(e.target.value)}
          placeholder="Type or pick an author"
          required
          className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-crimson-700"
        />
        <datalist id="author-suggestions">
          {authors.map((a) => (
            <option key={a.id} value={a.name} />
          ))}
        </datalist>
      </div>

      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
          Excerpt (optional)
        </label>
        <textarea
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          rows={2}
          placeholder="Short summary shown on cards and in search results"
          className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-crimson-700"
        />
      </div>

      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
          Cover Image
        </label>
        <div className="flex items-center gap-4">
          <div className="relative w-40 h-28 rounded border border-dashed border-slate-300 bg-slate-50 overflow-hidden flex items-center justify-center flex-shrink-0">
            {coverPreview ? (
              <Image
                src={coverPreview}
                alt="Cover preview"
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              <UploadCloud className="w-6 h-6 text-slate-300" />
            )}
            {coverUploading && (
              <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                <Loader2 className="w-5 h-5 text-crimson-800 animate-spin" />
              </div>
            )}
          </div>
          <div className="flex flex-col gap-1.5 items-start">
            <label className="text-xs font-bold text-crimson-800 hover:underline cursor-pointer">
              {coverPreview ? "Replace image" : "Choose image"}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleCoverChange}
                className="hidden"
              />
            </label>
            {coverPreview && (
              <button
                type="button"
                onClick={handleRemoveCover}
                className="text-xs font-semibold text-slate-500 hover:text-red-600 transition-colors"
              >
                Remove image
              </button>
            )}
          </div>
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
          Content
        </label>
        <RichTextEditor content={content} onChange={setContent} />
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
        <div className="flex items-center gap-4 text-sm">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="radio"
              name="post-status"
              checked={status === "draft"}
              onChange={() => setStatus("draft")}
            />
            <span>Draft</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="radio"
              name="post-status"
              checked={status === "published"}
              onChange={() => setStatus("published")}
            />
            <span>Published</span>
          </label>
          {isEdit && initialData?.status === "private" && (
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="post-status"
                checked={status === "private"}
                onChange={() => setStatus("private")}
              />
              <span>Private</span>
            </label>
          )}
        </div>

        <div className="flex items-center gap-3">
          {formError && <span className="text-xs text-red-600">{formError}</span>}
          <button
            type="submit"
            disabled={submitting || coverUploading || slugStatus === "checking"}
            className="bg-crimson-800 hover:bg-crimson-700 text-white text-sm font-bold px-6 py-2.5 rounded transition-colors disabled:opacity-50"
          >
            {submitting
              ? "Saving…"
              : isEdit
              ? "Update Article"
              : status === "published"
              ? "Publish"
              : "Save Draft"}
          </button>
        </div>
      </div>
    </form>
  );
}
