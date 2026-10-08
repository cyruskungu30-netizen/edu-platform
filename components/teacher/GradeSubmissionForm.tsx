"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  LoaderCircle,
  MessageSquareText,
  Save,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Props = {
  assignmentId: string;
  submissionId: string;
  assignmentTitle: string;
  totalMarks: number;
  initialMarks: string;
  initialFeedback: string;
  initialStatus: string;
};

type GradingStatus = "graded" | "returned";

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;

  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }

  return "Unable to save the grade. Please try again.";
}

export default function GradeSubmissionForm({
  assignmentId,
  submissionId,
  assignmentTitle,
  totalMarks,
  initialMarks,
  initialFeedback,
  initialStatus,
}: Props) {
  const router = useRouter();

  const [marks, setMarks] = useState(initialMarks);
  const [feedback, setFeedback] = useState(initialFeedback);
  const [status, setStatus] = useState<GradingStatus>(
    initialStatus === "returned" ? "returned" : "graded",
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function saveGrade(nextStatus: GradingStatus) {
    setError("");
    setNotice("");

    if (marks.trim() === "") {
      setError("Enter the marks awarded.");
      return;
    }

    const parsedMarks = Number(marks);

    if (
      !Number.isFinite(parsedMarks) ||
      parsedMarks < 0 ||
      parsedMarks > totalMarks
    ) {
      setError(`Marks must be between 0 and ${totalMarks}.`);
      return;
    }

    if (!Number.isInteger(parsedMarks)) {
      setError("Marks must be a whole number.");
      return;
    }

    if (feedback.length > 10000) {
      setError("Feedback must not exceed 10,000 characters.");
      return;
    }

    setSaving(true);

    try {
      const supabase = createClient();

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;

      if (!user) {
        throw new Error("Your session has expired. Please sign in again.");
      }

      const { data: teacher, error: teacherError } = await supabase
        .from("teacher_profiles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (teacherError) throw teacherError;

      if (!teacher) {
        throw new Error("Your teacher profile could not be verified.");
      }

      // Verify that this teacher owns the assignment.
      const { data: assignment, error: assignmentError } = await supabase
        .from("assignments")
        .select("id,total_marks")
        .eq("id", assignmentId)
        .eq("teacher_id", teacher.id)
        .maybeSingle();

      if (assignmentError) throw assignmentError;

      if (!assignment) {
        throw new Error("You do not have permission to grade this assignment.");
      }

      const maximum = Number(assignment.total_marks) || 0;

      if (parsedMarks > maximum) {
        throw new Error(`Marks cannot exceed the assignment maximum of ${maximum}.`);
      }

      // Update only the submission associated with the selected assignment.
      // Database RLS must still enforce teacher ownership.
      const { data: updatedSubmission, error: updateError } = await supabase
        .from("assignment_submissions")
        .update({
          marks_awarded: parsedMarks,
          teacher_feedback: feedback.trim() || null,
          status: nextStatus,
        })
        .eq("id", submissionId)
        .eq("assignment_id", assignmentId)
        .select("id")
        .maybeSingle();

      if (updateError) throw updateError;

      if (!updatedSubmission) {
        throw new Error(
          "The grade was not saved. Check the submission permissions and database policies.",
        );
      }

      setStatus(nextStatus);
      setNotice(
        nextStatus === "returned"
          ? "Grade saved and feedback returned to the learner."
          : "Grade saved successfully.",
      );

      router.refresh();
    } catch (caught) {
      setError(getErrorMessage(caught));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
          <MessageSquareText size={22} />
        </span>

        <div>
          <h2 className="text-lg font-bold text-slate-950">
            Mark and provide feedback
          </h2>
          <p className="text-sm text-slate-500">
            Record the learner&apos;s score and feedback for{" "}
            {assignmentTitle}.
          </p>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {notice && (
        <div
          role="status"
          className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
        >
          {notice}
        </div>
      )}

      <div className="mt-6 space-y-6">
        <div>
          <label
            htmlFor="marks"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Marks awarded
          </label>

          <div className="flex max-w-sm items-center gap-3">
            <input
              id="marks"
              type="number"
              min="0"
              max={totalMarks}
              step="1"
              value={marks}
              onChange={(event) => setMarks(event.target.value)}
              disabled={saving}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:bg-slate-50"
              placeholder="Enter score"
            />

            <span className="shrink-0 text-sm font-semibold text-slate-500">
              / {totalMarks}
            </span>
          </div>

          {marks !== "" &&
            Number.isFinite(Number(marks)) &&
            totalMarks > 0 && (
              <p className="mt-2 text-sm text-slate-500">
                Percentage:{" "}
                <span className="font-semibold text-emerald-700">
                  {((Number(marks) / totalMarks) * 100).toFixed(1)}%
                </span>
              </p>
            )}
        </div>

        <div>
          <label
            htmlFor="feedback"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Teacher feedback
          </label>

          <textarea
            id="feedback"
            value={feedback}
            onChange={(event) => setFeedback(event.target.value)}
            disabled={saving}
            rows={6}
            maxLength={10000}
            className="w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-900 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:bg-slate-50"
            placeholder="Explain the learner's performance, strengths, mistakes, and areas for improvement..."
          />

          <p className="mt-2 text-xs text-slate-400">
            {feedback.length}/10,000 characters
          </p>
        </div>

        <div>
          <label
            htmlFor="grading-status"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Grading status
          </label>

          <select
            id="grading-status"
            value={status}
            onChange={(event) =>
              setStatus(event.target.value as GradingStatus)
            }
            disabled={saving}
            className="w-full max-w-sm rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:bg-slate-50"
          >
            <option value="graded">Graded</option>
            <option value="returned">Returned to learner</option>
          </select>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => saveGrade("graded")}
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? (
              <LoaderCircle size={17} className="animate-spin" />
            ) : (
              <Save size={17} />
            )}
            Save grade
          </button>

          <button
            type="button"
            onClick={() => saveGrade("returned")}
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? (
              <LoaderCircle size={17} className="animate-spin" />
            ) : (
              <CheckCircle2 size={17} />
            )}
            Save & return feedback
          </button>
        </div>
      </div>
    </section>
  );
}