"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, Search, Menu, X, Scale, LogIn } from "lucide-react";
import type { Category } from "@/lib/posts";

interface NavItem { title: string; href: string }

const NAV_ITEMS: NavItem[] = [
  { title: "ARTICLES", href: "/category/articles" },
  { title: "DU LLB", href: "/category/du-llb" },
  { title: "AIBE", href: "/category/aibe" },
  { title: "BARE ACTS", href: "/category/bare-acts" },
  { title: "TRAINING", href: "/category/training" },
  { title: "LEGALTECH", href: "/category/legaltech" },
];

export function Navbar({ categories }: { categories: Category[] }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const router = useRouter();

  function toggleMobileMenu() {
    setMobileMenuOpen((open) => !open);
    setCategoriesOpen(false);
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery("");
    }
  };

  return (
    <div className="w-full bg-white border-b border-neutral-200 sticky top-0 z-50 font-sans shadow-sm">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 flex items-center justify-between h-[76px]">
        <Link href="/" className="flex items-center space-x-3 group flex-shrink-0">
          <div className="text-neutral-900 group-hover:text-blue-900 transition-colors">
            <Scale className="w-9 h-9 stroke-[2.2]" />
          </div>
          <div className="flex flex-col">
            <span className="font-serif font-black text-2xl tracking-wider text-neutral-950 leading-none">
              LAW&apos;S FORUM
            </span>
            <span className="text-[9.5px] font-bold tracking-widest text-neutral-700 uppercase font-sans mt-1">
              Mastering Law Simplifying Process
            </span>
          </div>
        </Link>

        <nav className="hidden xl:flex items-center space-x-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className="px-3.5 py-2 text-[13px] font-bold text-neutral-900 hover:text-blue-700 hover:bg-neutral-100 rounded tracking-tight transition-colors"
            >
              {item.title}
            </Link>
          ))}
        </nav>

        <div className="flex items-center space-x-2">
          <Link
            href="/author/login"
            className="hidden xl:inline-flex items-center gap-1.5 h-[46px] px-4 border border-neutral-300 hover:border-neutral-900 text-neutral-900 text-xs font-bold uppercase tracking-wider transition-colors"
          >
            <LogIn className="w-4 h-4" />
            <span>Log In</span>
          </Link>

          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="w-[46px] h-[46px] bg-[#2E489E] hover:bg-[#233a82] text-white flex items-center justify-center transition-colors rounded-none shadow-sm"
            aria-label="Search"
          >
            <Search className="w-5 h-5 stroke-[2.5]" />
          </button>

          <button
            onClick={toggleMobileMenu}
            className="xl:hidden p-2 text-neutral-900 hover:bg-neutral-100 rounded"
            aria-label="Toggle Mobile Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {searchOpen && (
        <div className="bg-neutral-900 py-3 px-4 sm:px-6 border-t border-neutral-800 animate-fadeIn">
          <div className="max-w-4xl mx-auto">
            <form onSubmit={handleSearch} className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Search articles, DU LLB notes, AIBE guides, Bare Acts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                className="flex-1 bg-neutral-800 text-white placeholder-neutral-400 text-sm px-4 py-2.5 rounded border border-neutral-700 focus:outline-none focus:border-blue-500"
              />
              <button type="submit" className="bg-[#2E489E] hover:bg-[#233a82] text-white text-xs font-bold px-6 py-2.5 uppercase tracking-wider transition-colors">
                Search
              </button>
              <button type="button" onClick={() => setSearchOpen(false)} className="text-neutral-400 hover:text-white p-2">
                <X className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>
      )}

      {mobileMenuOpen && (
        <div className="xl:hidden bg-white border-t border-neutral-200 px-4 py-4 space-y-2 shadow-lg max-h-[calc(100vh-76px)] overflow-y-auto">
          {NAV_ITEMS.map((item) => (
            <div key={item.title} className="border-b border-neutral-100 pb-1">
              <Link
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block text-sm font-bold text-neutral-900 hover:text-blue-700 py-2 px-1"
              >
                {item.title}
              </Link>
            </div>
          ))}

          {categories.length > 0 && (
            <div className="border-b border-neutral-100 pb-2">
              <button
                onClick={() => setCategoriesOpen(!categoriesOpen)}
                className="w-full flex items-center justify-between text-sm font-bold text-neutral-900 hover:text-blue-700 py-2 px-1"
                aria-expanded={categoriesOpen}
              >
                <span>ALL CATEGORIES</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${categoriesOpen ? "rotate-180" : ""}`} />
              </button>
              {categoriesOpen && (
                <div className="pl-3 space-y-1 mt-1 max-h-56 overflow-y-auto">
                  {categories.map((cat) => (
                    <Link
                      key={cat.id}
                      href={`/category/${cat.slug}`}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center justify-between gap-2 text-xs text-neutral-600 hover:text-blue-700 py-1"
                    >
                      <span className="flex items-center gap-1.5 min-w-0">
                        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                        <span className="truncate">{cat.name}</span>
                      </span>
                      <span className="flex-shrink-0 text-neutral-400 font-mono text-[10px]">{cat.postCount ?? 0}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          <Link
            href="/author/login"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-1.5 text-sm font-bold text-neutral-900 hover:text-blue-700 py-2 px-1"
          >
            <LogIn className="w-4 h-4" />
            <span>Log In</span>
          </Link>
        </div>
      )}
    </div>
  );
}
