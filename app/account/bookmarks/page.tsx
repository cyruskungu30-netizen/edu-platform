 import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import {
  ArrowLeft,
  Bookmark,
  BookOpen,
  FileText,
  Library,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";

type SavedResource = {
  id: string;
  resource_id: string;
  created_at: string;
  resource: {
    id: string;
    title: string;
    slug: string;
    description: string | null;
    thumbnail_url: string | null;
    format: string;
    price: number;
    sale_price: number | null;
    pricing_model: string;
    status: string;
  } | null;
};

function formatPrice(
  price: number,
  salePrice: number | null,
  pricingModel: string,
) {
  if (pricingModel === "free") {
    return "Free";
  }

  if (salePrice !== null && salePrice < price) {
    return `KSh ${salePrice.toLocaleString("en-KE")}`;
  }

  return `KSh ${price.toLocaleString("en-KE")}`;
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Saved resource";
  }

  return new Intl.DateTimeFormat("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

async function BookmarksContent() {
  await connection();

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-12 sm:px-6">
        <section className="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
            <Bookmark size={30} />
          </div>

          <h1 className="mt-5 text-2xl font-bold text-slate-950">
            Your saved resources
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-600">
            Sign in to save educational resources and access them
            whenever you need them.
          </p>

          <Link
            href="/auth/login?redirect=/account/bookmarks"
            className="mt-6 inline-flex items-center justify-center rounded-xl bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            Sign in
          </Link>
        </section>
      </main>
    );
  }

  const { data, error } = await supabase
    .from("resource_bookmarks")
    .select(`
      id,
      resource_id,
      created_at,
      resource:resources!resource_bookmarks_resource_id_fkey (
        id,
        title,
        slug,
        description,
        thumbnail_url,
        format,
        price,
        sale_price,
        pricing_model,
        status
      )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-4xl rounded-2xl border border-red-200 bg-red-50 p-6">
          <h1 className="font-bold text-red-800">
            Unable to load saved resources
          </h1>

          <p className="mt-2 text-sm leading-6 text-red-700">
            Check the resource_bookmarks table permissions and
            confirm that its resource foreign key is configured
            correctly.
          </p>

          <Link
            href="/account"
            className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-red-800 underline"
          >
            <ArrowLeft size={16} />
            Return to account
          </Link>
        </div>
      </main>
    );
  }

  const bookmarks = (data ?? []) as unknown as SavedResource[];

  const visibleBookmarks = bookmarks.filter(
    (bookmark) =>
      bookmark.resource &&
      bookmark.resource.status === "published",
  );

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/account"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-slate-950"
        >
          <ArrowLeft size={17} />
          Back to account
        </Link>

        <header className="overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950 p-6 text-white shadow-sm sm:p-9">
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
            <div>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20">
                <Bookmark size={25} />
              </div>

              <h1 className="text-3xl font-bold tracking-tight">
                Saved resources
              </h1>

              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">
                Keep your favourite educational materials together
                and return to them whenever you need them.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/10 px-5 py-4">
              <p className="text-3xl font-bold">
                {visibleBookmarks.length}
              </p>

              <p className="mt-1 text-xs text-slate-300">
                Saved resources
              </p>
            </div>
          </div>
        </header>

        <section className="mt-8">
          {visibleBookmarks.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
                <Library size={30} />
              </div>

              <h2 className="mt-5 text-xl font-bold text-slate-950">
                No saved resources yet
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                Browse the resource library and use the Save button
                to build your personal collection.
              </p>

              <Link
                href="/resources"
                className="mt-6 inline-flex items-center justify-center rounded-xl bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
              >
                Explore resources
              </Link>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {visibleBookmarks.map((bookmark) => {
                const resource = bookmark.resource!;

                return (
                  <article
                    key={bookmark.id}
                    className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    {resource.thumbnail_url ? (
                      <div className="aspect-[16/9] overflow-hidden bg-slate-100">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={resource.thumbnail_url}
                          alt={resource.title}
                          loading="lazy"
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="flex aspect-[16/9] items-center justify-center bg-gradient-to-br from-slate-100 to-amber-50 text-slate-400">
                        <FileText size={42} />
                      </div>
                    )}

                    <div className="p-5">
                      <div className="flex items-center justify-between gap-3">
                        <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold capitalize text-amber-800">
                          {resource.format.replaceAll("_", " ")}
                        </span>

                        <span className="text-xs text-slate-400">
                          {formatDate(bookmark.created_at)}
                        </span>
                      </div>

                      <h2 className="mt-4 line-clamp-2 text-lg font-bold text-slate-950">
                        {resource.title}
                      </h2>

                      {resource.description && (
                        <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-500">
                          {resource.description}
                        </p>
                      )}

                      <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
                        <p className="font-bold text-slate-900">
                          {formatPrice(
                            Number(resource.price ?? 0),
                            resource.sale_price === null
                              ? null
                              : Number(resource.sale_price),
                            resource.pricing_model,
                          )}
                        </p>

                        <Link
                          href={`/resources/${encodeURIComponent(resource.slug)}`}
                          className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
                        >
                          <BookOpen size={16} />
                          View
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function BookmarksFallback() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12 sm:px-6">
      <div className="mx-auto max-w-6xl animate-pulse">
        <div className="h-8 w-56 rounded-lg bg-slate-200" />
        <div className="mt-6 h-44 rounded-3xl bg-slate-200" />

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((item) => (
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

export default function BookmarksPage() {
  return (
    <Suspense fallback={<BookmarksFallback />}>
      <BookmarksContent />
    </Suspense>
  );
}