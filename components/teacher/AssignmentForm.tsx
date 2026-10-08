 "use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Archive,
  BookOpen,
  CheckCircle2,
  Clock3,
  Copy,
  FileText,
  Paperclip,
  Download,
  X,
  LoaderCircle,
  Save,
  Trash2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type TaxonomyItem = {
  id: string;
  name: string;
};

type AssignmentType =
  | "homework"
  | "classwork"
  | "project"
  | "research"
  | "practical"
  | "revision"
  | "group_work";

type AssignmentStatus = "draft" | "published" | "closed" | "archived";

type AssignmentRecord = {
  id: string;
  teacher_id: string;
  title: string;
  description: string | null;
  instructions: string | null;
  curriculum_id: string | null;
  education_level_id: string | null;
  grade_id: string | null;
  subject_id: string | null;
  term_id: string | null;
  assignment_type: AssignmentType;
  total_marks: number;
  due_at: string | null;
  allow_late_submission: boolean;
  status: AssignmentStatus;
};

type AssignmentAttachment = {
  id: string;
  assignment_id: string;
  file_name: string;
  file_path: string;
  file_size: number | null;
  mime_type: string | null;
  created_at: string;
};

type Props = {
  assignmentId?: string;
};

const ATTACHMENT_BUCKET = "assignment-files";
const MAX_ATTACHMENT_SIZE = 20 * 1024 * 1024;
const ALLOWED_ATTACHMENT_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/jpeg",
  "image/png",
  "image/webp",
  "text/plain",
]);

function formatFileSize(bytes: number | null) {
  if (bytes === null || !Number.isFinite(bytes) || bytes < 0) return "Unknown size";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function safeFileName(name: string) {
  return name
    .normalize("NFKC")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(-120) || "attachment";
}

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10";

const selectClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10";

function FieldLabel({
  children,
  required = false,
}: {
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label className="mb-2 block text-sm font-semibold text-slate-700">
      {children}
      {required && <span className="ml-1 text-red-500">*</span>}
    </label>
  );
}

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

  return "Something went wrong. Please try again.";
}

function toDateTimeLocal(value: string | null) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return new Date(
    date.getTime() - date.getTimezoneOffset() * 60_000,
  )
    .toISOString()
    .slice(0, 16);
}

