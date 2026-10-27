 import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type Resource = {
  id: string;
  title: string;
  description?: string | null;
  category?: string | null;
  price?: number | null;
  thumbnail_url?: string | null;
  created_at?: string | null;
};

export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Sign in to receive personalized recommendations." },
        { status: 401 },
      );
    }

    const { data: wishlistData } = await supabase
      .from("wishlist")
      .select("resource_id")
      .eq("user_id", user.id)
      .limit(100);

    const wishlistIds = (wishlistData ?? [])
      .map((item) => item.resource_id as string)
      .filter(Boolean);

    const { data: recentData } = await supabase
      .from("recently_viewed")
      .select("resource_id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    const recentIds = (recentData ?? [])
      .map((item) => item.resource_id as string)
      .filter(Boolean);

    const excludedIds = [...new Set([...wishlistIds, ...recentIds])];

    const { data: resourceData, error: resourceError } = await supabase
      .from("resources")
      .select(
        "id, title, description, category, price, thumbnail_url, created_at",
      )
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(200);

    if (resourceError) {
      console.error(
        "Recommendations resource query failed:",
        resourceError.message,
      );

      return NextResponse.json(
        { error: "Unable to load recommendations." },
        { status: 500 },
      );
    }

    const resources = (resourceData ?? []) as Resource[];

    const categoryCounts = new Map<string, number>();

    if (wishlistIds.length > 0) {
      const { data: wishlistResources } = await supabase
        .from("resources")
        .select("category")
        .in("id", wishlistIds);

      for (const resource of wishlistResources ?? []) {
        const category = resource.category as string | null;

        if (category) {
          categoryCounts.set(
            category,
            (categoryCounts.get(category) ?? 0) + 3,
          );
        }
      }
    }

    if (recentIds.length > 0) {
      const { data: recentResources } = await supabase
        .from("resources")
        .select("category")
        .in("id", recentIds);

      for (const resource of recentResources ?? []) {
        const category = resource.category as string | null;

        if (category) {
          categoryCounts.set(
            category,
            (categoryCounts.get(category) ?? 0) + 1,
          );
        }
      }
    }

    const recommendations = resources
      .filter((resource) => !excludedIds.includes(resource.id))
      .map((resource) => {
        const categoryScore = resource.category
          ? categoryCounts.get(resource.category) ?? 0
          : 0;

        const ageInDays = resource.created_at
          ? Math.max(
              0,
              (Date.now() - new Date(resource.created_at).getTime()) /
                86_400_000,
            )
          : 365;

        const freshnessScore = Math.max(0, 10 - ageInDays / 7);

        return {
          ...resource,
          recommendationScore: categoryScore + freshnessScore,
          recommendationReason:
            categoryScore > 0
              ? "Based on categories you have explored"
              : "Recently published resource",
        };
      })
      .sort(
        (a, b) => b.recommendationScore - a.recommendationScore,
      )
      .slice(0, 20);

    return NextResponse.json(
      {
        success: true,
        recommendations,
        personalized: categoryCounts.size > 0,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "private, no-store",
        },
      },
    );
  } catch (error) {
    console.error("Recommendations API error:", error);

    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 },
    );
  }
}