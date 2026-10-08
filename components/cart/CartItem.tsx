"use client";

import {
  FileText,
  Minus,
  Plus,
  Trash2,
} from "lucide-react";

import type { CartItem as CartItemType } from "@/lib/db/cart";

type CartItemProps = {
  item: CartItemType;
  busy: boolean;
  onQuantityChange: (
    cartItemId: string,
    quantity: number,
  ) => void;
  onRemove: (cartItemId: string) => void;
};

export default function CartItem({
  item,
  busy,
  onQuantityChange,
  onRemove,
}: CartItemProps) {
  const price = Number(item.resource.price);
  const total = price * item.quantity;

  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-center">
      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
        <FileText size={27} />
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="font-bold text-slate-900">
          {item.resource.title}
        </h3>

        <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-500">
          <span>{item.resource.format}</span>

          <span>•</span>

          <span>
            KES {price.toLocaleString()}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-5 sm:justify-end">
        <div className="flex items-center rounded-xl border border-slate-200">
          <button
            type="button"
            disabled={busy}
            onClick={() =>
              onQuantityChange(
                item.id,
                item.quantity - 1,
              )
            }
            className="p-2.5 text-slate-600 transition hover:bg-slate-50 disabled:opacity-40"
            aria-label="Decrease quantity"
          >
            <Minus size={16} />
          </button>

          <span className="min-w-10 text-center text-sm font-bold text-slate-900">
            {item.quantity}
          </span>

          <button
            type="button"
            disabled={busy}
            onClick={() =>
              onQuantityChange(
                item.id,
                item.quantity + 1,
              )
            }
            className="p-2.5 text-slate-600 transition hover:bg-slate-50 disabled:opacity-40"
            aria-label="Increase quantity"
          >
            <Plus size={16} />
          </button>
        </div>

        <div className="min-w-24 text-right">
          <p className="font-black text-slate-900">
            KES {total.toLocaleString()}
          </p>

          <button
            type="button"
            disabled={busy}
            onClick={() => onRemove(item.id)}
            className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-red-500 transition hover:text-red-700 disabled:opacity-40"
          >
            <Trash2 size={13} />
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}