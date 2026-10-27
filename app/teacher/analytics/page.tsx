import Link from "next/link";
import { connection } from "next/server";
import {
  ArrowLeft,
  BarChart3,
  BookOpen,
  Download,
  Eye,
  GraduationCap,
  TrendingUp,
  Users,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Resource Analytics | EduMarket",
  description: "Monitor your educational resources and performance.",
};

type Resource = {
  id: string;
  title: string;
  status?: string | null;
  created_at?: string | null;
  price?: number | null;
};

type Order = {
  id: string;
  resource_id?: string | null;
  status?: string | null;
  total_amount?: number | null;
  created_at?: string | null;
};

export default async function ResourceAnalyticsPage() {
  await connection();

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5">
        <div className="max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <BarChart3 size={42} className="mx-auto text-blue-700" />

          <h1 className="mt-5 text-2xl font-black text-slate-950">
            Sign in to view analytics
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-500">
            Access your resource performance, sales, and engagement
            statistics by signing in to your account.
          </p>

          <Link
            href="/auth"
            className="mt-6 inline-flex rounded-xl bg-blue-700 px-6 py-3 font-bold text-white hover:bg-blue-800"
          >
            Sign in
          </Link>
        </div>
      </main>
    );
  }

  const { data: resourceData, error: resourceError } = await supabase
    .from("resources")
    .select("id, title, status, created_at, price")
    .or(`educator_id.eq.${user.id},user_id.eq.${user.id},seller_id.eq.${user.id}`)
    .order("created_at", { ascending: false })
    .limit(500);

  const resources = (resourceData ?? []) as Resource[];
  const resourceIds = resources.map((resource) => resource.id);

  let orders: Order[] = [];

  if (resourceIds.length > 0) {
    const { data: orderData } = await supabase
      .from("orders")
      .select("id, resource_id, status, total_amount, created_at")
      .in("resource_id", resourceIds)
      .order("created_at", { ascending: false })
      .limit(1000);

    orders = (orderData ?? []) as Order[];
  }

  const publishedResources = resources.filter(
    (resource) => resource.status === "published",
  );

  const pendingResources = resources.filter(
    (resource) => resource.status === "pending",
  );

  const completedOrders = orders.filter((order) =>
    ["completed", "paid", "success"].includes(
      (order.status ?? "").toLowerCase(),
    ),
  );

  const totalRevenue = completedOrders.reduce(
    (total, order) => total + Number(order.total_amount ?? 0),
    0,
  );

  const resourceSales = new Map<string, number>();

  for (const order of completedOrders) {
    if (order.resource_id) {
      resourceSales.set(
        order.resource_id,
        (resourceSales.get(order.resource_id) ?? 0) + 1,
      );
    }
  }

  const topResources = [...resources]
    .map((resource) => ({
      ...resource,
      sales: resourceSales.get(resource.id) ?? 0,
    }))
    .sort((a, b) => b.sales - a.sales)
    .slice(0, 8);

  const recentOrders = completedOrders.slice(0, 8);

  const orderResourceNames = new Map(
    resources.map((resource) => [resource.id, resource.title]),
  );

  const maximumSales = Math.max(
    1,
    ...topResources.map((resource) => resource.sales),
  );

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="bg-slate-950 px-5 py-12 text-white sm:px-8 sm:py-16">
        <div className="mx-auto max-w-7xl">
          <Link
            href="/teacher"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-300 transition hover:text-white"
          >
            <ArrowLeft size={17} />
            Educator dashboard
          </Link>

          <div className="mt-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm font-bold text-blue-300">
                <BarChart3 size={19} />
                PERFORMANCE CENTER
              </div>

              <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
                Resource analytics
              </h1>

              <p className="mt-3 max-w-2xl leading-7 text-slate-300">
                Understand your published resources, sales performance,
                and educator activity from one dashboard.
              </p>
            </div>

            <a
              href="/api/teacher/analytics?format=csv"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-bold text-white transition hover:bg-blue-500"
            >
              <Download size={18} />
              Export analytics
            </a>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
        {resourceError ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
            Unable to load resource analytics. Check your resource schema
            and database permissions.
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                title="Total resources"
                value={resources.length.toLocaleString()}
                subtitle="Resources linked to your account"
                icon={<BookOpen size={22} />}
                iconStyle="bg-blue-50 text-blue-700"
              />

              <MetricCard
                title="Published resources"
                value={publishedResources.length.toLocaleString()}
                subtitle="Currently marked as published"
                icon={<GraduationCap size={22} />}
                iconStyle="bg-emerald-50 text-emerald-700"
              />

              <MetricCard
                title="Completed sales"
                value={completedOrders.length.toLocaleString()}
                subtitle="Orders marked as completed or paid"
                icon={<Users size={22} />}
                iconStyle="bg-violet-50 text-violet-700"
              />

              <MetricCard
                title="Recorded revenue"
                value={`KSh ${totalRevenue.toLocaleString("en-KE", {
                  maximumFractionDigits: 2,
                })}`}
                subtitle="Based on completed order amounts"
                icon={<TrendingUp size={22} />}
                iconStyle="bg-amber-50 text-amber-700"
              />
            </div>

            <div className="mt-8 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
              <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-black text-slate-950">
                      Best-performing resources
                    </h2>

                    <p className="mt-2 text-sm text-slate-500">
                      Ranked by completed sales recorded in the database.
                    </p>
                  </div>

                  <div className="rounded-xl bg-blue-50 p-3 text-blue-700">
                    <BarChart3 size={22} />
                  </div>
                </div>

                {topResources.length === 0 ? (
                  <EmptyState message="Your resources will appear here when they are available." />
                ) : (
                  <div className="mt-7 space-y-6">
                    {topResources.map((resource, index) => (
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

                              <p className="mt-1 text-xs text-slate-500">
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

              <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-black text-slate-950">
                      Resource overview
                    </h2>

                    <p className="mt-2 text-sm text-slate-500">
                      Current publication status.
                    </p>
                  </div>

                  <Eye size={23} className="text-blue-700" />
                </div>

                <div className="mt-7 space-y-5">
                  <StatusRow
                    label="Published"
                    value={publishedResources.length}
                    total={resources.length}
                    style="bg-emerald-500"
                  />

                  <StatusRow
                    label="Pending"
                    value={pendingResources.length}
                    total={resources.length}
                    style="bg-amber-500"
                  />

                  <StatusRow
                    label="Other statuses"
                    value={
                      resources.length -
                      publishedResources.length -
                      pendingResources.length
                    }
                    total={resources.length}
                    style="bg-slate-400"
                  />
                </div>

                <div className="mt-8 rounded-xl bg-slate-50 p-5">
                  <p className="text-sm font-semibold text-slate-500">
                    Average completed order value
                  </p>

                  <p className="mt-2 text-2xl font-black text-slate-950">
                    KSh{" "}
                    {(
                      completedOrders.length > 0
                        ? totalRevenue / completedOrders.length
                        : 0
                    ).toLocaleString("en-KE", {
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>
              </section>
            </div>

            <section className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <div className="flex flex-col gap-2 border-b border-slate-100 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
                <div>
                  <h2 className="text-xl font-black text-slate-950">
                    Recent completed orders
                  </h2>

                  <p className="mt-2 text-sm text-slate-500">
                    Latest completed sales associated with your resources.
                  </p>
                </div>

                <span className="w-fit rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">
                  {completedOrders.length} recorded
                </span>
              </div>

              {recentOrders.length === 0 ? (
                <EmptyState message="Completed orders will appear here when sales are recorded." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[600px] text-left">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                          Resource
                        </th>

                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                          Date
                        </th>

                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                          Status
                        </th>

                        <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wide text-slate-500">
                          Amount
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                      {recentOrders.map((order) => (
                        <tr key={order.id} className="hover:bg-slate-50">
                          <td className="max-w-[260px] truncate px-6 py-4 text-sm font-semibold text-slate-900">
                            {order.resource_id
                              ? orderResourceNames.get(order.resource_id) ??
                                "Educational resource"
                              : "Educational resource"}
                          </td>

                          <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500">
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

                          <td className="px-6 py-4">
                            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold capitalize text-emerald-700">
                              {order.status ?? "Completed"}
                            </span>
                          </td>

                          <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-black text-slate-950">
                            KSh{" "}
                            {Number(order.total_amount ?? 0).toLocaleString(
                              "en-KE",
                              { maximumFractionDigits: 2 },
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </section>
    </main>
  );
}

function MetricCard({
  title,
  value,
  subtitle,
  icon,
  iconStyle,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  iconStyle: string;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-500">{title}</p>
          <p className="mt-3 break-words text-2xl font-black text-slate-950">
            {value}
          </p>
        </div>

        <div className={`rounded-xl p-3 ${iconStyle}`}>{icon}</div>
      </div>

      <p className="mt-4 text-xs leading-5 text-slate-500">{subtitle}</p>
    </article>
  );
}

function StatusRow({
  label,
  value,
  total,
  style,
}: {
  label: string;
  value: number;
  total: number;
  style: string;
}) {
  const percentage =
    total > 0 ? Math.min(100, Math.round((value / total) * 100)) : 0;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-sm font-semibold text-slate-700">{label}</span>

        <span className="text-sm font-black text-slate-950">
          {value}{" "}
          <span className="font-medium text-slate-400">
            ({percentage}%)
          </span>
        </span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full ${style}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="px-6 py-12 text-center">
      <BookOpen size={34} className="mx-auto text-slate-300" />

      <p className="mt-4 text-sm leading-6 text-slate-500">{message}</p>
    </div>
  );
}