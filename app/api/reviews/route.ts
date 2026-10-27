import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const MAX_REVIEW_LENGTH = 2000;
const MIN_REVIEW_LENGTH = 5;

type ReviewRequest = {
  resourceId?: unknown;
  rating?: unknown;
  review?: unknown;
};

function isValidResourceId(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0 &&
    value.trim().length <= 200
  );
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const resourceId = url.searchParams.get("resourceId");

    if (!isValidResourceId(resourceId)) {
      return NextResponse.json(
        { error: "A valid resource ID is required." },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("resource_reviews")
      .select("id, resource_id, user_id, rating, review, created_at")
      .eq("resource_id", resourceId)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      console.error("Review retrieval failed:", error.message);

      return NextResponse.json(
        { error: "Unable to load reviews." },
        { status: 500 },
      );
    }

    const reviews = data ?? [];
    const total = reviews.length;

    const averageRating =
      total === 0
        ? 0
        : reviews.reduce(
            (sum, item) => sum + Number(item.rating || 0),
            0,
          ) / total;

    const distribution = [1, 2, 3, 4, 5].map((rating) => ({
      rating,
      count: reviews.filter(
        (item) => Number(item.rating) === rating,
      ).length,
    }));

    return NextResponse.json({
      reviews,
      summary: {
        count: total,
        averageRating: Number(averageRating.toFixed(1)),
        distribution,
      },
    });
  } catch (error) {
    console.error("Review request failed:", error);

    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Sign in to submit a review." },
        { status: 401 },
      );
    }

    const body = (await request.json()) as ReviewRequest;

    if (!isValidResourceId(body.resourceId)) {
      return NextResponse.json(
        { error: "A valid resource ID is required." },
        { status: 400 },
      );
    }

    if (
      typeof body.rating !== "number" ||
      !Number.isInteger(body.rating) ||
      body.rating < 1 ||
      body.rating > 5
    ) {
      return NextResponse.json(
        { error: "Rating must be an integer between 1 and 5." },
        { status: 400 },
      );
    }

    if (
      typeof body.review !== "string" ||
      body.review.trim().length < MIN_REVIEW_LENGTH ||
      body.review.trim().length > MAX_REVIEW_LENGTH
    ) {
      return NextResponse.json(
        {
          error: `Your review must contain ${MIN_REVIEW_LENGTH}–${MAX_REVIEW_LENGTH} characters.`,
        },
        { status: 400 },
      );
    }

    const resourceId = body.resourceId.trim();
    const reviewText = body.review.trim();

    const { data: resource, error: resourceError } = await supabase
      .from("resources")
      .select("id")
      .eq("id", resourceId)
      .eq("status", "published")
      .maybeSingle();

    if (resourceError) {
      console.error("Review resource lookup failed:", resourceError.message);

      return NextResponse.json(
        { error: "Unable to verify this resource." },
        { status: 500 },
      );
    }

    if (!resource) {
      return NextResponse.json(
        { error: "Published resource not found." },
        { status: 404 },
      );
    }

    const { data: existing, error: existingError } = await supabase
      .from("resource_reviews")
      .select("id")
      .eq("resource_id", resourceId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existingError) {
      console.error("Existing review lookup failed:", existingError.message);

      return NextResponse.json(
        { error: "Unable to verify your previous review." },
        { status: 500 },
      );
    }

    if (existing) {
      return NextResponse.json(
        {
          error:
            "You have already reviewed this resource. Editing reviews can be added separately.",
        },
        { status: 409 },
      );
    }

    const { data: savedReview, error: insertError } = await supabase
      .from("resource_reviews")
      .insert({
        resource_id: resourceId,
        user_id: user.id,
        rating: body.rating,
        review: reviewText,
      })
      .select("id, resource_id, user_id, rating, review, created_at")
      .single();

    if (insertError) {
      console.error("Review submission failed:", insertError.message);

      return NextResponse.json(
        { error: "Unable to submit your review." },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        review: savedReview,
        message: "Your review was submitted successfully.",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Review submission failed:", error);

    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 },
    );
  }
}