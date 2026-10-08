 "use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Archive,
  CheckCircle2,
  Clock3,
  Copy,
  FileText,
  LoaderCircle,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type TaxonomyItem = {
  id: string;
  name: string;
};

type AssessmentType =
  | "quiz"
  | "cat"
  | "homework"
  | "classwork"
  | "midterm"
  | "endterm"
  | "revision"
  | "project";

type QuestionType =
  | "multiple_choice"
  | "true_false"
  | "short_answer"
  | "structured"
  | "essay"
  | "fill_blank";

type QuestionOption = {
  id: string;
  text: string;
};

type AssessmentQuestion = {
  id: string;
  question_number: number;
  question_type: QuestionType;
  question_text: string;
  options: QuestionOption[];
  correct_answer: string;
  marking_scheme: string;
  marks: number;
};

type AssessmentRecord = {
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
  assessment_type: AssessmentType;
  duration_minutes: number;
  total_marks: number;
  due_at: string | null;
  status: "draft" | "published" | "archived";
};

type QuestionRecord = {
  id: string;
  question_number: number;
  question_type: QuestionType;
  question_text: string;
  options: unknown;
  correct_answer: string | null;
  marking_scheme: string | null;
  marks: number;
  position: number;
};

type Props = {
  assessmentId?: string;
};

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10";

const selectClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10";

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

function createOption(): QuestionOption {
  return {
    id: `option-${crypto.randomUUID()}`,
    text: "",
  };
}

function createQuestion(number: number): AssessmentQuestion {
  return {
    id: `new-${crypto.randomUUID()}`,
    question_number: number,
    question_type: "short_answer",
    question_text: "",
    options: [
      createOption(),
      createOption(),
      createOption(),
      createOption(),
    ],
    correct_answer: "",
    marking_scheme: "",
    marks: 1,
  };
}

function parseQuestionOptions(value: unknown): QuestionOption[] {
  if (!Array.isArray(value)) {
    return [
      createOption(),
      createOption(),
      createOption(),
      createOption(),
    ];
  }

  const parsed = value.map((item): QuestionOption => {
    if (typeof item === "string") {
      return {
        id: `option-${crypto.randomUUID()}`,
        text: item,
      };
    }

    if (item && typeof item === "object" && "text" in item) {
      const option = item as {
        id?: unknown;
        text?: unknown;
      };

      return {
        id:
          typeof option.id === "string"
            ? option.id
            : `option-${crypto.randomUUID()}`,
        text: typeof option.text === "string" ? option.text : "",
      };
    }

    return createOption();
  });

  return parsed.length
    ? parsed
    : [createOption(), createOption(), createOption(), createOption()];
}

function toDateTimeLocal(value: string | null): string {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  const offset = date.getTimezoneOffset() * 60_000;

  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;

  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }

  return "An unexpected error occurred. Please try again.";
}

