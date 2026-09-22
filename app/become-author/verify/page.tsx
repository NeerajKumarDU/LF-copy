import Link from "next/link";
import { Scale, CheckCircle2, XCircle } from "lucide-react";
import { verifyAuthorRequestByToken } from "@/lib/author-requests";

export const dynamic = "force-dynamic";
export const metadata = { title: "Verify Email" };

export default async function VerifyAuthorRequestPage({ searchParams }: { searchParams: { token?: string } }) {
  const token = searchParams.token;
  const result = token ? await verifyAuthorRequestByToken(token) : { ok: false as const, reason: "invalid" as const };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 py-10">
      <div className="w-full max-w-sm bg-white rounded-md p-8 shadow-xl space-y-5 text-center">
        <div className="flex items-center justify-center gap-2 mb-1">
          <div className="w-8 h-8 rounded bg-crimson-800 text-white flex items-center justify-center">
            <Scale className="w-5 h-5" />
          </div>
          <span className="font-serif text-lg font-extrabold text-slate-900">LawsForum</span>
        </div>

        {result.ok ? (
          <>
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
            <h1 className="font-serif text-lg font-bold text-slate-900">Email verified</h1>
            <p className="text-sm text-slate-600">
              Your author request is now in front of our team. We&apos;ll email you once it&apos;s reviewed.
            </p>
          </>
        ) : (
          <>
            <XCircle className="w-10 h-10 text-red-600 mx-auto" />
            <h1 className="font-serif text-lg font-bold text-slate-900">
              {result.reason === "expired" ? "Link expired" : "Invalid link"}
            </h1>
            <p className="text-sm text-slate-600">
              {result.reason === "expired"
                ? "This verification link has expired. Please submit a new request."
                : "This verification link isn't valid. Please submit a new request."}
            </p>
            <Link href="/become-author" className="inline-block text-crimson-800 font-semibold text-sm hover:underline">
              Request author access
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
