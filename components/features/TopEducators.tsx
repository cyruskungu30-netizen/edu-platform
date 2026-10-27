"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  GraduationCap,
  Medal,
  RefreshCw,
  Sparkles,
  Users,
} from "lucide-react";

type Educator = {
  id: string;
  name: string;
  resourceCount: number;
  categories: string[];
  latestResource: string;
  latestResourceDate?: string;
};

type EducatorsResponse = {
  educators?: Educator[];
  totalEducators?: number;
  totalResources?: number;
  error?: string;
};

const rankStyles = [
  "border-amber-200 bg-amber-50 text-amber-700",
  "border-slate-200 bg-slate-100 text-slate-700",
  "border-orange-200 bg-orange-50 text-orange-700",
];

export default function TopEducators() {
  const [educators, setEducators] = useState<Educator[]>([]);
  const [totalResources, setTotalResources] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadEducators() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/top-educators", {
        method: "GET",
        cache: "no-store",
        headers: {
          Accept: "application/json",
        },
      });

      const result: EducatorsResponse = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ?? "Unable to load educators.",
        );
      }

      setEducators(result.educators ?? []);
      setTotalResources(result.totalResources ?? 0);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "An unexpected error occurred.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadEducators();
  }, []);

  return (
    <section className="mx-auto w-full max-w-7xl px-5 py-12 sm:px-8 sm:py-16">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-2 text-xs font-bold uppercase tracking-wide text-amber-700">
            <Sparkles size={15} />
            Learning community
          </div>

          <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
            Meet our top educators
          </h2>

          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500 sm:text-base">
            Discover contributors sharing educational resources with
            learners across EduMarket.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void loadEducators()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={loading ? "animate-spin" : ""}
            />
            Refresh
          </button>

          <Link
            href="/top-educators"
            className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-800"
          >
            View all educators <ArrowRight size={17} />
          </Link>
        </div>
      </div>

      {!loading && !error && (
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5">
            <div className="rounded-xl bg-blue-50 p-3 text-blue-700">
              <Users size={23} />
            </div>

            <div>
              <p className="text-2xl font-black text-slate-950">
                {educators.length}
              </p>

              <p className="text-sm text-slate-500">
                Educators displayed
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5">
            <div className="rounded-xl bg-emerald-50 p-3 text-emerald-700">
              <BookOpen size={23} />
            </div>

            <div>
              <p className="text-2xl font-black text-slate-950">
                {totalResources}
              </p>

              <p className="text-sm text-slate-500">
                Published resources reviewed
              </p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-6"
        >
          <p className="font-bold text-red-800">
            Could not load educators
          </p>

          <p className="mt-2 text-sm text-red-700">{error}</p>

          <button
            type="button"
            onClick={() => void loadEducators()}
            className="mt-4 rounded-lg bg-red-700 px-4 py-2 text-sm font-bold text-white hover:bg-red-800"
          >
            Try again
          </button>
        </div>
      )}

      {loading ? (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="h-72 animate-pulse rounded-2xl border border-slate-200 bg-white"
            />
          ))}
        </div>
      ) : !error && educators.length === 0 ? (
        <div className="mt-8 rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <GraduationCap
            size={44}
            className="mx-auto text-slate-300"
          />

          <h3 className="mt-5 text-xl font-black text-slate-950">
            The educator community is growing
          </h3>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
            Educators will appear here when published resources are
            associated with their accounts.
          </p>

          <Link
            href="/resources"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-700 px-5 py-3 text-sm font-bold text-white hover:bg-blue-800"
          >
            Explore resources <ArrowRight size={17} />
          </Link>
        </div>
      ) : !error ? (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {educators.slice(0, 6).map((educator, index) => (
            <article
              key={educator.id}
              className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl"
            >
              <div className="flex items-start justify-between">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-950 to-blue-800 text-white">
                  <GraduationCap size={28} />
                </div>

                <span
                  className={`rounded-full border px-3 py-1.5 text-xs font-black ${
                    rankStyles[index] ??
                    "border-slate-200 bg-slate-50 text-slate-600"
                  }`}
                >
                  <Medal
                    size={13}
                    className="mr-1 inline-block"
                  />
                  Rank #{index + 1}
                </span>
              </div>

              <h3 className="mt-5 text-xl font-black text-slate-950">
                {educator.name}
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Contributing educational materials to the EduMarket
                community.
              </p>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-2xl font-black text-slate-950">
                    {educator.resourceCount}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Resources
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
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
              >
                View resources <ArrowRight size={16} />
              </Link>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}