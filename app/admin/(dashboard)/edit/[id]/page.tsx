import { notFound, redirect } from "next/navigation";
import { getCategories } from "@/lib/posts";
import { getAuthorsList, getAdminPostById } from "@/lib/admin-posts";
import { getCurrentSessionUser } from "@/lib/adminAuth";
import { ArticleForm } from "@/components/admin/ArticleForm";

export const dynamic = "force-dynamic";

export default async function EditArticlePage({
  params,
}: {
  params: { id: string };
}) {
  const [post, categories, authors, user] = await Promise.all([
    getAdminPostById(params.id),
    getCategories(),
    getAuthorsList(),
    getCurrentSessionUser(),
  ]);

  if (!post) {
    notFound();
  }

  // If logged-in user is an author, prevent them from accessing other authors' posts
  if (user?.role === "author" && post.authorId !== user.authorId) {
    redirect("/admin");
  }

  return (
    <ArticleForm
      initialData={post}
      categories={categories}
      authors={authors}
      currentUser={user ?? undefined}
    />
  );
}
