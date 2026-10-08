 import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Package,
  ShoppingBag,
  XCircle,
} from "lucide-react";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { createClient } from "@/lib/supabase/server";

type Order = {
  id: string;
  status: string;
  total_amount: number | string | null;
  created_at: string;
};

function formatMoney(value: number | string | null | undefined) {
  const amount = Number(value ?? 0);

  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-KE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getStatusStyles(status: string) {
  switch (status.toLowerCase()) {
    case "paid":
    case "completed":
      return {
        label: "Paid",
        className: "bg-emerald-50 text-emerald-700",
        icon: <CheckCircle2 className="h-4 w-4" />,
      };

    case "pending":
    case "processing":
      return {
        label: "Pending",
        className: "bg-amber-50 text-amber-700",
        icon: <Clock3 className="h-4 w-4" />,
      };

    case "failed":
      return {
        label: "Failed",
        className: "bg-red-50 text-red-700",
        icon: <XCircle className="h-4 w-4" />,
      };

    case "cancelled":
      return {
        label: "Cancelled",
        className: "bg-slate-100 text-slate-600",
        icon: <XCircle className="h-4 w-4" />,
      };

    default:
      return {
        label: status,
        className: "bg-slate-100 text-slate-600",
        icon: <Package className="h-4 w-4" />,
      };
  }
}

function OrdersLoading() {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="h-5 w-32 animate-pulse rounded bg-slate-200" />

        <div className="mt-6 h-20 w-64 animate-pulse rounded-xl bg-slate-200" />

        <div className="mt-8 space-y-4">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-28 animate-pulse rounded-2xl bg-white shadow-sm"
            />
          ))}
        </div>
      </div>
    </main>
  );
}

async function OrdersContent() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?redirect=/orders");
  }

  const { data: orders, error } = await supabase
    .from("orders")
    .select("id, status, total_amount, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
            <h1 className="text-lg font-bold text-red-800">
              Unable to load orders
            </h1>

            <p className="mt-2 text-sm text-red-700">
              {error.message}
            </p>

            <Link
              href="/account"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-red-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-800"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Account
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const orderList = (orders ?? []) as Order[];

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6 lg:px-8">
          <Link
            href="/account"
            className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Account
          </Link>

          <div className="mt-4 flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                My Orders
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                View your EduMarket purchase history and order details.
              </p>
            </div>

            <div className="hidden h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 sm:flex">
              <ShoppingBag className="h-6 w-6" />
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {orderList.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <ShoppingBag className="h-8 w-8" />
            </div>

            <h2 className="mt-6 text-xl font-bold text-slate-950">
              No orders yet
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              Your completed and pending purchases will appear here once
              you place your first order.
            </p>

            <Link
              href="/resources"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
            >
              Browse Resources
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orderList.map((order) => {
              const status = getStatusStyles(order.status);

              return (
                <Link
                  key={order.id}
                  href={`/orders/${order.id}`}
                  className="group block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md sm:p-6"
                >
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                        <Package className="h-6 w-6" />
                      </div>

                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                          Order
                        </p>

                        <p className="mt-1 truncate font-mono text-sm font-bold text-slate-900">
                          #{order.id.slice(0, 8).toUpperCase()}
                        </p>

                        <p className="mt-1 text-sm text-slate-500">
                          {formatDate(order.created_at)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-6 sm:justify-end">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                          Total
                        </p>

                        <p className="mt-1 text-lg font-bold text-slate-950">
                          {formatMoney(order.total_amount)}
                        </p>
                      </div>

                      <div
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${status.className}`}
                      >
                        {status.icon}
                        {status.label}
                      </div>

                      <ArrowRight className="hidden h-5 w-5 text-slate-300 transition group-hover:translate-x-1 group-hover:text-blue-600 sm:block" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={<OrdersLoading />}>
      <OrdersContent />
    </Suspense>
  );
}