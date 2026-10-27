import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type Resource = {
  id: string;
  title: string;
  category: string | null;
  created_at: string;
  educator_id?: string | null;
  user_id?: string | null;
  seller_id?: string | null;
};

export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      return NextResponse.json(
        { error: "Authentication could not be verified." },
        { status: 401 },
      );
    }

    const { data, error } = await supabase
      .from("resources")
      .select("*")
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(500);

    if (error) {
      console.error("Top educators query failed:", error.message);

      return NextResponse.json(
        { error: "Unable to load top educators." },
        { status: 500 },
      );
    }

    const resources = (data ?? []) as Resource[];

    const educatorMap = new Map<
      string,
      {
        id: string;
        resourceCount: number;
        categories: Set<string>;
        latestResource: string;
        latestResourceDate: string;
      }
    >();

    for (const resource of resources) {
      const educatorId =
        resource.educator_id ??
        resource.user_id ??
        resource.seller_id;

      if (!educatorId) continue;

      const existing = educatorMap.get(educatorId);

      if (existing) {
        existing.resourceCount += 1;

        if (resource.category) {
          existing.categories.add(resource.category);
        }

        if (
          new Date(resource.created_at).getTime() >
          new Date(existing.latestResourceDate).getTime()
        ) {
          existing.latestResource = resource.title;
          existing.latestResourceDate = resource.created_at;
        }
      } else {
        educatorMap.set(educatorId, {
          id: educatorId,
          resourceCount: 1,
          categories: new Set(
            resource.category ? [resource.category] : [],
          ),
          latestResource: resource.title,
          latestResourceDate: resource.created_at,
        });
      }
    }

    const educators = [...educatorMap.values()]
      .sort((a, b) => b.resourceCount - a.resourceCount)
      .slice(0, 50)
      .map((educator, index) => ({
        id: educator.id,
        name: `Educator ${index + 1}`,
        resourceCount: educator.resourceCount,
        categories: [...educator.categories],
        latestResource: educator.latestResource,
        latestResourceDate: educator.latestResourceDate,
      }));

    return NextResponse.json(
      {
        educators,
        totalEducators: educatorMap.size,
        totalResources: resources.length,
        currentUserId: user?.id ?? null,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "private, no-store",
        },
      },
    );
  } catch (error) {
    console.error("Top educators API error:", error);

    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 },
    );
  }
}