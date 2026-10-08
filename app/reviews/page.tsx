 import Link from "next/link";
import { ArrowLeft, FileText, Star } from "lucide-react";
import { Suspense } from "react";

import { createClient } from "@/lib/supabase/server";

type Review = {
  id: string;
  resource_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
};

type Resource = {
  id: string;
  title: string;
  slug: string;
  format: string;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-KE", {
    dateStyle: "medium",
  }).format(new Date(value));
}

function ReviewsLoading() {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="h-6 w-32 animate-pulse rounded bg-slate-200" />

        <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="h-8 w-64 animate-pulse rounded bg-slate-200" />

          <div className="mt-3 h-4 w-80 animate-pulse rounded bg-slate-100" />

          <div className="mt-8 space-y-4">
            <div className="h-32 animate-pulse rounded-2xl bg-slate-100" />
            <div className="h-32 animate-pulse rounded-2xl bg-slate-100" />
          </div>
        </div>
      </div>
    </main>
  );
}

function RatingStars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          className={`h-4 w-4 ${
            index < rating
              ? "fill-amber-400 text-amber-400"
              : "text-slate-300"
          }`}
        />
      ))}
    </div>
  );
}

async function ReviewsContent() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <Star className="h-7 w-7" />
            </div>

            <h1 className="mt-5 text-2xl font-bold text-slate-950">
              Your Reviews
            </h1>

            <p className="mt-3 text-sm leading-6 text-slate-500">
              Sign in to view and manage the reviews you have submitted.
            </p>

            <Link
              href="/auth/login?redirect=/reviews"
              className="mt-6 inline-flex rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
            >
              Sign In
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const { data: reviews, error } = await supabase
    .from("reviews")
    .select("id, resource_id, rating, comment, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
          <div className="rounded-3xl border border-red-100 bg-white p-8 text-center shadow-sm">
            <h1 className="text-xl font-bold text-slate-950">
              Unable to load reviews
            </h1>

            <p className="mt-3 text-sm text-slate-500">
              Please refresh the page and try again.
            </p>

            <Link
              href="/account"
              className="mt-6 inline-flex rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
            >
              Back to Account
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const typedReviews = (reviews ?? []) as Review[];

  const resourceIds = [
    ...new Set(typedReviews.map((review) => review.resource_id)),
  ];

  let resources: Resource[] = [];

  if (resourceIds.length > 0) {
    const { data: resourceData } = await supabase
      .from("resources")
      .select("id, title, slug, format")
      .in("id", resourceIds);

    resources = (resourceData ?? []) as Resource[];
  }

  const resourceMap = new Map(
    resources.map((resource) => [resource.id, resource]),
  );

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <Link
          href="/account"
          className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 transition hover:text-blue-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Account
        </Link>

        <div className="mt-6 rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-6 sm:p-8">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-500">
                <Star className="h-6 w-6 fill-amber-400" />
              </div>

              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                  Your Reviews
                </h1>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Manage the reviews you have submitted for EduMarket
                  resources.
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            {typedReviews.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm">
                  <Star className="h-7 w-7" />
                </div>

                <h2 className="mt-5 text-lg font-bold text-slate-950">
                  No reviews yet
                </h2>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                  After purchasing a resource, you can leave a rating and
                  review to help other teachers and students.
                </p>

                <Link
                  href="/resources"
                  className="mt-6 inline-flex rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
                >
                  Browse Resources
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {typedReviews.map((review) => {
                  const resource = resourceMap.get(review.resource_id);

                  return (
                    <div
                      key={review.id}
                      className="rounded-2xl border border-slate-200 p-5"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex min-w-0 items-start gap-4">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                            <FileText className="h-5 w-5" />
                          </div>

                          <div className="min-w-0">
                            {resource ? (
                              <Link
                                href={`/resources/${resource.slug}`}
                                className="line-clamp-2 text-sm font-bold text-slate-900 transition hover:text-blue-600"
                              >
                                {resource.title}
                              </Link>
                            ) : (
                              <p className="text-sm font-bold text-slate-900">
                                Resource
                              </p>
                            )}

                            {resource?.format && (
                              <p className="mt-1 text-xs text-slate-500">
                                {resource.format}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="shrink-0">
                          <RatingStars rating={review.rating} />

                          <p className="mt-1 text-xs text-slate-400">
                            {formatDate(review.created_at)}
                          </p>
                        </div>
                      </div>

                      {review.comment && (
                        <div className="mt-5 rounded-xl bg-slate-50 p-4">
                          <p className="whitespace-pre-line text-sm leading-6 text-slate-600">
                            {review.comment}
                          </p>
                        </div>
                      )}

                      {resource && (
                        <div className="mt-4">
                          <Link
                            href={`/resources/${resource.slug}`}
                            className="text-xs font-bold text-blue-600 transition hover:text-blue-700"
                          >
                            View resource →
                          </Link>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

export default function ReviewsPage() {
  return (
    <Suspense fallback={<ReviewsLoading />}>
      <ReviewsContent />
    </Suspense>
  );
}