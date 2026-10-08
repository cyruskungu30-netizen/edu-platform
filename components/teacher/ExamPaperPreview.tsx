"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  FileText,
  LoaderCircle,
  Printer,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type ExamPaper = {
  id: string;
  title: string;
  instructions: string | null;
  academic_year: number | null;
  exam_type: string | null;
  duration_minutes: number | null;
  total_marks: number | null;
  status: string;
  curriculum_id: string | null;
  education_level_id: string | null;
  grade_id: string | null;
  subject_id: string | null;
  term_id: string | null;
};

type ExamQuestion = {
  id: string;
  question_number: number;
  question_type: string;
  section_title: string | null;
  question_text: string;
  options: unknown;
  correct_answer: string | null;
  answer: string | null;
  marking_scheme: string | null;
  explanation: string | null;
  marks: number;
  difficulty: string | null;
  topic: string | null;
  position: number;
};

type TaxonomyItem = {
  id: string;
  name: string;
};

type Props = {
  examId: string;
};

function getOptions(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((option) => {
      if (typeof option === "string") return option;

      if (
        option &&
        typeof option === "object" &&
        "text" in option &&
        typeof option.text === "string"
      ) {
        return option.text;
      }

      return "";
    })
    .filter(Boolean);
}

function formatExamType(value: string | null) {
  if (!value) return "General Assessment";

  const labels: Record<string, string> = {
    general: "General Assessment",
    opener: "Opener Examination",
    midterm: "Mid-Term Examination",
    endterm: "End-Term Examination",
    holiday: "Holiday Assessment",
    mock: "Mock Examination",
    revision: "Revision Examination",
    cat: "Continuous Assessment Test",
    topical: "Topical Assessment",
  };

  return (
    labels[value] ??
    value.replace(/[_-]/g, " ").replace(/\b\w/g, (letter) =>
      letter.toUpperCase(),
    )
  );
}

