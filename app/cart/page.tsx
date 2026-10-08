"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  ShoppingCart,
} from "lucide-react";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import CartItem from "@/components/cart/CartItem";
import CartSummary from "@/components/cart/CartSummary";
import { useCart } from "@/hooks/useCart";

export default function CartPage() {
  const {
    items,
    loading,
    busy,
    error,
    itemCount,
    subtotal,
    changeQuantity,
    removeItem,
    emptyCart,
  } = useCart();

  return (
    <>
      <Header />

      <main className="min-h-screen bg-slate-50">
        <section className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
            <Link
              href="/resources"
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-emerald-600"
            >
              <ArrowLeft size={16} />
              Continue shopping
            </Link>

            <div className="mt-6 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                <ShoppingCart size={24} />
              </div>

              <div>
                <h1 className="text-3xl font-black text-slate-900">
                  Your Cart
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                  Review your educational resources before
                  checkout.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          {loading ? (
            <div className="flex min-h-[400px] items-center justify-center rounded-3xl border border-slate-200 bg-white">
              <div className="flex flex-col items-center gap-3">
                <Loader2
                  size={32}
                  className="animate-spin text-emerald-600"
                />

                <p className="text-sm font-semibold text-slate-500">
                  Loading your cart...
                </p>
              </div>
            </div>
          ) : error ? (
            <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-center">
              <h2 className="text-xl font-black text-red-800">
                Unable to load your cart
              </h2>

              <p className="mt-2 text-sm text-red-700">
                {error}
              </p>

              <Link
                href="/auth/login"
                className="mt-6 inline-flex rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white"
              >
                Sign in
              </Link>
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <ShoppingCart size={30} />
              </div>

              <h2 className="mt-5 text-2xl font-black text-slate-900">
                Your cart is empty
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                Browse our educational resources and add
                the materials you need.
              </p>

              <Link
                href="/resources"
                className="mt-7 inline-flex rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-emerald-700"
              >
                Browse Resources
              </Link>
            </div>
          ) : (
            <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
              <div>
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-slate-900">
                      {itemCount}{" "}
                      {itemCount === 1 ? "item" : "items"}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Your selected resources
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => emptyCart()}
                    className="text-xs font-bold text-red-500 transition hover:text-red-700 disabled:opacity-40"
                  >
                    Clear cart
                  </button>
                </div>

                <div className="space-y-4">
                  {items.map((item) => (
                    <CartItem
                      key={item.id}
                      item={item}
                      busy={busy}
                      onQuantityChange={changeQuantity}
                      onRemove={removeItem}
                    />
                  ))}
                </div>
              </div>

              <CartSummary
                itemCount={itemCount}
                subtotal={subtotal}
              />
            </div>
          )}
        </section>
      </main>

      <Footer />
    </>
  );
}