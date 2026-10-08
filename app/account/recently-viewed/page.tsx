 import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  Clock3,
  FileText,
  Trash2,
} from "lucide-react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { revalidatePath } from "next/cache";
import { Suspense } from "react";

import { createClient } from "@/lib/supabase/server";

type RecentlyViewedResource = {
  id: string;
  resource_id: string;
  viewed_at: string;
  resource: {
    id: string;
    title: string;
    slug: string;
    description: string | null;
    price: number | string | null;
    format: string | null;
    pricing_model: string | null;
    status: string;
  } | null;
};

async function clearRecentlyViewed() {
  "use server";

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?redirect=/account/recently-viewed");
  }

  const { error } = await supabase
    .from("recently_viewed_resources")
    .delete()
    .eq("user_id", user.id);

  if (error) {
    throw new Error("Unable to clear recently viewed history.");
  }

  revalidatePath("/account/recently-viewed");
}

async function RecentlyViewedContent() {
  await connection();

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?redirect=/account/recently-viewed");
  }

  const { data, error } = await supabase
    .from("recently_viewed_resources")
    .select(`
      id,
      resource_id,
      viewed_at,
      resource:resources (
        id,
        title,
        slug,
        description,
        price,
        format,
        pricing_model,
        status
      )
    `)
    .eq("user_id", user.id)
    .order("viewed_at", { ascending: false })
    .limit(100);

  const resources = (
    (data ?? []) as unknown as RecentlyViewedResource[]
  ).filter(
    (item) =>
      item.resource &&
      item.resource.status === "published",
  );

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <Link
            href="/resources"
            className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 hover:text-emerald-800"
          >
            <ArrowLeft size={17} />
            Browse resources
          </Link>

          <div className="mt-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                  <Clock3 size={25} />
                </div>

                <h1 className="text-3xl font-black tracking-tight text-slate-950">
                  Recently Viewed
                </h1>
              </div>

              <p className="mt-3 text-sm leading-6 text-slate-500">
                Quickly return to educational resources you&apos;ve explored.
              </p>
            </div>

            {resources.length > 0 && (
              <form action={clearRecentlyViewed}>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-3 text-sm font-bold text-red-600 transition hover:bg-red-50"
                >
                  <Trash2 size={17} />
                  Clear History
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
            <h2 className="font-bold text-red-700">
              Unable to load your history
            </h2>

            <p className="mt-2 text-sm text-red-600">
              {error.message}
            </p>
          </div>
        ) : resources.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white px-6 py-16 text-center">
            <BookOpen
              size={48}
              className="mx-auto text-slate-300"
            />

            <h2 className="mt-5 text-xl font-bold text-slate-900">
              No recently viewed resources
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              Resources you open while signed in will appear here,
              making it easier to find them again.
            </p>

            <Link
              href="/resources"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-700"
            >
              <BookOpen size={17} />
              Explore Resources
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">
                Your viewing history
              </h2>

              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                {resources.length} resources
              </span>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {resources.map((item) => {
                const resource = item.resource!;

                const isFree =
                  resource.pricing_model === "free" ||
                  Number(resource.price ?? 0) <= 0;

                return (
                  <article
                    key={item.id}
                    className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                  >
                    <div className="flex h-36 items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
                      <FileText
                        size={42}
                        className="text-emerald-400"
                      />
                    </div>

                    <div className="p-5">
                      <h3 className="line-clamp-2 min-h-12 font-bold leading-6 text-slate-900">
                        {resource.title}
                      </h3>

                      {resource.description && (
                        <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">
                          {resource.description}
                        </p>
                      )}

                      <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
                        <span className="text-sm font-black text-emerald-700">
                          {isFree
                            ? "FREE"
                            : `KSh ${Number(
                                resource.price ?? 0,
                              ).toLocaleString("en-KE")}`}
                        </span>

                        <span className="text-xs text-slate-400">
                          {new Date(item.viewed_at).toLocaleDateString(
                            "en-KE",
                            {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            },
                          )}
                        </span>
                      </div>

                      <Link
                        href={`/resources/${encodeURIComponent(resource.slug)}`}
                        className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-700"
                      >
                        View Resource
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        )}
      </section>
    </main>
  );
}

function RecentlyViewedFallback() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-16">
      <div className="mx-auto max-w-7xl animate-pulse">
        <div className="h-8 w-64 rounded-lg bg-slate-200" />
        <div className="mt-4 h-4 w-96 max-w-full rounded bg-slate-200" />

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="h-64 rounded-2xl bg-slate-200"
            />
          ))}
        </div>
      </div>
    </main>
  );
}

export default function RecentlyViewedPage() {
  return (
    <Suspense fallback={<RecentlyViewedFallback />}>
      <RecentlyViewedContent />
    </Suspense>
  );
}