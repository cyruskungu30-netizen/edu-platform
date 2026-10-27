 import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET() {
try {
const supabase = await createClient();
const {
  data: { user },
  error: authError,
} = await supabase.auth.getUser();

if (authError || !user) {
  return NextResponse.json(
    { error: "Please sign in to view your wishlist." },
    { status: 401 },
  );
}

const { data, error } = await supabase
  .from("wishlist")
  .select("id, resource_id, created_at")
  .eq("user_id", user.id)
  .order("created_at", { ascending: false });

if (error) {
  console.error("Wishlist retrieval failed:", error.message);

  return NextResponse.json(
    { error: "Unable to load your wishlist." },
    { status: 500 },
  );
}

return NextResponse.json({ items: data ?? [] });
} catch (error) {
console.error("Wishlist request failed:", error);
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
    { error: "Please sign in to manage your wishlist." },
    { status: 401 },
  );
}

const body: unknown = await request.json();

if (
  typeof body !== "object" ||
  body === null ||
  !("resourceId" in body) ||
  typeof body.resourceId !== "string" ||
  !body.resourceId.trim()
) {
  return NextResponse.json(
    { error: "A valid resource ID is required." },
    { status: 400 },
  );
}

const resourceId = body.resourceId.trim();

const { data: resource, error: resourceError } = await supabase
  .from("resources")
  .select("id")
  .eq("id", resourceId)
  .maybeSingle();

if (resourceError) {
  console.error(
    "Wishlist resource lookup failed:",
    resourceError.message,
  );

  return NextResponse.json(
    { error: "Unable to verify this resource." },
    { status: 500 },
  );
}

if (!resource) {
  return NextResponse.json(
    { error: "Resource not found." },
    { status: 404 },
  );
}

const { data: existing, error: existingError } = await supabase
  .from("wishlist")
  .select("id")
  .eq("user_id", user.id)
  .eq("resource_id", resourceId)
  .maybeSingle();

if (existingError) {
  console.error("Wishlist lookup failed:", existingError.message);

  return NextResponse.json(
    { error: "Unable to check your wishlist." },
    { status: 500 },
  );
}

if (existing) {
  const { error: deleteError } = await supabase
    .from("wishlist")
    .delete()
    .eq("id", existing.id)
    .eq("user_id", user.id);

  if (deleteError) {
    console.error(
      "Wishlist removal failed:",
      deleteError.message,
    );

    return NextResponse.json(
      { error: "Unable to remove this resource." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    saved: false,
    message: "Resource removed from your wishlist.",
  });
}

const { data: saved, error: insertError } = await supabase
  .from("wishlist")
  .insert({
    user_id: user.id,
    resource_id: resourceId,
  })
  .select("id, resource_id, created_at")
  .single();

if (insertError) {
  console.error("Wishlist save failed:", insertError.message);

  return NextResponse.json(
    { error: "Unable to save this resource." },
    { status: 500 },
  );
}

return NextResponse.json(
  {
    saved: true,
    item: saved,
    message: "Resource added to your wishlist.",
  },
  { status: 201 },
);
} catch (error) {
console.error("Wishlist update failed:", error);
return NextResponse.json(
  { error: "An unexpected error occurred." },
  { status: 500 },
);
}
}

