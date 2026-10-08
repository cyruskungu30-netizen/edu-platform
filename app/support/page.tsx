 import Link from "next/link";
import { connection } from "next/server";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Headphones,
  MessageCircle,
  Ticket,
} from "lucide-react";
import { Suspense } from "react";

import { createClient } from "@/lib/supabase/server";
import CreateTicketForm from "@/components/support/CreateTicketForm";

type SupportTicket = {
  id: string;
  subject: string;
  message: string;
  status: string;
  created_at: string;
  updated_at: string;
};

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return new Intl.DateTimeFormat("en-KE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getStatusLabel(status: string) {
  switch (status) {
    case "open":
      return "Open";
    case "pending":
      return "Pending";
    case "resolved":
      return "Resolved";
    case "closed":
      return "Closed";
    default:
      return status;
  }
}

function getStatusClasses(status: string) {
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

function getStatusIcon(status: string) {
  switch (status) {
    case "resolved":
    case "closed":
      return <CheckCircle2 className="h-4 w-4" />;
    case "pending":
      return <Clock3 className="h-4 w-4" />;
    default:
      return <MessageCircle className="h-4 w-4" />;
  }
}

function SupportLoading() {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="h-6 w-32 animate-pulse rounded bg-slate-200" />

        <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_390px]">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="h-8 w-64 animate-pulse rounded bg-slate-200" />
            <div className="mt-3 h-4 w-80 max-w-full animate-pulse rounded bg-slate-100" />

            <div className="mt-8 space-y-3">
              <div className="h-28 animate-pulse rounded-2xl bg-slate-100" />
              <div className="h-28 animate-pulse rounded-2xl bg-slate-100" />
              <div className="h-28 animate-pulse rounded-2xl bg-slate-100" />
            </div>
          </div>

          <div className="h-96 animate-pulse rounded-3xl bg-slate-200" />
        </div>
      </div>
    </main>
  );
}

async function SupportContent() {
  // Wait until a request is available before accessing dynamic data.
  await connection();

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <Headphones className="h-7 w-7" />
            </div>

            <h1 className="mt-5 text-2xl font-bold text-slate-950">
              EduMarket Support
            </h1>

            <p className="mt-3 text-sm leading-6 text-slate-500">
              Sign in to create support tickets and view your previous
              requests.
            </p>

            <Link
              href="/auth/login?redirect=/support"
              className="mt-6 inline-flex rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-700"
            >
              Sign In
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const { data: tickets, error } = await supabase
    .from("support_tickets")
    .select("id, subject, message, status, created_at, updated_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const typedTickets = (tickets ?? []) as SupportTicket[];

  const openTickets = typedTickets.filter(
    (ticket) =>
      ticket.status === "open" || ticket.status === "pending",
  ).length;

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <Link
          href="/account"
          className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-600 transition hover:text-emerald-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Account
        </Link>

        <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_390px]">
          <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 p-6 sm:p-8">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                    <Headphones className="h-6 w-6" />
                  </div>

                  <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                      Support
                    </h1>

                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      Get help with payments, downloads, orders and your
                      EduMarket account.
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <div className="rounded-xl bg-slate-50 px-4 py-2.5 text-center">
                    <p className="text-lg font-black text-slate-950">
                      {typedTickets.length}
                    </p>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                      Tickets
                    </p>
                  </div>

                  <div className="rounded-xl bg-blue-50 px-4 py-2.5 text-center">
                    <p className="text-lg font-black text-blue-700">
                      {openTickets}
                    </p>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-blue-500">
                      Active
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-6">
              {error ? (
                <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-center">
                  <p className="text-sm font-semibold text-red-700">
                    We could not load your support tickets.
                  </p>
                  <p className="mt-1 text-xs text-red-600">
                    Please refresh the page and try again.
                  </p>
                </div>
              ) : typedTickets.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm">
                    <Ticket className="h-7 w-7" />
                  </div>

                  <h2 className="mt-5 text-lg font-bold text-slate-950">
                    No support tickets
                  </h2>

                  <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                    You haven&apos;t contacted support yet. If you need help,
                    create your first support ticket.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {typedTickets.map((ticket) => (
                    <Link
                      key={ticket.id}
                      href={`/support/${ticket.id}`}
                      className="block rounded-2xl border border-slate-200 p-5 transition hover:border-emerald-300 hover:bg-slate-50"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <Ticket className="h-4 w-4 shrink-0 text-emerald-600" />

                            <h2 className="truncate text-sm font-bold text-slate-950">
                              {ticket.subject}
                            </h2>
                          </div>

                          <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">
                            {ticket.message}
                          </p>

                          <p className="mt-3 text-xs text-slate-400">
                            Created {formatDate(ticket.created_at)}
                          </p>
                        </div>

                        <span
                          className={`inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${getStatusClasses(
                            ticket.status,
                          )}`}
                        >
                          {getStatusIcon(ticket.status)}
                          {getStatusLabel(ticket.status)}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </section>

          <aside>
            <CreateTicketForm />
          </aside>
        </div>

        <div className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
          <div className="flex items-start gap-3">
            <Headphones className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />

            <div>
              <p className="text-sm font-bold text-emerald-900">
                Need help quickly?
              </p>

              <p className="mt-1 text-sm leading-6 text-emerald-800">
                Include your order number, payment details or resource name
                where relevant. This helps our team resolve your issue faster.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function SupportPage() {
  return (
    <Suspense fallback={<SupportLoading />}>
      <SupportContent />
    </Suspense>
  );
}