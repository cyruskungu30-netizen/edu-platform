 "use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  RefreshCw,
  Sparkles,
  Tag,
} from "lucide-react";

type Recommendation = {
  id: string;
  title: string;
  description?: string | null;
  category?: string | null;
  price?: number | null;
  thumbnail_url?: string | null;
  recommendationScore?: number;
  recommendationReason?: string;
};

type RecommendationsResponse = {
  success?: boolean;
  recommendations?: Recommendation[];
  personalized?: boolean;
  error?: string;
};

export default function SmartRecommendations() {
  const [recommendations, setRecommendations] = useState<
    Recommendation[]
  >([]);
  const [personalized, setPersonalized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadRecommendations = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/recommendations", {
        method: "GET",
        cache: "no-store",
        headers: {
          Accept: "application/json",
        },
      });

      const result: RecommendationsResponse = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ?? "Unable to load recommendations.",
        );
      }

      setRecommendations(result.recommendations ?? []);
      setPersonalized(result.personalized ?? false);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Something went wrong.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRecommendations();
  }, [loadRecommendations]);

  const formatPrice = (price?: number | null) => {
    if (price == null || Number(price) === 0) return "Free";

    return `KSh ${Number(price).toLocaleString("en-KE", {
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <section className="mx-auto w-full max-w-7xl px-5 py-12 sm:px-8 sm:py-16">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-violet-50 px-3 py-2 text-xs font-bold uppercase tracking-wide text-violet-700">
            <Sparkles size={15} />
            Smart discovery
          </div>

          <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
            Picked for your learning journey
          </h2>

          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500 sm:text-base">
            Discover educational resources based on your interests and
            recently explored materials.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadRecommendations()}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 sm:self-auto"
        >
          <RefreshCw
            size={17}
            className={loading ? "animate-spin" : ""}
          />
          Refresh
        </button>
      </div>

      {!loading && !error && (
        <div className="mt-6 flex items-center gap-2 text-sm text-slate-500">
          <Sparkles size={17} className="text-violet-600" />

          {personalized
            ? "Recommendations reflect categories from your saved and recently viewed resources."
            : "Explore recently published resources to discover learning materials."}
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-6"
        >
          <h3 className="font-bold text-red-800">
            Recommendations unavailable
          </h3>

          <p className="mt-2 text-sm text-red-700">{error}</p>

          <button
            type="button"
            onClick={() => void loadRecommendations()}
            className="mt-4 rounded-lg bg-red-700 px-4 py-2 text-sm font-bold text-white hover:bg-red-800"
          >
            Try again
          </button>
        </div>
      )}

      {loading ? (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-80 animate-pulse rounded-2xl border border-slate-200 bg-white"
            />
          ))}
        </div>
      ) : !error && recommendations.length === 0 ? (
        <div className="mt-8 rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <BookOpen
            size={44}
            className="mx-auto text-slate-300"
          />

          <h3 className="mt-5 text-xl font-black text-slate-950">
            More discoveries await
          </h3>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
            There are no recommendations to display right now. Explore
            the resource library to find your next learning material.
          </p>

          <Link
            href="/resources"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-800"
          >
            Explore resources <ArrowRight size={17} />
          </Link>
        </div>
      ) : !error ? (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {recommendations.slice(0, 8).map((resource) => (
            <article
              key={resource.id}
              className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-violet-200 hover:shadow-xl"
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
                    loading="lazy"
                    className="h-48 w-full object-cover transition duration-500 group-hover:scale-[1.02]"
                  />
                ) : (
                  <div className="flex h-48 items-center justify-center bg-gradient-to-br from-slate-950 via-blue-900 to-violet-800 text-white">
                    <BookOpen size={42} />
                  </div>
                )}
              </Link>

              <div className="p-5">
                {resource.category && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-3 py-1.5 text-xs font-bold text-violet-700">
                    <Tag size={12} />
                    {resource.category}
                  </span>
                )}

                <Link
                  href={`/resources/${encodeURIComponent(resource.id)}`}
                >
                  <h3 className="mt-4 line-clamp-2 text-lg font-black text-slate-950 transition hover:text-violet-700">
                    {resource.title}
                  </h3>
                </Link>

                <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-500">
                  {resource.description ||
                    "Explore this educational resource and expand your knowledge."}
                </p>

                {resource.recommendationReason && (
                  <div className="mt-4 flex items-start gap-2 rounded-xl bg-violet-50 p-3">
                    <Sparkles
                      size={15}
                      className="mt-0.5 shrink-0 text-violet-700"
                    />

                    <p className="text-xs leading-5 text-violet-800">
                      {resource.recommendationReason}
                    </p>
                  </div>
                )}

                <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
                  <span className="font-black text-slate-950">
                    {formatPrice(resource.price)}
                  </span>

                  <Link
                    href={`/resources/${encodeURIComponent(resource.id)}`}
                    aria-label={`View ${resource.title}`}
                    className="inline-flex items-center gap-1 text-sm font-bold text-violet-700 transition hover:text-violet-900"
                  >
                    View <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}