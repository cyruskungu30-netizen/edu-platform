"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  CheckCircle2,
  ClipboardList,
  Copy,
  Eye,
  FilePlus2,
  LoaderCircle,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Option = {
  id: string;
  text: string;
};

type ExamQuestion = {
  id: string;
  question_number: number;
  question_type:
    | "multiple_choice"
    | "true_false"
    | "short_answer"
    | "structured"
    | "essay"
    | "fill_blank";
  section_title: string;
  question_text: string;
  options: Option[];
  correct_answer: string;
  marking_scheme: string;
  marks: number;
  difficulty: "easy" | "medium" | "hard";
  topic: string;
  position: number;
};

type TaxonomyItem = {
  id: string;
  name: string;
};

type ExistingExam = {
  id: string;
  title: string;
  instructions: string | null;
  curriculum_id: string | null;
  education_level_id: string | null;
  grade_id: string | null;
  subject_id: string | null;
  term_id: string | null;
  academic_year: number | null;
  exam_type: string | null;
  duration_minutes: number | null;
  status: string;
};

type Props = {
  examId?: string;
};

const QUESTION_TYPES = [
  { value: "multiple_choice", label: "Multiple choice" },
  { value: "true_false", label: "True or false" },
  { value: "short_answer", label: "Short answer" },
  { value: "structured", label: "Structured question" },
  { value: "essay", label: "Essay" },
  { value: "fill_blank", label: "Fill in the blank" },
] as const;

function createId() {
  return `new-${crypto.randomUUID()}`;
}

function createBlankQuestion(
  number: number,
  section = "Section A",
): ExamQuestion {
  return {
    id: createId(),
    question_number: number,
    question_type: "short_answer",
    section_title: section,
    question_text: "",
    options: [
      { id: createId(), text: "" },
      { id: createId(), text: "" },
      { id: createId(), text: "" },
      { id: createId(), text: "" },
    ],
    correct_answer: "",
    marking_scheme: "",
    marks: 1,
    difficulty: "medium",
    topic: "",
    position: number - 1,
  };
}

function getRelationId(value: unknown): string {
  if (typeof value === "string") return value;
  return "";
}

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

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10";

const selectClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10";

