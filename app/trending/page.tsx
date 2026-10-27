import Link from "next/link";
import { connection } from "next/server";
import {
  ArrowRight,
  BookOpen,
  Flame,
  GraduationCap,
  Search,
  TrendingUp,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";

type Resource = {
  id: string;
  title: string;
  description?: string | null;
  price?: number | null;
  category?: string | null;
  thumbnail_url?: string | null;
};

export const metadata = {
  title: "Trending Resources | EduMarket",
  description:
    "Discover educational resources worth exploring on EduMarket.",
};

export default async function TrendingPage() {
  await connection();

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("resources")
    .select("id, title, description, price, category, thumbnail_url")
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(24);

  const resources = (data ?? []) as Resource[];

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="relative overflow-hidden bg-slate-950 px-5 py-16 text-white sm:px-8 sm:py-24">
        <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-orange-500/20 blur-3xl" />

        <div className="relative mx-auto max-w-7xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-400/20 bg-orange-400/10 px-4 py-2 text-sm font-semibold text-orange-300">
            <Flame size={17} />
            Explore what&apos;s new
          </div>

          <h1 className="mt-7 max-w-3xl text-4xl font-black tracking-tight sm:text-6xl">
            Resources worth{" "}
            <span className="text-orange-400">discovering.</span>
          </h1>

          <p className="mt-5 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
            Explore educational materials for revision, teaching,
            assessment, and continuous learning.
          </p>

          <Link
            href="/resources"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-orange-500 px-6 py-3 font-bold text-white transition hover:bg-orange-400"
          >
            Browse all resources <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-orange-600">
              EduMarket discovery
            </p>

            <h2 className="mt-2 text-3xl font-black text-slate-950">
              Explore resources
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              {resources.length} resources available to explore
            </p>
          </div>

          <Link
            href="/resources"
            className="inline-flex items-center gap-2 text-sm font-bold text-blue-700 hover:text-blue-900"
          >
            Advanced search <Search size={17} />
          </Link>
        </div>

        {error ? (
          <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
            Resources could not be loaded. Please try again later.
          </div>
        ) : resources.length === 0 ? (
          <div className="mt-8 rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <BookOpen className="mx-auto h-12 w-12 text-slate-300" />

            <h3 className="mt-5 text-xl font-bold text-slate-900">
              No published resources yet
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              Check back when educators publish their learning materials.
            </p>
          </div>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {resources.map((resource, index) => (
              <article
                key={resource.id}
                className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-orange-200 hover:shadow-xl"
              >
                <div className="relative flex h-40 items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-orange-950">
                  {resource.thumbnail_url ? (
                    <img
                      src={resource.thumbnail_url}
                      alt={resource.title}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <GraduationCap
                      size={54}
                      className="text-white/60 transition duration-300 group-hover:scale-110"
                    />
                  )}

                  <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-orange-500 px-3 py-1 text-xs font-bold text-white">
                    <TrendingUp size={13} />
                    Explore
                  </span>
                </div>

                <div className="p-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-orange-600">
                    {resource.category || "Learning resource"}
                  </p>

                  <h3 className="mt-2 line-clamp-2 text-lg font-bold text-slate-950">
                    {resource.title}
                  </h3>

                  <p className="mt-2 line-clamp-3 min-h-[60px] text-sm leading-5 text-slate-500">
                    {resource.description ||
                      "Explore this educational resource on EduMarket."}
                  </p>

                  <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
                    <span className="font-black text-slate-900">
                      {typeof resource.price === "number"
                        ? `KES ${resource.price.toLocaleString("en-KE")}`
                        : "View details"}
                    </span>

                    <Link
                      href={`/resources/${resource.id}`}
                      className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-slate-950 px-3 py-2 text-xs font-bold text-white transition hover:bg-orange-600"
                    >
                      View <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>

                <span className="sr-only">Resource {index + 1}</span>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}