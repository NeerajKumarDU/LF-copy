import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { getCategories } from "@/lib/posts";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: {
    template: "%s | LawsForum",
    default: "LawsForum | Legal Digest & Case Law",
  },
  description: "Comprehensive Indian legal education portal, case law digests, judiciary exam preparation, and law notes for students and practitioners.",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico" },
    ],
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const categories = await getCategories();
  return (
    <html lang="en" className="scroll-smooth">
      <body className="min-h-screen flex flex-col justify-between bg-editorial-bg font-sans">
        <div>
          <Navbar categories={categories} />
          <main className="min-h-[calc(100vh-320px)]">{children}</main>
        </div>
        <Footer categories={categories} />
      </body>
    </html>
  );
}
