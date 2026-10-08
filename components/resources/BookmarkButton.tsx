"use client";

import { useEffect, useState } from "react";
import { Bookmark, LoaderCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type BookmarkButtonProps = {
  resourceId: string;
  className?: string;
};

export default function BookmarkButton({
  resourceId,
  className = "",
}: BookmarkButtonProps) {
  const [userId, setUserId] = useState<string | null>(null);
  const [bookmarkId, setBookmarkId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadBookmark() {
      setLoading(true);
      setError("");

      try {
        const supabase = createClient();

        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) throw authError;
        if (cancelled) return;

        if (!user) {
          setUserId(null);
          setBookmarkId(null);
          return;
        }

        setUserId(user.id);

        const { data, error: bookmarkError } = await supabase
          .from("resource_bookmarks")
          .select("id")
          .eq("user_id", user.id)
          .eq("resource_id", resourceId)
          .maybeSingle();

        if (bookmarkError) throw bookmarkError;
        if (cancelled) return;

        setBookmarkId(data?.id ?? null);
      } catch {
        if (!cancelled) {
          setError("Unable to load bookmark.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadBookmark();

    return () => {
      cancelled = true;
    };
  }, [resourceId]);

  async function toggleBookmark() {
    setError("");

    if (!userId) {
      setError("Please sign in to save resources.");
      return;
    }

    if (saving || loading) return;

    setSaving(true);

    try {
      const supabase = createClient();

      if (bookmarkId) {
        const { error: deleteError } = await supabase
          .from("resource_bookmarks")
          .delete()
          .eq("id", bookmarkId)
          .eq("user_id", userId);

        if (deleteError) throw deleteError;

        setBookmarkId(null);
      } else {
        const { data, error: insertError } = await supabase
          .from("resource_bookmarks")
          .insert({
            user_id: userId,
            resource_id: resourceId,
          })
          .select("id")
          .single();

        if (insertError) throw insertError;

        setBookmarkId(data.id);
      }
    } catch {
      setError("Unable to update bookmark. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const bookmarked = Boolean(bookmarkId);

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={toggleBookmark}
        disabled={loading || saving}
        aria-pressed={bookmarked}
        aria-label={
          bookmarked ? "Remove saved resource" : "Save resource"
        }
        title={
          bookmarked ? "Remove from saved resources" : "Save resource"
        }
        className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
          bookmarked
            ? "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100"
            : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
        } ${className}`}
      >
        {loading || saving ? (
          <LoaderCircle size={17} className="animate-spin" />
        ) : (
          <Bookmark
            size={17}
            className={bookmarked ? "fill-current" : ""}
          />
        )}

        {loading
          ? "Loading..."
          : saving
            ? "Saving..."
            : bookmarked
              ? "Saved"
              : "Save"}
      </button>

      {error && (
        <p role="status" className="max-w-48 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}