 import Link from "next/link";
import { Suspense } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Headphones,
  MessageCircle,
  User,
} from "lucide-react";

import { requireAdmin } from "@/lib/auth/admin";
import SupportReplyForm from "@/components/admin/SupportReplyForm";

type SupportTicket = {
  id: string;
  subject: string;
  message: string;
  status: string;
  created_at: string;
  user_id: string;
};

type SupportMessage = {
  id: string;
  ticket_id: string;
  user_id: string;
  message: string;
  is_admin: boolean;
  created_at: string;
};

function LoadingState() {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="animate-pulse space-y-6">
          <div className="h-5 w-48 rounded bg-slate-200" />
          <div className="h-10 w-96 max-w-full rounded-lg bg-slate-200" />
          <div className="h-64 rounded-3xl bg-white ring-1 ring-slate-200" />
          <div className="h-96 rounded-3xl bg-white ring-1 ring-slate-200" />
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

  return date.toLocaleString("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
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

async function AdminSupportDetailContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: ticketId } = await params;

  const { supabase } = await requireAdmin();

  const { data: ticket, error: ticketError } = await supabase
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
    .eq("id", ticketId)
    .maybeSingle();

  if (ticketError) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
          <Link
            href="/admin/support"
            className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to support
          </Link>

          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
            <h1 className="font-semibold">
              Unable to load support ticket
            </h1>

            <p className="mt-2 text-sm">
              {ticketError.message}
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (!ticket) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto flex min-h-[60vh] max-w-2xl items-center justify-center px-4 py-16">
          <div className="w-full rounded-3xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200 sm:p-12">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
              <Headphones className="h-8 w-8 text-slate-500" />
            </div>

            <h1 className="mt-6 text-2xl font-bold text-slate-900">
              Ticket Not Found
            </h1>

            <p className="mt-3 text-sm leading-6 text-slate-600">
              The support ticket you are looking for does not exist or is no
              longer available.
            </p>

            <Link
              href="/admin/support"
              className="mt-7 inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Support
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const typedTicket = ticket as SupportTicket;

  const { data: messages, error: messagesError } = await supabase
    .from("support_messages")
    .select(
      `
        id,
        ticket_id,
        user_id,
        message,
        is_admin,
        created_at
      `,
    )
    .eq("ticket_id", ticketId)
    .order("created_at", { ascending: true });

  const typedMessages = (messages ?? []) as SupportMessage[];

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Navigation */}
        <Link
          href="/admin/support"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to support
        </Link>

        {/* Ticket header */}
        <div className="mb-6 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              <div className="mb-3 flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                  <Headphones className="h-3.5 w-3.5" />
                  Support Ticket
                </span>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusClasses(
                    typedTicket.status,
                  )}`}
                >
                  {typedTicket.status}
                </span>
              </div>

              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                {typedTicket.subject}
              </h1>

              <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                <span>
                  Ticket #{typedTicket.id.slice(0, 8)}
                </span>

                <span>•</span>

                <span>
                  User #{typedTicket.user_id.slice(0, 8)}
                </span>

                <span>•</span>

                <span>
                  {formatDate(typedTicket.created_at)}
                </span>
              </div>
            </div>
          </div>

          {/* Original request */}
          <div className="mt-7 rounded-2xl bg-slate-50 p-5 ring-1 ring-slate-200">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
              <User className="h-4 w-4 text-slate-500" />
              Customer request
            </div>

            <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">
              {typedTicket.message}
            </p>
          </div>
        </div>

        {/* Conversation */}
        <div className="rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
          <div className="border-b border-slate-200 px-6 py-5 sm:px-8">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                <MessageCircle className="h-5 w-5" />
              </div>

              <div>
                <h2 className="font-bold text-slate-900">
                  Conversation
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Communicate directly with the customer.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-5 p-6 sm:p-8">
            {messagesError ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                Unable to load conversation:{" "}
                {messagesError.message}
              </div>
            ) : typedMessages.length === 0 ? (
              <div className="rounded-2xl bg-slate-50 px-5 py-10 text-center ring-1 ring-slate-200">
                <Clock3 className="mx-auto h-7 w-7 text-slate-400" />

                <p className="mt-3 text-sm font-medium text-slate-700">
                  No replies yet
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Send the first response below.
                </p>
              </div>
            ) : (
              typedMessages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.is_admin
                      ? "justify-end"
                      : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-3xl rounded-2xl px-5 py-4 ${
                      message.is_admin
                        ? "bg-blue-600 text-white"
                        : "bg-slate-100 text-slate-900"
                    }`}
                  >
                    <div className="mb-2 flex items-center gap-2 text-xs font-semibold">
                      {message.is_admin ? (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          EduMarket Support
                        </>
                      ) : (
                        <>
                          <User className="h-3.5 w-3.5" />
                          Customer
                        </>
                      )}
                    </div>

                    <p
                      className={`whitespace-pre-wrap text-sm leading-7 ${
                        message.is_admin
                          ? "text-white"
                          : "text-slate-700"
                      }`}
                    >
                      {message.message}
                    </p>

                    <p
                      className={`mt-3 text-[11px] ${
                        message.is_admin
                          ? "text-blue-100"
                          : "text-slate-400"
                      }`}
                    >
                      {formatDate(message.created_at)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Reply form */}
          <div className="border-t border-slate-200 p-6 sm:p-8">
            <SupportReplyForm
              ticketId={typedTicket.id}
              currentStatus={typedTicket.status}
            />
          </div>
        </div>
      </div>
    </main>
  );
}

export default function AdminSupportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<LoadingState />}>
      <AdminSupportDetailContent params={params} />
    </Suspense>
  );
}