import {
  CheckCircle2,
  MessageSquare,
  Star,
  UserRound,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import ReviewForm from "@/components/resources/ReviewForm";

type ResourceReviewsProps = {
  resourceId: string;
};

type Review = {
  id: string;
  rating: number;
  review_text: string | null;
  created_at: string;
  user_id: string;
};

type Profile = {
  id: string;
  full_name: string | null;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-KE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function Stars({
  rating,
  size = "normal",
}: {
  rating: number;
  size?: "small" | "normal" | "large";
}) {
  const sizeClass =
    size === "small"
      ? "h-3.5 w-3.5"
      : size === "large"
        ? "h-6 w-6"
        : "h-4 w-4";

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${sizeClass} ${
            star <= rating
              ? "fill-current text-amber-400"
              : "text-slate-300"
          }`}
        />
      ))}
    </div>
  );
}

function RatingBar({
  rating,
  count,
  total,
}: {
  rating: number;
  count: number;
  total: number;
}) {
  const percentage =
    total > 0 ? Math.round((count / total) * 100) : 0;

  return (
    <div className="flex items-center gap-3">
      <span className="w-3 text-xs font-semibold text-slate-500">
        {rating}
      </span>

      <Star className="h-3.5 w-3.5 fill-current text-amber-400" />

      <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-amber-400 transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>

      <span className="w-8 text-right text-xs text-slate-400">
        {count}
      </span>
    </div>
  );
}

export default async function ResourceReviews({
  resourceId,
}: ResourceReviewsProps) {
  const supabase = await createClient();

  const { data: reviews, error: reviewsError } = await supabase
    .from("reviews")
    .select(
      "id, rating, review_text, created_at, user_id",
    )
    .eq("resource_id", resourceId)
    .order("created_at", { ascending: false });

  if (reviewsError) {
    return (
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex items-start gap-3">
          <MessageSquare className="mt-0.5 h-5 w-5 text-slate-400" />

          <div>
            <h2 className="font-bold text-slate-950">
              Reviews
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Reviews are temporarily unavailable.
            </p>
          </div>
        </div>
      </section>
    );
  }

  const reviewList = (reviews ?? []) as Review[];

  const totalReviews = reviewList.length;

  const totalRating = reviewList.reduce(
    (total, review) => total + Number(review.rating),
    0,
  );

  const averageRating =
    totalReviews > 0
      ? totalRating / totalReviews
      : 0;

  const roundedAverage = Math.round(averageRating);

  const ratingCounts = {
    5: reviewList.filter(
      (review) => Number(review.rating) === 5,
    ).length,
    4: reviewList.filter(
      (review) => Number(review.rating) === 4,
    ).length,
    3: reviewList.filter(
      (review) => Number(review.rating) === 3,
    ).length,
    2: reviewList.filter(
      (review) => Number(review.rating) === 2,
    ).length,
    1: reviewList.filter(
      (review) => Number(review.rating) === 1,
    ).length,
  };

  const userIds = [
    ...new Set(
      reviewList.map((review) => review.user_id),
    ),
  ];

  let profiles: Profile[] = [];

  if (userIds.length > 0) {
    const { data: profileData } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", userIds);

    profiles = (profileData ?? []) as Profile[];
  }

  const profileMap = new Map(
    profiles.map((profile) => [
      profile.id,
      profile,
    ]),
  );

  return (
    <section className="space-y-6">
      {/* Review form */}
      <ReviewForm resourceId={resourceId} />

      {/* Public reviews */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-500">
                <MessageSquare className="h-5 w-5" />
              </div>

              <div>
                <h2 className="text-xl font-bold text-slate-950">
                  Customer Reviews
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Feedback from the EduMarket community.
                </p>
              </div>
            </div>
          </div>

          {totalReviews > 0 && (
            <div className="flex items-center gap-2">
              <Stars
                rating={roundedAverage}
                size="normal"
              />

              <span className="text-sm font-bold text-slate-700">
                {averageRating.toFixed(1)}
              </span>
            </div>
          )}
        </div>

        {totalReviews === 0 ? (
          <div className="mt-8 rounded-2xl bg-slate-50 px-6 py-10 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-amber-400 shadow-sm">
              <Star className="h-7 w-7" />
            </div>

            <h3 className="mt-5 font-bold text-slate-950">
              No reviews yet
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              Be the first verified customer to share your experience
              with this resource.
            </p>
          </div>
        ) : (
          <>
            {/* Rating overview */}
            <div className="mt-8 grid gap-8 border-y border-slate-100 py-7 md:grid-cols-[180px_1fr]">
              <div className="text-center md:border-r md:border-slate-100 md:pr-8">
                <p className="text-5xl font-bold tracking-tight text-slate-950">
                  {averageRating.toFixed(1)}
                </p>

                <div className="mt-3 flex justify-center">
                  <Stars
                    rating={roundedAverage}
                    size="large"
                  />
                </div>

                <p className="mt-3 text-sm text-slate-500">
                  Based on {totalReviews}{" "}
                  {totalReviews === 1
                    ? "review"
                    : "reviews"}
                </p>
              </div>

              <div className="space-y-2.5">
                <RatingBar
                  rating={5}
                  count={ratingCounts[5]}
                  total={totalReviews}
                />

                <RatingBar
                  rating={4}
                  count={ratingCounts[4]}
                  total={totalReviews}
                />

                <RatingBar
                  rating={3}
                  count={ratingCounts[3]}
                  total={totalReviews}
                />

                <RatingBar
                  rating={2}
                  count={ratingCounts[2]}
                  total={totalReviews}
                />

                <RatingBar
                  rating={1}
                  count={ratingCounts[1]}
                  total={totalReviews}
                />
              </div>
            </div>

            {/* Review list */}
            <div className="mt-8">
              <div className="mb-5 flex items-center justify-between">
                <h3 className="font-bold text-slate-950">
                  What customers are saying
                </h3>

                <span className="text-xs font-medium text-slate-400">
                  {totalReviews}{" "}
                  {totalReviews === 1
                    ? "review"
                    : "reviews"}
                </span>
              </div>

              <div className="divide-y divide-slate-100">
                {reviewList.map((review) => {
                  const profile = profileMap.get(
                    review.user_id,
                  );

                  const reviewerName =
                    profile?.full_name?.trim() ||
                    "EduMarket Customer";

                  return (
                    <article
                      key={review.id}
                      className="py-6 first:pt-0 last:pb-0"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                            <UserRound className="h-5 w-5" />
                          </div>

                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-bold text-slate-900">
                                {reviewerName}
                              </p>

                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                                <CheckCircle2 className="h-3 w-3" />
                                Verified Purchase
                              </span>
                            </div>

                            <div className="mt-1.5">
                              <Stars
                                rating={Number(
                                  review.rating,
                                )}
                                size="small"
                              />
                            </div>
                          </div>
                        </div>

                        <time className="text-xs text-slate-400">
                          {formatDate(review.created_at)}
                        </time>
                      </div>

                      {review.review_text ? (
                        <div className="mt-4 rounded-2xl bg-slate-50 p-4 sm:ml-13">
                          <p className="whitespace-pre-line text-sm leading-6 text-slate-600">
                            {review.review_text}
                          </p>
                        </div>
                      ) : (
                        <p className="mt-4 text-sm italic text-slate-400 sm:ml-13">
                          This customer left a rating without written
                          feedback.
                        </p>
                      )}
                    </article>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}