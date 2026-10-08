"use client";

import { useState } from "react";
import {
  CheckCircle2,
  Loader2,
  MessageSquare,
  Send,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

type SupportReplyFormProps = {
  ticketId: string;
  currentStatus: string;
};

export default function SupportReplyForm({
  ticketId,
  currentStatus,
}: SupportReplyFormProps) {
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState(currentStatus);
  const [busy, setBusy] = useState(false);
  const [statusBusy, setStatusBusy] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  async function updateStatus(nextStatus: string) {
    setStatusBusy(true);
    setSuccess("");
    setError("");

    try {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("Your admin session has expired. Please sign in again.");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (profile?.role !== "admin") {
        setError("You do not have permission to update this ticket.");
        return;
      }

      const { error: updateError } = await supabase
        .from("support_tickets")
        .update({
          status: nextStatus,
        })
        .eq("id", ticketId);

      if (updateError) {
        throw updateError;
      }

      setStatus(nextStatus);
      setSuccess(`Ticket marked as ${nextStatus}.`);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to update ticket status.",
      );
    } finally {
      setStatusBusy(false);
    }
  }

  async function sendReply() {
    const trimmedMessage = message.trim();

    if (!trimmedMessage) {
      setError("Please enter a reply before sending.");
      return;
    }

    if (trimmedMessage.length > 5000) {
      setError("Your reply must be 5,000 characters or less.");
      return;
    }

    setBusy(true);
    setSuccess("");
    setError("");

    try {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("Your admin session has expired. Please sign in again.");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (profile?.role !== "admin") {
        setError("You do not have permission to reply to this ticket.");
        return;
      }

      const { error: insertError } = await supabase
        .from("support_messages")
        .insert({
          ticket_id: ticketId,
          user_id: user.id,
          message: trimmedMessage,
          is_admin: true,
        });

      if (insertError) {
        throw insertError;
      }

      const { error: ticketUpdateError } = await supabase
        .from("support_tickets")
        .update({
          status: "pending",
        })
        .eq("id", ticketId);

      if (ticketUpdateError) {
        throw ticketUpdateError;
      }

      setMessage("");
      setStatus("pending");
      setSuccess(
        "Reply sent successfully. The customer has been notified.",
      );

      window.setTimeout(() => {
        window.location.reload();
      }, 700);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to send your reply.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-emerald-600" />

              <h2 className="text-lg font-black text-slate-900">
                Respond to Customer
              </h2>
            </div>

            <p className="mt-1 text-sm text-slate-500">
              Send a professional response and manage the ticket status.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <label
              htmlFor="ticket-status"
              className="text-xs font-bold uppercase tracking-wide text-slate-400"
            >
              Status
            </label>

            <select
              id="ticket-status"
              value={status}
              disabled={statusBusy || busy}
              onChange={(event) => {
                updateStatus(event.target.value);
              }}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <option value="open">Open</option>
              <option value="pending">Pending</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>
      </div>

      <div className="p-5 sm:p-6">
        {success && (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />

            <p className="font-semibold">{success}</p>
          </div>
        )}

        {error && (
          <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        <label
          htmlFor="support-reply"
          className="mb-2 block text-sm font-bold text-slate-700"
        >
          Your Reply
        </label>

        <textarea
          id="support-reply"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          disabled={busy}
          maxLength={5000}
          rows={7}
          placeholder="Write a clear and helpful response to the customer..."
          className="w-full resize-y rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-7 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
        />

        <div className="mt-2 flex items-center justify-between">
          <p className="text-xs text-slate-400">
            Be clear, helpful, and professional.
          </p>

          <p className="text-xs font-medium text-slate-400">
            {message.length}/5000
          </p>
        </div>

        <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={() => setMessage("")}
            disabled={busy || !message}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Clear
          </button>

          <button
            type="button"
            onClick={sendReply}
            disabled={busy || !message.trim()}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Send Reply
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}