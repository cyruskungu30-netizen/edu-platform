import { Suspense } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CalendarClock,
  Clock3,
  FileText,
  GraduationCap,
  ShieldCheck,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import AssignmentSubmissionForm from "@/components/students/AssignmentSubmissionForm";

export const metadata = {
  title: "Submit Assignment | EduMarket",
  description:
    "Submit your assignment securely through the EduMarket student portal.",
};

type PageProps = {
  params: Promise<{ id: string }>;
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
  teacher_id: string;
};

function formatDate(value: string | null) {
  if (!value) return "No deadline specified";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "No deadline specified";
  }

  return new Intl.DateTimeFormat("en-KE", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

async function SubmissionPageContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      id
    )
  ) {
    notFound();
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile) {
    return (
      <main className="min-h-screen bg-slate-50 px-5 py-16">
        <div className="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white p-8 text-center">
          <ShieldCheck className="mx-auto h-12 w-12 text-indigo-600" />

          <h1 className="mt-4 text-2xl font-black text-slate-950">
            Profile unavailable
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-600">
            We could not verify your student profile. Please sign in again.
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
    return (
      <main className="min-h-screen bg-slate-50 px-5 py-16">
        <div className="mx-auto max-w-xl rounded-3xl border border-amber-200 bg-white p-8 text-center">
          <GraduationCap className="mx-auto h-12 w-12 text-amber-600" />

          <h1 className="mt-4 text-2xl font-black text-slate-950">
            Student access required
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-600">
            Only student accounts can submit assignments.
          </p>

          <Link
            href="/"
            className="mt-6 inline-flex rounded-xl bg-slate-950 px-5 py-3 font-bold text-white hover:bg-slate-800"
          >
            Return home
          </Link>
        </div>
      </main>
    );
  }

  const { data: assignment, error: assignmentError } = await supabase
    .from("assignments")
    .select(
      "id, title, description, instructions, assignment_type, total_marks, due_at, allow_late_submission, status, teacher_id"
    )
    .eq("id", id)
    .eq("status", "published")
    .maybeSingle();

  if (assignmentError) {
    console.error("Submission page assignment query failed:", assignmentError.message);

    return (
      <main className="min-h-screen bg-slate-50 px-5 py-16">
        <div className="mx-auto max-w-xl rounded-3xl border border-rose-200 bg-white p-8">
          <h1 className="text-xl font-black text-rose-900">
            Unable to load assignment
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-600">
            We could not load this assignment. Please try again.
          </p>

          <Link
            href="/student/assignments"
            className="mt-6 inline-flex items-center gap-2 font-bold text-indigo-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to assignments
          </Link>
        </div>
      </main>
    );
  }

  if (!assignment) {
    notFound();
  }

  const currentAssignment = assignment as Assignment;

  const { data: existingSubmission, error: submissionError } =
    await supabase
      .from("assignment_submissions")
      .select("id, status")
      .eq("assignment_id", currentAssignment.id)
      .eq("student_id", user.id)
      .maybeSingle();

  if (submissionError) {
    console.error("Existing submission lookup failed:", submissionError.message);

    return (
      <main className="min-h-screen bg-slate-50 px-5 py-16">
        <div className="mx-auto max-w-xl rounded-3xl border border-rose-200 bg-white p-8">
          <h1 className="text-xl font-black text-rose-900">
            Unable to verify submission
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-600">
            We could not verify whether you have already submitted this
            assignment. Please try again.
          </p>
        </div>
      </main>
    );
  }

  const existingStatus = existingSubmission?.status.toLowerCase();

  const submissionLocked = Boolean(
    existingStatus &&
      ["submitted", "late", "graded", "returned"].includes(existingStatus)
  );

  const deadlinePassed = currentAssignment.due_at
    ? new Date(currentAssignment.due_at).getTime() < Date.now()
    : false;

  const deadlineBlocksSubmission =
    deadlinePassed && !currentAssignment.allow_late_submission;

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-4xl px-5 py-7 sm:px-8">
          <Link
            href={`/student/assignments/${currentAssignment.id}`}
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-indigo-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to assignment details
          </Link>

          <div className="mt-7 flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700">
              <BookOpen className="h-7 w-7" />
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">
                Student workspace
              </p>

              <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                Submit your assignment
              </h1>
            </div>
          </div>

          <p className="mt-5 max-w-2xl text-sm leading-6 text-slate-600">
            Prepare your written response, attach your work if necessary,
            and review your submission before sending it to your teacher.
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-5 py-8 sm:px-8">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="border-b border-slate-100 pb-6">
            <h2 className="text-xl font-black text-slate-950">
              {currentAssignment.title}
            </h2>

            <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-600">
              {currentAssignment.instructions?.trim() ||
                currentAssignment.description ||
                "Review the assignment details before submitting your work."}
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-slate-50 p-4">
                <CalendarClock className="h-5 w-5 text-indigo-600" />

                <p className="mt-3 text-xs font-medium text-slate-500">
                  Deadline
                </p>

                <p className="mt-1 text-sm font-bold text-slate-900">
                  {formatDate(currentAssignment.due_at)}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <GraduationCap className="h-5 w-5 text-indigo-600" />

                <p className="mt-3 text-xs font-medium text-slate-500">
                  Maximum marks
                </p>

                <p className="mt-1 text-sm font-bold text-slate-900">
                  {currentAssignment.total_marks ?? "Not specified"}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <Clock3 className="h-5 w-5 text-indigo-600" />

                <p className="mt-3 text-xs font-medium text-slate-500">
                  Late submissions
                </p>

                <p className="mt-1 text-sm font-bold text-slate-900">
                  {currentAssignment.allow_late_submission
                    ? "Allowed"
                    : "Not allowed"}
                </p>
              </div>
            </div>
          </div>

          <div className="pt-6">
            {submissionLocked ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                <h3 className="font-bold text-emerald-900">
                  You have already submitted this assignment.
                </h3>

                <p className="mt-2 text-sm leading-6 text-emerald-800">
                  Your submission status is{" "}
                  <strong>{existingSubmission?.status}</strong>. Visit the
                  assignment details page to review available feedback.
                </p>

                <Link
                  href={`/student/assignments/${currentAssignment.id}`}
                  className="mt-4 inline-flex items-center gap-2 font-bold text-emerald-900 hover:underline"
                >
                  View submission
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ) : deadlineBlocksSubmission ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5">
                <h3 className="font-bold text-rose-900">
                  The submission deadline has passed.
                </h3>

                <p className="mt-2 text-sm leading-6 text-rose-800">
                  Your teacher has not enabled late submissions. Contact
                  your teacher if you believe you need an extension.
                </p>
              </div>
            ) : (
              <AssignmentSubmissionForm
                assignmentId={currentAssignment.id}
                dueAt={currentAssignment.due_at}
                allowLateSubmission={currentAssignment.allow_late_submission}
                totalMarks={currentAssignment.total_marks}
              />
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

export default function StudentAssignmentSubmissionPage({
  params,
}: PageProps) {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-slate-50 px-5 py-16">
          <div className="mx-auto max-w-4xl animate-pulse">
            <div className="h-8 w-56 rounded-lg bg-slate-200" />
            <div className="mt-7 h-12 w-96 max-w-full rounded-xl bg-slate-200" />
            <div className="mt-8 h-[500px] rounded-3xl bg-white shadow-sm" />
          </div>
        </main>
      }
    >
      <SubmissionPageContent params={params} />
    </Suspense>
  );
}