export default function AssignmentForm({ assignmentId }: Props) {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [attachments, setAttachments] = useState<AssignmentAttachment[]>([]);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [attachmentActionId, setAttachmentActionId] = useState("");
  const [attachmentError, setAttachmentError] = useState("");

  const [teacherId, setTeacherId] = useState("");

  const [curricula, setCurricula] = useState<TaxonomyItem[]>([]);
  const [levels, setLevels] = useState<TaxonomyItem[]>([]);
  const [grades, setGrades] = useState<TaxonomyItem[]>([]);
  const [subjects, setSubjects] = useState<TaxonomyItem[]>([]);
  const [terms, setTerms] = useState<TaxonomyItem[]>([]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [instructions, setInstructions] = useState("");

  const [curriculumId, setCurriculumId] = useState("");
  const [levelId, setLevelId] = useState("");
  const [gradeId, setGradeId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [termId, setTermId] = useState("");

  const [assignmentType, setAssignmentType] =
    useState<AssignmentType>("homework");

  const [totalMarks, setTotalMarks] = useState("0");
  const [dueAt, setDueAt] = useState("");
  const [allowLateSubmission, setAllowLateSubmission] = useState(false);
  const [status, setStatus] = useState<AssignmentStatus>("draft");

  useEffect(() => {
    let cancelled = false;

    async function loadForm() {
      setLoading(true);
      setError("");

      try {
        const supabase = createClient();

        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) throw authError;

        if (!user) {
          const destination = assignmentId
            ? `/teacher/assignments/${assignmentId}`
            : "/teacher/assignments/new";

          router.replace(
            `/auth/login?redirect=${encodeURIComponent(destination)}`,
          );

          return;
        }

        const [
          teacherResult,
          curriculaResult,
          levelsResult,
          gradesResult,
          subjectsResult,
          termsResult,
        ] = await Promise.all([
          supabase
            .from("teacher_profiles")
            .select("id")
            .eq("user_id", user.id)
            .maybeSingle(),

          supabase
            .from("curricula")
            .select("id,name")
            .eq("is_active", true)
            .order("name"),

          supabase
            .from("education_levels")
            .select("id,name")
            .eq("is_active", true)
            .order("name"),

          supabase
            .from("grades")
            .select("id,name")
            .order("name"),

          supabase
            .from("subjects")
            .select("id,name")
            .eq("is_active", true)
            .order("name"),

          supabase
            .from("terms")
            .select("id,name")
            .order("name"),
        ]);

        if (teacherResult.error) throw teacherResult.error;
        if (curriculaResult.error) throw curriculaResult.error;
        if (levelsResult.error) throw levelsResult.error;
        if (gradesResult.error) throw gradesResult.error;
        if (subjectsResult.error) throw subjectsResult.error;
        if (termsResult.error) throw termsResult.error;

        if (!teacherResult.data) {
          throw new Error(
            "Your teacher profile was not found. Complete teacher onboarding first.",
          );
        }

        if (cancelled) return;

        setTeacherId(teacherResult.data.id);
        setCurricula(curriculaResult.data ?? []);
        setLevels(levelsResult.data ?? []);
        setGrades(gradesResult.data ?? []);
        setSubjects(subjectsResult.data ?? []);
        setTerms(termsResult.data ?? []);

        if (!assignmentId) return;

        const { data: assignment, error: assignmentError } = await supabase
          .from("assignments")
          .select("*")
          .eq("id", assignmentId)
          .eq("teacher_id", teacherResult.data.id)
          .maybeSingle();

        if (assignmentError) throw assignmentError;

        if (!assignment) {
          throw new Error(
            "Assignment not found, or you do not have permission to manage it.",
          );
        }

        const record = assignment as AssignmentRecord;

        const { data: attachmentRows, error: attachmentLoadError } = await supabase
          .from("assignment_attachments")
          .select("id, assignment_id, file_name, file_path, file_size, mime_type, created_at")
          .eq("assignment_id", assignmentId)
          .order("created_at", { ascending: false });

        if (attachmentLoadError) throw attachmentLoadError;
        if (cancelled) return;

        setAttachments((attachmentRows ?? []) as AssignmentAttachment[]);
        setTitle(record.title ?? "");
        setDescription(record.description ?? "");
        setInstructions(record.instructions ?? "");

        setCurriculumId(record.curriculum_id ?? "");
        setLevelId(record.education_level_id ?? "");
        setGradeId(record.grade_id ?? "");
        setSubjectId(record.subject_id ?? "");
        setTermId(record.term_id ?? "");

        setAssignmentType(record.assignment_type ?? "homework");
        setTotalMarks(String(record.total_marks ?? 0));
        setDueAt(toDateTimeLocal(record.due_at));
        setAllowLateSubmission(record.allow_late_submission ?? false);
        setStatus(record.status ?? "draft");
      } catch (caught) {
        if (!cancelled) setError(getErrorMessage(caught));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadForm();

    return () => {
      cancelled = true;
    };
  }, [assignmentId, router]);

  async function saveAssignment(
    nextStatus: AssignmentStatus = status,
  ) {
    setError("");
    setNotice("");

    if (!teacherId) {
      setError("Your teacher profile could not be verified.");
      return;
    }

    if (!title.trim()) {
      setError("Enter an assignment title.");
      return;
    }

    const parsedMarks = Number(totalMarks);

    if (
      !Number.isInteger(parsedMarks) ||
      parsedMarks < 0 ||
      parsedMarks > 1_000_000
    ) {
      setError("Total marks must be a whole number between 0 and 1,000,000.");
      return;
    }

    if (dueAt && Number.isNaN(new Date(dueAt).getTime())) {
      setError("Please enter a valid deadline.");
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

      const payload = {
        teacher_id: teacherId,
        title: title.trim(),
        description: description.trim() || null,
        instructions: instructions.trim() || null,
        curriculum_id: curriculumId || null,
        education_level_id: levelId || null,
        grade_id: gradeId || null,
        subject_id: subjectId || null,
        term_id: termId || null,
        assignment_type: assignmentType,
        total_marks: parsedMarks,
        due_at: dueAt ? new Date(dueAt).toISOString() : null,
        allow_late_submission: allowLateSubmission,
        status: nextStatus,
      };

      let savedId = assignmentId;

      if (assignmentId) {
        const { data, error: updateError } = await supabase
          .from("assignments")
          .update(payload)
          .eq("id", assignmentId)
          .eq("teacher_id", teacherId)
          .select("id")
          .maybeSingle();

        if (updateError) throw updateError;

        if (!data) {
          throw new Error(
            "The assignment could not be updated. Check your permissions.",
          );
        }

        savedId = data.id;
      } else {
        const { data, error: insertError } = await supabase
          .from("assignments")
          .insert(payload)
          .select("id")
          .single();

        if (insertError) throw insertError;

        savedId = data.id;
      }

      setNotice(
        nextStatus === "published"
          ? "Assignment published successfully."
          : nextStatus === "closed"
            ? "Assignment closed successfully."
            : nextStatus === "archived"
              ? "Assignment archived successfully."
              : "Assignment saved successfully.",
      );

      router.push(`/teacher/assignments/${savedId}`);
      router.refresh();
    } catch (caught) {
      setError(getErrorMessage(caught));
    } finally {
      setSaving(false);
    }
  }

  async function uploadAttachment(file: File) {
    setAttachmentError("");
    setError("");
    setNotice("");

    if (!assignmentId) {
      setAttachmentError("Save this assignment as a draft first, then upload its files.");
      return;
    }

    if (!file.size || file.size > MAX_ATTACHMENT_SIZE) {
      setAttachmentError("Each attachment must be smaller than or equal to 20 MB.");
      return;
    }

    const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
    const allowedExtensions = new Set([
      "pdf", "doc", "docx", "ppt", "pptx", "xls", "xlsx", "jpg", "jpeg",
      "png", "webp", "txt",
    ]);
    if (!allowedExtensions.has(extension)) {
      setAttachmentError("Unsupported file type. Upload PDF, Office documents, JPG, PNG, WEBP, or TXT files.");
      return;
    }
    if (file.type && !ALLOWED_ATTACHMENT_TYPES.has(file.type)) {
      setAttachmentError("This file type is not supported.");
      return;
    }

    setUploadingAttachment(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;
      if (!user) throw new Error("Your session has expired. Please sign in again.");

      const { data: ownedAssignment, error: assignmentCheckError } = await supabase
        .from("assignments")
        .select("id")
        .eq("id", assignmentId)
        .eq("teacher_id", teacherId)
        .maybeSingle();

      if (assignmentCheckError) throw assignmentCheckError;
      if (!ownedAssignment) throw new Error("You do not have permission to attach files to this assignment.");

      const path = `assignments/${assignmentId}/${crypto.randomUUID()}-${safeFileName(file.name)}`;
      const { error: storageError } = await supabase.storage
        .from(ATTACHMENT_BUCKET)
        .upload(path, file, {
          cacheControl: "3600",
          contentType: file.type || "application/octet-stream",
          upsert: false,
        });

      if (storageError) throw storageError;

      const { data: row, error: insertError } = await supabase
        .from("assignment_attachments")
        .insert({
          assignment_id: assignmentId,
          file_name: file.name,
          file_path: path,
          file_size: file.size,
          mime_type: file.type || null,
        })
        .select("id, assignment_id, file_name, file_path, file_size, mime_type, created_at")
        .single();

      if (insertError) {
        await supabase.storage.from(ATTACHMENT_BUCKET).remove([path]);
        throw insertError;
      }

      setAttachments((current) => [row as AssignmentAttachment, ...current]);
      setNotice("Attachment uploaded successfully.");
    } catch (caught) {
      setAttachmentError(getErrorMessage(caught));
    } finally {
      setUploadingAttachment(false);
    }
  }

  async function downloadAttachment(attachment: AssignmentAttachment) {
    setAttachmentError("");
    setAttachmentActionId(attachment.id);
    try {
      const supabase = createClient();
      const { data, error: signedUrlError } = await supabase.storage
        .from(ATTACHMENT_BUCKET)
        .createSignedUrl(attachment.file_path, 60);

      if (signedUrlError) throw signedUrlError;
      if (!data?.signedUrl) throw new Error("A secure download link could not be created.");

      const link = document.createElement("a");
      link.href = data.signedUrl;
      link.download = attachment.file_name;
      link.rel = "noopener noreferrer";
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (caught) {
      setAttachmentError(getErrorMessage(caught));
    } finally {
      setAttachmentActionId("");
    }
  }

  async function deleteAttachment(attachment: AssignmentAttachment) {
    const confirmed = window.confirm(`Delete attachment "${attachment.file_name}"?`);
    if (!confirmed) return;

    setAttachmentError("");
    setAttachmentActionId(attachment.id);
    try {
      const supabase = createClient();

      const { error: rowError } = await supabase
        .from("assignment_attachments")
        .delete()
        .eq("id", attachment.id)
        .eq("assignment_id", assignmentId!);

      if (rowError) throw rowError;

      const { error: storageError } = await supabase.storage
        .from(ATTACHMENT_BUCKET)
        .remove([attachment.file_path]);

      setAttachments((current) => current.filter((item) => item.id !== attachment.id));

      if (storageError) {
        setAttachmentError("The attachment record was removed, but its stored file could not be deleted. Ask an administrator to clean up the storage file.");
      } else {
        setNotice("Attachment deleted successfully.");
      }
    } catch (caught) {
      setAttachmentError(getErrorMessage(caught));
    } finally {
      setAttachmentActionId("");
    }
  }

  async function duplicateAssignment() {
    if (!assignmentId || !teacherId) return;

    setSaving(true);
    setError("");
    setNotice("");

    try {
      const supabase = createClient();

      const { data: original, error: originalError } = await supabase
        .from("assignments")
        .select("*")
        .eq("id", assignmentId)
        .eq("teacher_id", teacherId)
        .maybeSingle();

      if (originalError) throw originalError;

      if (!original) {
        throw new Error("Assignment not found.");
      }

      const { data: copy, error: copyError } = await supabase
        .from("assignments")
        .insert({
          teacher_id: teacherId,
          title: `${original.title} (Copy)`,
          description: original.description,
          instructions: original.instructions,
          curriculum_id: original.curriculum_id,
          education_level_id: original.education_level_id,
          grade_id: original.grade_id,
          subject_id: original.subject_id,
          term_id: original.term_id,
          assignment_type: original.assignment_type,
          total_marks: original.total_marks,
          due_at: original.due_at,
          allow_late_submission: original.allow_late_submission,
          status: "draft",
        })
        .select("id")
        .single();

      if (copyError) throw copyError;

      router.push(`/teacher/assignments/${copy.id}`);
      router.refresh();
    } catch (caught) {
      setError(getErrorMessage(caught));
    } finally {
      setSaving(false);
    }
  }

  async function deleteAssignment() {
    if (!assignmentId || !teacherId) return;

    const confirmed = window.confirm(
      "Permanently delete this assignment and its associated records? This action cannot be undone.",
    );

    if (!confirmed) return;

    setDeleting(true);
    setError("");

    try {
      const supabase = createClient();

      const { error: deleteError } = await supabase
        .from("assignments")
        .delete()
        .eq("id", assignmentId)
        .eq("teacher_id", teacherId);

      if (deleteError) throw deleteError;

      router.push("/teacher/assignments");
      router.refresh();
    } catch (caught) {
      setError(getErrorMessage(caught));
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-72 items-center justify-center text-sm text-slate-500">
        <LoaderCircle size={22} className="mr-3 animate-spin" />
        Loading assignment editor...
      </div>
    );
  }

  if (!teacherId) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800">
        <h2 className="font-bold">Unable to open assignment editor</h2>
        <p className="mt-2 text-sm">
          {error || "Your teacher profile could not be loaded."}
        </p>
        <Link
          href="/teacher/assignments"
          className="mt-4 inline-flex items-center gap-2 text-sm font-semibold underline"
        >
          <ArrowLeft size={16} />
          Back to assignments
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-7">
      <div>
        <Link
          href="/teacher/assignments"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-emerald-700"
        >
          <ArrowLeft size={16} />
          Back to assignments
        </Link>

        <div className="mt-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              {assignmentId ? "Manage assignment" : "Create assignment"}
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Organize instructions, academic details, deadlines, and marks.
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-5 py-3">
            <p className="text-xs font-medium text-emerald-700">
              Total marks
            </p>
            <p className="mt-1 text-2xl font-bold text-emerald-950">
              {Number(totalMarks) || 0}
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {notice && (
        <div
          role="status"
          className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700"
        >
          {notice}
        </div>
      )}

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
            <BookOpen size={22} />
          </span>

          <div>
            <h2 className="text-lg font-bold text-slate-950">
              Assignment information
            </h2>
            <p className="text-sm text-slate-500">
              Set the assignment details and academic context.
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-5">
          <div>
            <FieldLabel required>Assignment title</FieldLabel>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className={inputClass}
              placeholder="e.g. Grade 7 Mathematics Homework"
              maxLength={250}
              required
            />
          </div>

          <div>
            <FieldLabel>Description</FieldLabel>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className={`${inputClass} min-h-24 resize-y`}
              placeholder="Describe the purpose and expected outcome..."
              maxLength={5000}
            />
          </div>

          <div>
            <FieldLabel>Instructions for learners</FieldLabel>
            <textarea
              value={instructions}
              onChange={(event) => setInstructions(event.target.value)}
              className={`${inputClass} min-h-32 resize-y`}
              placeholder="Explain how learners should complete and submit the work..."
              maxLength={10000}
            />
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <FieldLabel required>Assignment type</FieldLabel>
              <select
                value={assignmentType}
                onChange={(event) =>
                  setAssignmentType(event.target.value as AssignmentType)
                }
                className={selectClass}
              >
                <option value="homework">Homework</option>
                <option value="classwork">Classwork</option>
                <option value="project">Project</option>
                <option value="research">Research</option>
                <option value="practical">Practical</option>
                <option value="revision">Revision</option>
                <option value="group_work">Group work</option>
              </select>
            </div>

            <div>
              <FieldLabel>Curriculum</FieldLabel>
              <select
                value={curriculumId}
                onChange={(event) => setCurriculumId(event.target.value)}
                className={selectClass}
              >
                <option value="">Select curriculum</option>
                {curricula.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <FieldLabel>Education level</FieldLabel>
              <select
                value={levelId}
                onChange={(event) => setLevelId(event.target.value)}
                className={selectClass}
              >
                <option value="">Select education level</option>
                {levels.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <FieldLabel>Grade</FieldLabel>
              <select
                value={gradeId}
                onChange={(event) => setGradeId(event.target.value)}
                className={selectClass}
              >
                <option value="">Select grade</option>
                {grades.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <FieldLabel>Subject</FieldLabel>
              <select
                value={subjectId}
                onChange={(event) => setSubjectId(event.target.value)}
                className={selectClass}
              >
                <option value="">Select subject</option>
                {subjects.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <FieldLabel>Term</FieldLabel>
              <select
                value={termId}
                onChange={(event) => setTermId(event.target.value)}
                className={selectClass}
              >
                <option value="">Select term</option>
                {terms.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <FieldLabel>Total marks</FieldLabel>
              <input
                type="number"
                min="0"
                max="1000000"
                step="1"
                value={totalMarks}
                onChange={(event) => setTotalMarks(event.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <FieldLabel>Submission deadline</FieldLabel>
              <input
                type="datetime-local"
                value={dueAt}
                onChange={(event) => setDueAt(event.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 p-4">
            <input
              type="checkbox"
              checked={allowLateSubmission}
              onChange={(event) =>
                setAllowLateSubmission(event.target.checked)
              }
              className="mt-1 h-4 w-4 rounded border-slate-300 accent-emerald-700"
            />

            <span>
              <span className="block text-sm font-semibold text-slate-800">
                Allow late submissions
              </span>
              <span className="mt-1 block text-xs leading-5 text-slate-500">
                Permit learners to submit after the deadline. Enforcement
                will be applied when the submission workflow is implemented.
              </span>
            </span>
          </label>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
              <Paperclip size={22} />
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-950">Assignment attachments</h2>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
                Attach worksheets, reference notes, images, or other materials learners need.
                Files are stored privately and downloads use short-lived secure links.
              </p>
            </div>
          </div>
          <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600">
            {attachments.length} {attachments.length === 1 ? "file" : "files"}
          </span>
        </div>

        {attachmentError && (
          <div role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {attachmentError}
          </div>
        )}

        <div className="mt-5 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-5">
          {assignmentId ? (
            <>
              <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-700">
                {uploadingAttachment ? (
                  <LoaderCircle size={17} className="animate-spin" />
                ) : (
                  <Paperclip size={17} />
                )}
                {uploadingAttachment ? "Uploading file..." : "Choose attachment"}
                <input
                  type="file"
                  className="sr-only"
                  disabled={uploadingAttachment}
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.jpg,.jpeg,.png,.webp,.txt"
                  onChange={(event) => {
                    const file = event.currentTarget.files?.[0];
                    event.currentTarget.value = "";
                    if (file) void uploadAttachment(file);
                  }}
                />
              </label>
              <p className="mt-3 text-xs leading-5 text-slate-500">
                PDF, Word, PowerPoint, Excel, JPG, PNG, WEBP, or TXT. Maximum 20 MB per file.
              </p>
            </>
          ) : (
            <p className="text-sm leading-6 text-slate-600">
              Save this assignment as a draft first. You can then return here to upload its attachments.
            </p>
          )}
        </div>

        {attachments.length > 0 ? (
          <ul className="mt-5 space-y-3">
            {attachments.map((attachment) => (
              <li key={attachment.id} className="flex flex-col gap-3 rounded-2xl border border-slate-200 p-4 sm:flex-row sm:items-center">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                  <FileText size={21} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="break-words text-sm font-bold text-slate-900">{attachment.file_name}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {formatFileSize(attachment.file_size)}
                    {attachment.created_at
                      ? ` · Added ${new Intl.DateTimeFormat("en-KE", { day: "numeric", month: "short", year: "numeric" }).format(new Date(attachment.created_at))}`
                      : ""}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void downloadAttachment(attachment)}
                    disabled={Boolean(attachmentActionId) || uploadingAttachment}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                  >
                    {attachmentActionId === attachment.id ? (
                      <LoaderCircle size={16} className="animate-spin" />
                    ) : (
                      <Download size={16} />
                    )}
                    Download
                  </button>
                  <button
                    type="button"
                    onClick={() => void deleteAttachment(attachment)}
                    disabled={Boolean(attachmentActionId) || uploadingAttachment}
                    aria-label={`Delete ${attachment.file_name}`}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-50"
                  >
                    <X size={16} />
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-5 rounded-2xl border border-slate-100 bg-white p-6 text-center">
            <Paperclip className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-2 text-sm font-semibold text-slate-700">No attachments yet</p>
            <p className="mt-1 text-xs text-slate-500">Any files you add will appear here.</p>
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <h2 className="text-lg font-bold text-slate-950">
          Publishing status
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Drafts are not intended for learners. Publish when the assignment
          is ready to be released.
        </p>

        <div className="mt-5">
          <FieldLabel>Status</FieldLabel>
          <select
            value={status}
            onChange={(event) =>
              setStatus(event.target.value as AssignmentStatus)
            }
            className={selectClass}
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="closed">Closed</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </section>

      <section className="sticky bottom-3 z-20 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-xl backdrop-blur sm:p-5">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="font-bold text-slate-950">
              {assignmentId ? "Update assignment" : "Save assignment"}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {status.toUpperCase()} · {Number(totalMarks) || 0} marks
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {assignmentId && (
              <>
                <button
                  type="button"
                  onClick={duplicateAssignment}
                  disabled={saving || deleting}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                >
                  {saving ? (
                    <LoaderCircle size={17} className="animate-spin" />
                  ) : (
                    <Copy size={17} />
                  )}
                  Duplicate
                </button>

                <button
                  type="button"
                  onClick={deleteAssignment}
                  disabled={saving || deleting}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-60"
                >
                  {deleting ? (
                    <LoaderCircle size={17} className="animate-spin" />
                  ) : (
                    <Trash2 size={17} />
                  )}
                  Delete
                </button>
              </>
            )}

            {assignmentId && (
              <button
                type="button"
                onClick={() =>
                  saveAssignment(status === "archived" ? "draft" : "archived")
                }
                disabled={saving || deleting}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800 hover:bg-amber-100 disabled:opacity-60"
              >
                {saving ? (
                  <LoaderCircle size={17} className="animate-spin" />
                ) : (
                  <Archive size={17} />
                )}
                {status === "archived" ? "Restore" : "Archive"}
              </button>
            )}

            <button
              type="button"
              onClick={() => saveAssignment("draft")}
              disabled={saving || deleting}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              {saving ? (
                <LoaderCircle size={17} className="animate-spin" />
              ) : (
                <Save size={17} />
              )}
              Save draft
            </button>

            <button
              type="button"
              onClick={() => saveAssignment("published")}
              disabled={saving || deleting}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
            >
              {saving ? (
                <LoaderCircle size={17} className="animate-spin" />
              ) : (
                <CheckCircle2 size={17} />
              )}
              Publish
            </button>

            {assignmentId && status === "published" && (
              <button
                type="button"
                onClick={() => saveAssignment("closed")}
                disabled={saving || deleting}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-200 disabled:opacity-60"
              >
                <Clock3 size={17} />
                Close
              </button>
            )}
          </div>
        </div>
      </section>

      <div className="flex items-center gap-2 text-xs text-slate-400">
        <FileText size={14} />
        Assignment changes are saved when you select a save or publishing
        action.
      </div>
    </div>
  );
}