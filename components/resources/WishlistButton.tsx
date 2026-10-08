"use client";

import { Heart, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";

type WishlistButtonProps = {
  resourceId: string;
};

export default function WishlistButton({
  resourceId,
}: WishlistButtonProps) {
  const supabase = createClient();

  const [userId, setUserId] = useState<string | null>(null);
  const [wishlistId, setWishlistId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function loadWishlistState() {
    try {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setUserId(null);
        setWishlistId(null);
        return;
      }

      setUserId(user.id);

      const { data, error } = await supabase
        .from("wishlists")
        .select("id")
        .eq("user_id", user.id)
        .eq("resource_id", resourceId)
        .maybeSingle();

      if (error) {
        throw new Error(error.message);
      }

      setWishlistId(data?.id ?? null);
    } catch (error) {
      console.error("Wishlist state error:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadWishlistState();
  }, [resourceId]);

  async function toggleWishlist() {
    if (!userId) {
      window.location.href = `/auth/login?redirect=/resources/${resourceId}`;
      return;
    }

    try {
      setBusy(true);
      setMessage("");

      if (wishlistId) {
        const { error } = await supabase
          .from("wishlists")
          .delete()
          .eq("id", wishlistId)
          .eq("user_id", userId);

        if (error) {
          throw new Error(error.message);
        }

        setWishlistId(null);
        setMessage("Removed from wishlist");
      } else {
        const { data, error } = await supabase
          .from("wishlists")
          .insert({
            user_id: userId,
            resource_id: resourceId,
          })
          .select("id")
          .single();

        if (error) {
          throw new Error(error.message);
        }

        setWishlistId(data.id);
        setMessage("Added to wishlist");
      }

      window.setTimeout(() => {
        setMessage("");
      }, 2000);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to update wishlist.",
      );
    } finally {
      setBusy(false);
    }
  }

  const isSaved = Boolean(wishlistId);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={toggleWishlist}
        disabled={loading || busy}
        aria-label={
          isSaved
            ? "Remove from wishlist"
            : "Add to wishlist"
        }
        className={`inline-flex h-12 w-12 items-center justify-center rounded-xl border transition ${
          isSaved
            ? "border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
            : "border-slate-200 bg-white text-slate-600 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
        } disabled:cursor-not-allowed disabled:opacity-60`}
      >
        {loading || busy ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Heart
            className={`h-5 w-5 ${
              isSaved ? "fill-current" : ""
            }`}
          />
        )}
      </button>

      {message && (
        <div className="absolute right-0 top-14 z-20 whitespace-nowrap rounded-lg bg-slate-950 px-3 py-2 text-xs font-semibold text-white shadow-lg">
          {message}
        </div>
      )}
    </div>
  );
}