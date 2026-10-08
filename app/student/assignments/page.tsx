 import { Suspense } from "react";
import { connection } from "next/server";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CalendarDays,
  Clock3,
  FileText,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Assignments | EduMarket",
  description:
    "Explore published assignments, review deadlines, and manage your coursework.",
};

type Assignment = {
  id: string;
  title: string;
  description: string | null;
  instructions: string | null;
  assignment_type: string;
  total_marks: number | null;
  due_at: string | null;
  allow_late_submission: boolean;
  status: string;
  created_at: string;
  teacher_id: string;
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

type TeacherProfile = {
  id: string;
  display_name: string | null;
  school_name: string | null;
};

function formatDate(value: string | null) {
  if (!value) return "No deadline";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "No deadline";

  return new Intl.DateTimeFormat("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Africa/Nairobi",
  }).format(date);
}

function statusLabel(status: string) {
  switch (status.toLowerCase()) {
    case "draft":
      return "Draft";
    case "submitted":
      return "Submitted";
    case "late":
      return "Submitted late";
    case "graded":
      return "Graded";
    case "returned":
      return "Returned";
    default:
      return status.replaceAll("_", " ");
  }
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
    default:
      return "bg-slate-100 text-slate-600 ring-slate-200";
  }
}

async function AssignmentListingContent() {
  await connection();

  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return (
      <main className="min-h-screen bg-slate-50 px-5 py-16">
        <div className="mx-auto max-w-lg rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <BookOpen className="mx-auto h-12 w-12 text-indigo-600" />

          <h1 className="mt-4 text-2xl font-black text-slate-950">
            Student Assignments
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-600">
            Sign in to explore assignments and manage your coursework.
          </p>

          <Link
            href="/auth/login?redirect=%2Fstudent%2Fassignments"
            className="mt-7 inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 font-bold text-white transition hover:bg-indigo-700"
          >
            Sign in
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </main>
    );
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile || profile.role !== "student") {
    return (
      <main className="min-h-screen bg-slate-50 px-5 py-16">
        <div className="mx-auto max-w-lg rounded-3xl border border-amber-200 bg-white p-8 text-center">
          <BookOpen className="mx-auto h-12 w-12 text-amber-600" />

          <h1 className="mt-4 text-2xl font-black text-slate-950">
            Student access required
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-600">
            Please sign in using a student account to access assignments.
          </p>

          <Link
            href="/"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 font-bold text-white"
          >
            Return home
          </Link>
        </div>
      </main>
    );
  }

  const [
    { data: assignments, error: assignmentsError },
    { data: submissions, error: submissionsError },
  ] = await Promise.all([
    supabase
      .from("assignments")
      .select(
        "id, title, description, instructions, assignment_type, total_marks, due_at, allow_late_submission, status, created_at, teacher_id"
      )
      .eq("status", "published")
      .order("due_at", { ascending: true, nullsFirst: false })
      .limit(200),

    supabase
      .from("assignment_submissions")
      .select(
        "id, assignment_id, student_id, submission_text, attachment_name, submitted_at, marks_awarded, teacher_feedback, status"
      )
      .eq("student_id", user.id)
      .limit(500),
  ]);

  if (assignmentsError) {
    console.error("Assignment listing failed:", assignmentsError.message);
  }

  if (submissionsError) {
    console.error("Student submissions query failed:", submissionsError.message);
  }

  const allAssignments = (assignments ?? []) as Assignment[];
  const allSubmissions = (submissions ?? []) as Submission[];

  const submissionByAssignment = new Map<string, Submission>();

  for (const submission of allSubmissions) {
    submissionByAssignment.set(submission.assignment_id, submission);
  }

  const teacherIds = [
    ...new Set(allAssignments.map((assignment) => assignment.teacher_id)),
  ];

  const teachersById = new Map<string, TeacherProfile>();

  if (teacherIds.length > 0) {
    const { data: teachers, error: teachersError } = await supabase
      .from("teacher_profiles")
      .select("id, display_name, school_name")
      .in("id", teacherIds);

    if (teachersError) {
      console.error("Teacher lookup failed:", teachersError.message);
    }

    for (const teacher of (teachers ?? []) as TeacherProfile[]) {
      teachersById.set(teacher.id, teacher);
    }
  }

  const submittedCount = allSubmissions.filter((submission) =>
    ["submitted", "late", "graded", "returned"].includes(
      submission.status.toLowerCase()
    )
  ).length;

  const outstandingCount = allAssignments.filter((assignment) => {
    const submission = submissionByAssignment.get(assignment.id);

    return !submission || submission.status.toLowerCase() === "draft";
  }).length;

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-5 py-7 sm:px-8">
          <Link
            href="/student"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-indigo-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to student dashboard
          </Link>

          <div className="mt-6 flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700">
                <BookOpen className="h-4 w-4" />
                COURSEWORK CENTRE
              </div>

              <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                Your assignments
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                Review your coursework, plan around deadlines, and submit
                your work on time.
              </p>
            </div>

            <div className="flex gap-3">
              <SummaryCard
                label="Available"
                value={String(allAssignments.length)}
              />

              <SummaryCard
                label="Submitted"
                value={String(submittedCount)}
              />
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
        <div className="mb-7 grid gap-4 sm:grid-cols-3">
          <InfoCard
            icon={<FileText className="h-5 w-5" />}
            label="Published assignments"
            value={String(allAssignments.length)}
            description="All currently published tasks"
          />

          <InfoCard
            icon={<Clock3 className="h-5 w-5" />}
            label="Outstanding"
            value={String(outstandingCount)}
            description="Assignments not yet submitted"
          />

          <InfoCard
            icon={<CalendarDays className="h-5 w-5" />}
            label="Submission progress"
            value={
              allAssignments.length === 0
                ? "0%"
                : `${Math.min(
                    100,
                    Math.round(
                      (submittedCount / allAssignments.length) * 100
                    )
                  )}%`
            }
            description="Based on available published assignments"
          />
        </div>

        {assignmentsError ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6">
            <h2 className="font-bold text-rose-900">
              Unable to load assignments
            </h2>

            <p className="mt-2 text-sm leading-6 text-rose-800">
              The database rejected the assignments query. Check the
              assignments SELECT policy before continuing.
            </p>
          </div>
        ) : allAssignments.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <BookOpen className="mx-auto h-12 w-12 text-slate-400" />

            <h2 className="mt-4 text-xl font-black text-slate-950">
              No assignments available yet
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
              When your teachers publish assignments, they will appear here.
            </p>

            <Link
              href="/student"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 font-bold text-white hover:bg-indigo-700"
            >
              Return to dashboard
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-2">
            {allAssignments.map((assignment) => {
              const submission = submissionByAssignment.get(assignment.id);
              const teacher = teachersById.get(assignment.teacher_id);

              return (
                <article
                  key={assignment.id}
                  className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-indigo-200 hover:shadow-lg"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700">
                      <FileText className="h-6 w-6" />
                    </div>

                    {submission ? (
                      <span
                        className={`rounded-full px-3 py-1.5 text-xs font-bold ring-1 ${statusClasses(
                          submission.status
                        )}`}
                      >
                        {statusLabel(submission.status)}
                      </span>
                    ) : (
                      <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600">
                        Not submitted
                      </span>
                    )}
                  </div>

                  <h2 className="mt-5 text-xl font-extrabold text-slate-950">
                    {assignment.title}
                  </h2>

                  <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">
                    {assignment.description ||
                      assignment.instructions ||
                      "Open the assignment to review its requirements."}
                  </p>

                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-xs font-medium text-slate-500">
                        Due date
                      </p>

                      <p className="mt-1 text-sm font-bold text-slate-900">
                        {formatDate(assignment.due_at)}
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-xs font-medium text-slate-500">
                        Total marks
                      </p>

                      <p className="mt-1 text-sm font-bold text-slate-900">
                        {assignment.total_marks ?? "Not specified"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-slate-800">
                        {teacher?.display_name || "Teacher"}
                      </p>

                      <p className="mt-1 text-xs capitalize text-slate-500">
                        {assignment.assignment_type.replaceAll("_", " ")}
                      </p>
                    </div>

                    <Link
                      href={`/student/assignments/${assignment.id}`}
                      className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white transition hover:bg-indigo-700"
                    >
                      View assignment
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-24 rounded-2xl border border-slate-200 bg-white px-4 py-3">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-black text-slate-950">{value}</p>
    </div>
  );
}

function InfoCard({
  icon,
  label,
  value,
  description,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  description: string;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-indigo-50 p-3 text-indigo-700">
          {icon}
        </div>

        <div>
          <p className="text-sm font-medium text-slate-600">{label}</p>
          <p className="mt-1 text-2xl font-black text-slate-950">{value}</p>
        </div>
      </div>

      <p className="mt-4 text-xs leading-5 text-slate-500">{description}</p>
    </article>
  );
}

export default function StudentAssignmentsPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-slate-50 px-5 py-16">
          <div className="mx-auto max-w-7xl animate-pulse">
            <div className="h-8 w-56 rounded-lg bg-slate-200" />
            <div className="mt-6 h-12 w-80 max-w-full rounded-xl bg-slate-200" />

            <div className="mt-10 grid gap-5 lg:grid-cols-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="h-64 rounded-3xl bg-white shadow-sm"
                />
              ))}
            </div>
          </div>
        </main>
      }
    >
      <AssignmentListingContent />
    </Suspense>
  );
}