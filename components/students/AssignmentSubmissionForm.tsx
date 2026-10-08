 "use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  FileText,
  LoaderCircle,
  Paperclip,
  Send,
  Trash2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type AssignmentSubmissionFormProps = {
  assignmentId: string;
  dueAt: string | null;
  allowLateSubmission: boolean;
  totalMarks: number | null;
};

const MAX_FILE_SIZE = 20 * 1024 * 1024;

const ALLOWED_EXTENSIONS = new Set([
  "pdf",
  "doc",
  "docx",
  "ppt",
  "pptx",
  "xls",
  "xlsx",
  "txt",
  "jpg",
  "jpeg",
  "png",
  "webp",
  "zip",
]);

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/zip",
  "application/x-zip-compressed",
  "application/octet-stream",
]);

function sanitizeFilename(filename: string) {
  const lastPart = filename.split(/[\\/]/).pop() ?? "submission";

  return (
    lastPart
      .normalize("NFKD")
      .replace(/[^\w.-]+/g, "_")
      .replace(/^\.+/, "")
      .slice(-120) || "submission"
  );
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function AssignmentSubmissionForm({
  assignmentId,
  dueAt,
  allowLateSubmission,
  totalMarks,
}: AssignmentSubmissionFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [submissionText, setSubmissionText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function validateFile(file: File) {
    const extension = file.name.split(".").pop()?.toLowerCase() ?? "";

    if (!ALLOWED_EXTENSIONS.has(extension)) {
      return "This file type is not supported.";
    }

    if (file.size > MAX_FILE_SIZE) {
      return "Your file must be 20 MB or smaller.";
    }

    if (
      file.type &&
      !ALLOWED_MIME_TYPES.has(file.type.toLowerCase())
    ) {
      return "The file type is not permitted.";
    }

    if (file.size === 0) {
      return "The selected file is empty.";
    }

    return "";
  }

  function handleFileChange(file: File | null) {
    setError("");
    setSuccess("");

    if (!file) {
      setSelectedFile(null);
      return;
    }

    const validationError = validateFile(file);

    if (validationError) {
      setSelectedFile(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      setError(validationError);
      return;
    }

    setSelectedFile(file);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSuccess("");

    const trimmedText = submissionText.trim();

    if (!trimmedText && !selectedFile) {
      setError("Write your answer or attach a file before submitting.");
      return;
    }

    if (trimmedText.length > 50000) {
      setError("Your written response must be 50,000 characters or fewer.");
      return;
    }

    if (selectedFile) {
      const validationError = validateFile(selectedFile);

      if (validationError) {
        setError(validationError);
        return;
      }
    }

    setIsSubmitting(true);

    let uploadedPath: string | null = null;

    try {
      const supabase = createClient();

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error("Your session has expired. Please sign in again.");
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, role")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError || !profile) {
        throw new Error("Your student profile could not be verified.");
      }

      if (profile.role !== "student") {
        throw new Error("Only student accounts can submit assignments.");
      }

      /*
       * Recheck the assignment using the database.
       * Client-side deadline checks are not security enforcement.
       */
      const { data: assignment, error: assignmentError } = await supabase
        .from("assignments")
        .select("id, status, due_at, allow_late_submission, total_marks")
        .eq("id", assignmentId)
        .eq("status", "published")
        .maybeSingle();

      if (assignmentError || !assignment) {
        throw new Error("This assignment is unavailable.");
      }

      const deadline = assignment.due_at
        ? new Date(assignment.due_at).getTime()
        : null;

      const isLate = deadline !== null && Date.now() > deadline;

      if (isLate && !assignment.allow_late_submission) {
        throw new Error("The submission deadline has passed.");
      }

      /*
       * Do not permit students to overwrite an existing submission.
       * Grading and submission locking remain database responsibilities.
       */
      const { data: existingSubmission, error: existingError } =
        await supabase
          .from("assignment_submissions")
          .select("id, status")
          .eq("assignment_id", assignmentId)
          .eq("student_id", user.id)
          .maybeSingle();

      if (existingError) {
        throw new Error("We could not verify your existing submission.");
      }

      if (
        existingSubmission &&
        ["submitted", "late", "graded", "returned"].includes(
          existingSubmission.status.toLowerCase()
        )
      ) {
        throw new Error(
          "You have already submitted this assignment. Contact your teacher if you need help."
        );
      }

      let attachmentName: string | null = null;

      if (selectedFile) {
        attachmentName = sanitizeFilename(selectedFile.name);

        /*
         * Private bucket path:
         * submissions/<assignment UUID>/<student UUID>/<unique filename>
         */
        const uniqueFilename = `${crypto.randomUUID()}-${attachmentName}`;

        uploadedPath = [
          "submissions",
          assignmentId,
          user.id,
          uniqueFilename,
        ].join("/");

        const { error: uploadError } = await supabase.storage
          .from("assignment-files")
          .upload(uploadedPath, selectedFile, {
            cacheControl: "0",
            upsert: false,
            contentType:
              selectedFile.type || "application/octet-stream",
          });

        if (uploadError) {
          throw new Error(
            `File upload failed: ${uploadError.message}. Verify your private Storage policies.`
          );
        }
      }

      const submissionStatus = isLate ? "late" : "submitted";

      const { error: insertError } = await supabase
        .from("assignment_submissions")
        .insert({
          assignment_id: assignmentId,
          student_id: user.id,
          submission_text: trimmedText || null,
          attachment_path: uploadedPath,
          attachment_name: attachmentName,
          submitted_at: new Date().toISOString(),
          status: submissionStatus,
          marks_awarded: null,
          teacher_feedback: null,
        });

      if (insertError) {
        /*
         * If the database rejects the submission, remove the uploaded file
         * where permitted. The private Storage policy must authorize this
         * operation for cleanup to succeed.
         */
        if (uploadedPath) {
          const { error: cleanupError } = await supabase.storage
            .from("assignment-files")
            .remove([uploadedPath]);

          if (cleanupError) {
            console.error(
              "Uploaded file cleanup failed:",
              cleanupError.message
            );
          }
        }

        throw new Error(
          insertError.code === "23505"
            ? "A submission already exists for this assignment."
            : `Submission failed: ${insertError.message}`
        );
      }

      setSuccess("Your assignment has been submitted successfully.");
      setSubmissionText("");
      setSelectedFile(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      router.refresh();

      window.setTimeout(() => {
        router.push(`/student/assignments/${assignmentId}`);
      }, 1200);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "An unexpected error occurred while submitting your work."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const deadlinePassed = dueAt
    ? new Date(dueAt).getTime() < Date.now()
    : false;

  const lateSubmissionWarning =
    deadlinePassed && allowLateSubmission;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-900"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

          <p className="text-sm leading-6">{error}</p>
        </div>
      )}

      {success && (
        <div
          role="status"
          className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900"
        >
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />

          <p className="text-sm leading-6">{success}</p>
        </div>
      )}

      {lateSubmissionWarning && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
          The deadline has passed. Your teacher allows late submissions,
          so your work will be marked as late.
        </div>
      )}

      {totalMarks !== null && (
        <div className="rounded-2xl bg-indigo-50 p-4">
          <p className="text-sm font-semibold text-indigo-900">
            Maximum marks: {totalMarks}
          </p>

          <p className="mt-1 text-xs leading-5 text-indigo-800">
            Your teacher will grade your submission.
          </p>
        </div>
      )}

      <div>
        <label
          htmlFor="submissionText"
          className="mb-2 block text-sm font-bold text-slate-900"
        >
          Your written answer
        </label>

        <textarea
          id="submissionText"
          value={submissionText}
          onChange={(event) => setSubmissionText(event.target.value)}
          maxLength={50000}
          rows={10}
          placeholder="Write your answer here..."
          disabled={isSubmitting || Boolean(success)}
          className="w-full resize-y rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm leading-7 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-50"
        />

        <p className="mt-2 text-right text-xs text-slate-500">
          {submissionText.length.toLocaleString()} / 50,000 characters
        </p>
      </div>

      <div>
        <label className="mb-2 block text-sm font-bold text-slate-900">
          Attach your work
        </label>

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.jpg,.jpeg,.png,.webp,.zip"
          disabled={isSubmitting || Boolean(success)}
          onChange={(event) =>
            handleFileChange(event.target.files?.[0] ?? null)
          }
          className="sr-only"
          id="submissionFile"
        />

        {!selectedFile ? (
          <label
            htmlFor="submissionFile"
            className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center transition hover:border-indigo-400 hover:bg-indigo-50/50"
          >
            <div className="rounded-2xl bg-white p-4 text-indigo-600 shadow-sm">
              <Paperclip className="h-6 w-6" />
            </div>

            <span className="mt-4 text-sm font-bold text-slate-900">
              Choose a document
            </span>

            <span className="mt-2 text-xs leading-5 text-slate-500">
              PDF, Word, PowerPoint, Excel, images, text, or ZIP
            </span>

            <span className="mt-1 text-xs text-slate-500">
              Maximum file size: 20 MB
            </span>
          </label>
        ) : (
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-indigo-200 bg-indigo-50 p-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="rounded-xl bg-white p-3 text-indigo-700">
                <FileText className="h-5 w-5" />
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-slate-900">
                  {selectedFile.name}
                </p>

                <p className="mt-1 text-xs text-slate-600">
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
            </div>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => {
                setSelectedFile(null);

                if (fileInputRef.current) {
                  fileInputRef.current.value = "";
                }
              }}
              aria-label="Remove selected file"
              className="rounded-xl p-2 text-rose-600 transition hover:bg-rose-100 disabled:opacity-50"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-xs leading-6 text-slate-600">
          By submitting, you confirm that this is your work. Once submitted,
          your assignment may be locked against further changes.
        </p>
      </div>

      <button
        type="submit"
        disabled={isSubmitting || Boolean(success)}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-4 font-bold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? (
          <>
            <LoaderCircle className="h-5 w-5 animate-spin" />
            Submitting your work...
          </>
        ) : success ? (
          <>
            <CheckCircle2 className="h-5 w-5" />
            Submitted successfully
          </>
        ) : (
          <>
            <Send className="h-5 w-5" />
            Submit assignment
          </>
        )}
      </button>
    </form>
  );
}