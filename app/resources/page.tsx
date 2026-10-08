 import Link from "next/link";
import { Suspense } from "react";
import {
  ArrowRight,
  BookOpen,
  FileText,
  Filter,
  Search,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import BookmarkButton from "@/components/resources/BookmarkButton";
import RecommendedResources from "@/components/resources/RecommendedResources";

type SearchParams = {
  category?: string;
  search?: string;
};

function RecommendationsFallback() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="h-7 w-64 animate-pulse rounded-lg bg-slate-200" />
      <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((item) => (
          <div
            key={item}
            className="h-48 animate-pulse rounded-2xl bg-slate-200"
          />
        ))}
      </div>
    </section>
  );
}

function ResourcesFallback() {
  return (
    <main className="min-h-screen bg-slate-50">
      <section className="bg-slate-950 px-4 py-14 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="h-4 w-36 animate-pulse rounded bg-slate-700" />
          <div className="mt-4 h-12 max-w-lg animate-pulse rounded bg-slate-800" />
          <div className="mt-4 h-5 max-w-2xl animate-pulse rounded bg-slate-800" />
          <div className="mt-8 h-14 max-w-3xl animate-pulse rounded-xl bg-slate-800" />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 h-8 w-56 animate-pulse rounded bg-slate-200" />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
            <div
              key={item}
              className="h-80 animate-pulse rounded-2xl border border-slate-200 bg-white"
            />
          ))}
        </div>
      </section>
    </main>
  );
}

async function ResourcesContent({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("resources")
    .select(`
      id,
      title,
      slug,
      description,
      price,
      format,
      pricing_model,
      categories (
        name,
        slug
      )
    `)
    .eq("status", "published")
    .order("created_at", { ascending: false });

  if (params.category) {
    query = query.eq("categories.slug", params.category);
  }

  if (params.search) {
    query = query.ilike("title", `%${params.search}%`);
  }

  const { data: resources, error } = await query;

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="bg-slate-950 px-4 py-14 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-bold uppercase tracking-wider text-emerald-400">
            Resource Library
          </p>

          <h1 className="mt-3 text-4xl font-black sm:text-5xl">
            Education Resources
          </h1>

          <p className="mt-4 max-w-2xl leading-7 text-slate-400">
            Discover quality teaching, learning and assessment
            resources for Kenyan education.
          </p>

          <form
            action="/resources"
            className="mt-8 flex max-w-3xl flex-col gap-3 sm:flex-row"
          >
            <div className="flex flex-1 items-center rounded-xl bg-white px-4">
              <Search size={19} className="shrink-0 text-slate-400" />

              <input
                name="search"
                defaultValue={params.search ?? ""}
                placeholder="Search resources..."
                className="w-full bg-transparent px-3 py-3.5 text-sm text-slate-900 outline-none"
              />
            </div>

            {params.category && (
              <input
                type="hidden"
                name="category"
                value={params.category}
              />
            )}

            <button
              type="submit"
              className="rounded-xl bg-emerald-500 px-7 py-3.5 font-bold text-slate-950 transition hover:bg-emerald-400"
            >
              Search
            </button>
          </form>
        </div>
      </section>

      {!params.search && !params.category && (
        <Suspense fallback={<RecommendationsFallback />}>
          <RecommendedResources />
        </Suspense>
      )}

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-2xl font-black text-slate-900">
              Browse Resources
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {resources?.length ?? 0} resources available
            </p>
          </div>

          <Link
            href="/categories"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-emerald-400 hover:text-emerald-600"
          >
            <Filter size={17} />
            Categories
          </Link>
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
            <h2 className="font-bold text-red-700">
              Unable to load resources
            </h2>

            <p className="mt-2 text-sm text-red-600">{error.message}</p>
          </div>
        ) : resources && resources.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {resources.map((resource) => {
              const category = Array.isArray(resource.categories)
                ? resource.categories[0]
                : resource.categories;

              const isFree =
                resource.pricing_model === "free" ||
                Number(resource.price ?? 0) === 0;

              return (
                <article
                  key={resource.id}
                  className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:border-emerald-300 hover:shadow-xl"
                >
                  <div className="relative flex h-44 items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
                    <FileText size={48} className="text-emerald-400" />

                    <div className="absolute right-3 top-3">
                      <BookmarkButton resourceId={resource.id} />
                    </div>
                  </div>

                  <Link
                    href={`/resources/${encodeURIComponent(resource.slug)}`}
                    className="block"
                  >
                    <div className="p-5">
                      {category?.name && (
                        <span className="text-xs font-bold uppercase tracking-wide text-emerald-600">
                          {category.name}
                        </span>
                      )}

                      <h3 className="mt-2 line-clamp-2 min-h-12 font-bold leading-6 text-slate-900">
                        {resource.title}
                      </h3>

                      {resource.description && (
                        <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">
                          {resource.description}
                        </p>
                      )}

                      <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                        <div>
                          {isFree ? (
                            <span className="font-black text-emerald-600">
                              FREE
                            </span>
                          ) : (
                            <span className="font-black text-slate-900">
                              KSh{" "}
                              {Number(resource.price).toLocaleString("en-KE")}
                            </span>
                          )}
                        </div>

                        <span className="flex items-center gap-1 text-sm font-bold text-emerald-600">
                          View
                          <ArrowRight
                            size={15}
                            className="transition-transform group-hover:translate-x-1"
                          />
                        </span>
                      </div>
                    </div>
                  </Link>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="rounded-3xl border border-slate-200 bg-white px-6 py-16 text-center">
            <BookOpen size={46} className="mx-auto text-slate-300" />

            <h2 className="mt-5 text-xl font-bold text-slate-900">
              No resources found
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              We could not find resources matching your search. Try another
              search or browse our categories.
            </p>

            <Link
              href="/resources"
              className="mt-6 inline-flex rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-500"
            >
              View all resources
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}

export default function ResourcesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  return (
    <>
      <Header />

      <Suspense fallback={<ResourcesFallback />}>
        <ResourcesContent searchParams={searchParams} />
      </Suspense>

      <Footer />
    </>
  );
}