export default function ExamPaperPreview({ examId }: Props) {
  const [loading, setLoading] = useState(true);
  const [showAnswers, setShowAnswers] = useState(false);
  const [error, setError] = useState("");

  const [exam, setExam] = useState<ExamPaper | null>(null);
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);

  const [curriculumName, setCurriculumName] = useState("");
  const [levelName, setLevelName] = useState("");
  const [gradeName, setGradeName] = useState("");
  const [subjectName, setSubjectName] = useState("");
  const [termName, setTermName] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadPreview() {
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
          throw new Error(
            "Your session is unavailable. Sign in again to preview this examination.",
          );
        }

        const { data: teacher, error: teacherError } = await supabase
          .from("teacher_profiles")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (teacherError) throw teacherError;

        if (!teacher) {
          throw new Error("Your teacher profile could not be found.");
        }

        const { data: examData, error: examError } = await supabase
          .from("exam_papers")
          .select("*")
          .eq("id", examId)
          .eq("teacher_id", teacher.id)
          .maybeSingle();

        if (examError) throw examError;

        if (!examData) {
          throw new Error(
            "This examination was not found or you do not have permission to view it.",
          );
        }

        const loadedExam = examData as ExamPaper;

        const { data: questionData, error: questionError } = await supabase
          .from("exam_questions")
          .select("*")
          .eq("exam_paper_id", examId)
          .order("position", { ascending: true });

        if (questionError) throw questionError;

        const taxonomyRequests = [
          loadedExam.curriculum_id
            ? supabase
                .from("curricula")
                .select("id,name")
                .eq("id", loadedExam.curriculum_id)
                .maybeSingle()
            : Promise.resolve({ data: null, error: null }),
          loadedExam.education_level_id
            ? supabase
                .from("education_levels")
                .select("id,name")
                .eq("id", loadedExam.education_level_id)
                .maybeSingle()
            : Promise.resolve({ data: null, error: null }),
          loadedExam.grade_id
            ? supabase
                .from("grades")
                .select("id,name")
                .eq("id", loadedExam.grade_id)
                .maybeSingle()
            : Promise.resolve({ data: null, error: null }),
          loadedExam.subject_id
            ? supabase
                .from("subjects")
                .select("id,name")
                .eq("id", loadedExam.subject_id)
                .maybeSingle()
            : Promise.resolve({ data: null, error: null }),
          loadedExam.term_id
            ? supabase
                .from("terms")
                .select("id,name")
                .eq("id", loadedExam.term_id)
                .maybeSingle()
            : Promise.resolve({ data: null, error: null }),
        ];

        const [
          curriculumResult,
          levelResult,
          gradeResult,
          subjectResult,
          termResult,
        ] = await Promise.all(taxonomyRequests);

        if (curriculumResult.error) throw curriculumResult.error;
        if (levelResult.error) throw levelResult.error;
        if (gradeResult.error) throw gradeResult.error;
        if (subjectResult.error) throw subjectResult.error;
        if (termResult.error) throw termResult.error;

        if (cancelled) return;

        setExam(loadedExam);
        setQuestions((questionData ?? []) as ExamQuestion[]);
        setCurriculumName(curriculumResult.data?.name ?? "");
        setLevelName(levelResult.data?.name ?? "");
        setGradeName(gradeResult.data?.name ?? "");
        setSubjectName(subjectResult.data?.name ?? "");
        setTermName(termResult.data?.name ?? "");
      } catch (caught) {
        if (!cancelled) {
          setError(
            caught instanceof Error
              ? caught.message
              : "Unable to load the examination preview.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadPreview();

    return () => {
      cancelled = true;
    };
  }, [examId]);

  const calculatedMarks = questions.reduce(
    (sum, question) => sum + Math.max(0, Number(question.marks) || 0),
    0,
  );

  const sections = Array.from(
    new Set(
      questions.map((question) => question.section_title || "Section A"),
    ),
  );

  function printPaper(includeAnswers: boolean) {
    setShowAnswers(includeAnswers);

    window.setTimeout(() => {
      window.print();
    }, 100);
  }

  if (loading) {
    return (
      <div className="flex min-h-72 items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <LoaderCircle size={22} className="animate-spin" />
          Preparing examination preview...
        </div>
      </div>
    );
  }

  if (error || !exam) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
        <h2 className="font-bold text-red-800">
          Unable to load examination
        </h2>
        <p className="mt-2 text-sm text-red-700">
          {error || "The examination could not be found."}
        </p>

        <Link
          href="/teacher/exams"
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-red-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-800"
        >
          <ArrowLeft size={16} />
          Return to exam papers
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <style jsx global>{`
        @page {
          size: A4;
          margin: 18mm 16mm;
        }

        @media print {
          body {
            background: white !important;
            color: #111827 !important;
          }

          body * {
            visibility: hidden;
          }

          .exam-print-area,
          .exam-print-area * {
            visibility: visible;
          }

          .exam-print-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
            background: white !important;
          }

          .exam-print-area .print-hide {
            display: none !important;
          }

          .exam-print-area .question-block {
            break-inside: avoid;
          }

          .exam-print-area .section-heading {
            break-after: avoid;
          }

          .exam-print-area .exam-header {
            border-bottom: 2px solid #111827 !important;
          }
        }
      `}</style>

      <div className="print-hide flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <Link
            href={`/teacher/exams/${exam.id}`}
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-blue-700"
          >
            <ArrowLeft size={16} />
            Back to examination editor
          </Link>

          <h1 className="mt-3 text-2xl font-bold text-slate-950 sm:text-3xl">
            Examination preview
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Review your paper before printing or saving it as a PDF.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setShowAnswers((current) => !current)}
            className={`inline-flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition ${
              showAnswers
                ? "border-violet-200 bg-violet-50 text-violet-800"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            <Eye size={17} />
            {showAnswers ? "Hide marking scheme" : "Show marking scheme"}
          </button>

          <button
            type="button"
            onClick={() => printPaper(false)}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-800"
          >
            <Printer size={17} />
            Print question paper
          </button>

          <button
            type="button"
            onClick={() => printPaper(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm font-semibold text-violet-800 hover:bg-violet-100"
          >
            <FileText size={17} />
            Print with answers
          </button>
        </div>
      </div>

      <div className="print-hide grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium text-slate-500">Questions</p>
          <p className="mt-2 text-2xl font-bold text-slate-950">
            {questions.length}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium text-slate-500">
            Calculated marks
          </p>
          <p className="mt-2 text-2xl font-bold text-slate-950">
            {calculatedMarks}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium text-slate-500">
            Estimated duration
          </p>
          <p className="mt-2 text-2xl font-bold text-slate-950">
            {exam.duration_minutes ?? 60}{" "}
            <span className="text-sm font-medium text-slate-500">
              minutes
            </span>
          </p>
        </div>
      </div>

      <article className="exam-print-area mx-auto w-full max-w-4xl rounded-xl border border-slate-200 bg-white px-6 py-8 shadow-sm sm:px-12 sm:py-12">
        <header className="exam-header border-b-2 border-slate-900 pb-6 text-center">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-600">
            EduMarket Examination Paper
          </p>

          {curriculumName && (
            <p className="mt-2 text-sm font-medium text-slate-600">
              {curriculumName}
            </p>
          )}

          <h2 className="mt-5 text-2xl font-extrabold uppercase leading-tight tracking-wide text-slate-950 sm:text-3xl">
            {exam.title}
          </h2>

          <p className="mt-3 text-sm font-semibold uppercase tracking-wide text-slate-700">
            {formatExamType(exam.exam_type)}
          </p>

          <div className="mt-6 grid grid-cols-2 gap-3 text-left text-sm sm:grid-cols-4">
            <div className="border border-slate-300 p-3">
              <p className="text-xs font-medium text-slate-500">Grade</p>
              <p className="mt-1 font-bold text-slate-950">
                {gradeName || "____________"}
              </p>
            </div>

            <div className="border border-slate-300 p-3">
              <p className="text-xs font-medium text-slate-500">Subject</p>
              <p className="mt-1 font-bold text-slate-950">
                {subjectName || "____________"}
              </p>
            </div>

            <div className="border border-slate-300 p-3">
              <p className="text-xs font-medium text-slate-500">Term</p>
              <p className="mt-1 font-bold text-slate-950">
                {termName || "____________"}
              </p>
            </div>

            <div className="border border-slate-300 p-3">
              <p className="text-xs font-medium text-slate-500">
                Academic year
              </p>
              <p className="mt-1 font-bold text-slate-950">
                {exam.academic_year ?? "____________"}
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap justify-center gap-x-8 gap-y-2 text-sm font-bold text-slate-800">
            <span>
              TIME: {exam.duration_minutes ?? 60} MINUTES
            </span>
            <span>TOTAL MARKS: {calculatedMarks}</span>
          </div>
        </header>

        <section className="mt-7 border border-slate-300 p-4">
          <h3 className="text-sm font-extrabold uppercase tracking-wide text-slate-900">
            Candidate details
          </h3>

          <div className="mt-4 grid gap-x-8 gap-y-4 text-sm sm:grid-cols-2">
            <p className="border-b border-dotted border-slate-500 pb-2">
              Name: __________________________________
            </p>
            <p className="border-b border-dotted border-slate-500 pb-2">
              Admission number: _______________________
            </p>
          </div>
        </section>

        {exam.instructions && (
          <section className="mt-6">
            <h3 className="text-sm font-extrabold uppercase tracking-wide text-slate-900">
              Instructions
            </h3>

            <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-800">
              {exam.instructions}
            </p>
          </section>
        )}

        {questions.length === 0 ? (
          <div className="mt-10 rounded-xl border border-dashed border-slate-300 p-8 text-center">
            <p className="font-semibold text-slate-700">
              No questions have been added yet.
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Return to the editor to add questions to this examination.
            </p>
          </div>
        ) : (
          <div className="mt-8 space-y-8">
            {sections.map((section) => {
              const sectionQuestions = questions.filter(
                (question) =>
                  (question.section_title || "Section A") === section,
              );

              const sectionMarks = sectionQuestions.reduce(
                (sum, question) =>
                  sum + Math.max(0, Number(question.marks) || 0),
                0,
              );

              return (
                <section key={section}>
                  <div className="section-heading flex items-center justify-between gap-3 border-b border-slate-400 pb-2">
                    <h3 className="text-base font-extrabold uppercase tracking-wide text-slate-950">
                      {section}
                    </h3>
                    <span className="text-sm font-bold text-slate-800">
                      [{sectionMarks} marks]
                    </span>
                  </div>

                  <div className="mt-5 space-y-7">
                    {sectionQuestions.map((question) => {
                      const options = getOptions(question.options);

                      return (
                        <div
                          key={question.id}
                          className="question-block"
                        >
                          <div className="flex items-start gap-3">
                            <p className="shrink-0 font-bold text-slate-950">
                              {question.question_number}.
                            </p>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-4">
                                <p className="whitespace-pre-wrap text-sm leading-7 text-slate-900">
                                  {question.question_text}
                                </p>

                                <span className="shrink-0 whitespace-nowrap text-sm font-bold text-slate-950">
                                  ({question.marks} marks)
                                </span>
                              </div>

                              {options.length > 0 && (
                                <div className="mt-3 grid gap-x-8 gap-y-2 sm:grid-cols-2">
                                  {options.map((option, index) => (
                                    <p
                                      key={`${question.id}-${index}`}
                                      className="text-sm leading-6 text-slate-800"
                                    >
                                      <span className="mr-2 font-semibold">
                                        {String.fromCharCode(65 + index)}.
                                      </span>
                                      {option}
                                    </p>
                                  ))}
                                </div>
                              )}

                              {question.question_type ===
                                "true_false" && (
                                <p className="mt-3 text-sm text-slate-800">
                                  True / False
                                </p>
                              )}

                              {![
                                "multiple_choice",
                                "true_false",
                              ].includes(question.question_type) && (
                                <div className="mt-3 space-y-5">
                                  {Array.from({
                                    length: Math.min(
                                      Math.max(
                                        1,
                                        Math.ceil(
                                          Number(question.marks) || 1,
                                        ),
                                      ),
                                      question.question_type === "essay"
                                        ? 12
                                        : 6,
                                    ),
                                  }).map((_, index) => (
                                    <div
                                      key={index}
                                      className="h-5 border-b border-dotted border-slate-300"
                                    />
                                  ))}
                                </div>
                              )}

                              {showAnswers && (
                                <div className="mt-4 rounded-lg border border-violet-200 bg-violet-50 p-4">
                                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-violet-800">
                                    <CheckCircle2 size={15} />
                                    Marking scheme
                                  </div>

                                  {(question.correct_answer ||
                                    question.answer) && (
                                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-800">
                                      <strong>Answer:</strong>{" "}
                                      {question.correct_answer ||
                                        question.answer}
                                    </p>
                                  )}

                                  {(question.marking_scheme ||
                                    question.explanation) && (
                                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-800">
                                      <strong>Mark allocation:</strong>{" "}
                                      {question.marking_scheme ||
                                        question.explanation}
                                    </p>
                                  )}

                                  {!question.correct_answer &&
                                    !question.answer &&
                                    !question.marking_scheme &&
                                    !question.explanation && (
                                      <p className="mt-2 text-sm text-slate-600">
                                        No answer or marking scheme has
                                        been entered for this question.
                                      </p>
                                    )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        )}

        <footer className="mt-10 border-t-2 border-slate-900 pt-5 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-600">
            End of examination paper
          </p>

          <p className="mt-2 text-xs text-slate-500">
            Please ensure that all questions have been attempted.
          </p>
        </footer>
      </article>
    </div>
  );
}