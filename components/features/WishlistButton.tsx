"use client";

import { useCallback, useEffect, useState } from "react";
import { Heart, LoaderCircle } from "lucide-react";

type WishlistButtonProps = {
  resourceId: string;
  initialSaved?: boolean;
  className?: string;
  showLabel?: boolean;
  onChange?: (saved: boolean) => void;
};

export default function WishlistButton({
  resourceId,
  initialSaved = false,
  className = "",
  showLabel = true,
  onChange,
}: WishlistButtonProps) {
  const [saved, setSaved] = useState(initialSaved);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setSaved(initialSaved);
  }, [initialSaved]);

  const toggleWishlist = useCallback(async () => {
    if (!resourceId || loading) return;

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/wishlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify({ resourceId }),
      });

      const result: {
        saved?: boolean;
        error?: string;
        message?: string;
      } = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          setMessage("Please sign in to save resources.");
        } else {
          setMessage(result.error || "Unable to update your wishlist.");
        }

        return;
      }

      if (typeof result.saved !== "boolean") {
        setMessage("The server returned an unexpected response.");
        return;
      }

      setSaved(result.saved);
      setMessage(
        result.message ||
          (result.saved ? "Added to wishlist." : "Removed from wishlist."),
      );

      onChange?.(result.saved);
    } catch {
      setMessage("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [resourceId, loading, onChange]);

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={toggleWishlist}
        disabled={loading || !resourceId}
        aria-pressed={saved}
        aria-label={
          saved ? "Remove resource from wishlist" : "Save resource to wishlist"
        }
        title={saved ? "Remove from wishlist" : "Add to wishlist"}
        className={[
          "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl",
          "border px-4 py-2.5 text-sm font-bold transition-all duration-200",
          "focus-visible:outline-none focus-visible:ring-2",
          "focus-visible:ring-rose-500 focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-60",
          saved
            ? "border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100"
            : "border-slate-200 bg-white text-slate-700 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600",
          className,
        ].join(" ")}
      >
        {loading ? (
          <LoaderCircle
            size={18}
            className="animate-spin"
            aria-hidden="true"
          />
        ) : (
          <Heart
            size={18}
            className={saved ? "fill-current" : ""}
            aria-hidden="true"
          />
        )}

        {showLabel && (
          <span>
            {loading
              ? "Saving..."
              : saved
                ? "Saved"
                : "Add to wishlist"}
          </span>
        )}
      </button>

      {message && (
        <p
          role="status"
          aria-live="polite"
          className={`max-w-xs text-xs ${
            message.toLowerCase().includes("error") ||
            message.toLowerCase().includes("unable") ||
            message.toLowerCase().includes("sign in") ||
            message.toLowerCase().includes("connection")
              ? "text-red-600"
              : "text-slate-500"
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
}