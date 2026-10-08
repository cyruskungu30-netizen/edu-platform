 import Link from "next/link";
import { Suspense } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Headphones,
  MessageCircle,
  Ticket,
} from "lucide-react";

import { requireAdmin } from "@/lib/auth/admin";

type SupportTicket = {
  id: string;
  subject: string;
  message: string;
  status: string;
  created_at: string;
  user_id: string;
};

function LoadingState() {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-64 rounded-lg bg-slate-200" />
          <div className="h-5 w-96 max-w-full rounded-lg bg-slate-200" />

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-32 rounded-2xl bg-white ring-1 ring-slate-200"
              />
            ))}
          </div>

          <div className="h-96 rounded-2xl bg-white ring-1 ring-slate-200" />
        </div>
      </div>
    </main>
  );
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown date";
  }

  return date.toLocaleDateString("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function statusClasses(status: string) {
  switch (status) {
    case "open":
      return "bg-blue-50 text-blue-700";

    case "pending":
      return "bg-amber-50 text-amber-700";

    case "resolved":
      return "bg-emerald-50 text-emerald-700";

    case "closed":
      return "bg-slate-100 text-slate-600";

    default:
      return "bg-slate-100 text-slate-600";
  }
}

async function AdminSupportContent() {
  const { supabase } = await requireAdmin();

  const { data, error } = await supabase
    .from("support_tickets")
    .select(
      `
        id,
        subject,
        message,
        status,
        created_at,
        user_id
      `,
    )
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <Link
            href="/admin"
            className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to dashboard
          </Link>

          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
            <h1 className="font-semibold">
              Unable to load support tickets
            </h1>

            <p className="mt-2 text-sm">
              {error.message}
            </p>
          </div>
        </div>
      </main>
    );
  }

  const tickets = (data ?? []) as SupportTicket[];

  const total = tickets.length;
  const open = tickets.filter(
    (ticket) => ticket.status === "open",
  ).length;
  const pending = tickets.filter(
    (ticket) => ticket.status === "pending",
  ).length;
  const resolved = tickets.filter(
    (ticket) => ticket.status === "resolved",
  ).length;

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <Link
              href="/admin"
              className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-slate-900"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to dashboard
            </Link>

            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                <Headphones className="h-6 w-6" />
              </div>

              <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                  Support Center
                </h1>

                <p className="mt-1 text-sm text-slate-600">
                  Manage customer support requests and respond to users.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <div className="flex items-center justify-between">
              <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                <Ticket className="h-6 w-6" />
              </div>

              <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Total
              </span>
            </div>

            <p className="mt-5 text-3xl font-bold text-slate-900">
              {total}
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Support tickets
            </p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <div className="flex items-center justify-between">
              <div className="rounded-xl bg-sky-50 p-3 text-sky-600">
                <MessageCircle className="h-6 w-6" />
              </div>

              <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Open
              </span>
            </div>

            <p className="mt-5 text-3xl font-bold text-slate-900">
              {open}
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Awaiting attention
            </p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <div className="flex items-center justify-between">
              <div className="rounded-xl bg-amber-50 p-3 text-amber-600">
                <Clock3 className="h-6 w-6" />
              </div>

              <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Pending
              </span>
            </div>

            <p className="mt-5 text-3xl font-bold text-slate-900">
              {pending}
            </p>

            <p className="mt-1 text-sm text-slate-500">
              In progress
            </p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <div className="flex items-center justify-between">
              <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
                <CheckCircle2 className="h-6 w-6" />
              </div>

              <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Resolved
              </span>
            </div>

            <p className="mt-5 text-3xl font-bold text-slate-900">
              {resolved}
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Successfully resolved
            </p>
          </div>
        </div>

        {/* Tickets */}
        {tickets.length === 0 ? (
          <div className="rounded-3xl bg-white px-6 py-16 text-center shadow-sm ring-1 ring-slate-200">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
              <Headphones className="h-8 w-8 text-slate-500" />
            </div>

            <h2 className="mt-6 text-xl font-bold text-slate-900">
              No support tickets
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
              Customer support requests will appear here when users contact
              the EduMarket support team.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
            <div className="border-b border-slate-200 px-6 py-5">
              <h2 className="font-bold text-slate-900">
                Support Tickets
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Review and respond to customer requests.
              </p>
            </div>

            <div className="divide-y divide-slate-200">
              {tickets.map((ticket) => (
                <Link
                  key={ticket.id}
                  href={`/admin/support/${ticket.id}`}
                  className="block px-6 py-5 transition hover:bg-slate-50"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="truncate font-semibold text-slate-900">
                          {ticket.subject}
                        </h3>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusClasses(
                            ticket.status,
                          )}`}
                        >
                          {ticket.status}
                        </span>
                      </div>

                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">
                        {ticket.message}
                      </p>

                      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                        <span>
                          Ticket #{ticket.id.slice(0, 8)}
                        </span>

                        <span>•</span>

                        <span>
                          User #{ticket.user_id.slice(0, 8)}
                        </span>

                        <span>•</span>

                        <span>
                          {formatDate(ticket.created_at)}
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0 text-sm font-semibold text-blue-600">
                      View ticket →
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export default function AdminSupportPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <AdminSupportContent />
    </Suspense>
  );
}