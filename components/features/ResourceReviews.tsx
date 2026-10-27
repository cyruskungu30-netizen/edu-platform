"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  LoaderCircle,
  MessageSquare,
  RefreshCw,
  Star,
} from "lucide-react";

type Review = {
  id: string;
  resource_id: string;
  user_id: string;
  rating: number;
  review: string;
  created_at: string;
};

type RatingDistribution = {
  rating: number;
  count: number;
};

type ReviewsResponse = {
  reviews?: Review[];
  summary?: {
    count: number;
    averageRating: number;
    distribution: RatingDistribution[];
  };
  error?: string;
};

type ResourceReviewsProps = {
  resourceId: string;
  title?: string;
};

const MAX_REVIEW_LENGTH = 2000;
const MIN_REVIEW_LENGTH = 5;

function StarRating({
  rating,
  size = 18,
}: {
  rating: number;
  size?: number;
}) {
  return (
    <div
      className="inline-flex items-center gap-1"
      aria-label={`${rating} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={size}
          className={
            star <= rating
              ? "fill-amber-400 text-amber-400"
              : "fill-slate-100 text-slate-300"
          }
          aria-hidden="true"
        />
      ))}
    </div>
  );
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Recently";
  }

  return new Intl.DateTimeFormat("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export default function ResourceReviews({
  resourceId,
  title = "Ratings and reviews",
}: ResourceReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [distribution, setDistribution] = useState<RatingDistribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedRating, setSelectedRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [notice, setNotice] = useState("");
  const [noticeType, setNoticeType] = useState<"success" | "error">("success");

  const loadReviews = useCallback(async () => {
    if (!resourceId) {
      setLoading(false);
      setNotice("A valid resource ID is required.");
      setNoticeType("error");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `/api/reviews?resourceId=${encodeURIComponent(resourceId)}`,
        {
          method: "GET",
          cache: "no-store",
          credentials: "same-origin",
        },
      );

      const result: ReviewsResponse = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unable to load reviews.");
      }

      setReviews(Array.isArray(result.reviews) ? result.reviews : []);
      setAverageRating(result.summary?.averageRating ?? 0);
      setTotalReviews(result.summary?.count ?? 0);
      setDistribution(result.summary?.distribution ?? []);
      setNotice("");
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : "Unable to load reviews.",
      );
      setNoticeType("error");
    } finally {
      setLoading(false);
    }
  }, [resourceId]);

  useEffect(() => {
    void loadReviews();
  }, [loadReviews]);

  async function submitReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice("");

    if (selectedRating < 1 || selectedRating > 5) {
      setNotice("Please select a star rating.");
      setNoticeType("error");
      return;
    }

    const trimmedReview = reviewText.trim();

    if (
      trimmedReview.length < MIN_REVIEW_LENGTH ||
      trimmedReview.length > MAX_REVIEW_LENGTH
    ) {
      setNotice(
        `Your review must contain ${MIN_REVIEW_LENGTH}–${MAX_REVIEW_LENGTH} characters.`,
      );
      setNoticeType("error");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify({
          resourceId,
          rating: selectedRating,
          review: trimmedReview,
        }),
      });

      const result: ReviewsResponse = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unable to submit your review.");
      }

      setNotice("Your review has been submitted successfully.");
      setNoticeType("success");
      setReviewText("");
      setSelectedRating(0);

      await loadReviews();
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "Unable to submit your review.",
      );
      setNoticeType("error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="w-full py-10">
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700">
              <Star size={14} className="fill-current" />
              COMMUNITY FEEDBACK
            </div>

            <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
              {title}
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Discover what learners think about this resource.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadReviews()}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={loading ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </div>

        <div className="mt-8 grid gap-6 rounded-2xl bg-slate-50 p-5 md:grid-cols-[220px_1fr] md:p-6">
          <div className="flex flex-col items-center justify-center border-b border-slate-200 pb-5 text-center md:border-b-0 md:border-r md:pb-0 md:pr-6">
            <span className="text-5xl font-black tracking-tight text-slate-950">
              {averageRating.toFixed(1)}
            </span>

            <div className="mt-3">
              <StarRating rating={Math.round(averageRating)} size={20} />
            </div>

            <p className="mt-3 text-sm text-slate-500">
              {totalReviews}{" "}
              {totalReviews === 1 ? "review" : "reviews"}
            </p>
          </div>

          <div className="flex flex-col justify-center gap-3">
            {[5, 4, 3, 2, 1].map((rating) => {
              const count =
                distribution.find((item) => item.rating === rating)?.count ?? 0;

              const percentage =
                totalReviews > 0 ? (count / totalReviews) * 100 : 0;

              return (
                <div
                  key={rating}
                  className="grid grid-cols-[35px_1fr_35px] items-center gap-3"
                >
                  <span className="text-sm font-semibold text-slate-600">
                    {rating} ★
                  </span>

                  <div
                    className="h-2.5 overflow-hidden rounded-full bg-slate-200"
                    role="progressbar"
                    aria-label={`${rating}-star reviews`}
                    aria-valuenow={count}
                    aria-valuemin={0}
                    aria-valuemax={totalReviews}
                  >
                    <div
                      className="h-full rounded-full bg-amber-400 transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>

                  <span className="text-right text-xs font-semibold text-slate-500">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-8 border-t border-slate-100 pt-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
              <MessageSquare size={21} />
            </div>

            <div>
              <h3 className="text-lg font-black text-slate-950">
                Share your experience
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Help other learners make informed choices.
              </p>
            </div>
          </div>

          <form onSubmit={submitReview} className="mt-6 space-y-5">
            <fieldset>
              <legend className="mb-3 text-sm font-bold text-slate-800">
                Your rating
              </legend>

              <div className="flex flex-wrap items-center gap-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    type="button"
                    onClick={() => setSelectedRating(rating)}
                    onMouseEnter={() => setHoverRating(rating)}
                    onMouseLeave={() => setHoverRating(0)}
                    onFocus={() => setHoverRating(rating)}
                    onBlur={() => setHoverRating(0)}
                    aria-label={`Rate ${rating} out of 5`}
                    aria-pressed={selectedRating === rating}
                    className="rounded-lg p-1 transition hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                  >
                    <Star
                      size={32}
                      className={
                        rating <= (hoverRating || selectedRating)
                          ? "fill-amber-400 text-amber-400"
                          : "text-slate-300"
                      }
                    />
                  </button>
                ))}

                <span className="ml-2 text-sm font-semibold text-slate-500">
                  {selectedRating === 0
                    ? "Select a rating"
                    : [
                        "",
                        "Poor",
                        "Fair",
                        "Good",
                        "Very good",
                        "Excellent",
                      ][selectedRating]}
                </span>
              </div>
            </fieldset>

            <div>
              <label
                htmlFor="resource-review"
                className="mb-2 block text-sm font-bold text-slate-800"
              >
                Your review
              </label>

              <textarea
                id="resource-review"
                value={reviewText}
                onChange={(event) => setReviewText(event.target.value)}
                maxLength={MAX_REVIEW_LENGTH}
                minLength={MIN_REVIEW_LENGTH}
                rows={5}
                placeholder="What did you find useful? Would you recommend this resource?"
                className="w-full resize-y rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                required
              />

              <div className="mt-2 flex justify-between gap-3 text-xs text-slate-400">
                <span>
                  Minimum {MIN_REVIEW_LENGTH} characters.
                </span>

                <span>
                  {reviewText.length}/{MAX_REVIEW_LENGTH}
                </span>
              </div>
            </div>

            {notice && (
              <div
                role={noticeType === "error" ? "alert" : "status"}
                className={`flex items-start gap-3 rounded-xl border p-4 text-sm ${
                  noticeType === "error"
                    ? "border-red-200 bg-red-50 text-red-700"
                    : "border-emerald-200 bg-emerald-50 text-emerald-700"
                }`}
              >
                {noticeType === "error" ? (
                  <AlertCircle size={19} className="mt-0.5 shrink-0" />
                ) : (
                  <CheckCircle2 size={19} className="mt-0.5 shrink-0" />
                )}

                <p>{notice}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || !resourceId}
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-6 py-3 text-sm font-bold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              {submitting ? (
                <>
                  <LoaderCircle size={18} className="animate-spin" />
                  Submitting review...
                </>
              ) : (
                <>
                  <Star size={18} />
                  Submit review
                </>
              )}
            </button>
          </form>
        </div>

        <div className="mt-10 border-t border-slate-100 pt-8">
          <h3 className="text-xl font-black text-slate-950">
            Learner feedback
          </h3>

          {loading ? (
            <div className="mt-5 space-y-4">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="animate-pulse rounded-2xl border border-slate-100 p-5"
                >
                  <div className="h-4 w-32 rounded bg-slate-200" />
                  <div className="mt-4 h-3 w-full rounded bg-slate-100" />
                  <div className="mt-2 h-3 w-3/4 rounded bg-slate-100" />
                </div>
              ))}
            </div>
          ) : reviews.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-dashed border-slate-300 px-5 py-10 text-center">
              <MessageSquare
                size={30}
                className="mx-auto text-slate-300"
              />

              <p className="mt-3 font-bold text-slate-800">
                Be the first to review this resource
              </p>

              <p className="mt-2 text-sm text-slate-500">
                Your feedback can help someone choose their next learning
                resource.
              </p>
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              {reviews.map((review) => (
                <article
                  key={review.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-slate-300"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <StarRating rating={review.rating} />

                      <p className="mt-2 text-xs text-slate-400">
                        {formatDate(review.created_at)}
                      </p>
                    </div>

                    <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
                      <CheckCircle2 size={14} />
                      Learner review
                    </span>
                  </div>

                  <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-7 text-slate-700">
                    {review.review}
                  </p>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}