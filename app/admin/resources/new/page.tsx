 import Link from "next/link";
import { Suspense } from "react";
import { ArrowLeft, FilePlus2, Loader2 } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ResourceForm from "@/components/admin/ResourceForm";

export default function NewResourcePage() {
  return (
    <>
      <Header />

      <main className="min-h-screen bg-slate-50">
        <section className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
            <Link
              href="/admin/resources"
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-emerald-600"
            >
              <ArrowLeft size={16} />
              Back to resources
            </Link>

            <div className="mt-6 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <FilePlus2 size={23} />
              </div>

              <div>
                <h1 className="text-3xl font-black text-slate-900">
                  Add Resource
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                  Create a new educational resource.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
          <Suspense fallback={<ResourcePageLoading />}>
            <NewResourceContent />
          </Suspense>
        </section>
      </main>

      <Footer />
    </>
  );
}

async function NewResourceContent() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <AccessDenied />;
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || profile?.role !== "admin") {
    return <AccessDenied />;
  }

  const { data: categories, error } = await supabase
    .from("categories")
    .select("id, name")
    .order("sort_order", { ascending: true });

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          <p className="font-bold">
            Unable to load categories
          </p>

          <p className="mt-1">
            {error.message}
          </p>
        </div>
      ) : (
        <ResourceForm categories={categories ?? []} />
      )}
    </div>
  );
}

function ResourcePageLoading() {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-10 shadow-sm">
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-center">
          <Loader2
            size={32}
            className="animate-spin text-emerald-600"
          />

          <p className="text-sm font-semibold text-slate-600">
            Loading resource manager...
          </p>
        </div>
      </div>
    </div>
  );
}

function AccessDenied() {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-10 shadow-sm">
      <div className="text-center">
        <div className="text-4xl">🔒</div>

        <h2 className="mt-4 text-2xl font-black text-slate-900">
          Access denied
        </h2>

        <p className="mt-2 text-sm text-slate-500">
          Administrator access is required.
        </p>

        <Link
          href="/auth/login"
          className="mt-6 inline-flex rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-700"
        >
          Sign in
        </Link>
      </div>
    </div>
  );
}