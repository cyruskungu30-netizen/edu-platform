 import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  FileText,
  XCircle,
} from "lucide-react";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { createClient } from "@/lib/supabase/server";

type OrderPageProps = {
  params: Promise<{
    id: string;
  }>;
};

type OrderItem = {
  id: string;
  resource_id: string;
  quantity: number;
  unit_price: number | string;
  total_price: number | string;
  resource:
    | {
        id: string;
        title: string;
        slug: string;
        format: string;
      }
    | {
        id: string;
        title: string;
        slug: string;
        format: string;
      }[]
    | null;
};

type Order = {
  id: string;
  order_number: string;
  status: string;
  subtotal: number | string;
  total: number | string;
  created_at: string;
  order_items: OrderItem[];
};

function formatMoney(value: number | string | null | undefined) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 2,
  }).format(Number(value ?? 0));
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-KE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getStatusLabel(status: string) {
  switch (status) {
    case "paid":
      return "Paid";
    case "pending":
      return "Pending";
    case "processing":
      return "Processing";
    case "completed":
      return "Completed";
    case "cancelled":
      return "Cancelled";
    case "failed":
      return "Failed";
    default:
      return status;
  }
}

function getStatusIcon(status: string) {
  if (status === "paid" || status === "completed") {
    return <CheckCircle2 className="h-5 w-5" />;
  }

  if (status === "cancelled" || status === "failed") {
    return <XCircle className="h-5 w-5" />;
  }

  return <Clock3 className="h-5 w-5" />;
}

function getStatusClasses(status: string) {
  if (status === "paid" || status === "completed") {
    return "bg-emerald-50 text-emerald-700";
  }

  if (status === "cancelled" || status === "failed") {
    return "bg-red-50 text-red-700";
  }

  return "bg-amber-50 text-amber-700";
}

function OrdersDetailLoading() {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="h-6 w-32 animate-pulse rounded bg-slate-200" />

        <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="h-8 w-64 animate-pulse rounded bg-slate-200" />

          <div className="mt-3 h-4 w-48 animate-pulse rounded bg-slate-100" />

          <div className="mt-8 space-y-4">
            <div className="h-20 animate-pulse rounded-2xl bg-slate-100" />
            <div className="h-20 animate-pulse rounded-2xl bg-slate-100" />
            <div className="h-20 animate-pulse rounded-2xl bg-slate-100" />
          </div>
        </div>
      </div>
    </main>
  );
}

async function OrderDetailContent({
  params,
}: {
  params: Promise<{
    id: string;
  }>;
}) {
  const { id } = await params;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <h1 className="text-2xl font-bold text-slate-950">
              Sign in required
            </h1>

            <p className="mt-3 text-sm leading-6 text-slate-500">
              Please sign in to view this order.
            </p>

            <Link
              href={`/auth/login?redirect=/orders/${id}`}
              className="mt-6 inline-flex rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
            >
              Sign In
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const { data: order, error } = await supabase
    .from("orders")
    .select(
      `
        id,
        order_number,
        status,
        subtotal,
        total,
        created_at,
        order_items (
          id,
          resource_id,
          quantity,
          unit_price,
          total_price,
          resource:resources (
            id,
            title,
            slug,
            format
          )
        )
      `,
    )
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !order) {
    notFound();
  }

  const typedOrder = order as Order;

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <Link
          href="/orders"
          className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 transition hover:text-blue-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Orders
        </Link>

        <div className="mt-6 rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-6 sm:p-8">
            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Order
                </p>

                <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                  {typedOrder.order_number}
                </h1>

                <p className="mt-2 text-sm text-slate-500">
                  Placed {formatDate(typedOrder.created_at)}
                </p>
              </div>

              <div
                className={`inline-flex w-fit items-center gap-2 rounded-full px-4 py-2 text-sm font-bold ${getStatusClasses(
                  typedOrder.status,
                )}`}
              >
                {getStatusIcon(typedOrder.status)}
                {getStatusLabel(typedOrder.status)}
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            <h2 className="text-lg font-bold text-slate-950">
              Order Items
            </h2>

            <div className="mt-5 space-y-3">
              {typedOrder.order_items.map((item) => {
                const resource = Array.isArray(item.resource)
                  ? item.resource[0]
                  : item.resource;

                return (
                  <div
                    key={item.id}
                    className="flex flex-col gap-4 rounded-2xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex min-w-0 items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                        <FileText className="h-5 w-5" />
                      </div>

                      <div className="min-w-0">
                        {resource ? (
                          <Link
                            href={`/resources/${resource.slug}`}
                            className="line-clamp-2 text-sm font-bold text-slate-900 transition hover:text-blue-600"
                          >
                            {resource.title}
                          </Link>
                        ) : (
                          <p className="text-sm font-bold text-slate-900">
                            Resource
                          </p>
                        )}

                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                          {resource?.format && (
                            <span>{resource.format}</span>
                          )}

                          <span>•</span>

                          <span>Qty: {item.quantity}</span>
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0">
                      <p className="text-right text-sm font-bold text-slate-950">
                        {formatMoney(item.total_price)}
                      </p>

                      {item.quantity > 1 && (
                        <p className="mt-1 text-right text-xs text-slate-500">
                          {formatMoney(item.unit_price)} each
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-8 border-t border-slate-200 pt-6">
              <div className="ml-auto max-w-sm space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Subtotal</span>

                  <span className="font-semibold text-slate-800">
                    {formatMoney(typedOrder.subtotal)}
                  </span>
                </div>

                <div className="flex items-center justify-between border-t border-slate-200 pt-3">
                  <span className="text-base font-bold text-slate-950">
                    Total
                  </span>

                  <span className="text-xl font-bold text-blue-600">
                    {formatMoney(typedOrder.total)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 p-5">
          <p className="text-sm font-bold text-blue-900">
            Need help with this order?
          </p>

          <p className="mt-1 text-sm leading-6 text-blue-800">
            If you have an issue with your payment, order or downloaded
            resources, contact EduMarket support.
          </p>

          <Link
            href="/support"
            className="mt-4 inline-flex rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700"
          >
            Contact Support
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function OrderDetailPage({
  params,
}: OrderPageProps) {
  return (
    <Suspense fallback={<OrdersDetailLoading />}>
      <OrderDetailContent params={params} />
    </Suspense>
  );
}