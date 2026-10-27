"use client";

import { useCallback, useEffect, useState } from "react";
import {
  BarChart3,
  BookOpen,
  Download,
  RefreshCw,
  TrendingUp,
  Users,
  AlertCircle,
} from "lucide-react";

type AnalyticsSummary = {
  totalResources: number;
  publishedResources: number;
  pendingResources: number;
  otherResources: number;
  completedSales: number;
  totalRevenue: number;
  averageOrderValue: number;
};

type AnalyticsResource = {
  id: string;
  title: string;
  status: string | null;
  price: number;
  sales: number;
};

type AnalyticsOrder = {
  id: string;
  resource_id: string | null;
  status: string | null;
  total_amount: number | null;
  created_at: string | null;
};

type AnalyticsResponse = {
  success?: boolean;
  summary?: AnalyticsSummary;
  topResources?: AnalyticsResource[];
  recentOrders?: AnalyticsOrder[];
  error?: string;
};

const EMPTY_SUMMARY: AnalyticsSummary = {
  totalResources: 0,
  publishedResources: 0,
  pendingResources: 0,
  otherResources: 0,
  completedSales: 0,
  totalRevenue: 0,
  averageOrderValue: 0,
};

export default function ResourceAnalytics() {
  const [summary, setSummary] =
    useState<AnalyticsSummary>(EMPTY_SUMMARY);
  const [resources, setResources] = useState<AnalyticsResource[]>([]);
  const [orders, setOrders] = useState<AnalyticsOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/teacher/analytics", {
        method: "GET",
        cache: "no-store",
        headers: {
          Accept: "application/json",
        },
      });

      const result: AnalyticsResponse = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.error ?? "Unable to load resource analytics.",
        );
      }

      setSummary(result.summary ?? EMPTY_SUMMARY);
      setResources(result.topResources ?? []);
      setOrders(result.recentOrders ?? []);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "An unexpected error occurred.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAnalytics();
  }, [loadAnalytics]);

  async function exportAnalytics() {
    setExporting(true);
    setError("");

    try {
      const response = await fetch(
        "/api/teacher/analytics?format=csv",
        {
          method: "GET",
          cache: "no-store",
        },
      );

      if (!response.ok) {
        const result = (await response.json()) as {
          error?: string;
        };

        throw new Error(
          result.error ?? "Unable to export analytics.",
        );
      }

      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");

      anchor.href = downloadUrl;
      anchor.download = "edumarket-analytics.csv";

      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();

      URL.revokeObjectURL(downloadUrl);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to export analytics.",
      );
    } finally {
      setExporting(false);
    }
  }

  const maximumSales = Math.max(
    1,
    ...resources.map((resource) => resource.sales),
  );

  const money = (amount: number) =>
    `KSh ${amount.toLocaleString("en-KE", {
      maximumFractionDigits: 2,
    })}`;

  if (loading) {
    return (
      <section className="space-y-5">
        <div className="h-8 w-64 animate-pulse rounded-lg bg-slate-200" />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-36 animate-pulse rounded-2xl border border-slate-200 bg-white"
            />
          ))}
        </div>

        <div className="h-72 animate-pulse rounded-2xl bg-slate-200" />
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-bold text-blue-700">
            <BarChart3 size={19} />
            PERFORMANCE OVERVIEW
          </div>

          <h2 className="mt-2 text-2xl font-black text-slate-950 sm:text-3xl">
            Resource analytics
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Monitor your resources, recorded sales, and revenue.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void loadAnalytics()}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
          >
            <RefreshCw size={17} />
            Refresh
          </button>

          <button
            type="button"
            onClick={() => void exportAnalytics()}
            disabled={exporting}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Download size={17} />
            {exporting ? "Exporting..." : "Export CSV"}
          </button>
        </div>
      </header>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          <AlertCircle size={19} className="mt-0.5 shrink-0" />

          <div>
            <p className="font-bold">Analytics unavailable</p>
            <p className="mt-1">{error}</p>

            <button
              type="button"
              onClick={() => void loadAnalytics()}
              className="mt-2 font-bold underline"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          title="Total resources"
          value={summary.totalResources.toLocaleString()}
          subtitle="Resources linked to your account"
          icon={<BookOpen size={22} />}
          color="blue"
        />

        <Metric
          title="Published resources"
          value={summary.publishedResources.toLocaleString()}
          subtitle={`${summary.pendingResources} awaiting publication`}
          icon={<Users size={22} />}
          color="green"
        />

        <Metric
          title="Completed sales"
          value={summary.completedSales.toLocaleString()}
          subtitle="Orders recorded as completed or paid"
          icon={<TrendingUp size={22} />}
          color="purple"
        />

        <Metric
          title="Recorded revenue"
          value={money(summary.totalRevenue)}
          subtitle="Based on completed order amounts"
          icon={<BarChart3 size={22} />}
          color="amber"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-black text-slate-950">
                Best-performing resources
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Ranked by recorded completed sales.
              </p>
            </div>

            <BarChart3 className="text-blue-700" size={23} />
          </div>

          {resources.length === 0 ? (
            <EmptyMessage message="Your resources will appear here when available." />
          ) : (
            <div className="mt-7 space-y-6">
              {resources.slice(0, 8).map((resource, index) => (
                <div key={resource.id}>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-sm font-black text-slate-600">
                        {index + 1}
                      </span>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-slate-900">
                          {resource.title}
                        </p>

                        <p className="mt-1 text-xs capitalize text-slate-500">
                          {resource.status ?? "Unknown status"}
                        </p>
                      </div>
                    </div>

                    <span className="shrink-0 text-sm font-black text-slate-900">
                      {resource.sales} sales
                    </span>
                  </div>

                  <div className="ml-12 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-blue-600 transition-all"
                      style={{
                        width: `${(resource.sales / maximumSales) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
          <h3 className="text-lg font-black text-slate-950">
            Revenue overview
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Summary of recorded completed transactions.
          </p>

          <div className="mt-7 rounded-2xl bg-gradient-to-br from-slate-950 to-blue-900 p-6 text-white">
            <div className="flex items-center gap-2 text-sm font-semibold text-blue-200">
              <TrendingUp size={18} />
              Total recorded revenue
            </div>

            <p className="mt-4 break-words text-3xl font-black sm:text-4xl">
              {money(summary.totalRevenue)}
            </p>

            <p className="mt-3 text-sm text-slate-300">
              From {summary.completedSales} completed sales
            </p>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl bg-slate-50 p-5">
              <p className="text-sm font-semibold text-slate-500">
                Average order value
              </p>

              <p className="mt-3 break-words text-xl font-black text-slate-950">
                {money(summary.averageOrderValue)}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-5">
              <p className="text-sm font-semibold text-slate-500">
                Pending resources
              </p>

              <p className="mt-3 text-xl font-black text-slate-950">
                {summary.pendingResources}
              </p>
            </div>
          </div>
        </section>
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 p-5 sm:p-7">
          <h3 className="text-lg font-black text-slate-950">
            Recent completed orders
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Latest completed transactions returned by the analytics API.
          </p>
        </div>

        {orders.length === 0 ? (
          <EmptyMessage message="Completed orders will appear here when sales are recorded." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-left">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-5 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                    Resource
                  </th>

                  <th className="px-5 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                    Date
                  </th>

                  <th className="px-5 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                    Status
                  </th>

                  <th className="px-5 py-4 text-right text-xs font-bold uppercase tracking-wide text-slate-500">
                    Amount
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {orders.slice(0, 20).map((order) => {
                  const resource = resources.find(
                    (item) => item.id === order.resource_id,
                  );

                  return (
                    <tr key={order.id} className="hover:bg-slate-50">
                      <td className="max-w-[260px] truncate px-5 py-4 text-sm font-semibold text-slate-900">
                        {resource?.title ?? "Educational resource"}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-500">
                        {order.created_at
                          ? new Date(order.created_at).toLocaleDateString(
                              "en-KE",
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              },
                            )
                          : "—"}
                      </td>

                      <td className="px-5 py-4">
                        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold capitalize text-emerald-700">
                          {order.status ?? "Completed"}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-right text-sm font-black text-slate-950">
                        {money(Number(order.total_amount ?? 0))}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </section>
  );
}

function Metric({
  title,
  value,
  subtitle,
  icon,
  color,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  color: "blue" | "green" | "purple" | "amber";
}) {
  const styles = {
    blue: "bg-blue-50 text-blue-700",
    green: "bg-emerald-50 text-emerald-700",
    purple: "bg-violet-50 text-violet-700",
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

function EmptyMessage({ message }: { message: string }) {
  return (
    <div className="px-6 py-12 text-center">
      <BookOpen size={34} className="mx-auto text-slate-300" />

      <p className="mt-4 text-sm leading-6 text-slate-500">{message}</p>
    </div>
  );
}