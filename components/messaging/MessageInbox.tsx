"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  MessageCircle,
  RefreshCw,
  Search,
  UserRound,
  Clock3,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Discussion = {
  id: string;
  assignment_id: string;
  student_id: string;
  teacher_id: string;
  created_at: string;
  updated_at: string;
};

type Assignment = {
  id: string;
  title: string;
  status: string;
  teacher_id: string;
};

type Profile = {
  id: string;
  full_name: string | null;
};

type Message = {
  id: string;
  discussion_id: string;
  sender_id: string;
  message: string;
  created_at: string;
};

type InboxItem = {
  discussion: Discussion;
  assignmentTitle: string;
  otherPerson: string;
  latestMessage: Message | null;
};

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Recently";
  }

  return new Intl.DateTimeFormat("en-KE", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export default function MessageInbox({
  role,
}: {
  role: "student" | "teacher";
}) {
  const router = useRouter();

  const [items, setItems] = useState<InboxItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const loadInbox = useCallback(
    async (quiet = false) => {
      if (!quiet) {
        setLoading(true);
      }

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
          const destination =
            role === "student"
              ? "/student/messages"
              : "/teacher/messages";

          router.replace(
            `/login?redirect=${encodeURIComponent(destination)}`
          );

          return;
        }

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
            "id, assignment_id, student_id, teacher_id, created_at, updated_at"
          )
          .order("updated_at", {
            ascending: false,
          })
          .limit(100);

        discussionQuery =
          role === "student"
            ? discussionQuery.eq("student_id", user.id)
            : discussionQuery.eq(
                "teacher_id",
                teacherProfileId!
              );

        const {
          data: discussions,
          error: discussionsError,
        } = await discussionQuery;

        if (discussionsError) {
          throw discussionsError;
        }

        const rows = (discussions ?? []) as Discussion[];

        if (rows.length === 0) {
          setItems([]);
          return;
        }

        const assignmentIds = [
          ...new Set(
            rows.map((row) => row.assignment_id)
          ),
        ];

        const studentIds = [
          ...new Set(
            rows.map((row) => row.student_id)
          ),
        ];

        const teacherIds = [
          ...new Set(
            rows.map((row) => row.teacher_id)
          ),
        ];

        const discussionIds = rows.map(
          (row) => row.id
        );

        const [
          assignmentResult,
          studentResult,
          teacherResult,
          messageResult,
        ] = await Promise.all([
          supabase
            .from("assignments")
            .select("id, title, status, teacher_id")
            .in("id", assignmentIds),

          supabase
            .from("profiles")
            .select("id, full_name")
            .in("id", studentIds),

          supabase
            .from("teacher_profiles")
            .select("id, user_id, display_name")
            .in("id", teacherIds),

          supabase
            .from("assignment_discussion_messages")
            .select(
              "id, discussion_id, sender_id, message, created_at"
            )
            .in("discussion_id", discussionIds)
            .order("created_at", {
              ascending: false,
            })
            .limit(500),
        ]);

        if (assignmentResult.error) {
          throw assignmentResult.error;
        }

        if (studentResult.error) {
          throw studentResult.error;
        }

        if (teacherResult.error) {
          throw teacherResult.error;
        }

        if (messageResult.error) {
          throw messageResult.error;
        }

        const assignmentMap = new Map(
          (assignmentResult.data ?? []).map(
            (item) => [item.id, item as Assignment]
          )
        );

        const studentMap = new Map(
          (studentResult.data ?? []).map(
            (item) => [item.id, item as Profile]
          )
        );

        const teacherMap = new Map(
          (teacherResult.data ?? []).map(
            (item) => [
              item.id,
              item as {
                id: string;
                user_id: string;
                display_name: string | null;
              },
            ]
          )
        );

        const messageMap = new Map<string, Message>();

        for (const message of (messageResult.data ??
          []) as Message[]) {
          if (!messageMap.has(message.discussion_id)) {
            messageMap.set(
              message.discussion_id,
              message
            );
          }
        }

        const nextItems: InboxItem[] = rows.map(
          (discussion) => {
            const student = studentMap.get(
              discussion.student_id
            );

            const teacher = teacherMap.get(
              discussion.teacher_id
            );

            const assignment = assignmentMap.get(
              discussion.assignment_id
            );

            const otherPerson =
              role === "student"
                ? teacher?.display_name || "Your teacher"
                : student?.full_name || "Student";

            return {
              discussion,
              assignmentTitle:
                assignment?.title ||
                "Assignment discussion",
              otherPerson,
              latestMessage:
                messageMap.get(discussion.id) ?? null,
            };
          }
        );

        setItems(nextItems);
      } catch (caught) {
        setError(
          caught instanceof Error
            ? caught.message
            : "Unable to load messages."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [role, router]
  );

  useEffect(() => {
    void loadInbox();

    const supabase = createClient();

    const channel = supabase
      .channel(`message-inbox-${role}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "assignment_discussion_messages",
        },
        () => {
          void loadInbox(true);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "assignment_discussions",
        },
        () => {
          void loadInbox(true);
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [loadInbox, role]);

  const filtered = items.filter((item) => {
    const searchableText = [
      item.assignmentTitle,
      item.otherPerson,
      item.latestMessage?.message ?? "",
    ]
      .join(" ")
      .toLowerCase();

    return searchableText.includes(
      query.trim().toLowerCase()
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-indigo-700">
            <MessageCircle className="h-4 w-4" />
            Communication centre
          </div>

          <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950">
            Messages
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Discuss assignments with the people involved
            in your coursework.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setRefreshing(true);
            void loadInbox(true);
          }}
          disabled={refreshing}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
        >
          <RefreshCw
            className={`h-4 w-4 ${
              refreshing ? "animate-spin" : ""
            }`}
          />
          Refresh
        </button>
      </div>

      <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <Search className="h-5 w-5 text-slate-400" />

        <input
          value={query}
          onChange={(event) =>
            setQuery(event.target.value)
          }
          className="w-full bg-transparent text-sm outline-none"
          placeholder="Search assignments or people..."
        />
      </label>

      {error && (
        <div
          role="alert"
          className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"
        >
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="h-36 animate-pulse rounded-2xl bg-slate-200"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <MessageCircle className="mx-auto h-12 w-12 text-slate-300" />

          <h2 className="mt-4 text-xl font-black text-slate-900">
            No conversations yet
          </h2>

          <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-600">
            {query
              ? "No conversations match your search."
              : role === "student"
                ? "Open a published assignment and start a discussion with your teacher."
                : "Student discussions about your assignments will appear here."}
          </p>

          {!query && (
            <Link
              href={
                role === "student"
                  ? "/student/assignments"
                  : "/teacher/assignments"
              }
              className="mt-6 inline-flex rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white hover:bg-indigo-700"
            >
              {role === "student"
                ? "Browse assignments"
                : "Manage assignments"}
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((item) => (
            <Link
              key={item.discussion.id}
              href={`/${role}/messages/${item.discussion.id}`}
              className="group rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="rounded-2xl bg-indigo-50 p-3 text-indigo-700">
                    <UserRound className="h-5 w-5" />
                  </div>

                  <div className="min-w-0">
                    <p className="truncate font-bold text-slate-950">
                      {item.otherPerson}
                    </p>

                    <p className="mt-1 line-clamp-1 text-xs font-semibold text-indigo-700">
                      {item.assignmentTitle}
                    </p>
                  </div>
                </div>

                <span className="shrink-0 text-[11px] text-slate-400">
                  {formatDate(item.discussion.updated_at)}
                </span>
              </div>

              <p className="mt-5 line-clamp-2 text-sm leading-6 text-slate-600">
                {item.latestMessage?.message ||
                  "No messages yet. Open this discussion to send the first message."}
              </p>

              <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-slate-500">
                <Clock3 className="h-3.5 w-3.5" />
                Assignment discussion
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}