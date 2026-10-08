"use client";

import { CheckCircle2, Loader2, Star, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";

type ReviewFormProps = {
  resourceId: string;
};

type Review = {
  id: string;
  rating: number;
  review_text: string | null;
};

export default function ReviewForm({
  resourceId,
}: ReviewFormProps) {
  const supabase = createClient();

  const [userId, setUserId] = useState<string | null>(null);
  const [review, setReview] = useState<Review | null>(null);

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [canReview, setCanReview] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<
    "success" | "error" | ""
  >("");

  async function loadReviewData() {
    try {
      setLoading(true);
      setMessage("");
      setMessageType("");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw new Error(userError.message);
      }

      if (!user) {
        setUserId(null);
        setCanReview(false);
        setReview(null);
        return;
      }

      setUserId(user.id);

      const { data: entitlement, error: entitlementError } =
        await supabase
          .from("entitlements")
          .select("id")
          .eq("user_id", user.id)
          .eq("resource_id", resourceId)
          .limit(1)
          .maybeSingle();

      if (entitlementError) {
        throw new Error(entitlementError.message);
      }

      const { data: existingReview, error: reviewError } =
        await supabase
          .from("reviews")
          .select("id, rating, review_text")
          .eq("user_id", user.id)
          .eq("resource_id", resourceId)
          .maybeSingle();

      if (reviewError) {
        throw new Error(reviewError.message);
      }

      setCanReview(Boolean(entitlement));

      if (existingReview) {
        setReview(existingReview);
        setRating(Number(existingReview.rating));
        setReviewText(existingReview.review_text ?? "");
      } else {
        setReview(null);
        setRating(0);
        setReviewText("");
      }
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to load review information.",
      );
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReviewData();
  }, [resourceId]);

  async function submitReview() {
    if (!userId) {
      window.location.href = `/auth/login?redirect=/resources/${resourceId}`;
      return;
    }

    if (!canReview) {
      setMessage(
        "You must purchase this resource before reviewing it.",
      );
      setMessageType("error");
      return;
    }

    if (rating < 1 || rating > 5) {
      setMessage("Please select a rating from 1 to 5 stars.");
      setMessageType("error");
      return;
    }

    const trimmedText = reviewText.trim();

    if (trimmedText.length > 2000) {
      setMessage(
        "Your review must be 2000 characters or less.",
      );
      setMessageType("error");
      return;
    }

    try {
      setSaving(true);
      setMessage("");
      setMessageType("");

      if (review) {
        const { data, error } = await supabase
          .from("reviews")
          .update({
            rating,
            review_text: trimmedText || null,
          })
          .eq("id", review.id)
          .eq("user_id", userId)
          .select("id, rating, review_text")
          .single();

        if (error) {
          throw new Error(error.message);
        }

        setReview(data);

        setMessage("Your review has been updated successfully.");
        setMessageType("success");
      } else {
        const { data, error } = await supabase
          .from("reviews")
          .insert({
            user_id: userId,
            resource_id: resourceId,
            rating,
            review_text: trimmedText || null,
          })
          .select("id, rating, review_text")
          .single();

        if (error) {
          throw new Error(error.message);
        }

        setReview(data);

        setMessage("Thank you! Your review has been submitted.");
        setMessageType("success");
      }
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to save your review.",
      );
      setMessageType("error");
    } finally {
      setSaving(false);
    }
  }

  async function deleteReview() {
    if (!review || !userId) {
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to delete your review?",
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeleting(true);
      setMessage("");
      setMessageType("");

      const { error } = await supabase
        .from("reviews")
        .delete()
        .eq("id", review.id)
        .eq("user_id", userId);

      if (error) {
        throw new Error(error.message);
      }

      setReview(null);
      setRating(0);
      setReviewText("");

      setMessage("Your review has been deleted.");
      setMessageType("success");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to delete your review.",
      );
      setMessageType("error");
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-blue-600" />

          <p className="text-sm font-medium text-slate-500">
            Checking review eligibility...
          </p>
        </div>
      </section>
    );
  }

  if (!userId) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <Star className="mt-0.5 h-5 w-5 text-amber-400" />

          <div>
            <h2 className="font-bold text-slate-950">
              Rate this resource
            </h2>

            <p className="mt-1 text-sm leading-6 text-slate-500">
              Sign in and purchase this resource to share your
              experience.
            </p>

            <a
              href={`/auth/login?redirect=/resources/${resourceId}`}
              className="mt-4 inline-flex rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700"
            >
              Sign In
            </a>
          </div>
        </div>
      </section>
    );
  }

  if (!canReview) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <Star className="mt-0.5 h-5 w-5 text-amber-400" />

          <div>
            <h2 className="font-bold text-slate-950">
              Review this resource
            </h2>

            <p className="mt-1 text-sm leading-6 text-slate-500">
              Reviews are available to customers who have purchased
              this resource.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
      <div>
        <h2 className="text-xl font-bold text-slate-950">
          {review ? "Your Review" : "Rate this Resource"}
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          {review
            ? "Update your rating or feedback whenever you need."
            : "Share your experience to help other educators and learners."}
        </p>
      </div>

      {/* Rating */}
      <div className="mt-6">
        <p className="text-sm font-bold text-slate-800">
          Your rating
        </p>

        <div
          className="mt-3 flex items-center gap-1"
          onMouseLeave={() => setHoverRating(0)}
        >
          {[1, 2, 3, 4, 5].map((star) => {
            const active =
              star <= (hoverRating || rating);

            return (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                aria-label={`${star} star${star > 1 ? "s" : ""}`}
                className="rounded-lg p-1.5 transition hover:bg-amber-50"
              >
                <Star
                  className={`h-8 w-8 transition ${
                    active
                      ? "fill-current text-amber-400"
                      : "text-slate-300"
                  }`}
                />
              </button>
            );
          })}
        </div>

        <p className="mt-2 text-xs font-medium text-slate-400">
          {rating === 0
            ? "Select a rating"
            : `${rating} out of 5 stars`}
        </p>
      </div>

      {/* Review */}
      <div className="mt-6">
        <div className="flex items-center justify-between gap-4">
          <label
            htmlFor="review-text"
            className="text-sm font-bold text-slate-800"
          >
            Written review
          </label>

          <span className="text-xs text-slate-400">
            {reviewText.length}/2000
          </span>
        </div>

        <textarea
          id="review-text"
          value={reviewText}
          onChange={(event) =>
            setReviewText(event.target.value.slice(0, 2000))
          }
          placeholder="What did you think about this resource?"
          rows={6}
          className="mt-3 w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
      </div>

      {/* Message */}
      {message && (
        <div
          className={`mt-5 flex items-start gap-3 rounded-xl border p-4 ${
            messageType === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {messageType === "success" && (
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
          )}

          <p className="text-sm font-medium">
            {message}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={submitReview}
          disabled={saving || deleting}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Star
                className={`h-4 w-4 ${
                  rating > 0 ? "fill-current" : ""
                }`}
              />
              {review ? "Update Review" : "Submit Review"}
            </>
          )}
        </button>

        {review && (
          <button
            type="button"
            onClick={deleteReview}
            disabled={saving || deleting}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 px-5 py-3 text-sm font-bold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {deleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}

            Delete Review
          </button>
        )}
      </div>

      <div className="mt-5 rounded-xl bg-slate-50 p-4">
        <p className="text-xs leading-5 text-slate-500">
          <strong className="text-slate-700">
            Verified purchase:
          </strong>{" "}
          Only users who have purchased this resource can submit a
          review.
        </p>
      </div>
    </section>
  );
}