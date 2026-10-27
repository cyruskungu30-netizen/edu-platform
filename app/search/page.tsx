import Link from "next/link";
import { connection } from "next/server";
import {
  ArrowRight,
  BookOpen,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Search Resources | EduMarket",
  description: "Find educational resources on EduMarket.",
};

type Resource = {
  id: string;
  title: string;
  description?: string | null;
  category?: string | null;
  price?: number | null;
  thumbnail_url?: string | null;
  created_at?: string | null;
};

type SearchParams = {
  q?: string;
  category?: string;
  sort?: string;
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await connection();

  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const category = params.category?.trim() ?? "";
  const sort = params.sort ?? "newest";

  const supabase = await createClient();

  let request = supabase
    .from("resources")
    .select(
      "id, title, description, category, price, thumbnail_url, created_at",
    )
    .eq("status", "published")
    .limit(100);

  if (query) {
    const safeQuery = query.replace(/[,%()]/g, " ").trim();

    if (safeQuery) {
      request = request.or(
        `title.ilike.%${safeQuery}%,description.ilike.%${safeQuery}%`,
      );
    }
  }

  if (category) {
    request = request.eq("category", category);
  }

  if (sort === "oldest") {
    request = request.order("created_at", { ascending: true });
  } else if (sort === "price_low") {
    request = request.order("price", { ascending: true });
  } else if (sort === "price_high") {
    request = request.order("price", { ascending: false });
  } else {
    request = request.order("created_at", { ascending: false });
  }

  const { data, error } = await request;

  const resources = (data ?? []) as Resource[];

  const { data: categoryData } = await supabase
    .from("resources")
    .select("category")
    .eq("status", "published")
    .limit(500);

  const categories = [
    ...new Set(
      (categoryData ?? [])
        .map((item) => item.category as string | null)
        .filter((value): value is string => Boolean(value)),
    ),
  ].sort((a, b) => a.localeCompare(b));

  function buildSearchUrl(overrides: Partial<SearchParams>) {
    const next = {
      q: query,
      category,
      sort,
      ...overrides,
    };

    const search = new URLSearchParams();

    if (next.q) search.set("q", next.q);
    if (next.category) search.set("category", next.category);
    if (next.sort && next.sort !== "newest") {
      search.set("sort", next.sort);
    }

    const queryString = search.toString();
    return queryString ? `/search?${queryString}` : "/search";
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="bg-slate-950 px-5 py-14 text-white sm:px-8 sm:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center gap-2 text-sm font-bold text-blue-300">
            <Search size={18} />
            DISCOVER LEARNING MATERIALS
          </div>

          <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-6xl">
            Find your next{" "}
            <span className="text-blue-400">breakthrough.</span>
          </h1>

          <p className="mt-4 max-w-2xl leading-7 text-slate-300">
            Search educational notes, revision materials, guides, and other
            resources to support your learning journey.
          </p>

          <form
            action="/search"
            method="GET"
            className="mt-8 grid gap-3 rounded-2xl bg-white p-3 sm:grid-cols-[1fr_200px_auto]"
          >
            <div className="flex items-center gap-3 px-3">
              <Search className="shrink-0 text-slate-400" size={22} />

              <input
                type="search"
                name="q"
                defaultValue={query}
                placeholder="Search notes, subjects, topics..."
                aria-label="Search educational resources"
                className="min-w-0 flex-1 py-3 text-slate-900 outline-none placeholder:text-slate-400"
              />
            </div>

            <select
              name="category"
              defaultValue={category}
              aria-label="Filter by category"
              className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700 outline-none focus:border-blue-500"
            >
              <option value="">All categories</option>
              {categories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-6 py-3 font-bold text-white transition hover:bg-blue-800"
            >
              Search <ArrowRight size={18} />
            </button>
          </form>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">
              Search results
            </p>

            <h2 className="mt-2 text-2xl font-black text-slate-950 sm:text-3xl">
              {query ? `Results for "${query}"` : "Explore resources"}
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              {error
                ? "We could not load resources."
                : `${resources.length} resource${resources.length === 1 ? "" : "s"} found in this result set.`}
            </p>
          </div>

          <form action="/search" method="GET" className="flex gap-2">
            {query && <input type="hidden" name="q" value={query} />}
            {category && (
              <input type="hidden" name="category" value={category} />
            )}

            <SlidersHorizontal
              size={18}
              className="mt-3 text-slate-400"
            />

            <select
              name="sort"
              defaultValue={sort}
              aria-label="Sort search results"
              onChange={(event) => event.currentTarget.form?.requestSubmit()}
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="price_low">Price: low to high</option>
              <option value="price_high">Price: high to low</option>
            </select>
          </form>
        </div>

        {error ? (
          <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
            Unable to load resources. Please try again later.
          </div>
        ) : resources.length === 0 ? (
          <div className="mt-8 rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <BookOpen size={42} className="mx-auto text-slate-300" />

            <h3 className="mt-5 text-xl font-black text-slate-950">
              No resources found
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              Try a different keyword or category to discover more learning
              materials.
            </p>

            <Link
              href="/search"
              className="mt-6 inline-flex rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-800"
            >
              Clear search
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {resources.map((resource) => (
              <article
                key={resource.id}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                <Link
                  href={`/resources/${encodeURIComponent(resource.id)}`}
                  className="block"
                >
                  {resource.thumbnail_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={resource.thumbnail_url}
                      alt={resource.title}
                      className="h-44 w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-44 items-center justify-center bg-gradient-to-br from-slate-950 to-blue-800 text-white">
                      <BookOpen size={42} />
                    </div>
                  )}
                </Link>

                <div className="p-5">
                  {resource.category && (
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                      {resource.category}
                    </span>
                  )}

                  <Link href={`/resources/${encodeURIComponent(resource.id)}`}>
                    <h3 className="mt-4 line-clamp-2 text-lg font-black text-slate-950 transition hover:text-blue-700">
                      {resource.title}
                    </h3>
                  </Link>

                  <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-500">
                    {resource.description || "Explore this learning resource."}
                  </p>

                  <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
                    <span className="font-black text-slate-950">
                      {resource.price == null || Number(resource.price) === 0
                        ? "Free"
                        : `KSh ${Number(resource.price).toLocaleString("en-KE")}`}
                    </span>

                    <Link
                      href={`/resources/${encodeURIComponent(resource.id)}`}
                      className="inline-flex items-center gap-1 text-sm font-bold text-blue-700 hover:text-blue-900"
                    >
                      View <ArrowRight size={16} />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}