export default function ExamPaperForm({ examId }: Props) {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [teacherId, setTeacherId] = useState("");

  const [curricula, setCurricula] = useState<TaxonomyItem[]>([]);
  const [levels, setLevels] = useState<TaxonomyItem[]>([]);
  const [grades, setGrades] = useState<TaxonomyItem[]>([]);
  const [subjects, setSubjects] = useState<TaxonomyItem[]>([]);
  const [terms, setTerms] = useState<TaxonomyItem[]>([]);

  const [title, setTitle] = useState("");
  const [instructions, setInstructions] = useState(
    "Answer all questions. Write your answers clearly.",
  );
  const [curriculumId, setCurriculumId] = useState("");
  const [levelId, setLevelId] = useState("");
  const [gradeId, setGradeId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [termId, setTermId] = useState("");
  const [academicYear, setAcademicYear] = useState(
    String(new Date().getFullYear()),
  );
  const [examType, setExamType] = useState("general");
  const [duration, setDuration] = useState("60");
  const [status, setStatus] = useState<"draft" | "published">("draft");

  const [questions, setQuestions] = useState<ExamQuestion[]>([
    createBlankQuestion(1),
  ]);

  const totalMarks = useMemo(
    () =>
      questions.reduce(
        (total, question) =>
          total + Math.max(0, Number(question.marks) || 0),
        0,
      ),
    [questions],
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
              examId ? `/teacher/exams/${examId}` : "/teacher/exams/new",
            )}`,
          );
          return;
        }

        const [
          teacherResult,
          curriculumResult,
          levelResult,
          gradeResult,
          subjectResult,
          termResult,
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
            .eq("is_active", true)
            .order("name"),
        ]);

        if (teacherResult.error) throw teacherResult.error;
        if (curriculumResult.error) throw curriculumResult.error;
        if (levelResult.error) throw levelResult.error;
        if (gradeResult.error) throw gradeResult.error;
        if (subjectResult.error) throw subjectResult.error;
        if (termResult.error) throw termResult.error;

        if (!teacherResult.data) {
          throw new Error(
            "Your teacher profile was not found. Complete teacher onboarding first.",
          );
        }

        if (cancelled) return;

        setTeacherId(teacherResult.data.id);
        setCurricula(curriculumResult.data ?? []);
        setLevels(levelResult.data ?? []);
        setGrades(gradeResult.data ?? []);
        setSubjects(subjectResult.data ?? []);
        setTerms(termResult.data ?? []);

        if (examId) {
          const { data: exam, error: examError } = await supabase
            .from("exam_papers")
            .select("*")
            .eq("id", examId)
            .eq("teacher_id", teacherResult.data.id)
            .maybeSingle();

          if (examError) throw examError;

          if (!exam) {
            throw new Error(
              "This examination does not exist or you do not have permission to edit it.",
            );
          }

          const existingExam = exam as ExistingExam;

          const { data: questionRows, error: questionError } =
            await supabase
              .from("exam_questions")
              .select("*")
              .eq("exam_paper_id", examId)
              .order("position", { ascending: true });

          if (questionError) throw questionError;

          if (cancelled) return;

          setTitle(existingExam.title ?? "");
          setInstructions(existingExam.instructions ?? "");
          setCurriculumId(existingExam.curriculum_id ?? "");
          setLevelId(existingExam.education_level_id ?? "");
          setGradeId(existingExam.grade_id ?? "");
          setSubjectId(existingExam.subject_id ?? "");
          setTermId(existingExam.term_id ?? "");
          setAcademicYear(
            existingExam.academic_year
              ? String(existingExam.academic_year)
              : "",
          );
          setExamType(existingExam.exam_type ?? "general");
          setDuration(String(existingExam.duration_minutes ?? 60));
          setStatus(
            existingExam.status === "published" ? "published" : "draft",
          );

          if (questionRows && questionRows.length > 0) {
            setQuestions(
              questionRows.map((row, index) => {
                const options = Array.isArray(row.options)
                  ? row.options.map((option: unknown, optionIndex: number) => {
                      if (
                        option &&
                        typeof option === "object" &&
                        "text" in option
                      ) {
                        return {
                          id:
                            "id" in option && typeof option.id === "string"
                              ? option.id
                              : `option-${index}-${optionIndex}`,
                          text:
                            typeof option.text === "string"
                              ? option.text
                              : "",
                        };
                      }

                      return {
                        id: `option-${index}-${optionIndex}`,
                        text: typeof option === "string" ? option : "",
                      };
                    })
                  : [];

                return {
                  id: row.id,
                  question_number: Number(row.question_number ?? index + 1),
                  question_type: row.question_type ?? "short_answer",
                  section_title: row.section_title ?? "Section A",
                  question_text: row.question_text ?? "",
                  options:
                    options.length > 0
                      ? options
                      : [
                          { id: createId(), text: "" },
                          { id: createId(), text: "" },
                          { id: createId(), text: "" },
                          { id: createId(), text: "" },
                        ],
                  correct_answer:
                    row.correct_answer ?? row.answer ?? "",
                  marking_scheme: row.marking_scheme ?? row.explanation ?? "",
                  marks: Number(row.marks ?? 1),
                  difficulty: row.difficulty ?? "medium",
                  topic: row.topic ?? "",
                  position: Number(row.position ?? index),
                } as ExamQuestion;
              }),
            );
          } else {
            setQuestions([createBlankQuestion(1)]);
          }
        }
      } catch (caught) {
        if (!cancelled) {
          setError(
            caught instanceof Error
              ? caught.message
              : "Unable to load the examination form.",
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
  }, [examId, router]);

  function updateQuestion(
    questionId: string,
    changes: Partial<ExamQuestion>,
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
      createBlankQuestion(current.length + 1, "Section A"),
    ]);
  }

  function duplicateQuestion(questionId: string) {
    setQuestions((current) => {
      const index = current.findIndex(
        (question) => question.id === questionId,
      );

      if (index < 0) return current;

      const original = current[index];

      const duplicate: ExamQuestion = {
        ...original,
        id: createId(),
        question_number: index + 2,
        position: index + 1,
        options: original.options.map((option) => ({
          id: createId(),
          text: option.text,
        })),
      };

      const next = [...current];
      next.splice(index + 1, 0, duplicate);

      return next.map((question, questionIndex) => ({
        ...question,
        question_number: questionIndex + 1,
        position: questionIndex,
      }));
    });
  }

  function removeQuestion(questionId: string) {
    setQuestions((current) => {
      const next = current.filter(
        (question) => question.id !== questionId,
      );

      return next.map((question, index) => ({
        ...question,
        question_number: index + 1,
        position: index,
      }));
    });
  }

  function moveQuestion(questionId: string, direction: -1 | 1) {
    setQuestions((current) => {
      const index = current.findIndex(
        (question) => question.id === questionId,
      );
      const destination = index + direction;

      if (index < 0 || destination < 0 || destination >= current.length) {
        return current;
      }

      const next = [...current];
      [next[index], next[destination]] = [
        next[destination],
        next[index],
      ];

      return next.map((question, questionIndex) => ({
        ...question,
        question_number: questionIndex + 1,
        position: questionIndex,
      }));
    });
  }

  function updateOption(
    questionId: string,
    optionId: string,
    text: string,
  ) {
    setQuestions((current) =>
      current.map((question) => {
        if (question.id !== questionId) return question;

        return {
          ...question,
          options: question.options.map((option) =>
            option.id === optionId ? { ...option, text } : option,
          ),
        };
      }),
    );
  }

  async function saveExam(
    nextStatus: "draft" | "published",
  ) {
    setError("");
    setSuccess("");

    if (!teacherId) {
      setError("Your teacher profile could not be verified.");
      return;
    }

    if (!title.trim()) {
      setError("Enter an examination title.");
      return;
    }

    if (!subjectId || !gradeId) {
      setError("Select a subject and grade before saving.");
      return;
    }

    if (!Number.isInteger(Number(duration)) || Number(duration) <= 0) {
      setError("Enter a valid examination duration.");
      return;
    }

    if (
      academicYear.trim() &&
      !/^\d{4}$/.test(academicYear.trim())
    ) {
      setError("Enter a valid four-digit academic year.");
      return;
    }

    if (questions.length === 0) {
      setError("Add at least one question.");
      return;
    }

    const incompleteQuestion = questions.find(
      (question) => !question.question_text.trim(),
    );

    if (incompleteQuestion) {
      setError(
        `Enter the question text for Question ${incompleteQuestion.question_number}.`,
      );
      return;
    }

    if (
      nextStatus === "published" &&
      questions.some((question) => question.marks <= 0)
    ) {
      setError("Every published question must have at least one mark.");
      return;
    }

    if (
      questions.some(
        (question) =>
          question.question_type === "multiple_choice" &&
          question.options.filter((option) => option.text.trim()).length < 2,
      )
    ) {
      setError(
        "Every multiple-choice question needs at least two non-empty options.",
      );
      return;
    }

    setSaving(true);

    try {
      const supabase = createClient();

      const payload = {
        teacher_id: teacherId,
        title: title.trim(),
        instructions: instructions.trim() || null,
        curriculum_id: curriculumId || null,
        education_level_id: levelId || null,
        grade_id: gradeId || null,
        subject_id: subjectId || null,
        term_id: termId || null,
        academic_year: academicYear.trim()
          ? Number(academicYear)
          : null,
        exam_type: examType,
        duration_minutes: Number(duration),
        total_marks: totalMarks,
        status: nextStatus,
      };

      let savedExamId = examId;

      if (savedExamId) {
        const { error: updateError } = await supabase
          .from("exam_papers")
          .update(payload)
          .eq("id", savedExamId)
          .eq("teacher_id", teacherId);

        if (updateError) throw updateError;
      } else {
        const { data: createdExam, error: createError } = await supabase
          .from("exam_papers")
          .insert(payload)
          .select("id")
          .single();

        if (createError) throw createError;

        savedExamId = createdExam.id;
      }

      const questionPayload = questions.map((question, index) => ({
        exam_paper_id: savedExamId,
        question_number: index + 1,
        question_type: question.question_type,
        section_title: question.section_title.trim() || "Section A",
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
        marks: Math.max(0, Number(question.marks) || 0),
        difficulty: question.difficulty,
        topic: question.topic.trim() || null,
        position: index,
      }));

      /*
       * Replace the question set in one controlled sequence.
       * If insertion fails, the saved exam remains available for correction.
       */
      const { error: deleteQuestionsError } = await supabase
        .from("exam_questions")
        .delete()
        .eq("exam_paper_id", savedExamId);

      if (deleteQuestionsError) throw deleteQuestionsError;

      const { error: insertQuestionsError } = await supabase
        .from("exam_questions")
        .insert(
          questionPayload.map((question) => ({
            ...question,
            exam_paper_id: savedExamId,
          })),
        );

      if (insertQuestionsError) throw insertQuestionsError;

      setSuccess(
        nextStatus === "published"
          ? "Examination published successfully."
          : "Examination draft saved successfully.",
      );

      router.push(`/teacher/exams/${savedExamId}`);
      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to save this examination. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-72 items-center justify-center">
        <div className="flex items-center gap-3 text-sm font-medium text-slate-500">
          <LoaderCircle className="animate-spin" size={22} />
          Loading examination builder...
        </div>
      </div>
    );
  }

  if (error && !teacherId) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800">
        <h2 className="font-semibold">Unable to open the exam builder</h2>
        <p className="mt-2 text-sm">{error}</p>
        <button
          type="button"
          onClick={() => router.refresh()}
          className="mt-4 rounded-xl bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-7">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <Link
            href="/teacher/exams"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-blue-700"
          >
            <ArrowLeft size={16} />
            Back to exam papers
          </Link>

          <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
            {examId ? "Edit examination" : "Create examination"}
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Configure your examination, write the questions, and set the
            marks before saving.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3">
          <ClipboardList className="text-blue-700" size={21} />
          <div>
            <p className="text-xs font-medium text-blue-700">
              Total examination marks
            </p>
            <p className="text-2xl font-bold text-blue-950">
              {totalMarks}
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {success && (
        <div
          role="status"
          className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
        >
          {success}
        </div>
      )}

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-xl bg-blue-50 p-3 text-blue-700">
            <ClipboardList size={22} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-950">
              Examination details
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Set the academic context and examination instructions.
            </p>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div className="md:col-span-2">
            <FieldLabel required>Examination title</FieldLabel>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className={inputClass}
              placeholder="e.g. Grade 7 Mathematics End-Term Assessment"
              maxLength={180}
              required
            />
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
            <FieldLabel required>Grade</FieldLabel>
            <select
              value={gradeId}
              onChange={(event) => setGradeId(event.target.value)}
              className={selectClass}
              required
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
            <FieldLabel required>Subject</FieldLabel>
            <select
              value={subjectId}
              onChange={(event) => setSubjectId(event.target.value)}
              className={selectClass}
              required
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
            <FieldLabel>Academic year</FieldLabel>
            <input
              type="number"
              min="2000"
              max="2200"
              value={academicYear}
              onChange={(event) => setAcademicYear(event.target.value)}
              className={inputClass}
              placeholder="2026"
            />
          </div>

          <div>
            <FieldLabel>Examination type</FieldLabel>
            <select
              value={examType}
              onChange={(event) => setExamType(event.target.value)}
              className={selectClass}
            >
              <option value="general">General assessment</option>
              <option value="opener">Opener examination</option>
              <option value="midterm">Mid-term examination</option>
              <option value="endterm">End-term examination</option>
              <option value="holiday">Holiday assessment</option>
              <option value="mock">Mock examination</option>
              <option value="revision">Revision examination</option>
              <option value="cat">Continuous assessment test</option>
              <option value="topical">Topical assessment</option>
            </select>
          </div>

          <div>
            <FieldLabel>Duration in minutes</FieldLabel>
            <input
              type="number"
              min="1"
              max="1440"
              value={duration}
              onChange={(event) => setDuration(event.target.value)}
              className={inputClass}
              required
            />
          </div>

          <div className="md:col-span-2">
            <FieldLabel>Candidate instructions</FieldLabel>
            <textarea
              value={instructions}
              onChange={(event) => setInstructions(event.target.value)}
              className={`${inputClass} min-h-28 resize-y`}
              placeholder="Write instructions for learners..."
              maxLength={5000}
            />
          </div>
        </div>
      </section>

      <section className="space-y-5">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-xl font-bold text-slate-950">
              Examination questions
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Write questions, choose their formats, and allocate marks.
            </p>
          </div>

          <button
            type="button"
            onClick={addQuestion}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-800"
          >
            <Plus size={18} />
            Add question
          </button>
        </div>

        {questions.map((question, index) => (
          <article
            key={question.id}
            className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/80 px-5 py-4 sm:px-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-700 text-sm font-bold text-white">
                  {index + 1}
                </div>
                <div>
                  <h3 className="font-bold text-slate-950">
                    Question {index + 1}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {question.marks}{" "}
                    {question.marks === 1 ? "mark" : "marks"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => moveQuestion(question.id, -1)}
                  disabled={index === 0}
                  title="Move question up"
                  aria-label={`Move question ${index + 1} up`}
                  className="rounded-lg p-2 text-slate-500 transition hover:bg-white hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <ArrowUp size={17} />
                </button>

                <button
                  type="button"
                  onClick={() => moveQuestion(question.id, 1)}
                  disabled={index === questions.length - 1}
                  title="Move question down"
                  aria-label={`Move question ${index + 1} down`}
                  className="rounded-lg p-2 text-slate-500 transition hover:bg-white hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <ArrowDown size={17} />
                </button>

                <button
                  type="button"
                  onClick={() => duplicateQuestion(question.id)}
                  title="Duplicate question"
                  aria-label={`Duplicate question ${index + 1}`}
                  className="rounded-lg p-2 text-slate-500 transition hover:bg-white hover:text-blue-700"
                >
                  <Copy size={17} />
                </button>

                <button
                  type="button"
                  onClick={() => removeQuestion(question.id)}
                  disabled={questions.length === 1}
                  title="Delete question"
                  aria-label={`Delete question ${index + 1}`}
                  className="rounded-lg p-2 text-slate-500 transition hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <Trash2 size={17} />
                </button>
              </div>
            </div>

            <div className="space-y-5 p-5 sm:p-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <FieldLabel>Question type</FieldLabel>
                  <select
                    value={question.question_type}
                    onChange={(event) =>
                      updateQuestion(question.id, {
                        question_type: event.target
                          .value as ExamQuestion["question_type"],
                      })
                    }
                    className={selectClass}
                  >
                    {QUESTION_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <FieldLabel>Section</FieldLabel>
                  <input
                    value={question.section_title}
                    onChange={(event) =>
                      updateQuestion(question.id, {
                        section_title: event.target.value,
                      })
                    }
                    className={inputClass}
                    placeholder="Section A"
                    maxLength={100}
                  />
                </div>

                <div>
                  <FieldLabel>Marks</FieldLabel>
                  <input
                    type="number"
                    min="0"
                    max="10000"
                    value={question.marks}
                    onChange={(event) =>
                      updateQuestion(question.id, {
                        marks: Math.max(
                          0,
                          Number(event.target.value) || 0,
                        ),
                      })
                    }
                    className={inputClass}
                  />
                </div>

                <div>
                  <FieldLabel>Difficulty</FieldLabel>
                  <select
                    value={question.difficulty}
                    onChange={(event) =>
                      updateQuestion(question.id, {
                        difficulty: event.target
                          .value as ExamQuestion["difficulty"],
                      })
                    }
                    className={selectClass}
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>

              <div>
                <FieldLabel required>Question text</FieldLabel>
                <textarea
                  value={question.question_text}
                  onChange={(event) =>
                    updateQuestion(question.id, {
                      question_text: event.target.value,
                    })
                  }
                  className={`${inputClass} min-h-32 resize-y`}
                  placeholder="Write the complete question here..."
                  maxLength={20000}
                  required
                />
              </div>

              <div>
                <FieldLabel>Topic or strand</FieldLabel>
                <input
                  value={question.topic}
                  onChange={(event) =>
                    updateQuestion(question.id, {
                      topic: event.target.value,
                    })
                  }
                  className={inputClass}
                  placeholder="e.g. Fractions, Measurement, Number Operations"
                  maxLength={250}
                />
              </div>

              {question.question_type === "multiple_choice" && (
                <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-4">
                  <FieldLabel>Answer options</FieldLabel>

                  <div className="space-y-3">
                    {question.options.map((option, optionIndex) => (
                      <div
                        key={option.id}
                        className="flex items-center gap-3"
                      >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-blue-100 bg-white text-xs font-bold text-blue-800">
                          {String.fromCharCode(65 + optionIndex)}
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
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      updateQuestion(question.id, {
                        options: [
                          ...question.options,
                          { id: createId(), text: "" },
                        ],
                      })
                    }
                    className="mt-3 inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
                  >
                    <Plus size={16} />
                    Add option
                  </button>
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
                    <option value="">Select correct answer</option>
                    <option value="True">True</option>
                    <option value="False">False</option>
                  </select>
                </div>
              )}

              {question.question_type !== "true_false" && (
                <div>
                  <FieldLabel>
                    {question.question_type === "multiple_choice"
                      ? "Correct option"
                      : "Expected answer"}
                  </FieldLabel>

                  <textarea
                    value={question.correct_answer}
                    onChange={(event) =>
                      updateQuestion(question.id, {
                        correct_answer: event.target.value,
                      })
                    }
                    className={`${inputClass} min-h-20 resize-y`}
                    placeholder={
                      question.question_type === "multiple_choice"
                        ? "Enter the correct option text or answer..."
                        : "Enter the expected answer..."
                    }
                    maxLength={10000}
                  />
                </div>
              )}

              <div>
                <FieldLabel>Marking scheme and explanation</FieldLabel>
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

        <button
          type="button"
          onClick={addQuestion}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 bg-white px-4 py-5 text-sm font-semibold text-slate-600 transition hover:border-blue-400 hover:bg-blue-50/50 hover:text-blue-800"
        >
          <Plus size={18} />
          Add another question
        </button>
      </section>

      <section className="sticky bottom-3 z-20 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-xl backdrop-blur sm:p-5">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="font-bold text-slate-950">
              {questions.length}{" "}
              {questions.length === 1 ? "question" : "questions"} ·{" "}
              {totalMarks} marks
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Save your progress as a draft or publish when ready.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => saveExam("draft")}
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
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
              onClick={() => saveExam("published")}
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <LoaderCircle size={17} className="animate-spin" />
              ) : (
                <CheckCircle2 size={17} />
              )}
              Publish examination
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}