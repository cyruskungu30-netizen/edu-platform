import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const MAX_NOTIFICATIONS = 100;

function isValidId(value: unknown): value is string {
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
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Please sign in to view notifications." },
        { status: 401 },
      );
    }

    const { data, error } = await supabase
      .from("notifications")
      .select("id, title, message, type, is_read, created_at, link")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(MAX_NOTIFICATIONS);

    if (error) {
      console.error("Notification retrieval failed:", error.message);

      return NextResponse.json(
        { error: "Unable to load notifications." },
        { status: 500 },
      );
    }

    const notifications = data ?? [];

    return NextResponse.json({
      notifications,
      unreadCount: notifications.filter(
        (notification) => !notification.is_read,
      ).length,
    });
  } catch (error) {
    console.error("Notification request failed:", error);

    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Please sign in to update notifications." },
        { status: 401 },
      );
    }

    const body: unknown = await request.json();

    if (typeof body !== "object" || body === null) {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 },
      );
    }

    if (
      !("action" in body) ||
      (body.action !== "read" &&
        body.action !== "read_all" &&
        body.action !== "delete")
    ) {
      return NextResponse.json(
        { error: "Unsupported notification action." },
        { status: 400 },
      );
    }

    if (body.action === "read_all") {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", user.id)
        .eq("is_read", false);

      if (error) {
        console.error("Mark-all-read failed:", error.message);

        return NextResponse.json(
          { error: "Unable to mark notifications as read." },
          { status: 500 },
        );
      }

      return NextResponse.json({
        success: true,
        message: "All notifications marked as read.",
      });
    }

    if (!("id" in body) || !isValidId(body.id)) {
      return NextResponse.json(
        { error: "A valid notification ID is required." },
        { status: 400 },
      );
    }

    const notificationId = body.id.trim();

    if (body.action === "read") {
      const { data, error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", notificationId)
        .eq("user_id", user.id)
        .select("id")
        .maybeSingle();

      if (error) {
        console.error("Mark-read failed:", error.message);

        return NextResponse.json(
          { error: "Unable to update this notification." },
          { status: 500 },
        );
      }

      if (!data) {
        return NextResponse.json(
          { error: "Notification not found." },
          { status: 404 },
        );
      }

      return NextResponse.json({
        success: true,
        message: "Notification marked as read.",
      });
    }

    const { data, error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", notificationId)
      .eq("user_id", user.id)
      .select("id")
      .maybeSingle();

    if (error) {
      console.error("Notification deletion failed:", error.message);

      return NextResponse.json(
        { error: "Unable to delete this notification." },
        { status: 500 },
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: "Notification not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Notification deleted.",
    });
  } catch (error) {
    console.error("Notification update failed:", error);

    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 },
    );
  }
}