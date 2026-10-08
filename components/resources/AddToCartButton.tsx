"use client";

import { ShoppingCart, Loader2 } from "lucide-react";
import { useState } from "react";

import { useCart } from "@/hooks/useCart";

type AddToCartButtonProps = {
  resourceId: string;
  className?: string;
};

export default function AddToCartButton({
  resourceId,
  className = "",
}: AddToCartButtonProps) {
  const { addItem, busy } = useCart();

  const [message, setMessage] = useState("");

  async function handleAdd() {
    try {
      setMessage("");

      await addItem(resourceId, 1);

      setMessage("Added to cart");
    } catch {
      setMessage("Please sign in to add items.");
    }
  }

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={handleAdd}
        disabled={busy}
        className={`inline-flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-600 bg-white px-5 py-3 text-sm font-bold text-emerald-700 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
      >
        {busy ? (
          <Loader2
            size={18}
            className="animate-spin"
          />
        ) : (
          <ShoppingCart size={18} />
        )}

        {busy ? "Adding..." : "Add to Cart"}
      </button>

      {message && (
        <p className="mt-2 text-center text-xs font-semibold text-emerald-600">
          {message}
        </p>
      )}
    </div>
  );
}