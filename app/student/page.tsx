 import { Suspense } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  ClipboardCheck,
  Clock3,
  GraduationCap,
  FileText,
  Sparkles,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Student Dashboard | EduMarket",
  description:
    "Manage assignments, track submissions, and review academic progress on EduMarket.",
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
  }).format(date);
}

function getStatusLabel(status: string) {
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

function getStatusClasses(status: string) {
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

function isPastDeadline(dueAt: string | null) {
  return dueAt ? new Date(dueAt).getTime() < Date.now() : false;
}

async function StudentDashboardContent() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return (
      <main className="min-h-screen bg-slate-50 px-5 py-16">
        <div className="mx-auto max-w-lg rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <GraduationCap className="mx-auto mb-4 h-12 w-12 text-indigo-600" />

          <h1 className="text-2xl font-bold text-slate-900">
            Student Portal
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-600">
            Sign in to view your assignments, submit your work, and check
            your academic progress.
          </p>

          <Link
            href="/login"
            className="mt-7 inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white transition hover:bg-indigo-700"
          >
            Sign in
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </main>
    );
  }

  const [
    { data: profile, error: profileError },
    { data: assignments, error: assignmentsError },
    { data: submissions, error: submissionsError },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, role")
      .eq("id", user.id)
      .maybeSingle(),

    supabase
      .from("assignments")
      .select(
        "id, title, description, instructions, assignment_type, total_marks, due_at, allow_late_submission, status, created_at, teacher_id"
      )
      .eq("status", "published")
      .order("due_at", { ascending: true, nullsFirst: false })
      .limit(100),

    supabase
      .from("assignment_submissions")
      .select(
        "id, assignment_id, student_id, submission_text, attachment_name, submitted_at, marks_awarded, teacher_feedback, status"
      )
      .eq("student_id", user.id)
      .limit(500),
  ]);

  if (profileError) {
    console.error("Student profile query failed:", profileError.message);
  }

  if (assignmentsError) {
    console.error("Student assignments query failed:", assignmentsError.message);
  }

  if (submissionsError) {
    console.error("Student submissions query failed:", submissionsError.message);
  }

  if (profile?.role && profile.role !== "student") {
    return (
      <main className="min-h-screen bg-slate-50 px-5 py-16">
        <div className="mx-auto max-w-lg rounded-3xl border border-amber-200 bg-white p-8 text-center shadow-sm">
          <GraduationCap className="mx-auto mb-4 h-12 w-12 text-amber-600" />

          <h1 className="text-2xl font-bold text-slate-900">
            Student access required
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-600">
            This area is for student accounts. Please use the appropriate
            EduMarket workspace for your account.
          </p>

          <Link
            href="/"
            className="mt-7 inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 py-3 font-semibold text-white transition hover:bg-slate-800"
          >
            Return home
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </main>
    );
  }

  const allAssignments = (assignments ?? []) as Assignment[];
  const allSubmissions = (submissions ?? []) as Submission[];

  const submissionByAssignment = new Map<string, Submission>();

  for (const submission of allSubmissions) {
    submissionByAssignment.set(submission.assignment_id, submission);
  }

  const availableAssignments = allAssignments.filter((assignment) => {
    const existingSubmission = submissionByAssignment.get(assignment.id);

    return !existingSubmission || existingSubmission.status === "draft";
  });

  const submittedCount = allSubmissions.filter((submission) =>
    ["submitted", "late", "graded", "returned"].includes(
      submission.status.toLowerCase()
    )
  ).length;

  const gradedSubmissions = allSubmissions.filter(
    (submission) => submission.marks_awarded !== null
  );

  const pendingReviewCount = allSubmissions.filter((submission) =>
    ["submitted", "late"].includes(submission.status.toLowerCase())
  ).length;

  const firstName =
    profile?.full_name?.trim().split(/\s+/)[0] ||
    user.email?.split("@")[0] ||
    "Student";

  const assignmentIds = allAssignments.map((assignment) => assignment.id);

  const submittedAssignmentIds = new Set(
    allSubmissions.map((submission) => submission.assignment_id)
  );

  const teachersById = new Map<string, TeacherProfile>();

  if (assignmentIds.length > 0) {
    const teacherIds = [
      ...new Set(allAssignments.map((assignment) => assignment.teacher_id)),
    ];

    if (teacherIds.length > 0) {
      const { data: teachers, error: teachersError } = await supabase
        .from("teacher_profiles")
        .select("id, display_name, school_name")
        .in("id", teacherIds);

      if (teachersError) {
        console.error("Teacher profiles query failed:", teachersError.message);
      }

      for (const teacher of (teachers ?? []) as TeacherProfile[]) {
        teachersById.set(teacher.id, teacher);
      }
    }
  }

  const gradedMarks = gradedSubmissions.reduce(
    (total, submission) => total + Number(submission.marks_awarded ?? 0),
    0
  );

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-5 px-5 py-8 sm:px-8 md:flex-row md:items-center">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700">
              <Sparkles className="h-3.5 w-3.5" />
              YOUR LEARNING SPACE
            </div>

            <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              Welcome back, {firstName}.
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-600 sm:text-base">
              Stay organized, complete your assignments, and track your
              progress.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/student/assignments"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700"
            >
              Browse assignments
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              href="/student/submissions"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-800 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
            >
              <ClipboardCheck className="h-4 w-4" />
              My submissions
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={<BookOpen className="h-5 w-5" />}
            label="Published assignments"
            value={String(allAssignments.length)}
            description="Available learning tasks"
            color="indigo"
          />

          <StatCard
            icon={<ClipboardCheck className="h-5 w-5" />}
            label="Submitted"
            value={String(submittedCount)}
            description="Assignments submitted"
            color="emerald"
          />

          <StatCard
            icon={<Clock3 className="h-5 w-5" />}
            label="Awaiting review"
            value={String(pendingReviewCount)}
            description="Submitted work awaiting grading"
            color="amber"
          />

          <StatCard
            icon={<GraduationCap className="h-5 w-5" />}
            label="Graded assignments"
            value={String(gradedSubmissions.length)}
            description={`Marks awarded: ${gradedMarks}`}
            color="blue"
          />
        </div>

        <section className="mt-10">
          <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">
                Your coursework
              </p>

              <h2 className="mt-2 text-2xl font-black text-slate-950">
                Recent assignments
              </h2>

              <p className="mt-1 text-sm text-slate-600">
                Review deadlines and continue working on your assignments.
              </p>
            </div>

            <Link
              href="/student/assignments"
              className="inline-flex items-center gap-2 text-sm font-bold text-indigo-700 hover:text-indigo-900"
            >
              View all assignments
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {assignmentsError ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6">
              <h3 className="font-bold text-rose-900">
                Unable to load assignments
              </h3>

              <p className="mt-2 text-sm leading-6 text-rose-800">
                The database rejected the assignments request. Verify the
                assignments SELECT policy and try again.
              </p>
            </div>
          ) : allAssignments.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
              <BookOpen className="mx-auto h-10 w-10 text-slate-400" />

              <h3 className="mt-4 text-lg font-bold text-slate-900">
                No published assignments yet
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
                Published assignments will appear here when they become
                available.
              </p>
            </div>
          ) : (
            <div className="grid gap-5 lg:grid-cols-2">
              {allAssignments.slice(0, 6).map((assignment) => {
                const submission = submissionByAssignment.get(assignment.id);
                const teacher = teachersById.get(assignment.teacher_id);
                const submitted = submittedAssignmentIds.has(assignment.id);
                const overdue =
                  !submitted && isPastDeadline(assignment.due_at);

                return (
                  <article
                    key={assignment.id}
                    className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-lg"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700">
                        <FileText className="h-6 w-6" />
                      </div>

                      {submission ? (
                        <span
                          className={`rounded-full px-3 py-1.5 text-xs font-bold ring-1 ${getStatusClasses(
                            submission.status
                          )}`}
                        >
                          {getStatusLabel(submission.status)}
                        </span>
                      ) : overdue ? (
                        <span className="rounded-full bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 ring-1 ring-rose-200">
                          Past deadline
                        </span>
                      ) : (
                        <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200">
                          Available
                        </span>
                      )}
                    </div>

                    <h3 className="mt-5 text-xl font-extrabold text-slate-950">
                      {assignment.title}
                    </h3>

                    <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-slate-600">
                      {assignment.description ||
                        assignment.instructions ||
                        "Open this assignment to review the instructions."}
                    </p>

                    <div className="mt-5 grid grid-cols-2 gap-3">
                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-xs font-medium text-slate-500">
                          Deadline
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

                    <div className="mt-4 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-700">
                          {teacher?.display_name || "Teacher"}
                        </p>

                        <p className="mt-1 truncate text-xs text-slate-500">
                          {assignment.assignment_type.replaceAll("_", " ")}
                        </p>
                      </div>

                      <Link
                        href={`/student/assignments/${assignment.id}`}
                        className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-700"
                      >
                        Open
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section className="mt-10 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
            <div className="flex items-start gap-4">
              <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700">
                <ClipboardCheck className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-950">
                  Track your academic progress
                </h2>
                <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
                  Review your submitted assignments, check your marks, and read
                  feedback from your teachers in one place.
                </p>
              </div>
            </div>
            <Link
              href="/student/submissions"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-indigo-700"
            >
              View submission history
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        <section className="mt-10 rounded-3xl bg-gradient-to-br from-indigo-950 via-indigo-900 to-slate-950 p-7 text-white sm:p-10">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-indigo-100 ring-1 ring-white/15">
                <GraduationCap className="h-4 w-4" />
                KEEP MAKING PROGRESS
              </div>

              <h2 className="mt-4 text-2xl font-black sm:text-3xl">
                Every completed assignment moves you forward.
              </h2>

              <p className="mt-3 text-sm leading-6 text-indigo-100 sm:text-base">
                Stay ahead of deadlines, submit your best work, and use
                teacher feedback to keep improving.
              </p>
            </div>

            <Link
              href="/student/assignments"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 font-bold text-indigo-950 transition hover:bg-indigo-50"
            >
              Explore assignments
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

function StatCard({
  icon,
  label,
  value,
  description,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  description: string;
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

      <p className="mt-3 text-xs leading-5 text-slate-500">{description}</p>
    </article>
  );
}

export default function StudentPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-slate-50 px-5 py-16">
          <div className="mx-auto max-w-7xl animate-pulse">
            <div className="h-10 w-72 rounded-xl bg-slate-200" />
            <div className="mt-4 h-5 w-96 max-w-full rounded-lg bg-slate-200" />

            <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="h-36 rounded-2xl bg-white shadow-sm"
                />
              ))}
            </div>

            <div className="mt-10 h-72 rounded-3xl bg-white shadow-sm" />
          </div>
        </main>
      }
    >
      <StudentDashboardContent />
    </Suspense>
  );
}