import { Suspense } from "react";
import { PenLine } from "lucide-react";
import { AuthorLoginForm } from "@/components/author-requests/AuthorLoginForm";

export const metadata = { title: "Author Login" };

export default function AuthorLoginPage() {
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
