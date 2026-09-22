import Link from "next/link";
import { Scale, PenLine } from "lucide-react";
import { BecomeAuthorForm } from "@/components/author-requests/BecomeAuthorForm";

export const metadata = { title: "Become an Author" };

export default function BecomeAuthorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 py-10">
      <div className="w-full max-w-sm bg-white rounded-md p-8 shadow-xl space-y-5">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded bg-crimson-800 text-white flex items-center justify-center">
            <Scale className="w-5 h-5" />
          </div>
          <span className="font-serif text-lg font-extrabold text-slate-900">LawsForum</span>
        </div>

        <div className="flex items-center gap-2 text-slate-700">
          <PenLine className="w-4 h-4 text-crimson-800" />
          <h1 className="font-serif text-base font-bold">Request author access</h1>
        </div>

        <BecomeAuthorForm />

        <p className="text-center text-xs text-slate-400">
          Already have an account?{" "}
          <Link href="/admin/login" className="text-crimson-800 font-semibold hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
