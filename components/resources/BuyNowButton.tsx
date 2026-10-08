"use client";

import { ArrowRight, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useCart } from "@/hooks/useCart";

type BuyNowButtonProps = {
  resourceId: string;
  className?: string;
};

export default function BuyNowButton({
  resourceId,
  className = "",
}: BuyNowButtonProps) {
  const router = useRouter();

  const { addItem, busy } = useCart();

  const [error, setError] = useState("");

  async function handleBuyNow() {
    try {
      setError("");

      await addItem(resourceId, 1);

      router.push("/cart");
    } catch {
      setError("Please sign in before purchasing.");
    }
  }

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={handleBuyNow}
        disabled={busy}
        className={`inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
      >
        {busy ? (
          <Loader2
            size={18}
            className="animate-spin"
          />
        ) : (
          <ArrowRight size={18} />
        )}

        {busy ? "Processing..." : "Buy Now"}
      </button>

      {error && (
        <p className="mt-2 text-center text-xs font-semibold text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}