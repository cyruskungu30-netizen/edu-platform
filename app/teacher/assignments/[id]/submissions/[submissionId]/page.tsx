 import { Suspense } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  FileText,
  Clock3,
  CheckCircle2,
  Save,
  Send,
  UserRound,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireTeacher } from "@/lib/auth/teacher";
import GradeSubmissionForm from "@/components/teacher/GradeSubmissionForm";

export const metadata = {
  title: "Review Submission | EduMarket",
  description: "Review, grade, and provide feedback on learner assignments.",
};

function LoadingState() {
  return (
    <div className="space-y-5">
      <div className="h-28 animate-pulse rounded-3xl bg-slate-100" />
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

async function SubmissionContent({
  params,
}: {
  params: Promise<{ id: string; submissionId: string }>;
}) {
  const { id, submissionId } = await params;
  const { supabase, user } = await requireTeacher();

  const { data: teacher, error: teacherError } = await supabase
    .from("teacher_profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (teacherError) throw new Error(teacherError.message);

  if (!teacher) {
    return (
      <ErrorPanel message="Your teacher profile could not be found. Please complete teacher onboarding." />
    );
  }

  const { data: assignment, error: assignmentError } = await supabase
    .from("assignments")
    .select("id,title,total_marks,due_at,status,teacher_id")
    .eq("id", id)
    .eq("teacher_id", teacher.id)
    .maybeSingle();

  if (assignmentError) throw new Error(assignmentError.message);

  if (!assignment) {
    return <ErrorPanel message="Assignment not found or access denied." />;
  }

  const { data: submission, error: submissionError } = await supabase
    .from("assignment_submissions")
    .select(
      "id,assignment_id,student_id,submission_text,attachment_path,attachment_name,submitted_at,marks_awarded,teacher_feedback,status",
    )
    .eq("id", submissionId)
    .eq("assignment_id", id)
    .maybeSingle();

  if (submissionError) throw new Error(submissionError.message);

  if (!submission) {
    return <ErrorPanel message="Submission not found or access denied." />;
  }

  const { data: student, error: studentError } = await supabase
    .from("profiles")
    .select("id,full_name")
    .eq("id", submission.student_id)
    .maybeSingle();

  if (studentError) throw new Error(studentError.message);

  let attachmentUrl: string | null = null;
  let attachmentError = "";

  if (submission.attachment_path) {
    const { data, error } = await supabase.storage
      .from("assignment-files")
      .createSignedUrl(submission.attachment_path, 60 * 5);

    if (error) {
      attachmentError =
        "The attachment could not be opened. Verify the private storage policies and file path.";
    } else {
      attachmentUrl = data.signedUrl;
    }
  }

  return (
    <div className="space-y-7">
      <header>
        <Link
          href={`/teacher/assignments/${id}/submissions`}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-emerald-700"
        >
          <ArrowLeft size={16} />
          Back to submissions
        </Link>

        <div className="mt-5">
          <p className="text-sm font-semibold text-emerald-700">
            Assignment grading
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
            Review learner submission
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            {assignment.title}
          </p>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <InfoCard
          icon={<UserRound size={20} />}
          label="Learner"
          value={student?.full_name || "Learner"}
        />
        <InfoCard
          icon={<Clock3 size={20} />}
          label="Submission date"
          value={formatDate(submission.submitted_at)}
        />
        <InfoCard
          icon={<CheckCircle2 size={20} />}
          label="Current status"
          value={submission.status.replaceAll("_", " ")}
        />
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
            <FileText size={22} />
          </span>
          <div>
            <h2 className="text-lg font-bold text-slate-950">
              Learner&apos;s work
            </h2>
            <p className="text-sm text-slate-500">
              Review the written response and any attached file.
            </p>
          </div>
        </div>

        <div className="mt-6">
          <h3 className="text-sm font-semibold text-slate-700">
            Written response
          </h3>

          {submission.submission_text?.trim() ? (
            <div className="mt-3 whitespace-pre-wrap break-words rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm leading-7 text-slate-700">
              {submission.submission_text}
            </div>
          ) : (
            <p className="mt-3 rounded-2xl border border-dashed border-slate-300 p-5 text-sm text-slate-500">
              No written response was provided.
            </p>
          )}
        </div>

        <div className="mt-6">
          <h3 className="text-sm font-semibold text-slate-700">
            Attachment
          </h3>

          {submission.attachment_path ? (
            <div className="mt-3 flex flex-col justify-between gap-3 rounded-2xl border border-slate-200 p-4 sm:flex-row sm:items-center">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                  <FileText size={21} />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-800">
                    {submission.attachment_name || "Submitted attachment"}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Private assignment storage
                  </p>
                </div>
              </div>

              {attachmentUrl ? (
                <a
                  href={attachmentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex shrink-0 items-center justify-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800"
                >
                  Open attachment
                </a>
              ) : (
                <span className="text-sm text-amber-700">
                  {attachmentError || "Attachment unavailable."}
                </span>
              )}
            </div>
          ) : (
            <p className="mt-3 rounded-2xl border border-dashed border-slate-300 p-5 text-sm text-slate-500">
              No attachment was submitted.
            </p>
          )}
        </div>
      </section>

      <GradeSubmissionForm
        assignmentId={assignment.id}
        submissionId={submission.id}
        assignmentTitle={assignment.title}
        totalMarks={Number(assignment.total_marks) || 0}
        initialMarks={
          submission.marks_awarded === null
            ? ""
            : String(submission.marks_awarded)
        }
        initialFeedback={submission.teacher_feedback ?? ""}
        initialStatus={submission.status}
      />
    </div>
  );
}

function InfoCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
          {icon}
        </span>
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-500">{label}</p>
          <p className="mt-1 break-words text-sm font-semibold capitalize text-slate-900">
            {value}
          </p>
        </div>
      </div>
    </article>
  );
}

function ErrorPanel({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
      {message}
    </div>
  );
}

export default function ReviewSubmissionPage({
  params,
}: {
  params: Promise<{ id: string; submissionId: string }>;
}) {
  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-9">
      <Suspense fallback={<LoadingState />}>
        <SubmissionContent params={params} />
      </Suspense>
    </main>
  );
}