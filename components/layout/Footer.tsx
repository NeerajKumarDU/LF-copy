import Link from "next/link";
import { Scale, ShieldAlert, Facebook, Instagram, Linkedin, Youtube, Mail, PhoneCall } from "lucide-react";
import type { Category } from "@/lib/posts";

export function Footer({ categories }: { categories: Category[] }) {
  // Full list is too long for a footer column; show the 5 most active ones.
  // getCategories() orders alphabetically for the sidebar/hamburger use case,
  // so re-sort by postCount here rather than change that default.
  const topCategories = [...categories].sort((a, b) => (b.postCount ?? 0) - (a.postCount ?? 0)).slice(0, 5);
  return (
    <footer className="w-full bg-slate-950 text-slate-400 font-sans border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded bg-crimson-800 text-white flex items-center justify-center">
                <Scale className="w-5 h-5" />
              </div>
              <span className="font-serif text-2xl font-extrabold text-white tracking-tight">LAWSFORUM</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-serif">
              Comprehensive legal education, authoritative case law digests, and exam preparation resources for law students, academicians, and legal practitioners across India.
            </p>
          </div>

          <div>
            <h4 className="font-serif text-sm font-bold uppercase tracking-wider text-white border-b border-slate-800 pb-2 mb-3">
              Categories
            </h4>
            <ul className="space-y-2 text-xs">
              {topCategories.map((c) => (
                <li key={c.slug}>
                  <Link href={`/category/${c.slug}`} className="hover:text-amber-400 transition-colors">
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-serif text-sm font-bold uppercase tracking-wider text-white border-b border-slate-800 pb-2 mb-3 flex items-center gap-1">
              <ShieldAlert className="w-4 h-4 text-amber-500" />
              <span>Disclaimer</span>
            </h4>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              The materials and articles on this platform are intended for academic and informational purposes only. They do not constitute formal legal advice.
            </p>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} LawsForum. All rights reserved.</p>
          <div className="flex items-center space-x-4">
            <span className="hover:text-slate-400">Privacy Policy</span>
            <span>•</span>
            <span className="hover:text-slate-400">Terms of Service</span>
          </div>
          {/* moved from TopBar (removed) — keeps these links site-wide instead of home-sidebar-only */}
          <div className="flex items-center space-x-3 text-slate-500">
            <a href="https://facebook.com" target="_blank" rel="noreferrer" className="hover:text-blue-500 transition-colors" aria-label="Facebook">
              <Facebook className="w-3.5 h-3.5" />
            </a>
            <a href="https://twitter.com" target="_blank" rel="noreferrer" className="hover:text-slate-300 transition-colors" aria-label="X (Twitter)">
              <span className="font-bold text-xs">𝕏</span>
            </a>
            <a href="https://instagram.com" target="_blank" rel="noreferrer" className="hover:text-pink-500 transition-colors" aria-label="Instagram">
              <Instagram className="w-3.5 h-3.5" />
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="hover:text-blue-400 transition-colors" aria-label="LinkedIn">
              <Linkedin className="w-3.5 h-3.5" />
            </a>
            <a href="https://youtube.com" target="_blank" rel="noreferrer" className="hover:text-red-600 transition-colors" aria-label="YouTube">
              <Youtube className="w-3.5 h-3.5" />
            </a>
            <a href="mailto:info@lawsforum.com" className="hover:text-amber-400 transition-colors" aria-label="Email">
              <Mail className="w-3.5 h-3.5" />
            </a>
            <a href="https://wa.me" target="_blank" rel="noreferrer" className="hover:text-emerald-500 transition-colors" aria-label="WhatsApp">
              <PhoneCall className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
