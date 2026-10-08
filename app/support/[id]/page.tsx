import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Headphones,
  MessageCircle,
  Ticket,
} from "lucide-react";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { createClient } from "@/lib/supabase/server";

type SupportDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

type SupportTicket = {
  id: string;
  subject: string;
  message: string;
  status: string;
  created_at: string;
  updated_at: string;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-KE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
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

function SupportDetailLoading() {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="h-6 w-32 animate-pulse rounded bg-slate-200" />

        <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="h-8 w-72 animate-pulse rounded bg-slate-200" />

          <div className="mt-3 h-4 w-48 animate-pulse rounded bg-slate-100" />

          <div className="mt-8 h-48 animate-pulse rounded-2xl bg-slate-100" />
        </div>
      </div>
    </main>
  );
}

async function SupportDetailContent({
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
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <Headphones className="h-7 w-7" />
            </div>

            <h1 className="mt-5 text-2xl font-bold text-slate-950">
              Sign in required
            </h1>

            <p className="mt-3 text-sm leading-6 text-slate-500">
              Please sign in to view this support ticket.
            </p>

            <Link
              href={`/auth/login?redirect=/support/${id}`}
              className="mt-6 inline-flex rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-700"
            >
              Sign In
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const { data: ticket, error } = await supabase
    .from("support_tickets")
    .select(
      "id, subject, message, status, created_at, updated_at",
    )
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !ticket) {
    notFound();
  }

  const typedTicket = ticket as SupportTicket;

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <Link
          href="/support"
          className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-600 transition hover:text-emerald-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Support
        </Link>

        <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-6 sm:p-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex min-w-0 items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                  <Ticket className="h-6 w-6" />
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Support Ticket
                  </p>

                  <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                    {typedTicket.subject}
                  </h1>

                  <p className="mt-2 text-sm text-slate-500">
                    Created {formatDate(typedTicket.created_at)}
                  </p>
                </div>
              </div>

              <span
                className={`inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${getStatusClasses(
                  typedTicket.status,
                )}`}
              >
                {getStatusIcon(typedTicket.status)}
                {getStatusLabel(typedTicket.status)}
              </span>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:p-6">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-emerald-600" />

                <p className="text-sm font-bold text-slate-900">
                  Your message
                </p>
              </div>

              <p className="mt-4 whitespace-pre-line text-sm leading-7 text-slate-600">
                {typedTicket.message}
              </p>
            </div>

            <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 p-5">
              <div className="flex items-start gap-3">
                <Headphones className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />

                <div>
                  <p className="text-sm font-bold text-blue-900">
                    Support team response
                  </p>

                  <p className="mt-1 text-sm leading-6 text-blue-800">
                    Our support team will review your request and update this
                    ticket when there is progress.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs text-slate-400">
                  Last updated
                </p>

                <p className="mt-1 text-sm font-semibold text-slate-700">
                  {formatDate(typedTicket.updated_at)}
                </p>
              </div>

              <Link
                href="/support"
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
              >
                View All Tickets
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function SupportDetailPage({
  params,
}: SupportDetailPageProps) {
  return (
    <Suspense fallback={<SupportDetailLoading />}>
      <SupportDetailContent params={params} />
    </Suspense>
  );
}