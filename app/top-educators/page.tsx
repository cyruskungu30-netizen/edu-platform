import Link from "next/link";
import { connection } from "next/server";
import {
  ArrowRight,
  BookOpen,
  GraduationCap,
  Medal,
  Search,
  Sparkles,
  Users,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Top Educators | EduMarket",
  description:
    "Discover educators sharing educational resources on EduMarket.",
};

type Resource = {
  id: string;
  title: string;
  category: string | null;
  created_at: string;
  educator_id?: string | null;
  user_id?: string | null;
  seller_id?: string | null;
};

type Educator = {
  id: string;
  name: string;
  resourceCount: number;
  categories: string[];
  latestResource: string;
};

export default async function TopEducatorsPage() {
  await connection();

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("resources")
    .select("*")
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(500);

  const resources = (data ?? []) as Resource[];
  const educatorMap = new Map<string, Educator>();

  if (!error) {
    for (const resource of resources) {
      const educatorId =
        resource.educator_id ??
        resource.user_id ??
        resource.seller_id;

      if (!educatorId) continue;

      const existing = educatorMap.get(educatorId);

      if (existing) {
        existing.resourceCount += 1;

        if (
          resource.category &&
          !existing.categories.includes(resource.category)
        ) {
          existing.categories.push(resource.category);
        }
      } else {
        educatorMap.set(educatorId, {
          id: educatorId,
          name: `Educator ${educatorMap.size + 1}`,
          resourceCount: 1,
          categories: resource.category ? [resource.category] : [],
          latestResource: resource.title,
        });
      }
    }
  }

  const educators = [...educatorMap.values()]
    .sort((a, b) => b.resourceCount - a.resourceCount)
    .slice(0, 50);

  const rankStyles = [
    "border-amber-200 bg-amber-50 text-amber-700",
    "border-slate-200 bg-slate-100 text-slate-700",
    "border-orange-200 bg-orange-50 text-orange-700",
  ];

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="relative overflow-hidden bg-slate-950 px-5 py-16 text-white sm:px-8 sm:py-24">
        <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-amber-500/20 blur-3xl" />

        <div className="relative mx-auto max-w-7xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-400/10 px-4 py-2 text-sm font-bold text-amber-300">
            <Medal size={17} />
            THE EDUCATOR COMMUNITY
          </div>

          <h1 className="mt-7 max-w-4xl text-4xl font-black tracking-tight sm:text-6xl">
            Meet the minds{" "}
            <span className="text-amber-400">behind learning.</span>
          </h1>

          <p className="mt-5 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
            Discover educators contributing learning materials and helping
            students, teachers, and lifelong learners find useful resources.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/resources"
              className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-6 py-3 font-bold text-slate-950 transition hover:bg-amber-400"
            >
              Explore resources <ArrowRight size={18} />
            </Link>

            <Link
              href="/teacher"
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-6 py-3 font-bold text-white transition hover:bg-white/10"
            >
              Become an educator <GraduationCap size={18} />
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
              <Users size={22} />
            </div>

            <p className="mt-5 text-3xl font-black text-slate-950">
              {educators.length}
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Educators represented
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <BookOpen size={22} />
            </div>

            <p className="mt-5 text-3xl font-black text-slate-950">
              {resources.length}
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Published resources reviewed
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
              <Sparkles size={22} />
            </div>

            <p className="mt-5 text-3xl font-black text-slate-950">
              {new Set(
                resources
                  .map((resource) => resource.category)
                  .filter(Boolean),
              ).size}
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Resource categories
            </p>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-600">
              Community contributors
            </p>

            <h2 className="mt-2 text-3xl font-black text-slate-950">
              Top educators
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Ranked by the number of published resources found.
            </p>
          </div>

          <Link
            href="/search"
            className="inline-flex items-center gap-2 text-sm font-bold text-blue-700 hover:text-blue-900"
          >
            Find learning materials <Search size={17} />
          </Link>
        </div>

        {error ? (
          <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
            Educators could not be loaded. Please try again later.
          </div>
        ) : educators.length === 0 ? (
          <div className="mt-8 rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <GraduationCap
              size={42}
              className="mx-auto text-slate-300"
            />

            <h3 className="mt-5 text-xl font-black text-slate-950">
              Educators are on their way
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              Published resources linked to educator accounts will appear
              here as the community grows.
            </p>

            <Link
              href="/resources"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-800"
            >
              Browse resources <ArrowRight size={17} />
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {educators.map((educator, index) => (
              <article
                key={educator.id}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-amber-200 hover:shadow-xl"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-950 to-blue-900 text-white">
                    <GraduationCap size={28} />
                  </div>

                  <span
                    className={`rounded-full border px-3 py-1.5 text-xs font-black ${
                      rankStyles[index] ??
                      "border-slate-200 bg-slate-50 text-slate-600"
                    }`}
                  >
                    #{index + 1}
                  </span>
                </div>

                <h3 className="mt-5 text-xl font-black text-slate-950">
                  {educator.name}
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Contributing educational materials to EduMarket.
                </p>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-2xl font-black text-slate-950">
                      {educator.resourceCount}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Published resources
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-2xl font-black text-slate-950">
                      {educator.categories.length}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Categories
                    </p>
                  </div>
                </div>

                {educator.categories.length > 0 && (
                  <div className="mt-5 flex flex-wrap gap-2">
                    {educator.categories.slice(0, 3).map((category) => (
                      <span
                        key={category}
                        className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700"
                      >
                        {category}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-5 border-t border-slate-100 pt-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                    Latest contribution
                  </p>

                  <p className="mt-2 line-clamp-2 text-sm font-semibold text-slate-700">
                    {educator.latestResource}
                  </p>
                </div>

                <Link
                  href={`/resources?educator=${encodeURIComponent(educator.id)}`}
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white transition hover:bg-amber-500 hover:text-slate-950"
                >
                  Explore contributions <ArrowRight size={16} />
                </Link>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}