import Link from "next/link";
import { PenLine } from "lucide-react";

export function AuthorAccessWidget() {
  return (
    <div className="bg-white p-5 rounded-md border border-slate-200 shadow-sm">
      <div className="flex items-center space-x-2 text-slate-700 mb-2">
        <PenLine className="w-4 h-4 text-crimson-800" />
        <span className="text-xs font-bold uppercase tracking-wider">Write For Us</span>
      </div>
      <p className="text-xs text-slate-600 leading-relaxed">
        We run case notes, exam digests and opinion pieces from students and practitioners. Got something worth
        publishing? Send it over.
      </p>
      <div className="flex items-center gap-3 mt-3 text-xs font-semibold">
        <Link href="/become-author" className="text-crimson-800 hover:underline">
          Pitch an article
        </Link>
        <span className="text-slate-300">·</span>
        <Link href="/author/login" className="text-slate-600 hover:text-slate-900 hover:underline">
          Already write for us? Log in
        </Link>
      </div>
    </div>
  );
}
