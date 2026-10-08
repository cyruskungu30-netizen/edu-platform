import Link from "next/link";
import { Suspense } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  LifeBuoy,
  MessageSquare,
  Ticket,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";

type SupportTicket = {
  id: string;
  user_id: string;
  subject: string;
  message: string;
  status: string;
  created_at: string;
  updated_at: string;
};

function formatDate(value: string) {
  return new Date(value).toLocaleString("en-KE", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function statusClasses(status: string) {
  switch (status) {
    case "open":
      return "bg-blue-100 text-blue-700";

    case "pending":
      return "bg-amber-100 text-amber-700";

    case "resolved":
      return "bg-emerald-100 text-emerald-700";

    case "closed":
      return "bg-slate-200 text-slate-700";

    default:
      return "bg-slate-100 text-slate-700";
  }
}

async function AdminSupportContent() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <LifeBuoy className="mx-auto mb-4 h-12 w-12 text-slate-300" />

          <h1 className="text-2xl font-black text-slate-900">
            Admin sign in required
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Please sign in with an administrator account.
          </p>

          <Link
            href="/auth/login?redirect=/admin/support"
            className="mt-6 inline-flex rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-700"
          >
            Sign in
          </Link>
        </div>
      </main>
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin") {
    return (
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-red-200 bg-red-50 p-10 text-center">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-400" />

          <h1 className="text-2xl font-black text-red-900">
            Access denied
          </h1>

          <p className="mt-2 text-sm text-red-700">
            You do not have permission to access the support administration
            area.
          </p>

          <Link
            href="/"
            className="mt-6 inline-flex rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
          >
            Return home
          </Link>
        </div>
      </main>
    );
  }

  const { data, error } = await supabase
    .from("support_tickets")
    .select(
      "id, user_id, subject, message, status, created_at, updated_at",
    )
    .order("updated_at", {
      ascending: false,
    });

  const tickets = (data ?? []) as SupportTicket[];

  const total = tickets.length;
  const open = tickets.filter((ticket) => ticket.status === "open").length;
  const pending = tickets.filter(
    (ticket) => ticket.status === "pending",
  ).length;
  const resolved = tickets.filter(
    (ticket) => ticket.status === "resolved",
  ).length;
  const closed = tickets.filter(
    (ticket) => ticket.status === "closed",
  ).length;

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
              <LifeBuoy className="h-4 w-4" />
              Support Center
            </div>

            <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
              Customer Support
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Manage customer support tickets, respond to customers, and keep
              every issue moving toward resolution.
            </p>
          </div>

          <Link
            href="/admin"
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:border-emerald-500 hover:text-emerald-600"
          >
            Back to Admin
          </Link>
        </div>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          icon={<Ticket className="h-5 w-5" />}
          label="Total"
          value={total}
          iconClass="bg-slate-100 text-slate-700"
        />

        <StatCard
          icon={<MessageSquare className="h-5 w-5" />}
          label="Open"
          value={open}
          iconClass="bg-blue-100 text-blue-700"
        />

        <StatCard
          icon={<Clock3 className="h-5 w-5" />}
          label="Pending"
          value={pending}
          iconClass="bg-amber-100 text-amber-700"
        />

        <StatCard
          icon={<CheckCircle2 className="h-5 w-5" />}
          label="Resolved"
          value={resolved}
          iconClass="bg-emerald-100 text-emerald-700"
        />

        <StatCard
          icon={<CheckCircle2 className="h-5 w-5" />}
          label="Closed"
          value={closed}
          iconClass="bg-slate-200 text-slate-700"
        />
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
          <h2 className="text-lg font-black text-slate-900">
            Support Tickets
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Review and respond to customer requests.
          </p>
        </div>

        {error ? (
          <div className="p-8 text-center">
            <AlertCircle className="mx-auto mb-3 h-10 w-10 text-red-400" />

            <h3 className="font-bold text-slate-900">
              Unable to load tickets
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              {error.message}
            </p>
          </div>
        ) : tickets.length === 0 ? (
          <div className="p-12 text-center">
            <LifeBuoy className="mx-auto mb-4 h-12 w-12 text-slate-300" />

            <h3 className="text-lg font-black text-slate-900">
              No support tickets
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              Customer support requests will appear here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {tickets.map((ticket) => (
              <Link
                key={ticket.id}
                href={`/admin/support/${ticket.id}`}
                className="block px-5 py-5 transition hover:bg-slate-50 sm:px-6"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-black uppercase tracking-wide ${statusClasses(
                          ticket.status,
                        )}`}
                      >
                        {ticket.status}
                      </span>

                      <span className="text-xs text-slate-400">
                        {formatDate(ticket.updated_at)}
                      </span>
                    </div>

                    <h3 className="truncate text-base font-black text-slate-900">
                      {ticket.subject}
                    </h3>

                    <p className="mt-1 line-clamp-2 max-w-3xl text-sm leading-6 text-slate-500">
                      {ticket.message}
                    </p>

                    <p className="mt-2 text-xs font-medium text-slate-400">
                      Customer ID: {ticket.user_id}
                    </p>
                  </div>

                  <div className="shrink-0">
                    <span className="inline-flex rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-bold text-slate-700">
                      View Ticket
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function StatCard({
  icon,
  label,
  value,
  iconClass,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  iconClass: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
            {label}
          </p>

          <p className="mt-2 text-3xl font-black text-slate-900">
            {value}
          </p>
        </div>

        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconClass}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function AdminSupportPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-6">
            <div className="h-10 w-72 rounded-xl bg-slate-200" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {Array.from({ length: 5 }).map((_, index) => (
                <div
                  key={index}
                  className="h-28 rounded-2xl bg-slate-200"
                />
              ))}
            </div>
            <div className="h-96 rounded-3xl bg-slate-200" />
          </div>
        </main>
      }
    >
      <AdminSupportContent />
    </Suspense>
  );
}