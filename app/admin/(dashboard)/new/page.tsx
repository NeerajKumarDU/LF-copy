import { getCategories } from "@/lib/posts";
import { getAuthorsList } from "@/lib/admin-posts";
import { getCurrentSessionUser } from "@/lib/adminAuth";
import { NewArticleForm } from "@/components/admin/NewArticleForm";

export const dynamic = "force-dynamic";

export default async function NewArticlePage() {
  const [categories, authors, user] = await Promise.all([
    getCategories(),
    getAuthorsList(),
    getCurrentSessionUser(),
  ]);

  return (
    <NewArticleForm
      categories={categories}
      authors={authors}
      currentUser={user ?? undefined}
    />
  );
}