export default function AssessmentForm({ assessmentId }: Props) {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [teacherId, setTeacherId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

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

  const [assessmentType, setAssessmentType] =
    useState<AssessmentType>("quiz");

  const [durationMinutes, setDurationMinutes] = useState("30");
  const [dueAt, setDueAt] = useState("");

  const [status, setStatus] = useState<
    "draft" | "published" | "archived"
  >("draft");

  const [questions, setQuestions] = useState<AssessmentQuestion[]>([
    createQuestion(1),
  ]);

  const totalMarks = questions.reduce(
    (total, question) => total + Math.max(0, Number(question.marks) || 0),
    0,
  );

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
          const destination = assessmentId
            ? `/teacher/assessments/${assessmentId}`
            : "/teacher/assessments/new";

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

        if (!assessmentId) return;

        const { data: assessment, error: assessmentError } = await supabase
          .from("assessments")
          .select("*")
          .eq("id", assessmentId)
          .eq("teacher_id", teacherResult.data.id)
          .maybeSingle();

        if (assessmentError) throw assessmentError;

        if (!assessment) {
          throw new Error(
            "Assessment not found, or you do not have permission to edit it.",
          );
        }

        const record = assessment as AssessmentRecord;

        const { data: questionData, error: questionError } = await supabase
          .from("assessment_questions")
          .select("*")
          .eq("assessment_id", assessmentId)
          .order("position", { ascending: true })
          .order("question_number", { ascending: true });

        if (questionError) throw questionError;

        if (cancelled) return;

        setTitle(record.title ?? "");
        setDescription(record.description ?? "");
        setInstructions(record.instructions ?? "");

        setCurriculumId(record.curriculum_id ?? "");
        setLevelId(record.education_level_id ?? "");
        setGradeId(record.grade_id ?? "");
        setSubjectId(record.subject_id ?? "");
        setTermId(record.term_id ?? "");

        setAssessmentType(record.assessment_type ?? "quiz");
        setDurationMinutes(String(record.duration_minutes ?? 30));
        setDueAt(toDateTimeLocal(record.due_at));
        setStatus(record.status ?? "draft");

        const loadedQuestions = (questionData ?? []) as QuestionRecord[];

        setQuestions(
          loadedQuestions.length
            ? loadedQuestions.map((question, index) => ({
                id: question.id,
                question_number: question.question_number ?? index + 1,
                question_type: question.question_type ?? "short_answer",
                question_text: question.question_text ?? "",
                options: parseQuestionOptions(question.options),
                correct_answer: question.correct_answer ?? "",
                marking_scheme: question.marking_scheme ?? "",
                marks: question.marks ?? 1,
              }))
            : [createQuestion(1)],
        );
      } catch (caught) {
        if (!cancelled) {
          setError(getErrorMessage(caught));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadForm();

    return () => {
      cancelled = true;
    };
  }, [assessmentId, router]);

  function updateQuestion(
    questionId: string,
    changes: Partial<AssessmentQuestion>,
  ) {
    setQuestions((current) =>
      current.map((question) =>
        question.id === questionId
          ? { ...question, ...changes }
          : question,
      ),
    );
  }

  function addQuestion() {
    setQuestions((current) => [
      ...current,
      createQuestion(current.length + 1),
    ]);
  }

  function removeQuestion(questionId: string) {
    setQuestions((current) =>
      current
        .filter((question) => question.id !== questionId)
        .map((question, index) => ({
          ...question,
          question_number: index + 1,
        })),
    );
  }

  function moveQuestion(questionId: string, direction: -1 | 1) {
    setQuestions((current) => {
      const index = current.findIndex(
        (question) => question.id === questionId,
      );

      const destination = index + direction;

      if (
        index < 0 ||
        destination < 0 ||
        destination >= current.length
      ) {
        return current;
      }

      const reordered = [...current];

      [reordered[index], reordered[destination]] = [
        reordered[destination],
        reordered[index],
      ];

      return reordered.map((question, questionIndex) => ({
        ...question,
        question_number: questionIndex + 1,
      }));
    });
  }

  function duplicateQuestion(questionId: string) {
    setQuestions((current) => {
      const index = current.findIndex(
        (question) => question.id === questionId,
      );

      if (index < 0) return current;

      const original = current[index];

      const duplicate: AssessmentQuestion = {
        ...original,
        id: `new-${crypto.randomUUID()}`,
        question_number: index + 2,
        options: original.options.map((option) => ({
          ...option,
          id: `option-${crypto.randomUUID()}`,
        })),
      };

      const updated = [...current];

      updated.splice(index + 1, 0, duplicate);

      return updated.map((question, questionIndex) => ({
        ...question,
        question_number: questionIndex + 1,
      }));
    });
  }

  function updateOption(
    questionId: string,
    optionId: string,
    text: string,
  ) {
    setQuestions((current) =>
      current.map((question) =>
        question.id !== questionId
          ? question
          : {
              ...question,
              options: question.options.map((option) =>
                option.id === optionId
                  ? { ...option, text }
                  : option,
              ),
            },
      ),
    );
  }

  function addOption(questionId: string) {
    setQuestions((current) =>
      current.map((question) =>
        question.id === questionId
          ? {
              ...question,
              options: [...question.options, createOption()],
            }
          : question,
      ),
    );
  }

  function removeOption(questionId: string, optionId: string) {
    setQuestions((current) =>
      current.map((question) =>
        question.id === questionId
          ? {
              ...question,
              options: question.options.filter(
                (option) => option.id !== optionId,
              ),
            }
          : question,
      ),
    );
  }

  async function saveAssessment(
    nextStatus: "draft" | "published" | "archived" = status,
  ) {
    setError("");
    setNotice("");

    if (!teacherId) {
      setError("Your teacher profile could not be verified.");
      return;
    }

    if (!title.trim()) {
      setError("Enter an assessment title.");
      return;
    }

    const parsedDuration = Number(durationMinutes);

    if (
      !Number.isInteger(parsedDuration) ||
      parsedDuration < 1 ||
      parsedDuration > 1440
    ) {
      setError("Duration must be a whole number between 1 and 1,440 minutes.");
      return;
    }

    if (nextStatus === "published" && questions.length === 0) {
      setError("Add at least one question before publishing.");
      return;
    }

    if (
      nextStatus === "published" &&
      questions.some((question) => !question.question_text.trim())
    ) {
      setError("Complete or remove every blank question before publishing.");
      return;
    }

    for (const [index, question] of questions.entries()) {
      if (!question.question_text.trim()) continue;

      if (
        !Number.isInteger(Number(question.marks)) ||
        Number(question.marks) < 0
      ) {
        setError(`Question ${index + 1} must have valid non-negative marks.`);
        return;
      }

      if (
        question.question_type === "multiple_choice" &&
        question.options.filter((option) => option.text.trim()).length < 2
      ) {
        setError(
          `Question ${index + 1} needs at least two multiple-choice options.`,
        );
        return;
      }

      if (
        question.question_type === "true_false" &&
        !["True", "False"].includes(question.correct_answer)
      ) {
        setError(
          `Select True or False as the correct answer for question ${index + 1}.`,
        );
        return;
      }
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
        throw new Error("Your session has expired. Sign in again.");
      }

      const assessmentPayload = {
        teacher_id: teacherId,
        title: title.trim(),
        description: description.trim() || null,
        instructions: instructions.trim() || null,
        curriculum_id: curriculumId || null,
        education_level_id: levelId || null,
        grade_id: gradeId || null,
        subject_id: subjectId || null,
        term_id: termId || null,
        assessment_type: assessmentType,
        duration_minutes: parsedDuration,
        total_marks: totalMarks,
        due_at: dueAt ? new Date(dueAt).toISOString() : null,
        status: nextStatus,
      };

      let savedAssessmentId = assessmentId;

      if (assessmentId) {
        const { data, error: updateError } = await supabase
          .from("assessments")
          .update(assessmentPayload)
          .eq("id", assessmentId)
          .eq("teacher_id", teacherId)
          .select("id")
          .maybeSingle();

        if (updateError) throw updateError;

        if (!data) {
          throw new Error(
            "The assessment could not be updated. Check your permissions.",
          );
        }

        savedAssessmentId = data.id;
      } else {
        const { data, error: insertError } = await supabase
          .from("assessments")
          .insert(assessmentPayload)
          .select("id")
          .single();

        if (insertError) throw insertError;

        savedAssessmentId = data.id;
      }

      const questionPayload = questions
        .filter((question) => question.question_text.trim())
        .map((question, index) => ({
          assessment_id: savedAssessmentId!,
          question_number: index + 1,
          question_type: question.question_type,
          question_text: question.question_text.trim(),
          options:
            question.question_type === "multiple_choice"
              ? question.options
                  .filter((option) => option.text.trim())
                  .map((option) => ({
                    id: option.id,
                    text: option.text.trim(),
                  }))
              : question.question_type === "true_false"
                ? [
                    { id: "true", text: "True" },
                    { id: "false", text: "False" },
                  ]
                : [],
          correct_answer: question.correct_answer.trim() || null,
          marking_scheme: question.marking_scheme.trim() || null,
          marks: Number(question.marks),
          position: index,
        }));

      if (savedAssessmentId) {
        const { error: deleteQuestionsError } = await supabase
          .from("assessment_questions")
          .delete()
          .eq("assessment_id", savedAssessmentId);

        if (deleteQuestionsError) {
          throw new Error(
            `Assessment details were saved, but old questions could not be replaced: ${deleteQuestionsError.message}`,
          );
        }

        if (questionPayload.length > 0) {
          const { error: insertQuestionsError } = await supabase
            .from("assessment_questions")
            .insert(questionPayload);

          if (insertQuestionsError) {
            throw new Error(
              `Assessment details were saved, but questions could not be saved: ${insertQuestionsError.message}`,
            );
          }
        }
      }

      setNotice(
        nextStatus === "published"
          ? "Assessment published successfully."
          : nextStatus === "archived"
            ? "Assessment archived successfully."
            : "Assessment draft saved successfully.",
      );

      router.push(`/teacher/assessments/${savedAssessmentId}`);
      router.refresh();
    } catch (caught) {
      setError(getErrorMessage(caught));
    } finally {
      setSaving(false);
    }
  }

  async function deleteAssessment() {
    if (!assessmentId || !teacherId) return;

    const confirmed = window.confirm(
      "Permanently delete this assessment and its questions? This action cannot be undone.",
    );

    if (!confirmed) return;

    setDeleting(true);
    setError("");

    try {
      const supabase = createClient();

      const { error: deleteError } = await supabase
        .from("assessments")
        .delete()
        .eq("id", assessmentId)
        .eq("teacher_id", teacherId);

      if (deleteError) throw deleteError;

      router.push("/teacher/assessments");
      router.refresh();
    } catch (caught) {
      setError(getErrorMessage(caught));
    } finally {
      setDeleting(false);
    }
  }

  async function duplicateAssessment() {
    if (!assessmentId || !teacherId) return;

    setSaving(true);
    setError("");

    try {
      const supabase = createClient();

      const { data: original, error: originalError } = await supabase
        .from("assessments")
        .select("*")
        .eq("id", assessmentId)
        .eq("teacher_id", teacherId)
        .maybeSingle();

      if (originalError) throw originalError;

      if (!original) {
        throw new Error("Assessment not found.");
      }

      const { data: copy, error: copyError } = await supabase
        .from("assessments")
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
          assessment_type: original.assessment_type,
          duration_minutes: original.duration_minutes,
          total_marks: original.total_marks,
          due_at: original.due_at,
          status: "draft",
        })
        .select("id")
        .single();

      if (copyError) throw copyError;

      const { data: originalQuestions, error: questionsError } =
        await supabase
          .from("assessment_questions")
          .select("*")
          .eq("assessment_id", assessmentId)
          .order("position", { ascending: true });

      if (questionsError) throw questionsError;

      if (originalQuestions && originalQuestions.length > 0) {
        const copiedQuestions = originalQuestions.map((question) => ({
          assessment_id: copy.id,
          question_number: question.question_number,
          question_type: question.question_type,
          question_text: question.question_text,
          options: question.options,
          correct_answer: question.correct_answer,
          marking_scheme: question.marking_scheme,
          marks: question.marks,
          position: question.position,
        }));

        const { error: insertQuestionsError } = await supabase
          .from("assessment_questions")
          .insert(copiedQuestions);

        if (insertQuestionsError) {
          await supabase
            .from("assessments")
            .delete()
            .eq("id", copy.id)
            .eq("teacher_id", teacherId);

          throw insertQuestionsError;
        }
      }

      router.push(`/teacher/assessments/${copy.id}`);
      router.refresh();
    } catch (caught) {
      setError(getErrorMessage(caught));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-72 items-center justify-center text-sm text-slate-500">
        <LoaderCircle className="mr-3 animate-spin" size={22} />
        Loading assessment editor...
      </div>
    );
  }

  if (!teacherId) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800">
        <h2 className="font-bold">Unable to open assessment editor</h2>
        <p className="mt-2 text-sm">{error || "Teacher profile not found."}</p>
        <Link
          href="/teacher/assessments"
          className="mt-4 inline-flex items-center gap-2 text-sm font-semibold underline"
        >
          <ArrowLeft size={16} />
          Back to assessments
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-7">
      <div>
        <Link
          href="/teacher/assessments"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-indigo-700"
        >
          <ArrowLeft size={16} />
          Back to assessments
        </Link>

        <div className="mt-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              {assessmentId ? "Edit assessment" : "Create assessment"}
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Configure the assessment and manage its questions in one place.
            </p>
          </div>

          <div className="rounded-2xl border border-indigo-100 bg-indigo-50 px-5 py-3">
            <p className="text-xs font-medium text-indigo-700">
              Total assessment marks
            </p>
            <p className="mt-1 text-2xl font-bold text-indigo-950">
              {totalMarks}
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
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
            <FileText size={22} />
          </span>
          <div>
            <h2 className="text-lg font-bold text-slate-950">
              Assessment information
            </h2>
            <p className="text-sm text-slate-500">
              Define the assessment details and academic context.
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-5">
          <div>
            <FieldLabel required>Assessment title</FieldLabel>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className={inputClass}
              placeholder="e.g. Grade 7 Mathematics CAT 1"
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
              placeholder="Describe the purpose and scope of this assessment..."
              maxLength={5000}
            />
          </div>

          <div>
            <FieldLabel>Instructions for learners</FieldLabel>
            <textarea
              value={instructions}
              onChange={(event) => setInstructions(event.target.value)}
              className={`${inputClass} min-h-28 resize-y`}
              placeholder="Explain how learners should complete the assessment..."
              maxLength={10000}
            />
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <FieldLabel required>Assessment type</FieldLabel>
              <select
                value={assessmentType}
                onChange={(event) =>
                  setAssessmentType(event.target.value as AssessmentType)
                }
                className={selectClass}
              >
                <option value="quiz">Quiz</option>
                <option value="cat">Continuous Assessment Test (CAT)</option>
                <option value="homework">Homework</option>
                <option value="classwork">Classwork</option>
                <option value="midterm">Mid-Term</option>
                <option value="endterm">End-Term</option>
                <option value="revision">Revision</option>
                <option value="project">Project</option>
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
              <FieldLabel>Duration in minutes</FieldLabel>
              <input
                type="number"
                min="1"
                max="1440"
                step="1"
                value={durationMinutes}
                onChange={(event) =>
                  setDurationMinutes(event.target.value)
                }
                className={inputClass}
              />
            </div>

            <div>
              <FieldLabel>Deadline</FieldLabel>
              <input
                type="datetime-local"
                value={dueAt}
                onChange={(event) => setDueAt(event.target.value)}
                className={inputClass}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-5">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-xl font-bold text-slate-950">
              Assessment questions
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Add questions, assign marks, and provide marking guidance.
            </p>
          </div>

          <button
            type="button"
            onClick={addQuestion}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-700 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-800"
          >
            <Plus size={17} />
            Add question
          </button>
        </div>

        {questions.map((question, index) => (
          <article
            key={question.id}
            className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
          >
            <div className="flex flex-col justify-between gap-3 border-b border-slate-100 bg-slate-50/70 px-5 py-4 sm:flex-row sm:items-center sm:px-7">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-sm font-bold text-indigo-800">
                  {index + 1}
                </span>

                <div>
                  <h3 className="font-bold text-slate-950">
                    Question {index + 1}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {Number(question.marks) || 0} marks
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => moveQuestion(question.id, -1)}
                  disabled={index === 0}
                  title="Move question up"
                  className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 hover:bg-indigo-50 disabled:opacity-30"
                >
                  <ArrowUp size={17} />
                </button>

                <button
                  type="button"
                  onClick={() => moveQuestion(question.id, 1)}
                  disabled={index === questions.length - 1}
                  title="Move question down"
                  className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 hover:bg-indigo-50 disabled:opacity-30"
                >
                  <ArrowDown size={17} />
                </button>

                <button
                  type="button"
                  onClick={() => duplicateQuestion(question.id)}
                  title="Duplicate question"
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-indigo-50"
                >
                  <Copy size={16} />
                  <span className="hidden sm:inline">Duplicate</span>
                </button>

                <button
                  type="button"
                  onClick={() => removeQuestion(question.id)}
                  title="Remove question"
                  className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                >
                  <Trash2 size={16} />
                  <span className="hidden sm:inline">Remove</span>
                </button>
              </div>
            </div>

            <div className="space-y-5 p-5 sm:p-7">
              <div>
                <FieldLabel required>Question text</FieldLabel>
                <textarea
                  value={question.question_text}
                  onChange={(event) =>
                    updateQuestion(question.id, {
                      question_text: event.target.value,
                    })
                  }
                  className={`${inputClass} min-h-28 resize-y`}
                  placeholder="Write the question..."
                  maxLength={20000}
                />
              </div>

              <div className="grid gap-5 md:grid-cols-3">
                <div>
                  <FieldLabel>Question type</FieldLabel>
                  <select
                    value={question.question_type}
                    onChange={(event) =>
                      updateQuestion(question.id, {
                        question_type: event.target.value as QuestionType,
                      })
                    }
                    className={selectClass}
                  >
                    <option value="multiple_choice">Multiple choice</option>
                    <option value="true_false">True / False</option>
                    <option value="short_answer">Short answer</option>
                    <option value="structured">Structured</option>
                    <option value="essay">Essay</option>
                    <option value="fill_blank">Fill in the blank</option>
                  </select>
                </div>

                <div>
                  <FieldLabel>Marks</FieldLabel>
                  <input
                    type="number"
                    min="0"
                    max="10000"
                    step="1"
                    value={question.marks}
                    onChange={(event) =>
                      updateQuestion(question.id, {
                        marks: Number(event.target.value),
                      })
                    }
                    className={inputClass}
                  />
                </div>
              </div>

              {question.question_type === "multiple_choice" && (
                <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4 sm:p-5">
                  <div className="flex items-center justify-between gap-3">
                    <h4 className="text-sm font-bold text-slate-900">
                      Answer options
                    </h4>

                    <button
                      type="button"
                      onClick={() => addOption(question.id)}
                      className="rounded-lg border border-indigo-200 bg-white px-3 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-50"
                    >
                      Add option
                    </button>
                  </div>

                  <div className="mt-4 space-y-3">
                    {question.options.map((option, optionIndex) => (
                      <div
                        key={option.id}
                        className="flex items-center gap-3"
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-sm font-bold text-indigo-800 ring-1 ring-indigo-100">
                          {String.fromCharCode(65 + (optionIndex % 26))}
                        </span>

                        <input
                          value={option.text}
                          onChange={(event) =>
                            updateOption(
                              question.id,
                              option.id,
                              event.target.value,
                            )
                          }
                          className={inputClass}
                          placeholder={`Option ${optionIndex + 1}`}
                          maxLength={2000}
                        />

                        <button
                          type="button"
                          onClick={() =>
                            removeOption(question.id, option.id)
                          }
                          disabled={question.options.length <= 2}
                          title="Remove option"
                          className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-700 disabled:opacity-30"
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {question.question_type === "true_false" && (
                <div>
                  <FieldLabel>Correct answer</FieldLabel>
                  <select
                    value={question.correct_answer}
                    onChange={(event) =>
                      updateQuestion(question.id, {
                        correct_answer: event.target.value,
                      })
                    }
                    className={selectClass}
                  >
                    <option value="">Select answer</option>
                    <option value="True">True</option>
                    <option value="False">False</option>
                  </select>
                </div>
              )}

              {question.question_type !== "true_false" && (
                <div>
                  <FieldLabel>Expected answer</FieldLabel>
                  <textarea
                    value={question.correct_answer}
                    onChange={(event) =>
                      updateQuestion(question.id, {
                        correct_answer: event.target.value,
                      })
                    }
                    className={`${inputClass} min-h-20 resize-y`}
                    placeholder="Enter the expected answer..."
                    maxLength={10000}
                  />
                </div>
              )}

              <div>
                <FieldLabel>Marking scheme / explanation</FieldLabel>
                <textarea
                  value={question.marking_scheme}
                  onChange={(event) =>
                    updateQuestion(question.id, {
                      marking_scheme: event.target.value,
                    })
                  }
                  className={`${inputClass} min-h-24 resize-y`}
                  placeholder="Explain how marks should be awarded..."
                  maxLength={10000}
                />
              </div>
            </div>
          </article>
        ))}

        <div className="flex items-center justify-between rounded-2xl border border-indigo-100 bg-indigo-50 px-5 py-4">
          <div>
            <p className="text-sm font-semibold text-indigo-900">
              Assessment total
            </p>
            <p className="mt-1 text-xs text-indigo-700">
              Calculated from all question marks.
            </p>
          </div>

          <p className="text-3xl font-bold text-indigo-950">
            {totalMarks}
          </p>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <h2 className="text-lg font-bold text-slate-950">
          Publishing status
        </h2>

        <div className="mt-4">
          <FieldLabel>Status</FieldLabel>
          <select
            value={status}
            onChange={(event) =>
              setStatus(
                event.target.value as "draft" | "published" | "archived",
              )
            }
            className={selectClass}
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </section>

      <section className="sticky bottom-3 z-20 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-xl backdrop-blur sm:p-5">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="font-bold text-slate-950">
              {assessmentId ? "Update assessment" : "Save assessment"}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {questions.length} question
              {questions.length === 1 ? "" : "s"} · {totalMarks} marks ·{" "}
              {durationMinutes} minutes
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {assessmentId && (
              <>
                <button
                  type="button"
                  onClick={duplicateAssessment}
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
                  onClick={deleteAssessment}
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

            {assessmentId && (
              <button
                type="button"
                onClick={() =>
                  saveAssessment(status === "archived" ? "draft" : "archived")
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
              onClick={() => saveAssessment("draft")}
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
              onClick={() => saveAssessment("published")}
              disabled={saving || deleting}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-700 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-800 disabled:opacity-60"
            >
              {saving ? (
                <LoaderCircle size={17} className="animate-spin" />
              ) : (
                <CheckCircle2 size={17} />
              )}
              Publish
            </button>
          </div>
        </div>
      </section>

      <div className="flex items-center gap-2 text-xs text-slate-400">
        <Clock3 size={14} />
        Changes are saved when you select Save draft, Publish, or Archive.
      </div>
    </div>
  );
}