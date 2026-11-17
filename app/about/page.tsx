import Link from "next/link";
import type { Metadata } from "next";
import { ChevronRight, Scale } from "lucide-react";

export const metadata: Metadata = {
  title: "About",
  description: "About LawsForum - Indian legal education portal with case law digests, exam preparation, and law notes.",
};

export default function AboutPage() {
  return (
    <div className="w-full pb-16 font-sans">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
        <nav className="flex items-center space-x-2 text-xs text-slate-500 py-3 border-b border-slate-200">
          <Link href="/" className="hover:text-crimson-800 transition-colors">Home</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-700 font-bold">About</span>
        </nav>

        <div className="my-6 p-6 sm:p-8 bg-slate-900 text-white rounded-md border border-slate-800 shadow-md">
          <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Scale className="w-4 h-4" />
            <span>About Us</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-extrabold">About LawsForum</h1>
        </div>

        <div className="bg-white p-6 sm:p-8 rounded-md border border-slate-200 shadow-sm space-y-5 font-serif text-slate-700 leading-relaxed">
          <p>
            LawsForum is an Indian legal education portal offering case law digests, bare acts, law notes, and
            judiciary exam preparation resources for law students, academicians, and legal practitioners.
          </p>

          <h2 className="font-sans text-sm font-bold uppercase tracking-wider text-slate-900 pt-2">What we publish</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Case notes and summaries of significant judgments</li>
            <li>Bare acts and statutory material</li>
            <li>Subject-wise law notes and articles</li>
            <li>Guides for judiciary and other law exams</li>
          </ul>

          <h2 className="font-sans text-sm font-bold uppercase tracking-wider text-slate-900 pt-2">Write for us</h2>
          <p>
            Students, academics, and practitioners can contribute articles.{" "}
            <Link href="/become-author" className="text-crimson-800 font-semibold hover:underline">
              Request author access
            </Link>{" "}
            to get started.
          </p>

          <h2 className="font-sans text-sm font-bold uppercase tracking-wider text-slate-900 pt-2">Disclaimer</h2>
          <p className="text-sm text-slate-600">
            The materials and articles on this platform are intended for academic and informational purposes only.
            They do not constitute formal legal advice.
          </p>

          <p className="text-sm">
            Questions or feedback?{" "}
            <Link href="/contact" className="text-crimson-800 font-semibold hover:underline">Contact us</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
