import { Suspense } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  FileText,
  Clock3,
  CheckCircle2,
  AlertCircle,
  Users,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireTeacher } from "@/lib/auth/teacher";

export const metadata = {
  title: "Assignment Submissions | EduMarket",
  description: "Review and manage learner assignment submissions.",
};

type Submission = {
  id: string;
  assignment_id: string;
  student_id: string;
  submission_text: string | null;
  attachment_path: string | null;
  attachment_name: string | null;
  submitted_at: string | null;
  marks_awarded: number | null;
  teacher_feedback: string | null;
  status: string;
};

type Assignment = {
  id: string;
  title: string;
  total_marks: number;
  due_at: string | null;
  status: string;
};

function LoadingState() {
  return (
    <div className="space-y-5">
      <div className="h-32 animate-pulse rounded-3xl bg-slate-100" />
      <div className="h-24 animate-pulse rounded-3xl bg-slate-100" />
      <div className="h-72 animate-pulse rounded-3xl bg-slate-100" />
    </div>
  );
}

function formatDate(value: string | null) {
  if (!value) return "Not submitted";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Unknown date";

  return new Intl.DateTimeFormat("en-KE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function statusLabel(status: string) {
  switch (status) {
    case "submitted":
      return "Submitted";
    case "late":
      return "Late";
    case "graded":
      return "Graded";
    case "returned":
      return "Returned";
    case "draft":
      return "Draft";
    case "in_progress":
      return "In progress";
    case "not_submitted":
      return "Not submitted";
    default:
      return status.replaceAll("_", " ");
  }
}

function statusClass(status: string) {
  switch (status) {
    case "graded":
    case "returned":
      return "bg-emerald-50 text-emerald-700 ring-emerald-200";
    case "late":
      return "bg-amber-50 text-amber-700 ring-amber-200";
    case "submitted":
      return "bg-blue-50 text-blue-700 ring-blue-200";
    case "draft":
    case "in_progress":
      return "bg-slate-100 text-slate-600 ring-slate-200";
    default:
      return "bg-slate-100 text-slate-600 ring-slate-200";
  }
}

async function SubmissionsContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, user } = await requireTeacher();

  const { data: teacherProfile, error: teacherError } = await supabase
    .from("teacher_profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (teacherError) {
    throw new Error(teacherError.message);
  }

  if (!teacherProfile) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
        Your teacher profile could not be found. Please complete teacher
        onboarding.
      </div>
    );
  }

  const { data: assignment, error: assignmentError } = await supabase
    .from("assignments")
    .select("id,title,total_marks,due_at,status")
    .eq("id", id)
    .eq("teacher_id", teacherProfile.id)
    .maybeSingle();

  if (assignmentError) {
    throw new Error(assignmentError.message);
  }

  if (!assignment) {
    return (
      <section className="rounded-3xl border border-red-200 bg-red-50 p-7">
        <h1 className="text-xl font-bold text-red-900">
          Assignment not found
        </h1>
        <p className="mt-2 text-sm text-red-700">
          This assignment does not exist or you do not have permission to
          manage it.
        </p>
        <Link
          href="/teacher/assignments"
          className="mt-5 inline-flex items-center gap-2 font-semibold text-red-800 underline"
        >
          <ArrowLeft size={16} />
          Back to assignments
        </Link>
      </section>
    );
  }

  const { data: submissionData, error: submissionsError } = await supabase
    .from("assignment_submissions")
    .select(
      "id,assignment_id,student_id,submission_text,attachment_path,attachment_name,submitted_at,marks_awarded,teacher_feedback,status",
    )
    .eq("assignment_id", id)
    .order("submitted_at", { ascending: false, nullsFirst: false });

  if (submissionsError) {
    throw new Error(submissionsError.message);
  }

  const submissions = (submissionData ?? []) as Submission[];
  const total = submissions.length;
  const awaitingGrading = submissions.filter((submission) =>
    ["submitted", "late", "returned"].includes(submission.status),
  ).length;
  const graded = submissions.filter((submission) =>
    ["graded"].includes(submission.status),
  ).length;
  const late = submissions.filter(
    (submission) => submission.status === "late",
  ).length;

  const studentIds = [
    ...new Set(submissions.map((submission) => submission.student_id)),
  ];

  let studentNames = new Map<string, string>();

  if (studentIds.length > 0) {
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id,full_name")
      .in("id", studentIds);

    if (profilesError) {
      throw new Error(profilesError.message);
    }

    studentNames = new Map(
      (profiles ?? []).map((profile) => [
        profile.id,
        profile.full_name || "Learner",
      ]),
    );
  }

  return (
    <div className="space-y-7">
      <header>
        <Link
          href={`/teacher/assignments/${id}`}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-emerald-700"
        >
          <ArrowLeft size={16} />
          Back to assignment
        </Link>

        <div className="mt-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold text-emerald-700">
              Assignment management
            </p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              Submission dashboard
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-500">
              Review learner work, monitor deadlines, and manage marking for{" "}
              <span className="font-semibold text-slate-700">
                {assignment.title}
              </span>
              .
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-5 py-3">
            <p className="text-xs font-medium text-emerald-700">
              Maximum marks
            </p>
            <p className="mt-1 text-2xl font-bold text-emerald-950">
              {assignment.total_marks}
            </p>
          </div>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total submissions"
          value={total}
          description="Learner submission records"
          icon={<Users size={21} />}
        />
        <StatCard
          label="Awaiting grading"
          value={awaitingGrading}
          description="Submitted work to review"
          icon={<Clock3 size={21} />}
        />
        <StatCard
          label="Graded"
          value={graded}
          description="Completed marking"
          icon={<CheckCircle2 size={21} />}
        />
        <StatCard
          label="Late submissions"
          value={late}
          description="Marked as late"
          icon={<AlertCircle size={21} />}
        />
      </section>

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col justify-between gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:px-7">
          <div>
            <h2 className="text-lg font-bold text-slate-950">
              Learner submissions
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {total} submission record{total === 1 ? "" : "s"} found.
            </p>
          </div>

          <span
            className={`inline-flex w-fit items-center rounded-full px-3 py-1.5 text-xs font-semibold ${
              assignment.status === "published"
                ? "bg-emerald-50 text-emerald-700"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            {assignment.status.toUpperCase()}
          </span>
        </div>

        {submissions.length === 0 ? (
          <div className="px-5 py-16 text-center sm:px-8">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
              <FileText size={27} />
            </div>
            <h3 className="mt-4 text-lg font-bold text-slate-900">
              No submissions yet
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              Learner submissions will appear here when students submit their
              work through the student portal.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-6 py-4 font-semibold">Learner</th>
                  <th className="px-6 py-4 font-semibold">Submitted</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold">Marks</th>
                  <th className="px-6 py-4 font-semibold">Attachment</th>
                  <th className="px-6 py-4 text-right font-semibold">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {submissions.map((submission) => (
                  <tr key={submission.id} className="hover:bg-slate-50/70">
                    <td className="px-6 py-5">
                      <p className="font-semibold text-slate-900">
                        {studentNames.get(submission.student_id) ?? "Learner"}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        {submission.student_id.slice(0, 8)}…
                      </p>
                    </td>

                    <td className="px-6 py-5 text-slate-600">
                      {formatDate(submission.submitted_at)}
                    </td>

                    <td className="px-6 py-5">
                      <span
                        className={`inline-flex rounded-full px-3 py-1.5 text-xs font-semibold capitalize ring-1 ring-inset ${statusClass(submission.status)}`}
                      >
                        {statusLabel(submission.status)}
                      </span>
                    </td>

                    <td className="px-6 py-5 font-semibold text-slate-800">
                      {submission.marks_awarded === null
                        ? "Not graded"
                        : `${submission.marks_awarded} / ${assignment.total_marks}`}
                    </td>

                    <td className="px-6 py-5">
                      {submission.attachment_name ? (
                        <span className="inline-flex max-w-48 items-center gap-2 truncate text-slate-700">
                          <FileText
                            size={16}
                            className="shrink-0 text-emerald-700"
                          />
                          <span className="truncate">
                            {submission.attachment_name}
                          </span>
                        </span>
                      ) : (
                        <span className="text-slate-400">No attachment</span>
                      )}
                    </td>

                    <td className="px-6 py-5 text-right">
                      <Link
                        href={`/teacher/assignments/${id}/submissions/${submission.id}`}
                        className="inline-flex items-center justify-center rounded-xl bg-emerald-700 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-emerald-800"
                      >
                        Review & grade
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:p-6">
        <h2 className="font-bold text-slate-900">Assignment details</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium text-slate-500">Deadline</p>
            <p className="mt-1 text-sm font-semibold text-slate-800">
              {formatDate(assignment.due_at)}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Assignment ID</p>
            <p className="mt-1 break-all font-mono text-xs text-slate-600">
              {assignment.id}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  description,
  icon,
}: {
  label: string;
  value: number;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
            {value}
          </p>
        </div>
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
          {icon}
        </span>
      </div>
      <p className="mt-3 text-xs text-slate-500">{description}</p>
    </article>
  );
}

export default function AssignmentSubmissionsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-9">
      <Suspense fallback={<LoadingState />}>
        <SubmissionsContent params={params} />
      </Suspense>
    </main>
  );
}