"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  Clock,
  GraduationCap,
  Heart,
  History,
  RefreshCw,
  Sparkles,
  TrendingUp,
  AlertCircle,
} from "lucide-react";

type Resource = {
  id: string;
  title: string;
  description?: string | null;
  category?: string | null;
  price?: number | null;
  thumbnail_url?: string | null;
};

type ViewedItem = {
  id: string;
  resource_id: string;
  created_at: string;
  resource?: Resource;
};

type WishlistItem = {
  id: string;
  resource_id: string;
  created_at: string;
  resource?: Resource;
};

type Order = {
  id: string;
  status?: string | null;
  total_amount?: number | null;
  created_at?: string | null;
};

type DashboardResponse = {
  recentlyViewed?: ViewedItem[];
  wishlist?: WishlistItem[];
  orders?: Order[];
  error?: string;
};

const formatMoney = (amount: number) =>
  `KSh ${amount.toLocaleString("en-KE", {
    maximumFractionDigits: 2,
  })}`;

export default function LearningDashboard() {
  const [recentlyViewed, setRecentlyViewed] = useState<ViewedItem[]>([]);
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [historyResponse, wishlistResponse, ordersResponse] =
        await Promise.all([
          fetch("/api/recently-viewed", {
            cache: "no-store",
          }),
          fetch("/api/wishlist", {
            cache: "no-store",
          }),
          fetch("/api/orders", {
            cache: "no-store",
          }),
        ]);

      const [historyResult, wishlistResult, ordersResult] =
        await Promise.all([
          historyResponse.json(),
          wishlistResponse.json(),
          ordersResponse.json(),
        ]);

      if (!historyResponse.ok && historyResponse.status !== 404) {
        throw new Error(
          historyResult.error ?? "Unable to load viewing history.",
        );
      }

      if (!wishlistResponse.ok && wishlistResponse.status !== 404) {
        throw new Error(
          wishlistResult.error ?? "Unable to load your wishlist.",
        );
      }

      if (!ordersResponse.ok && ordersResponse.status !== 404) {
        throw new Error(
          ordersResult.error ?? "Unable to load your orders.",
        );
      }

      const historyItems = Array.isArray(historyResult)
        ? historyResult
        : historyResult.items ?? historyResult.history ?? [];

      const wishlistItems = Array.isArray(wishlistResult)
        ? wishlistResult
        : wishlistResult.items ?? wishlistResult.wishlist ?? [];

      const orderItems = Array.isArray(ordersResult)
        ? ordersResult
        : ordersResult.orders ?? [];

      setRecentlyViewed(historyItems);
      setWishlist(wishlistItems);
      setOrders(orderItems);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to load your learning dashboard.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const completedOrders = orders.filter((order) =>
    ["completed", "paid", "success"].includes(
      (order.status ?? "").toLowerCase(),
    ),
  );

  const totalSpent = completedOrders.reduce(
    (total, order) => total + Number(order.total_amount ?? 0),
    0,
  );

  const recentResources = recentlyViewed
    .map((item) => ({
      ...item,
      resource: item.resource,
    }))
    .filter(
      (
        item,
      ): item is ViewedItem & {
        resource: Resource;
      } => Boolean(item.resource),
    );

  const savedResources = wishlist
    .map((item) => ({
      ...item,
      resource: item.resource,
    }))
    .filter(
      (
        item,
      ): item is WishlistItem & {
        resource: Resource;
      } => Boolean(item.resource),
    );

  if (loading) {
    return (
      <section className="space-y-6">
        <div className="h-36 animate-pulse rounded-3xl bg-slate-200" />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-32 animate-pulse rounded-2xl bg-slate-200"
            />
          ))}
        </div>

        <div className="h-72 animate-pulse rounded-2xl bg-slate-200" />
      </section>
    );
  }

  return (
    <section className="space-y-8">
      <header className="relative overflow-hidden rounded-3xl bg-slate-950 p-7 text-white sm:p-10">
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-blue-600/20 blur-3xl" />

        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-400/10 px-3 py-2 text-xs font-bold uppercase tracking-wide text-blue-300">
            <GraduationCap size={16} />
            Your learning space
          </div>

          <h2 className="mt-5 text-3xl font-black tracking-tight sm:text-4xl">
            Your learning,{" "}
            <span className="text-blue-400">your progress.</span>
          </h2>

          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
            Keep track of resources you explore, revisit saved materials,
            and manage your educational journey in one place.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/resources"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-500"
            >
              Explore resources <ArrowRight size={17} />
            </Link>

            <Link
              href="/search"
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10"
            >
              Find materials <BookOpen size={17} />
            </Link>
          </div>
        </div>
      </header>

      {error && (
        <div
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50 p-5"
        >
          <div className="flex items-start gap-3">
            <AlertCircle
              size={20}
              className="mt-0.5 shrink-0 text-red-700"
            />

            <div className="flex-1">
              <h3 className="font-bold text-red-800">
                Dashboard data could not be fully loaded
              </h3>

              <p className="mt-1 text-sm leading-6 text-red-700">
                {error}
              </p>

              <button
                type="button"
                onClick={() => void loadDashboard()}
                className="mt-3 inline-flex items-center gap-2 rounded-lg bg-red-700 px-4 py-2 text-sm font-bold text-white hover:bg-red-800"
              >
                <RefreshCw size={15} />
                Try again
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Recently viewed"
          value={recentlyViewed.length}
          subtitle="Recorded viewing entries"
          icon={<History size={22} />}
          color="blue"
        />

        <MetricCard
          title="Saved resources"
          value={wishlist.length}
          subtitle="Items in your wishlist"
          icon={<Heart size={22} />}
          color="pink"
        />

        <MetricCard
          title="Completed orders"
          value={completedOrders.length}
          subtitle="Orders marked as paid or completed"
          icon={<BookOpen size={22} />}
          color="green"
        />

        <MetricCard
          title="Recorded spending"
          value={formatMoney(totalSpent)}
          subtitle="Based on completed order amounts"
          icon={<TrendingUp size={22} />}
          color="amber"
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-7">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-xl font-black text-slate-950">
                Continue learning
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                Return to resources you recently explored.
              </p>
            </div>

            <div className="rounded-xl bg-blue-50 p-3 text-blue-700">
              <History size={22} />
            </div>
          </div>

          {recentResources.length === 0 ? (
            <EmptyState
              icon={<BookOpen size={30} />}
              title="No recent resources"
              description="Start exploring resources to build your learning history."
              href="/resources"
              action="Browse resources"
            />
          ) : (
            <div className="mt-6 space-y-3">
              {recentResources.slice(0, 5).map((item) => (
                <Link
                  key={item.id}
                  href={`/resources/${encodeURIComponent(item.resource.id)}`}
                  className="flex items-center gap-3 rounded-xl border border-slate-100 p-4 transition hover:border-blue-200 hover:bg-blue-50/50"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                    <BookOpen size={21} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-slate-950">
                      {item.resource.title}
                    </p>

                    <p className="mt-1 truncate text-xs text-slate-500">
                      {item.resource.category ?? "Learning resource"}
                    </p>
                  </div>

                  <ArrowRight
                    size={17}
                    className="shrink-0 text-slate-400"
                  />
                </Link>
              ))}

              <Link
                href="/recently-viewed"
                className="inline-flex items-center gap-2 pt-2 text-sm font-bold text-blue-700 hover:text-blue-900"
              >
                View all history <ArrowRight size={16} />
              </Link>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-7">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-xl font-black text-slate-950">
                Saved for later
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                Your bookmarked learning materials.
              </p>
            </div>

            <div className="rounded-xl bg-pink-50 p-3 text-pink-700">
              <Heart size={22} />
            </div>
          </div>

          {savedResources.length === 0 ? (
            <EmptyState
              icon={<Heart size={30} />}
              title="Your wishlist is empty"
              description="Save useful resources to find them quickly later."
              href="/resources"
              action="Discover resources"
            />
          ) : (
            <div className="mt-6 space-y-3">
              {savedResources.slice(0, 5).map((item) => (
                <Link
                  key={item.id}
                  href={`/resources/${encodeURIComponent(item.resource.id)}`}
                  className="flex items-center gap-3 rounded-xl border border-slate-100 p-4 transition hover:border-pink-200 hover:bg-pink-50/50"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-pink-50 text-pink-700">
                    <Heart size={21} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-slate-950">
                      {item.resource.title}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {item.resource.price == null ||
                      Number(item.resource.price) === 0
                        ? "Free"
                        : formatMoney(Number(item.resource.price))}
                    </p>
                  </div>

                  <ArrowRight
                    size={17}
                    className="shrink-0 text-slate-400"
                  />
                </Link>
              ))}

              <Link
                href="/wishlist"
                className="inline-flex items-center gap-2 pt-2 text-sm font-bold text-blue-700 hover:text-blue-900"
              >
                View complete wishlist <ArrowRight size={16} />
              </Link>
            </div>
          )}
        </section>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-7">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-xl font-black text-slate-950">
              Learning shortcuts
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              Jump directly to your most useful learning tools.
            </p>
          </div>

          <Sparkles size={23} className="text-violet-700" />
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Shortcut
            href="/search"
            title="Advanced search"
            description="Find resources by keyword and category."
            icon={<BookOpen size={21} />}
            color="blue"
          />

          <Shortcut
            href="/trending"
            title="Trending resources"
            description="Discover popular learning materials."
            icon={<TrendingUp size={21} />}
            color="amber"
          />

          <Shortcut
            href="/recently-viewed"
            title="Viewing history"
            description="Revisit resources you explored."
            icon={<Clock size={21} />}
            color="green"
          />

          <Shortcut
            href="/wishlist"
            title="My wishlist"
            description="Return to your saved materials."
            icon={<Heart size={21} />}
            color="pink"
          />
        </div>
      </section>
    </section>
  );
}

function MetricCard({
  title,
  value,
  subtitle,
  icon,
  color,
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ReactNode;
  color: "blue" | "pink" | "green" | "amber";
}) {
  const styles = {
    blue: "bg-blue-50 text-blue-700",
    pink: "bg-pink-50 text-pink-700",
    green: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
  };

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-500">{title}</p>

          <p className="mt-3 break-words text-2xl font-black text-slate-950">
            {value}
          </p>
        </div>

        <div className={`rounded-xl p-3 ${styles[color]}`}>{icon}</div>
      </div>

      <p className="mt-4 text-xs leading-5 text-slate-500">{subtitle}</p>
    </article>
  );
}

function EmptyState({
  icon,
  title,
  description,
  href,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
  action: string;
}) {
  return (
    <div className="mt-6 rounded-2xl border border-dashed border-slate-200 px-5 py-10 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-slate-400">
        {icon}
      </div>

      <h4 className="mt-4 font-black text-slate-950">{title}</h4>

      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
        {description}
      </p>

      <Link
        href={href}
        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-800"
      >
        {action} <ArrowRight size={16} />
      </Link>
    </div>
  );
}

function Shortcut({
  href,
  title,
  description,
  icon,
  color,
}: {
  href: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: "blue" | "amber" | "green" | "pink";
}) {
  const styles = {
    blue: "bg-blue-50 text-blue-700",
    amber: "bg-amber-50 text-amber-700",
    green: "bg-emerald-50 text-emerald-700",
    pink: "bg-pink-50 text-pink-700",
  };

  return (
    <Link
      href={href}
      className="group rounded-xl border border-slate-200 p-5 transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg"
    >
      <div
        className={`flex h-11 w-11 items-center justify-center rounded-xl ${styles[color]}`}
      >
        {icon}
      </div>

      <h4 className="mt-4 font-black text-slate-950">{title}</h4>

      <p className="mt-2 text-sm leading-6 text-slate-500">
        {description}
      </p>

      <span className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-blue-700">
        Open <ArrowRight size={15} />
      </span>
    </Link>
  );
}