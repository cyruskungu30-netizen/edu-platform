"use client";

import Link from "next/link";
import {
  FormEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  LoaderCircle,
  MessageCircle,
  Send,
  ShieldCheck,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Discussion = {
  id: string;
  assignment_id: string;
  student_id: string;
  teacher_id: string;
};

type Assignment = {
  id: string;
  title: string;
  status: string;
};

type Message = {
  id: string;
  discussion_id: string;
  assignment_id: string;
  sender_id: string;
  message: string;
  created_at: string;
};

type Person = {
  id: string;
  full_name: string | null;
};

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("en-KE", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export default function ConversationView({
  discussionId,
  role,
}: {
  discussionId: string;
  role: "student" | "teacher";
}) {
  const router = useRouter();
  const bottomRef = useRef<HTMLDivElement>(null);

  const [userId, setUserId] = useState("");
  const [discussion, setDiscussion] =
    useState<Discussion | null>(null);
  const [assignment, setAssignment] =
    useState<Assignment | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [otherName, setOtherName] = useState("");
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadConversation = useCallback(async () => {
    setError("");

    try {
      const supabase = createClient();

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        throw authError;
      }

      if (!user) {
        router.replace(
          `/login?redirect=${encodeURIComponent(
            `/${role}/messages/${discussionId}`
          )}`
        );

        return;
      }

      setUserId(user.id);

      let teacherProfileId: string | null = null;

      if (role === "teacher") {
        const { data: teacher, error: teacherError } =
          await supabase
            .from("teacher_profiles")
            .select("id")
            .eq("user_id", user.id)
            .maybeSingle();

        if (teacherError) {
          throw teacherError;
        }

        if (!teacher) {
          throw new Error(
            "Your teacher profile could not be found."
          );
        }

        teacherProfileId = teacher.id;
      }

      let discussionQuery = supabase
        .from("assignment_discussions")
        .select(
          "id, assignment_id, student_id, teacher_id"
        )
        .eq("id", discussionId);

      discussionQuery =
        role === "student"
          ? discussionQuery.eq("student_id", user.id)
          : discussionQuery.eq(
              "teacher_id",
              teacherProfileId!
            );

      const {
        data: row,
        error: discussionError,
      } = await discussionQuery.maybeSingle();

      if (discussionError) {
        throw discussionError;
      }

      if (!row) {
        throw new Error(
          "This conversation does not exist or you do not have access."
        );
      }

      const current = row as Discussion;

      setDiscussion(current);

      const [
        assignmentResult,
        messagesResult,
        studentResult,
        teacherResult,
      ] = await Promise.all([
        supabase
          .from("assignments")
          .select("id, title, status")
          .eq("id", current.assignment_id)
          .maybeSingle(),

        supabase
          .from("assignment_discussion_messages")
          .select(
            "id, discussion_id, assignment_id, sender_id, message, created_at"
          )
          .eq("discussion_id", current.id)
          .order("created_at", { ascending: true })
          .limit(500),

        supabase
          .from("profiles")
          .select("id, full_name")
          .eq("id", current.student_id)
          .maybeSingle(),

        supabase
          .from("teacher_profiles")
          .select("id, display_name, user_id")
          .eq("id", current.teacher_id)
          .maybeSingle(),
      ]);

      if (assignmentResult.error) {
        throw assignmentResult.error;
      }

      if (messagesResult.error) {
        throw messagesResult.error;
      }

      if (studentResult.error) {
        throw studentResult.error;
      }

      if (teacherResult.error) {
        throw teacherResult.error;
      }

      setAssignment(
        assignmentResult.data as Assignment | null
      );

      setMessages(
        (messagesResult.data ?? []) as Message[]
      );

      const student =
        studentResult.data as Person | null;

      const teacher = teacherResult.data as {
        id: string;
        display_name: string | null;
        user_id: string;
      } | null;

      setOtherName(
        role === "student"
          ? teacher?.display_name || "Your teacher"
          : student?.full_name || "Student"
      );
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to load this conversation."
      );
    } finally {
      setLoading(false);
    }
  }, [discussionId, role, router]);

  useEffect(() => {
    void loadConversation();

    const supabase = createClient();

    const channel = supabase
      .channel(`discussion-${discussionId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "assignment_discussion_messages",
          filter: `discussion_id=eq.${discussionId}`,
        },
        () => {
          void loadConversation();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [discussionId, loadConversation]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages.length]);

  async function sendMessage(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const message = draft.trim();

    if (!message || !discussion || sending) {
      return;
    }

    if (message.length > 5000) {
      setError(
        "Messages must be 5,000 characters or fewer."
      );
      return;
    }

    setSending(true);
    setError("");
    setNotice("");

    try {
      const supabase = createClient();

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        throw authError;
      }

      if (!user || user.id !== userId) {
        throw new Error(
          "Your session has changed. Please sign in again."
        );
      }

      const { error: insertError } = await supabase
        .from("assignment_discussion_messages")
        .insert({
          discussion_id: discussion.id,
          assignment_id: discussion.assignment_id,
          sender_id: user.id,
          message,
        });

      if (insertError) {
        throw insertError;
      }

      setDraft("");
      setNotice("Message sent.");

      await loadConversation();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Your message could not be sent."
      );
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-80 items-center justify-center text-sm text-slate-500">
        <LoaderCircle className="mr-3 h-5 w-5 animate-spin" />
        Loading conversation...
      </div>
    );
  }

  if (!discussion) {
    return (
      <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6">
        <h1 className="font-bold text-rose-900">
          Conversation unavailable
        </h1>

        <p className="mt-2 text-sm text-rose-800">
          {error ||
            "You may not have access to this conversation."}
        </p>

        <Link
          href={`/${role}/messages`}
          className="mt-4 inline-flex items-center gap-2 font-bold text-rose-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to messages
        </Link>
      </div>
    );
  }

  const canSend = assignment?.status === "published";

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href={`/${role}/messages`}
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-indigo-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to messages
      </Link>

      <section className="mt-5 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <header className="border-b border-slate-200 bg-white p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-indigo-50 p-3 text-indigo-700">
              <MessageCircle className="h-6 w-6" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold uppercase tracking-wide text-indigo-700">
                Assignment discussion
              </p>

              <h1 className="mt-1 text-xl font-black text-slate-950">
                {assignment?.title || "Assignment"}
              </h1>

              <p className="mt-1 text-sm text-slate-600">
                {otherName}
              </p>
            </div>

            <ShieldCheck
              className="h-5 w-5 shrink-0 text-emerald-600"
              aria-label="Protected conversation"
            />
          </div>
        </header>

        <div className="min-h-72 max-h-[55vh] space-y-4 overflow-y-auto bg-slate-50 p-4 sm:p-6">
          {messages.length === 0 ? (
            <div className="flex min-h-60 flex-col items-center justify-center text-center">
              <MessageCircle className="h-10 w-10 text-slate-300" />

              <h2 className="mt-3 font-bold text-slate-900">
                Start the conversation
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Ask a question or request clarification about
                this assignment.
              </p>
            </div>
          ) : (
            messages.map((item) => {
              const mine = item.sender_id === userId;

              return (
                <div
                  key={item.id}
                  className={`flex ${
                    mine ? "justify-end" : "justify-start"
                  }`}
                >
                  <article
                    className={`max-w-[88%] rounded-2xl px-4 py-3 shadow-sm sm:max-w-[75%] ${
                      mine
                        ? "rounded-br-md bg-indigo-600 text-white"
                        : "rounded-bl-md border border-slate-200 bg-white text-slate-900"
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words text-sm leading-6">
                      {item.message}
                    </p>

                    <p
                      className={`mt-2 text-[10px] ${
                        mine
                          ? "text-indigo-100"
                          : "text-slate-400"
                      }`}
                    >
                      {formatDate(item.created_at)}
                    </p>
                  </article>
                </div>
              );
            })
          )}

          <div ref={bottomRef} />
        </div>

        {error && (
          <div
            role="alert"
            className="mx-4 mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800 sm:mx-6"
          >
            {error}
          </div>
        )}

        {notice && (
          <div
            role="status"
            className="mx-4 mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 sm:mx-6"
          >
            {notice}
          </div>
        )}

        {canSend ? (
          <form
            onSubmit={sendMessage}
            className="border-t border-slate-200 p-4 sm:p-5"
          >
            <label
              htmlFor="discussion-message"
              className="sr-only"
            >
              Write a message
            </label>

            <div className="flex items-end gap-3">
              <textarea
                id="discussion-message"
                value={draft}
                onChange={(event) =>
                  setDraft(event.target.value)
                }
                rows={2}
                maxLength={5000}
                placeholder="Write your message..."
                className="min-h-12 flex-1 resize-y rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
              />

              <button
                type="submit"
                disabled={sending || !draft.trim()}
                className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {sending ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}

                <span className="hidden sm:inline">
                  Send
                </span>
              </button>
            </div>

            <p className="mt-2 text-xs text-slate-400">
              {draft.length}/5000 characters
            </p>
          </form>
        ) : (
          <div className="border-t border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
            Messaging is unavailable because this assignment
            is no longer published.
          </div>
        )}
      </section>
    </div>
  );
}