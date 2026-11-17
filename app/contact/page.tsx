import Link from "next/link";
import type { Metadata } from "next";
import { ChevronRight, Mail, PenLine } from "lucide-react";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with the LawsForum team.",
};

export default function ContactPage() {
  return (
    <div className="w-full pb-16 font-sans">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
        <nav className="flex items-center space-x-2 text-xs text-slate-500 py-3 border-b border-slate-200">
          <Link href="/" className="hover:text-crimson-800 transition-colors">Home</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-700 font-bold">Contact</span>
        </nav>

        <div className="my-6 p-6 sm:p-8 bg-slate-900 text-white rounded-md border border-slate-800 shadow-md">
          <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Mail className="w-4 h-4" />
            <span>Contact</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-extrabold">Get in touch</h1>
          <p className="text-slate-300 text-sm sm:text-base mt-3 font-serif">
            For corrections, feedback, or general questions, write to us.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-md border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm mb-2">
              <Mail className="w-4 h-4 text-crimson-800" />
              <span>Email</span>
            </div>
            <a href="mailto:info@lawsforum.com" className="text-crimson-800 font-semibold hover:underline text-sm">
              info@lawsforum.com
            </a>
          </div>

          <div className="bg-white p-6 rounded-md border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm mb-2">
              <PenLine className="w-4 h-4 text-crimson-800" />
              <span>Write for LawsForum</span>
            </div>
            <p className="text-sm text-slate-600">
              Want to contribute?{" "}
              <Link href="/become-author" className="text-crimson-800 font-semibold hover:underline">
                Request author access
              </Link>
              .
            </p>
          </div>
        </div>

        <p className="mt-6 text-xs text-slate-500">
          LawsForum does not provide legal advice and cannot respond to requests for advice on individual cases.
        </p>
      </div>
    </div>
  );
}
