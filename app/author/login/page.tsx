import { Suspense } from "react";
import { redirect } from "next/navigation";
import { PenLine } from "lucide-react";
import { AuthorLoginForm } from "@/components/author-requests/AuthorLoginForm";
import { getCurrentSessionUser } from "@/lib/adminAuth";

export const metadata = { title: "Author Login" };

export default async function AuthorLoginPage({
  searchParams,
}: {
  searchParams: { next?: string };
}) {
  // Already signed in as an author - skip the form. Only same-site paths are
  // honoured for `next` so this can't be used as an open redirect.
  const user = await getCurrentSessionUser();
  if (user?.role === "author") {
    const next = searchParams.next;
    redirect(next && next.startsWith("/") && !next.startsWith("//") ? next : "/admin");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-sm bg-white rounded-md p-8 shadow-xl space-y-5">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded bg-crimson-800 text-white flex items-center justify-center">
            <PenLine className="w-4 h-4" />
          </div>
          <span className="font-serif text-lg font-extrabold text-slate-900">LawsForum Authors</span>
        </div>

        <Suspense fallback={null}>
          <AuthorLoginForm />
        </Suspense>
      </div>
    </div>
  );
}
