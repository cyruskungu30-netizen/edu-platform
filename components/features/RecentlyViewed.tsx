"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Clock3,
  LoaderCircle,
  RefreshCw,
} from "lucide-react";

type Resource = {
  id: string;
  title: string;
  description: string | null;
  price: number | null;
  category: string | null;
  thumbnail_url: string | null;
};

type RecentlyViewedProps = {
  limit?: number;
  title?: string;
  showDescription?: boolean;
};

export default function RecentlyViewed({
  limit = 8,
  title = "Recently Viewed",
  showDescription = true,
}: RecentlyViewedProps) {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [clearing, setClearing] = useState(false);

  const loadResources = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/recently-viewed", {
        method: "GET",
        credentials: "same-origin",
        cache: "no-store",
      });

      const result: {
        resources?: Resource[];
        error?: string;
      } = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unable to load recently viewed.");
      }

      setResources(
        Array.isArray(result.resources)
          ? result.resources.slice(0, Math.max(1, limit))
          : [],
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load recently viewed resources.",
      );
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    void loadResources();
  }, [loadResources]);

  const clearHistory = async () => {
    if (clearing) return;

    setClearing(true);
    setError("");

    try {
      const response = await fetch("/api/recently-viewed", {
        method: "DELETE",
        credentials: "same-origin",
      });

      const result: { error?: string } = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unable to clear viewing history.");
      }

      setResources([]);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to clear viewing history.",
      );
    } finally {
      setClearing(false);
    }
  };

  return (
    <section className="w-full py-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">
            <Clock3 size={14} />
            YOUR LEARNING HISTORY
          </div>

          <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
            {title}
          </h2>

          {showDescription && (
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
              Pick up where you left off and quickly return to resources
              you explored earlier.
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void loadResources()}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={loading ? "animate-spin" : ""}
            />
            Refresh
          </button>

          {resources.length > 0 && (
            <button
              type="button"
              onClick={() => void clearHistory()}
              disabled={clearing}
              className="rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-bold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
            >
              {clearing ? "Clearing..." : "Clear history"}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-5 flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between"
        >
          <p>{error}</p>

          <button
            type="button"
            onClick={() => void loadResources()}
            className="shrink-0 font-bold underline"
          >
            Try again
          </button>
        </div>
      )}

      {loading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="animate-pulse overflow-hidden rounded-2xl border border-slate-200 bg-white"
            >
              <div className="h-40 bg-slate-200" />

              <div className="space-y-3 p-5">
                <div className="h-3 w-1/3 rounded bg-slate-200" />
                <div className="h-5 w-4/5 rounded bg-slate-200" />
                <div className="h-4 w-full rounded bg-slate-100" />
                <div className="h-10 rounded-xl bg-slate-200" />
              </div>
            </div>
          ))}
        </div>
      ) : resources.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
            <BookOpen size={30} />
          </div>

          <h3 className="mt-5 text-xl font-black text-slate-950">
            Your learning journey starts here
          </h3>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
            Resources you view will appear here, making it easier to return
            to your recent discoveries.
          </p>

          <Link
            href="/resources"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-800"
          >
            Explore resources <ArrowRight size={17} />
          </Link>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {resources.map((resource) => (
            <article
              key={resource.id}
              className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl"
            >
              <Link
                href={`/resources/${resource.id}`}
                aria-label={`View ${resource.title}`}
                className="block"
              >
                <div className="flex h-40 items-center justify-center overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-900">
                  {resource.thumbnail_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={resource.thumbnail_url}
                      alt={resource.title}
                      loading="lazy"
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <BookOpen
                      size={46}
                      className="text-white/60 transition group-hover:scale-110"
                    />
                  )}
                </div>
              </Link>

              <div className="p-5">
                <p className="text-xs font-bold uppercase tracking-wide text-blue-700">
                  {resource.category || "Learning resource"}
                </p>

                <h3 className="mt-2 line-clamp-2 text-lg font-bold text-slate-950">
                  {resource.title}
                </h3>

                {showDescription && (
                  <p className="mt-2 line-clamp-3 min-h-[60px] text-sm leading-5 text-slate-500">
                    {resource.description ||
                      "Explore this educational resource on EduMarket."}
                  </p>
                )}

                <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
                  <span className="font-black text-slate-950">
                    {typeof resource.price === "number"
                      ? resource.price === 0
                        ? "Free"
                        : `KES ${resource.price.toLocaleString("en-KE")}`
                      : "View details"}
                  </span>

                  <Link
                    href={`/resources/${resource.id}`}
                    className="inline-flex items-center gap-1 rounded-lg bg-slate-950 px-3 py-2.5 text-xs font-bold text-white transition hover:bg-blue-700"
                  >
                    Open <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}