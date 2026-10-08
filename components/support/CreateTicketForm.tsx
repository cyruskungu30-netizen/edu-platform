"use client";

import { FormEvent, useState } from "react";
import { Loader2, Send } from "lucide-react";

import { createClient } from "@/lib/supabase/client";

type CreateTicketFormProps = {
  onCreated?: () => void;
};

export default function CreateTicketForm({
  onCreated,
}: CreateTicketFormProps) {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSuccess("");

    const cleanSubject = subject.trim();
    const cleanMessage = message.trim();

    if (!cleanSubject) {
      setError("Please enter a subject.");
      return;
    }

    if (cleanSubject.length < 3) {
      setError("Subject must be at least 3 characters.");
      return;
    }

    if (!cleanMessage) {
      setError("Please describe your issue.");
      return;
    }

    if (cleanMessage.length < 10) {
      setError("Please provide a little more detail.");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("Please sign in before creating a support ticket.");
        return;
      }

      const { error: insertError } = await supabase
        .from("support_tickets")
        .insert({
          user_id: user.id,
          subject: cleanSubject,
          message: cleanMessage,
          status: "open",
        });

      if (insertError) {
        throw insertError;
      }

      setSubject("");
      setMessage("");
      setSuccess("Your support ticket has been created successfully.");

      onCreated?.();
    } catch (submitError) {
      console.error("Support ticket creation error:", submitError);

      setError(
        "We could not create your support ticket. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
    >
      <div>
        <h2 className="text-xl font-bold text-slate-950">
          Create a support ticket
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          Tell us what you need help with and our support team will get back
          to you.
        </p>
      </div>

      {error && (
        <div className="mt-6 rounded-2xl border border-red-100 bg-red-50 p-4">
          <p className="text-sm font-semibold text-red-700">{error}</p>
        </div>
      )}

      {success && (
        <div className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
          <p className="text-sm font-semibold text-emerald-700">
            {success}
          </p>
        </div>
      )}

      <div className="mt-6 space-y-5">
        <div>
          <label
            htmlFor="support-subject"
            className="mb-2 block text-sm font-bold text-slate-800"
          >
            Subject
          </label>

          <input
            id="support-subject"
            type="text"
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            placeholder="e.g. Payment completed but resource is not available"
            maxLength={160}
            disabled={loading}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-slate-50"
          />
        </div>

        <div>
          <label
            htmlFor="support-message"
            className="mb-2 block text-sm font-bold text-slate-800"
          >
            Describe your issue
          </label>

          <textarea
            id="support-message"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Please explain what happened and how we can help..."
            rows={7}
            maxLength={5000}
            disabled={loading}
            className="w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-slate-50"
          />

          <div className="mt-2 text-right text-xs text-slate-400">
            {message.length}/5000
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Creating ticket...
          </>
        ) : (
          <>
            <Send className="h-5 w-5" />
            Submit Support Ticket
          </>
        )}
      </button>
    </form>
  );
}