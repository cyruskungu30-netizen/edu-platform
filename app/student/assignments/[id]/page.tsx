  import { Suspense } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Download,
  FileText,
  GraduationCap,
  MessageSquare,
  Paperclip,
  ShieldCheck,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import StartDiscussionButton from "@/components/messaging/StartDiscussionButton";

export const metadata = {
  title: "Assignment Details | EduMarket",
  description:
    "Review assignment instructions, deadlines, submission status, and feedback.",
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
  created_at: string;
  teacher_id: string;
};

type Teacher = {
  id: string;
  display_name: string | null;
  school_name: string | null;
};

type Attachment = {
  id: string;
  assignment_id: string;
  file_name: string;
  file_path: string;
  file_size: number | null;
  mime_type: string | null;
  created_at: string;
  signedUrl?: string | null;
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

function formatFileSize(bytes: number | null) {
  if (bytes === null || bytes === undefined || bytes < 0) {
    return "File";
  }

  if (bytes < 1024) return `${bytes} B`;

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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

async function AssignmentDetailsContent({
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
            We could not load your EduMarket profile. Please sign in again
            or contact support if the problem continues.
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
            This page is available to student accounts.
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
      "id, title, description, instructions, assignment_type, total_marks, due_at, allow_late_submission, status, created_at, teacher_id"
    )
    .eq("id", id)
    .eq("status", "published")
    .maybeSingle();

  if (assignmentError) {
    console.error("Assignment lookup failed:", assignmentError.message);

    return (
      <main className="min-h-screen bg-slate-50 px-5 py-16">
        <div className="mx-auto max-w-xl rounded-3xl border border-rose-200 bg-white p-8">
          <h1 className="text-xl font-black text-rose-800">
            Unable to load assignment
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-600">
            The assignment could not be loaded. Please try again.
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

  const [
    { data: teacher },
    { data: attachments, error: attachmentError },
    { data: submission, error: submissionError },
  ] = await Promise.all([
    supabase
      .from("teacher_profiles")
      .select("id, display_name, school_name")
      .eq("id", currentAssignment.teacher_id)
      .maybeSingle(),

    supabase
      .from("assignment_attachments")
      .select(
        "id, assignment_id, file_name, file_path, file_size, mime_type, created_at"
      )
      .eq("assignment_id", currentAssignment.id)
      .order("created_at", { ascending: false }),

    supabase
      .from("assignment_submissions")
      .select(
        "id, assignment_id, student_id, submission_text, attachment_path, attachment_name, submitted_at, marks_awarded, teacher_feedback, status"
      )
      .eq("assignment_id", currentAssignment.id)
      .eq("student_id", user.id)
      .maybeSingle(),
  ]);

  if (attachmentError) {
    console.error("Assignment attachments query failed:", attachmentError.message);
  }

  if (submissionError) {
    console.error("Student submission query failed:", submissionError.message);
  }

  const teacherProfile = teacher as Teacher | null;
  const studentSubmission = submission as Submission | null;

  // Create short-lived download links on the server. The bucket remains private;
  // Supabase Storage policies must authorize this student's SELECT request.
  const rawAttachments = (attachments ?? []) as Attachment[];
  const assignmentAttachments: Attachment[] = await Promise.all(
    rawAttachments.map(async (attachment) => {
      const { data, error } = await supabase.storage
        .from("assignment-files")
        .createSignedUrl(attachment.file_path, 10 * 60, {
          download: attachment.file_name,
        });

      if (error) {
        console.error(
          "Could not create assignment attachment download URL:",
          error.message,
        );
        return { ...attachment, signedUrl: null };
      }

      return { ...attachment, signedUrl: data.signedUrl };
    }),
  );

  const deadlinePassed = currentAssignment.due_at
    ? new Date(currentAssignment.due_at).getTime() < Date.now()
    : false;

  const submissionLocked = Boolean(
    studentSubmission &&
      ["submitted", "late", "graded", "returned"].includes(
        studentSubmission.status.toLowerCase()
      )
  );

  const canSubmit =
    !submissionLocked &&
    (!deadlinePassed || currentAssignment.allow_late_submission);

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl px-5 py-7 sm:px-8">
          <Link
            href="/student/assignments"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-indigo-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to assignments
          </Link>

          <div className="mt-7 flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
            <div className="max-w-3xl">
              <span className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-indigo-700">
                <BookOpen className="h-4 w-4" />
                Assignment details
              </span>

              <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                {currentAssignment.title}
              </h1>

              <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">
                {currentAssignment.description ||
                  "Review the instructions below and prepare your submission."}
              </p>
            </div>

            {studentSubmission && (
              <span
                className={`inline-flex shrink-0 items-center gap-2 self-start rounded-full px-4 py-2 text-sm font-bold ring-1 ${statusClasses(
                  studentSubmission.status
                )}`}
              >
                <CheckCircle2 className="h-4 w-4" />
                {statusLabel(studentSubmission.status)}
              </span>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-5xl gap-6 px-5 py-8 sm:px-8 lg:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="flex items-center gap-3 text-xl font-black text-slate-950">
              <FileText className="h-5 w-5 text-indigo-600" />
              Instructions
            </h2>

            <div className="mt-5 whitespace-pre-wrap text-sm leading-7 text-slate-700">
              {currentAssignment.instructions?.trim() ||
                "No additional instructions have been provided."}
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="flex items-center gap-3 text-xl font-black text-slate-950">
              <Paperclip className="h-5 w-5 text-indigo-600" />
              Assignment attachments
            </h2>

            {assignmentAttachments.length === 0 ? (
              <p className="mt-4 text-sm leading-6 text-slate-600">
                No attachments have been added to this assignment.
              </p>
            ) : (
              <div className="mt-5 space-y-3">
                {assignmentAttachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 p-4"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="rounded-xl bg-indigo-50 p-3 text-indigo-700">
                        <FileText className="h-5 w-5" />
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-slate-900">
                          {attachment.file_name}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {formatFileSize(attachment.file_size)}
                        </p>
                      </div>
                    </div>

                    {attachment.signedUrl ? (
                      <a
                        href={attachment.signedUrl}
                        download={attachment.file_name}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-3 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-200"
                        aria-label={`Download ${attachment.file_name}`}
                      >
                        <Download className="h-4 w-4" />
                        <span className="hidden sm:inline">Download</span>
                      </a>
                    ) : (
                      <span className="shrink-0 text-xs font-semibold text-amber-700">
                        Download unavailable
                      </span>
                    )}
                  </div>
                ))}

                <p className="text-xs leading-5 text-slate-500">
                  Download links expire after 10 minutes. If a link is
                  unavailable, check the assignment-file Storage permissions
                  and refresh this page.
                </p>
              </div>
            )}
          </section>

          {studentSubmission && (
            <section className="rounded-3xl border border-emerald-200 bg-white p-6 shadow-sm sm:p-8">
              <h2 className="flex items-center gap-3 text-xl font-black text-slate-950">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                Your submission
              </h2>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold text-slate-500">
                    Submitted on
                  </p>

                  <p className="mt-2 text-sm font-bold text-slate-900">
                    {formatDate(studentSubmission.submitted_at)}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold text-slate-500">
                    Marks awarded
                  </p>

                  <p className="mt-2 text-sm font-bold text-slate-900">
                    {studentSubmission.marks_awarded === null
                      ? "Awaiting grading"
                      : `${studentSubmission.marks_awarded}${
                          currentAssignment.total_marks !== null
                            ? ` / ${currentAssignment.total_marks}`
                            : ""
                        }`}
                  </p>
                </div>
              </div>

              {studentSubmission.submission_text && (
                <div className="mt-5">
                  <h3 className="text-sm font-bold text-slate-900">
                    Your written response
                  </h3>

                  <p className="mt-2 whitespace-pre-wrap rounded-2xl bg-slate-50 p-4 text-sm leading-7 text-slate-700">
                    {studentSubmission.submission_text}
                  </p>
                </div>
              )}

              {studentSubmission.attachment_name && (
                <div className="mt-5 rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-indigo-600" />

                    <div>
                      <p className="text-sm font-bold text-slate-900">
                        {studentSubmission.attachment_name}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        Your submitted attachment
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {studentSubmission.teacher_feedback && (
                <div className="mt-5 rounded-2xl border border-blue-200 bg-blue-50 p-5">
                  <h3 className="flex items-center gap-2 text-sm font-bold text-blue-950">
                    <MessageSquare className="h-4 w-4" />
                    Teacher feedback
                  </h3>

                  <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-blue-900">
                    {studentSubmission.teacher_feedback}
                  </p>
                </div>
              )}
            </section>
          )}
        </div>

        <aside className="space-y-6">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-black text-slate-950">
              Assignment overview
            </h2>

            <div className="mt-5 space-y-5">
              <OverviewItem
                icon={<CalendarClock className="h-5 w-5" />}
                label="Deadline"
                value={formatDate(currentAssignment.due_at)}
              />

              <OverviewItem
                icon={<GraduationCap className="h-5 w-5" />}
                label="Maximum marks"
                value={
                  currentAssignment.total_marks === null
                    ? "Not specified"
                    : String(currentAssignment.total_marks)
                }
              />

              <OverviewItem
                icon={<FileText className="h-5 w-5" />}
                label="Assignment type"
                value={currentAssignment.assignment_type.replaceAll("_", " ")}
              />

              <OverviewItem
                icon={<Clock3 className="h-5 w-5" />}
                label="Late submissions"
                value={
                  currentAssignment.allow_late_submission
                    ? "Allowed by teacher"
                    : "Not allowed"
                }
              />
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
                <GraduationCap className="h-5 w-5" />
              </div>

              <div className="min-w-0">
                <h2 className="font-black text-slate-950">Your teacher</h2>

                <p className="mt-1 truncate text-sm text-slate-600">
                  {teacherProfile?.display_name || "Teacher"}
                </p>
              </div>
            </div>

            {teacherProfile?.school_name && (
              <p className="mt-4 text-sm text-slate-600">
                {teacherProfile.school_name}
              </p>
            )}
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-black text-slate-950">
              Ready to submit?
            </h2>
            <div className="mt-5">
  <StartDiscussionButton
    assignmentId={currentAssignment.id}
  />
</div>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Review the instructions carefully before submitting your work.
            </p>

            {submissionLocked ? (
              <div className="mt-5 rounded-2xl bg-emerald-50 p-4">
                <CheckCircle2 className="h-5 w-5 text-emerald-700" />

                <p className="mt-2 text-sm font-bold text-emerald-900">
                  Submission received
                </p>

                <p className="mt-1 text-xs leading-5 text-emerald-800">
                  Your submission is recorded. Check the status and feedback
                  above.
                </p>
              </div>
            ) : !canSubmit ? (
              <div className="mt-5 rounded-2xl bg-rose-50 p-4">
                <Clock3 className="h-5 w-5 text-rose-700" />

                <p className="mt-2 text-sm font-bold text-rose-900">
                  Submission deadline passed
                </p>

                <p className="mt-1 text-xs leading-5 text-rose-800">
                  Your teacher has not enabled late submissions.
                </p>
              </div>
            ) : (
              <Link
                href={`/student/assignments/${currentAssignment.id}/submit`}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 font-bold text-white transition hover:bg-indigo-700"
              >
                Continue to submission
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}

            <Link
              href="/student/assignments"
              className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
            >
              <ArrowLeft className="h-4 w-4" />
              All assignments
            </Link>
          </section>
        </aside>
      </div>
    </main>
  );
}

function OverviewItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="rounded-xl bg-indigo-50 p-2.5 text-indigo-700">
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-slate-500">{label}</p>

        <p className="mt-1 break-words text-sm font-bold capitalize text-slate-900">
          {value}
        </p>
      </div>
    </div>
  );
}

export default function StudentAssignmentDetailsPage({
  params,
}: PageProps) {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-slate-50 px-5 py-16">
          <div className="mx-auto max-w-5xl animate-pulse">
            <div className="h-8 w-48 rounded-lg bg-slate-200" />
            <div className="mt-7 h-12 w-96 max-w-full rounded-xl bg-slate-200" />

            <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_300px]">
              <div className="h-96 rounded-3xl bg-white shadow-sm" />
              <div className="h-72 rounded-3xl bg-white shadow-sm" />
            </div>
          </div>
        </main>
      }
    >
      <AssignmentDetailsContent params={params} />
    </Suspense>
  );
}