import { Suspense } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  GraduationCap,
  MessageSquareText,
  Search,
  Trophy,
} from "lucide-react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "My Submissions | EduMarket",
  description:
    "Review submitted assignments, marks, submission dates, and teacher feedback.",
};

type Submission = {
  id: string;
  assignment_id: string;
  student_id: string;
  submission_text: string | null;
  attachment_name: string | null;
  submitted_at: string | null;
  marks_awarded: number | null;
  teacher_feedback: string | null;
  status: string;
};

type Assignment = {
  id: string;
  title: string;
  description: string | null;
  assignment_type: string;
  total_marks: number | null;
  due_at: string | null;
  status: string;
  teacher_id: string;
};

type TeacherProfile = {
  id: string;
  display_name: string | null;
  school_name: string | null;
};

function formatDate(value: string | null) {
  if (!value) return "Not recorded";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Not recorded";

  return new Intl.DateTimeFormat("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    not_submitted: "Not submitted",
    draft: "Draft",
    submitted: "Submitted",
    late: "Submitted late",
    graded: "Graded",
    returned: "Returned with feedback",
  };

  return labels[status.toLowerCase()] ?? status.replaceAll("_", " ");
}

function statusClasses(status: string) {
  switch (status.toLowerCase()) {
    case "graded":
      return "bg-emerald-50 text-emerald-700 ring-emerald-200";
    case "returned":
      return "bg-blue-50 text-blue-700 ring-blue-200";
    case "submitted":
      return "bg-indigo-50 text-indigo-700 ring-indigo-200";
    case "late":
      return "bg-amber-50 text-amber-700 ring-amber-200";
    case "draft":
      return "bg-slate-100 text-slate-700 ring-slate-200";
    default:
      return "bg-slate-100 text-slate-600 ring-slate-200";
  }
}

