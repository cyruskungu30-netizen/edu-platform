"use client";

import Link from "next/link";
import { ArrowRight, ShoppingBag } from "lucide-react";

type CartSummaryProps = {
  itemCount: number;
  subtotal: number;
};

export default function CartSummary({
  itemCount,
  subtotal,
}: CartSummaryProps) {
  return (
    <aside className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-black text-slate-900">
        Order Summary
      </h2>

      <div className="mt-6 space-y-4">
        <div className="flex items-center justify-between text-sm text-slate-600">
          <span>Items</span>

          <span className="font-semibold text-slate-900">
            {itemCount}
          </span>
        </div>

        <div className="flex items-center justify-between text-sm text-slate-600">
          <span>Subtotal</span>

          <span className="font-semibold text-slate-900">
            KES {subtotal.toLocaleString()}
          </span>
        </div>

        <div className="border-t border-slate-200 pt-4">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-900">
              Total
            </span>

            <span className="text-xl font-black text-emerald-600">
              KES {subtotal.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      <Link
        href="/checkout"
        className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-emerald-700"
      >
        <ShoppingBag size={18} />
        Proceed to Checkout
        <ArrowRight size={17} />
      </Link>
    </aside>
  );
}