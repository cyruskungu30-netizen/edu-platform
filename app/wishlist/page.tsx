"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Heart,
  Loader2,
  ShoppingCart,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";

type WishlistResource = {
  wishlistId: string;
  resourceId: string;
  title: string;
  slug: string;
  description: string | null;
  price: number;
  format: string;
};

export default function WishlistPage() {
  const supabase = createClient();

  const [items, setItems] = useState<WishlistResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function loadWishlist() {
    try {
      setLoading(true);
      setError("");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw new Error(userError.message);
      }

      if (!user) {
        window.location.href = "/auth/login?redirect=/wishlist";
        return;
      }

      const { data, error: wishlistError } = await supabase
        .from("wishlists")
        .select(`
          id,
          resource_id,
          resource:resources (
            id,
            title,
            slug,
            description,
            price,
            format,
            status
          )
        `)
        .eq("user_id", user.id)
        .order("id", { ascending: false });

      if (wishlistError) {
        throw new Error(wishlistError.message);
      }

      const mappedItems: WishlistResource[] = (data ?? [])
        .map((item) => {
          const resource = Array.isArray(item.resource)
            ? item.resource[0]
            : item.resource;

          if (!resource || resource.status !== "published") {
            return null;
          }

          return {
            wishlistId: item.id,
            resourceId: resource.id,
            title: resource.title,
            slug: resource.slug,
            description: resource.description,
            price: Number(resource.price ?? 0),
            format: resource.format ?? "PDF",
          };
        })
        .filter((item): item is WishlistResource => item !== null);

      setItems(mappedItems);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load your wishlist.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadWishlist();
  }, []);

  async function removeFromWishlist(
    wishlistId: string,
  ) {
    try {
      setBusyId(wishlistId);
      setError("");

      const { error: deleteError } = await supabase
        .from("wishlists")
        .delete()
        .eq("id", wishlistId);

      if (deleteError) {
        throw new Error(deleteError.message);
      }

      setItems((current) =>
        current.filter(
          (item) => item.wishlistId !== wishlistId,
        ),
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to remove this resource.",
      );
    } finally {
      setBusyId(null);
    }
  }

  function formatMoney(value: number) {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      maximumFractionDigits: 2,
    }).format(value);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-4">
          <div className="text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />

            <p className="mt-4 text-sm font-medium text-slate-500">
              Loading your wishlist...
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6 lg:px-8">
          <Link
            href="/account"
            className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Account
          </Link>

          <div className="mt-5 flex items-center justify-between gap-4">
            <div>
              <h1 className="flex items-center gap-3 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                My Wishlist
                <Heart className="h-7 w-7 fill-current text-red-500" />
              </h1>

              <p className="mt-2 text-sm text-slate-500">
                Resources you have saved for later.
              </p>
            </div>

            <div className="hidden h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-500 sm:flex">
              <Heart className="h-6 w-6 fill-current" />
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Error */}
        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4">
            <p className="text-sm font-medium text-red-700">
              {error}
            </p>
          </div>
        )}

        {/* Empty state */}
        {items.length === 0 ? (
          <section className="rounded-3xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-500">
              <Heart className="h-8 w-8" />
            </div>

            <h2 className="mt-6 text-xl font-bold text-slate-950">
              Your wishlist is empty
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              Save educational resources you are interested in and
              come back to them whenever you are ready.
            </p>

            <Link
              href="/resources"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
            >
              Browse Resources
              <ArrowRight className="h-4 w-4" />
            </Link>
          </section>
        ) : (
          <>
            {/* Wishlist count */}
            <div className="mb-5 flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500">
                {items.length}{" "}
                {items.length === 1 ? "saved resource" : "saved resources"}
              </p>

              <Link
                href="/resources"
                className="inline-flex items-center gap-1.5 text-sm font-bold text-blue-600 hover:text-blue-700"
              >
                Find more
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {/* Resources */}
            <div className="grid gap-5 md:grid-cols-2">
              {items.map((item) => (
                <article
                  key={item.wishlistId}
                  className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
                >
                  <div className="p-5 sm:p-6">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                        <BookOpen className="h-6 w-6" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <Link
                            href={`/resources/${item.slug}`}
                            className="font-bold leading-6 text-slate-950 transition hover:text-blue-600"
                          >
                            {item.title}
                          </Link>

                          <button
                            type="button"
                            onClick={() =>
                              removeFromWishlist(
                                item.wishlistId,
                              )
                            }
                            disabled={
                              busyId === item.wishlistId
                            }
                            aria-label={`Remove ${item.title} from wishlist`}
                            className="shrink-0 rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {busyId === item.wishlistId ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </button>
                        </div>

                        <div className="mt-2 flex flex-wrap gap-2">
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                            {item.format}
                          </span>

                          <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                            Educational Resource
                          </span>
                        </div>
                      </div>
                    </div>

                    {item.description && (
                      <p className="mt-5 line-clamp-3 text-sm leading-6 text-slate-500">
                        {item.description}
                      </p>
                    )}

                    <div className="mt-6 flex flex-col gap-4 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                          Price
                        </p>

                        <p className="mt-1 text-xl font-bold text-slate-950">
                          {item.price <= 0
                            ? "Free"
                            : formatMoney(item.price)}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={`/resources/${item.slug}`}
                          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                        >
                          View
                          <ArrowRight className="h-4 w-4" />
                        </Link>

                        {item.price > 0 ? (
                          <Link
                            href={`/resources/${item.slug}`}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700"
                          >
                            <ShoppingCart className="h-4 w-4" />
                            Buy
                          </Link>
                        ) : (
                          <Link
                            href={`/resources/${item.slug}`}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700"
                          >
                            <BookOpen className="h-4 w-4" />
                            Open
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}