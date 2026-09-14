import { notFound } from "next/navigation";
import { getCategories } from "@/lib/posts";
import { getAuthorsList, getAdminPostById } from "@/lib/admin-posts";
import { ArticleForm } from "@/components/admin/ArticleForm";

export const dynamic = "force-dynamic";

export default async function EditArticlePage({
  params,
}: {
  params: { id: string };
}) {
  const [post, categories, authors] = await Promise.all([
    getAdminPostById(params.id),
    getCategories(),
    getAuthorsList(),
  ]);

  if (!post) {
    notFound();
  }

  return <ArticleForm initialData={post} categories={categories} authors={authors} />;
}
