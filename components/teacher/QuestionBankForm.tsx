"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Archive,
  BookOpen,
  CheckCircle2,
  LoaderCircle,
  Save,
  Trash2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type TaxonomyItem = {
  id: string;
  name: string;
};

type QuestionType =
  | "multiple_choice"
  | "true_false"
  | "short_answer"
  | "structured"
  | "essay"
  | "fill_blank";

type Difficulty = "easy" | "medium" | "hard";

type QuestionOption = {
  id: string;
  text: string;
};

type QuestionRecord = {
  id: string;
  teacher_id: string;
  curriculum_id: string | null;
  education_level_id: string | null;
  grade_id: string | null;
  subject_id: string | null;
  topic: string | null;
  subtopic: string | null;
  question_type: QuestionType;
  question_text: string;
  options: unknown;
  correct_answer: string | null;
  answer: string | null;
  marking_scheme: string | null;
  explanation: string | null;
  marks: number;
  difficulty: Difficulty;
  tags: string[] | null;
  is_public: boolean;
  status: "active" | "archived";
};

type Props = {
  questionId?: string;
};

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10";

const selectClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10";

function Label({
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

function newOption(): QuestionOption {
  return {
    id: crypto.randomUUID(),
    text: "",
  };
}

function parseOptions(value: unknown): QuestionOption[] {
  if (!Array.isArray(value)) {
    return [newOption(), newOption(), newOption(), newOption()];
  }

  const options = value.map((item) => {
    if (typeof item === "string") {
      return {
        id: crypto.randomUUID(),
        text: item,
      };
    }

    if (item && typeof item === "object" && "text" in item) {
      const option = item as { id?: unknown; text?: unknown };

      return {
        id:
          typeof option.id === "string"
            ? option.id
            : crypto.randomUUID(),
        text: typeof option.text === "string" ? option.text : "",
      };
    }

    return newOption();
  });

  return options.length
    ? options
    : [newOption(), newOption(), newOption(), newOption()];
}

export default function QuestionBankForm({ questionId }: Props) {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [teacherId, setTeacherId] = useState("");

  const [curricula, setCurricula] = useState<TaxonomyItem[]>([]);
  const [levels, setLevels] = useState<TaxonomyItem[]>([]);
  const [grades, setGrades] = useState<TaxonomyItem[]>([]);
  const [subjects, setSubjects] = useState<TaxonomyItem[]>([]);

  const [title, setTitle] = useState("");
  const [curriculumId, setCurriculumId] = useState("");
  const [levelId, setLevelId] = useState("");
  const [gradeId, setGradeId] = useState("");
  const [subjectId, setSubjectId] = useState("");

  const [topic, setTopic] = useState("");
  const [subtopic, setSubtopic] = useState("");

  const [questionType, setQuestionType] =
    useState<QuestionType>("short_answer");

  const [options, setOptions] = useState<QuestionOption[]>([
    newOption(),
    newOption(),
    newOption(),
    newOption(),
  ]);

  const [correctAnswer, setCorrectAnswer] = useState("");
  const [markingScheme, setMarkingScheme] = useState("");
  const [marks, setMarks] = useState("1");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [tagsInput, setTagsInput] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [status, setStatus] = useState<"active" | "archived">("active");

  const totalOptions = useMemo(
    () => options.filter((option) => option.text.trim()).length,
    [options],
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
          router.replace(
            `/auth/login?redirect=${encodeURIComponent(
              questionId
                ? `/teacher/question-bank/${questionId}`
                : "/teacher/question-bank/new",
            )}`,
          );
          return;
        }

        const [
          teacherResult,
          curriculaResult,
          levelsResult,
          gradesResult,
          subjectsResult,
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
        ]);

        if (teacherResult.error) throw teacherResult.error;
        if (curriculaResult.error) throw curriculaResult.error;
        if (levelsResult.error) throw levelsResult.error;
        if (gradesResult.error) throw gradesResult.error;
        if (subjectsResult.error) throw subjectsResult.error;

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

        if (questionId) {
          const { data: question, error: questionError } = await supabase
            .from("question_bank")
            .select("*")
            .eq("id", questionId)
            .eq("teacher_id", teacherResult.data.id)
            .maybeSingle();

          if (questionError) throw questionError;

          if (!question) {
            throw new Error(
              "Question not found, or you do not have permission to edit it.",
            );
          }

          if (cancelled) return;

          const record = question as QuestionRecord;

          setTitle(record.question_text ?? "");
          setCurriculumId(record.curriculum_id ?? "");
          setLevelId(record.education_level_id ?? "");
          setGradeId(record.grade_id ?? "");
          setSubjectId(record.subject_id ?? "");
          setTopic(record.topic ?? "");
          setSubtopic(record.subtopic ?? "");
          setQuestionType(record.question_type ?? "short_answer");
          setOptions(parseOptions(record.options));
          setCorrectAnswer(
            record.correct_answer ?? record.answer ?? "",
          );
          setMarkingScheme(
            record.marking_scheme ?? record.explanation ?? "",
          );
          setMarks(String(record.marks ?? 1));
          setDifficulty(record.difficulty ?? "medium");
          setTagsInput((record.tags ?? []).join(", "));
          setIsPublic(Boolean(record.is_public));
          setStatus(record.status ?? "active");
        }
      } catch (caught) {
        if (!cancelled) {
          setError(
            caught instanceof Error
              ? caught.message
              : "Unable to load the question form.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadForm();

    return () => {
      cancelled = true;
    };
  }, [questionId, router]);

  function updateOption(optionId: string, text: string) {
    setOptions((current) =>
      current.map((option) =>
        option.id === optionId ? { ...option, text } : option,
      ),
    );
  }

  function addOption() {
    setOptions((current) => [...current, newOption()]);
  }

  function removeOption(optionId: string) {
    setOptions((current) =>
      current.filter((option) => option.id !== optionId),
    );
  }

  async function saveQuestion() {
    setError("");
    setNotice("");

    if (!teacherId) {
      setError("Your teacher profile could not be verified.");
      return;
    }

    if (!title.trim()) {
      setError("Enter the question text.");
      return;
    }

    const parsedMarks = Number(marks);

    if (
      !Number.isInteger(parsedMarks) ||
      parsedMarks < 0 ||
      parsedMarks > 10000
    ) {
      setError("Marks must be a whole number between 0 and 10,000.");
      return;
    }

    const cleanedOptions = options
      .map((option) => option.text.trim())
      .filter(Boolean);

    if (questionType === "multiple_choice" && cleanedOptions.length < 2) {
      setError("Multiple-choice questions need at least two options.");
      return;
    }

    if (
      questionType === "true_false" &&
      !["True", "False"].includes(correctAnswer)
    ) {
      setError("Select True or False as the correct answer.");
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
      if (!user) throw new Error("Your session has expired. Sign in again.");

      const payload = {
        teacher_id: teacherId,
        curriculum_id: curriculumId || null,
        education_level_id: levelId || null,
        grade_id: gradeId || null,
        subject_id: subjectId || null,
        topic: topic.trim() || null,
        subtopic: subtopic.trim() || null,
        question_type: questionType,
        question_text: title.trim(),
        options:
          questionType === "multiple_choice"
            ? options
                .filter((option) => option.text.trim())
                .map((option) => ({
                  id: option.id,
                  text: option.text.trim(),
                }))
            : questionType === "true_false"
              ? [
                  { id: "true", text: "True" },
                  { id: "false", text: "False" },
                ]
              : [],
        correct_answer: correctAnswer.trim() || null,
        answer: correctAnswer.trim() || null,
        marking_scheme: markingScheme.trim() || null,
        explanation: markingScheme.trim() || null,
        marks: parsedMarks,
        difficulty,
        tags: Array.from(
          new Set(
            tagsInput
              .split(",")
              .map((tag) => tag.trim())
              .filter(Boolean),
          ),
        ),
        is_public: isPublic,
        status,
      };

      if (questionId) {
        const { error: updateError } = await supabase
          .from("question_bank")
          .update(payload)
          .eq("id", questionId)
          .eq("teacher_id", teacherId);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from("question_bank")
          .insert(payload);

        if (insertError) throw insertError;
      }

      setNotice("Question saved successfully.");
      router.push("/teacher/question-bank");
      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to save this question.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteQuestion() {
    if (!questionId || !teacherId) return;

    const confirmed = window.confirm(
      "Permanently delete this question from your Question Bank? This cannot be undone.",
    );

    if (!confirmed) return;

    setDeleting(true);
    setError("");

    try {
      const supabase = createClient();

      const { error: deleteError } = await supabase
        .from("question_bank")
        .delete()
        .eq("id", questionId)
        .eq("teacher_id", teacherId);

      if (deleteError) throw deleteError;

      router.push("/teacher/question-bank");
      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to delete the question.",
      );
    } finally {
      setDeleting(false);
    }
  }

  async function toggleArchive() {
    if (!questionId || !teacherId) return;

    const nextStatus = status === "archived" ? "active" : "archived";

    setSaving(true);
    setError("");

    try {
      const supabase = createClient();

      const { error: archiveError } = await supabase
        .from("question_bank")
        .update({ status: nextStatus })
        .eq("id", questionId)
        .eq("teacher_id", teacherId);

      if (archiveError) throw archiveError;

      setStatus(nextStatus);
      setNotice(
        nextStatus === "archived"
          ? "Question archived."
          : "Question restored to the active bank.",
      );
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to update question status.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-72 items-center justify-center text-sm text-slate-500">
        <LoaderCircle className="mr-3 animate-spin" size={22} />
        Loading question form...
      </div>
    );
  }

  if (error && !teacherId) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800">
        <h2 className="font-bold">Unable to open question form</h2>
        <p className="mt-2 text-sm">{error}</p>
        <Link
          href="/teacher/question-bank"
          className="mt-4 inline-flex items-center gap-2 text-sm font-semibold underline"
        >
          <ArrowLeft size={16} />
          Return to Question Bank
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-7">
      <div>
        <Link
          href="/teacher/question-bank"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-blue-700"
        >
          <ArrowLeft size={16} />
          Back to Question Bank
        </Link>

        <div className="mt-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              {questionId ? "Edit question" : "Create a question"}
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Save a reusable question with its answer and marking guidance.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
            <BookOpen size={20} className="text-blue-700" />
            <div>
              <p className="text-xs text-blue-700">Question value</p>
              <p className="font-bold text-blue-950">
                {marks || 0} marks
              </p>
            </div>
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
        <h2 className="text-lg font-bold text-slate-950">
          Question content
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Enter the question and organize it within the curriculum.
        </p>

        <div className="mt-6 space-y-5">
          <div>
            <Label required>Question text</Label>
            <textarea
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className={`${inputClass} min-h-36 resize-y`}
              placeholder="Write the complete question..."
              maxLength={20000}
              required
            />
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <Label>Curriculum</Label>
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
              <Label>Education level</Label>
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
              <Label>Grade</Label>
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
              <Label>Subject</Label>
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
              <Label>Topic</Label>
              <input
                value={topic}
                onChange={(event) => setTopic(event.target.value)}
                className={inputClass}
                placeholder="e.g. Fractions"
                maxLength={250}
              />
            </div>

            <div>
              <Label>Subtopic</Label>
              <input
                value={subtopic}
                onChange={(event) => setSubtopic(event.target.value)}
                className={inputClass}
                placeholder="e.g. Adding fractions"
                maxLength={250}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <h2 className="text-lg font-bold text-slate-950">
          Question format and marking
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Configure the response type and expected answer.
        </p>

        <div className="mt-6 grid gap-5 md:grid-cols-3">
          <div>
            <Label required>Question type</Label>
            <select
              value={questionType}
              onChange={(event) =>
                setQuestionType(event.target.value as QuestionType)
              }
              className={selectClass}
            >
              <option value="multiple_choice">Multiple choice</option>
              <option value="true_false">True or false</option>
              <option value="short_answer">Short answer</option>
              <option value="structured">Structured question</option>
              <option value="essay">Essay</option>
              <option value="fill_blank">Fill in the blank</option>
            </select>
          </div>

          <div>
            <Label required>Marks</Label>
            <input
              type="number"
              min="0"
              max="10000"
              step="1"
              value={marks}
              onChange={(event) => setMarks(event.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <Label required>Difficulty</Label>
            <select
              value={difficulty}
              onChange={(event) =>
                setDifficulty(event.target.value as Difficulty)
              }
              className={selectClass}
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
        </div>

        {questionType === "multiple_choice" && (
          <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50/50 p-4 sm:p-5">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <h3 className="font-semibold text-slate-950">
                  Answer options
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  {totalOptions} non-empty options
                </p>
              </div>

              <button
                type="button"
                onClick={addOption}
                className="rounded-xl border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50"
              >
                Add option
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {options.map((option, index) => (
                <div
                  key={option.id}
                  className="flex items-center gap-3"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-sm font-bold text-blue-800 ring-1 ring-blue-100">
                    {String.fromCharCode(65 + index)}
                  </span>

                  <input
                    value={option.text}
                    onChange={(event) =>
                      updateOption(option.id, event.target.value)
                    }
                    className={inputClass}
                    placeholder={`Option ${index + 1}`}
                    maxLength={2000}
                  />

                  <button
                    type="button"
                    onClick={() => removeOption(option.id)}
                    disabled={options.length <= 2}
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

        {questionType === "true_false" && (
          <div className="mt-6">
            <Label required>Correct answer</Label>
            <select
              value={correctAnswer}
              onChange={(event) => setCorrectAnswer(event.target.value)}
              className={selectClass}
            >
              <option value="">Select the correct answer</option>
              <option value="True">True</option>
              <option value="False">False</option>
            </select>
          </div>
        )}

        {questionType !== "true_false" && (
          <div className="mt-6">
            <Label>
              {questionType === "multiple_choice"
                ? "Correct option / answer"
                : "Expected answer"}
            </Label>
            <textarea
              value={correctAnswer}
              onChange={(event) => setCorrectAnswer(event.target.value)}
              className={`${inputClass} min-h-24 resize-y`}
              placeholder="Enter the correct answer..."
              maxLength={10000}
            />
          </div>
        )}

        <div className="mt-6">
          <Label>Marking scheme and explanation</Label>
          <textarea
            value={markingScheme}
            onChange={(event) => setMarkingScheme(event.target.value)}
            className={`${inputClass} min-h-28 resize-y`}
            placeholder="Describe the expected answer and how marks should be awarded..."
            maxLength={10000}
          />
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <h2 className="text-lg font-bold text-slate-950">
          Organization and sharing
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Add searchable tags and choose whether to share this question.
        </p>

        <div className="mt-6 space-y-5">
          <div>
            <Label>Tags</Label>
            <input
              value={tagsInput}
              onChange={(event) => setTagsInput(event.target.value)}
              className={inputClass}
              placeholder="e.g. fractions, CBC, revision, algebra"
              maxLength={2000}
            />
            <p className="mt-2 text-xs text-slate-500">
              Separate tags with commas.
            </p>
          </div>

          <div>
            <Label>Question status</Label>
            <select
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as "active" | "archived")
              }
              className={selectClass}
            >
              <option value="active">Active</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 p-4 transition hover:bg-slate-50">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(event) => setIsPublic(event.target.checked)}
              className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-700 focus:ring-blue-500"
            />
            <span>
              <span className="block text-sm font-semibold text-slate-900">
                Share this question with other authenticated users
              </span>
              <span className="mt-1 block text-xs leading-5 text-slate-500">
                Shared questions can be visible to signed-in users permitted
                by the Question Bank access policies. Do not include private
                student information.
              </span>
            </span>
          </label>
        </div>
      </section>

      <section className="sticky bottom-3 z-20 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-xl backdrop-blur sm:p-5">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="font-bold text-slate-950">
              {questionId ? "Update saved question" : "Save new question"}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Your question will be available in your personal Question Bank.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            {questionId && (
              <>
                <button
                  type="button"
                  onClick={toggleArchive}
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

                <button
                  type="button"
                  onClick={deleteQuestion}
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

            <button
              type="button"
              onClick={saveQuestion}
              disabled={saving || deleting}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <LoaderCircle size={17} className="animate-spin" />
              ) : (
                <Save size={17} />
              )}
              {saving ? "Saving..." : "Save question"}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}