async function SubmissionHistoryContent() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  const [
    { data: profile, error: profileError },
    { data: submissions, error: submissionsError },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, role")
      .eq("id", user.id)
      .maybeSingle(),

    supabase
      .from("assignment_submissions")
      .select(
        "id, assignment_id, student_id, submission_text, attachment_name, submitted_at, marks_awarded, teacher_feedback, status"
      )
      .eq("student_id", user.id)
      .order("submitted_at", { ascending: false, nullsFirst: false })
      .limit(500),
  ]);

  if (profileError || !profile) {
    return (
      <main className="min-h-screen bg-slate-50 px-5 py-16">
        <div className="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white p-8 text-center">
          <GraduationCap className="mx-auto h-12 w-12 text-indigo-600" />

          <h1 className="mt-4 text-2xl font-black text-slate-950">
            Profile unavailable
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-600">
            We could not verify your account. Please sign in again.
          </p>

          <Link
            href="/login"
            className="mt-6 inline-flex rounded-xl bg-indigo-600 px-5 py-3 font-bold text-white hover:bg-indigo-700"
          >
            Sign in
          </Link>
        </div>
      </main>
    );
  }

  if (profile.role !== "student") {
    redirect("/");
  }

  if (submissionsError) {
    console.error(
      "Student submission history query failed:",
      submissionsError.message
    );

    return (
      <main className="min-h-screen bg-slate-50 px-5 py-16">
        <div className="mx-auto max-w-2xl rounded-3xl border border-rose-200 bg-white p-8">
          <h1 className="text-xl font-black text-rose-900">
            Unable to load submission history
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-600">
            Please try again. If this continues, verify the submission
            table's SELECT policy for student accounts.
          </p>
        </div>
      </main>
    );
  }

  const allSubmissions = (submissions ?? []) as Submission[];

  const assignmentIds = [
    ...new Set(allSubmissions.map((submission) => submission.assignment_id)),
  ];

  let assignments: Assignment[] = [];

  if (assignmentIds.length > 0) {
    const { data, error } = await supabase
      .from("assignments")
      .select(
        "id, title, description, assignment_type, total_marks, due_at, status, teacher_id"
      )
      .in("id", assignmentIds);

    if (error) {
      console.error("Submission assignment lookup failed:", error.message);
    } else {
      assignments = (data ?? []) as Assignment[];
    }
  }

  const assignmentMap = new Map(
    assignments.map((assignment) => [assignment.id, assignment])
  );

  const teacherIds = [
    ...new Set(assignments.map((assignment) => assignment.teacher_id)),
  ];

  let teachers: TeacherProfile[] = [];

  if (teacherIds.length > 0) {
    const { data, error } = await supabase
      .from("teacher_profiles")
      .select("id, display_name, school_name")
      .in("id", teacherIds);

    if (error) {
      console.error("Teacher profile lookup failed:", error.message);
    } else {
      teachers = (data ?? []) as TeacherProfile[];
    }
  }

  const teacherMap = new Map(
    teachers.map((teacher) => [teacher.id, teacher])
  );

  const submittedCount = allSubmissions.filter((submission) =>
    ["submitted", "late", "graded", "returned"].includes(
      submission.status.toLowerCase()
    )
  ).length;

  const gradedSubmissions = allSubmissions.filter(
    (submission) =>
      submission.marks_awarded !== null &&
      ["graded", "returned"].includes(submission.status.toLowerCase())
  );

  const awaitingReview = allSubmissions.filter((submission) =>
    ["submitted", "late"].includes(submission.status.toLowerCase())
  ).length;

  const totalMarksAwarded = gradedSubmissions.reduce(
    (total, submission) => total + Number(submission.marks_awarded ?? 0),
    0
  );

  const firstName =
    profile.full_name?.trim().split(/\s+/)[0] ||
    user.email?.split("@")[0] ||
    "Student";

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-5 py-7 sm:px-8">
          <Link
            href="/student"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-indigo-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to dashboard
          </Link>

          <div className="mt-7 flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700">
                <GraduationCap className="h-4 w-4" />
                STUDENT WORKSPACE
              </div>

              <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                My submissions
              </h1>

              <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">
                Welcome, {firstName}. Track your submitted work, review your
                marks, and learn from teacher feedback.
              </p>
            </div>

            <Link
              href="/student/assignments"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-indigo-700"
            >
              Browse assignments
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={<FileText className="h-5 w-5" />}
            label="Total submissions"
            value={String(allSubmissions.length)}
            color="indigo"
          />

          <StatCard
            icon={<CheckCircle2 className="h-5 w-5" />}
            label="Submitted"
            value={String(submittedCount)}
            color="emerald"
          />

          <StatCard
            icon={<Clock3 className="h-5 w-5" />}
            label="Awaiting review"
            value={String(awaitingReview)}
            color="amber"
          />

          <StatCard
            icon={<Trophy className="h-5 w-5" />}
            label="Marks awarded"
            value={String(totalMarksAwarded)}
            color="blue"
          />
        </section>

        <section className="mt-10">
          <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">
                Academic progress
              </p>

              <h2 className="mt-2 text-2xl font-black text-slate-950">
                Submission history
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Your recorded submissions and the feedback your teachers
                have provided.
              </p>
            </div>

            <div className="inline-flex items-center gap-2 text-sm text-slate-500">
              <CalendarDays className="h-4 w-4" />
              Ordered by submission date
            </div>
          </div>

          {allSubmissions.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                <BookOpen className="h-8 w-8" />
              </div>

              <h3 className="mt-5 text-xl font-black text-slate-950">
                No submissions yet
              </h3>

              <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-600">
                When you submit an assignment, it will appear here with its
                submission date, status, marks, and teacher feedback.
              </p>

              <Link
                href="/student/assignments"
                className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-indigo-700"
              >
                Find an assignment
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <div className="space-y-5">
              {allSubmissions.map((submission) => {
                const assignment = assignmentMap.get(submission.assignment_id);
                const teacher = assignment
                  ? teacherMap.get(assignment.teacher_id)
                  : undefined;

                const hasGrade = submission.marks_awarded !== null;

                return (
                  <article
                    key={submission.id}
                    className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-indigo-200 hover:shadow-md sm:p-7"
                  >
                    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                      <div className="flex min-w-0 gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700">
                          <FileText className="h-6 w-6" />
                        </div>

                        <div className="min-w-0">
                          <h3 className="break-words text-lg font-black text-slate-950">
                            {assignment?.title ?? "Assignment"}
                          </h3>

                          <p className="mt-1 text-sm capitalize text-slate-500">
                            {(assignment?.assignment_type ?? "assignment").replaceAll(
                              "_",
                              " "
                            )}
                          </p>

                          {teacher && (
                            <p className="mt-2 text-sm text-slate-600">
                              Teacher:{" "}
                              <span className="font-semibold text-slate-800">
                                {teacher.display_name || "Teacher"}
                              </span>
                              {teacher.school_name
                                ? ` · ${teacher.school_name}`
                                : ""}
                            </p>
                          )}
                        </div>
                      </div>

                      <span
                        className={`inline-flex w-fit shrink-0 rounded-full px-3 py-1.5 text-xs font-bold ring-1 ${statusClasses(
                          submission.status
                        )}`}
                      >
                        {statusLabel(submission.status)}
                      </span>
                    </div>

                    <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      <InfoCard
                        label="Submitted on"
                        value={formatDate(submission.submitted_at)}
                      />

                      <InfoCard
                        label="Deadline"
                        value={formatDate(assignment?.due_at ?? null)}
                      />

                      <InfoCard
                        label="Marks awarded"
                        value={
                          hasGrade
                            ? `${submission.marks_awarded} / ${
                                assignment?.total_marks ?? "—"
                              }`
                            : "Not graded yet"
                        }
                      />

                      <InfoCard
                        label="Attachment"
                        value={submission.attachment_name || "No attachment"}
                      />
                    </div>

                    {submission.teacher_feedback && (
                      <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 p-5">
                        <div className="flex items-center gap-2 font-bold text-blue-950">
                          <MessageSquareText className="h-5 w-5" />
                          Teacher feedback
                        </div>

                        <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-blue-950">
                          {submission.teacher_feedback}
                        </p>
                      </div>
                    )}

                    {submission.submission_text && (
                      <details className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <summary className="cursor-pointer text-sm font-bold text-slate-800">
                          Review your written response
                        </summary>

                        <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-700">
                          {submission.submission_text}
                        </p>
                      </details>
                    )}

                    <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5">
                      <p className="text-xs text-slate-500">
                        Submission reference: {submission.id.slice(0, 8)}
                      </p>

                      {assignment ? (
                        <Link
                          href={`/student/assignments/${assignment.id}`}
                          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-800 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                        >
                          View assignment
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      ) : (
                        <span className="text-xs text-slate-500">
                          Assignment details unavailable
                        </span>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: "indigo" | "emerald" | "amber" | "blue";
}) {
  const colors = {
    indigo: "bg-indigo-50 text-indigo-700",
    emerald: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    blue: "bg-blue-50 text-blue-700",
  };

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-600">{label}</p>
          <p className="mt-3 text-3xl font-black tracking-tight text-slate-950">
            {value}
          </p>
        </div>

        <div className={`rounded-xl p-3 ${colors[color]}`}>{icon}</div>
      </div>
    </article>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-xl bg-slate-50 p-3">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-2 break-words text-sm font-bold text-slate-900">
        {value}
      </p>
    </div>
  );
}

export default function StudentSubmissionsPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-slate-50 px-5 py-16">
          <div className="mx-auto max-w-7xl animate-pulse">
            <div className="h-8 w-48 rounded-lg bg-slate-200" />
            <div className="mt-8 h-14 w-80 max-w-full rounded-xl bg-slate-200" />
            <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="h-32 rounded-2xl bg-white shadow-sm"
                />
              ))}
            </div>
            <div className="mt-8 h-72 rounded-3xl bg-white shadow-sm" />
          </div>
        </main>
      }
    >
      <SubmissionHistoryContent />
    </Suspense>
  );
}