import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const COOKIE_NAME = "edumarket_recently_viewed";
const MAX_ITEMS = 20;
const MAX_COOKIE_AGE = 60 * 60 * 24 * 30;

function readRecentlyViewed(value: string | undefined): string[] {
  if (!value) return [];

  try {
    const parsed: unknown = JSON.parse(value);

    if (!Array.isArray(parsed)) return [];

    return [
      ...new Set(
        parsed.filter(
          (item): item is string =>
            typeof item === "string" &&
            item.length > 0 &&
            item.length <= 200,
        ),
      ),
    ].slice(0, MAX_ITEMS);
  } catch {
    return [];
  }
}

function validResourceId(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0 &&
    value.trim().length <= 200
  );
}

export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const cookieStore = await import("next/headers").then((module) =>
      module.cookies(),
    );

    const ids = readRecentlyViewed(
      cookieStore.get(COOKIE_NAME)?.value,
    );

    if (ids.length === 0) {
      return NextResponse.json({ resources: [] });
    }

    let query = supabase
      .from("resources")
      .select("id, title, description, price, category, thumbnail_url")
      .in("id", ids);

    if (user) {
      query = query.eq("status", "published");
    } else {
      query = query.eq("status", "published");
    }

    const { data, error } = await query;

    if (error) {
      console.error("Recently viewed lookup failed:", error.message);

      return NextResponse.json(
        { error: "Unable to load recently viewed resources." },
        { status: 500 },
      );
    }

    const resourceMap = new Map(
      (data ?? []).map((resource) => [String(resource.id), resource]),
    );

    const resources = ids
      .map((id) => resourceMap.get(id))
      .filter((resource) => resource !== undefined);

    return NextResponse.json({ resources });
  } catch (error) {
    console.error("Recently viewed request failed:", error);

    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();

    if (
      typeof body !== "object" ||
      body === null ||
      !("resourceId" in body) ||
      !validResourceId(body.resourceId)
    ) {
      return NextResponse.json(
        { error: "A valid resource ID is required." },
        { status: 400 },
      );
    }

    const resourceId = body.resourceId.trim();
    const supabase = await createClient();

    const { data: resource, error } = await supabase
      .from("resources")
      .select("id")
      .eq("id", resourceId)
      .eq("status", "published")
      .maybeSingle();

    if (error) {
      console.error("Resource verification failed:", error.message);

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

    const cookieStore = await import("next/headers").then((module) =>
      module.cookies(),
    );

    const existing = readRecentlyViewed(
      cookieStore.get(COOKIE_NAME)?.value,
    );

    const updated = [
      resourceId,
      ...existing.filter((id) => id !== resourceId),
    ].slice(0, MAX_ITEMS);

    const response = NextResponse.json({
      success: true,
      resourceId,
      count: updated.length,
    });

    response.cookies.set(COOKIE_NAME, JSON.stringify(updated), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: MAX_COOKIE_AGE,
    });

    return response;
  } catch (error) {
    console.error("Recently viewed update failed:", error);

    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 },
    );
  }
}

export async function DELETE() {
  const response = NextResponse.json({
    success: true,
    resources: [],
  });

  response.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}