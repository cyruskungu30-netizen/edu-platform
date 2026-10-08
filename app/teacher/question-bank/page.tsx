import Link from "next/link";
import { Suspense } from "react";
import {
  ArrowRight,
  BookOpen,
  CircleHelp,
  ClipboardList,
  Plus,
  Search,
} from "lucide-react";
import { requireTeacher } from "@/lib/auth/teacher";

export const metadata = {
  title: "Question Bank | EduMarket",
  description:
    "Manage reusable examination questions in your EduMarket teacher workspace.",
};

type BankQuestion = {
  id: string;
  question_text: string;
  question_type: string;
  difficulty: string;
  marks: number;
  topic: string | null;
  subtopic: string | null;
  tags: string[] | null;
  status: string;
  is_public: boolean;
  created_at: string;
  subjects: { name: string } | { name: string }[] | null;
  grades: { name: string } | { name: string }[] | null;
};

function relationName(
  relation:
    | { name: string }
    | { name: string }[]
    | null
    | undefined,
) {
  if (!relation) return "Not specified";
  return Array.isArray(relation)
    ? relation[0]?.name ?? "Not specified"
    : relation.name;
}

function difficultyStyle(difficulty: string) {
  if (difficulty === "easy") {
    return "bg-emerald-50 text-emerald-700";
  }

  if (difficulty === "hard") {
    return "bg-red-50 text-red-700";
  }

  return "bg-amber-50 text-amber-700";
}

function typeLabel(type: string) {
  const labels: Record<string, string> = {
    multiple_choice: "Multiple choice",
    true_false: "True / False",
    short_answer: "Short answer",
    structured: "Structured",
    essay: "Essay",
    fill_blank: "Fill in the blank",
  };

  return labels[type] ?? type.replace(/_/g, " ");
}

function LoadingState() {
  return (
    <div className="space-y-5">
      <div className="h-36 animate-pulse rounded-3xl bg-slate-100" />
      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="h-24 animate-pulse rounded-2xl bg-slate-100"
          />
        ))}
      </div>
      <div className="h-72 animate-pulse rounded-3xl bg-slate-100" />
    </div>
  );
}

async function QuestionBankContent({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    subject?: string;
    grade?: string;
    difficulty?: string;
    status?: string;
  }>;
}) {
  const { supabase, user } = await requireTeacher();
  const filters = await searchParams;

  const searchTerm = filters.q?.trim() ?? "";
  const selectedSubject = filters.subject ?? "";
  const selectedGrade = filters.grade ?? "";
  const selectedDifficulty = filters.difficulty ?? "";
  const selectedStatus = filters.status ?? "active";

  const { data: teacher, error: teacherError } = await supabase
    .from("teacher_profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (teacherError || !teacher) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800">
        Your teacher profile could not be loaded. Please complete onboarding
        or refresh the page.
      </div>
    );
  }

  const [
    questionResult,
    subjectsResult,
    gradesResult,
    allQuestionsResult,
  ] = await Promise.all([
    (() => {
      let query = supabase
        .from("question_bank")
        .select(
          `
            id,
            question_text,
            question_type,
            difficulty,
            marks,
            topic,
            subtopic,
            tags,
            status,
            is_public,
            created_at,
            subjects(name),
            grades(name)
          `,
        )
        .eq("teacher_id", teacher.id)
        .order("created_at", { ascending: false });

      if (selectedStatus === "active" || selectedStatus === "archived") {
        query = query.eq("status", selectedStatus);
      }

      if (selectedSubject) {
        query = query.eq("subject_id", selectedSubject);
      }

      if (selectedGrade) {
        query = query.eq("grade_id", selectedGrade);
      }

      if (
        selectedDifficulty &&
        ["easy", "medium", "hard"].includes(selectedDifficulty)
      ) {
        query = query.eq("difficulty", selectedDifficulty);
      }

      if (searchTerm) {
        query = query.or(
          `question_text.ilike.%${searchTerm.replace(/[%_,()]/g, " ")}%,topic.ilike.%${searchTerm.replace(/[%_,()]/g, " ")}%`,
        );
      }

      return query;
    })(),
    supabase
      .from("subjects")
      .select("id,name")
      .eq("is_active", true)
      .order("name"),
    supabase
      .from("grades")
      .select("id,name")
      .order("name"),
    supabase
      .from("question_bank")
      .select("id,status,is_public")
      .eq("teacher_id", teacher.id),
  ]);

  const questions = (questionResult.data ?? []) as unknown as BankQuestion[];
  const allQuestions = allQuestionsResult.data ?? [];

  const totalCount = allQuestions.length;
  const activeCount = allQuestions.filter(
    (question) => question.status === "active",
  ).length;
  const archivedCount = allQuestions.filter(
    (question) => question.status === "archived",
  ).length;
  const publicCount = allQuestions.filter(
    (question) => question.is_public,
  ).length;

  const subjects = subjectsResult.data ?? [];
  const grades = gradesResult.data ?? [];

  const hasFilters =
    Boolean(searchTerm) ||
    Boolean(selectedSubject) ||
    Boolean(selectedGrade) ||
    Boolean(selectedDifficulty) ||
    selectedStatus !== "active";

  function filterUrl(overrides: Record<string, string>) {
    const params = new URLSearchParams();

    const current: Record<string, string> = {
      q: searchTerm,
      subject: selectedSubject,
      grade: selectedGrade,
      difficulty: selectedDifficulty,
      status: selectedStatus,
      ...overrides,
    };

    for (const [key, value] of Object.entries(current)) {
      if (value) params.set(key, value);
    }

    const query = params.toString();
    return query
      ? `/teacher/question-bank?${query}`
      : "/teacher/question-bank";
  }

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-800 px-6 py-8 text-white shadow-xl sm:px-9 sm:py-10">
        <div className="absolute -right-10 -top-16 h-56 w-56 rounded-full bg-blue-400/10 blur-3xl" />

        <div className="relative flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-blue-100">
              <BookOpen size={14} />
              Teacher workspace
            </span>

            <h1 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl">
              Question Bank
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-7 text-blue-100 sm:text-base">
              Build your personal library of reusable questions, organize
              them by subject and difficulty, and prepare assessments faster.
            </p>
          </div>

          <Link
            href="/teacher/question-bank/new"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3.5 text-sm font-semibold text-blue-950 transition hover:bg-blue-50"
          >
            <Plus size={18} />
            Add question
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {questionResult.error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          Unable to load your questions. Check the Question Bank table and
          its Row Level Security policies, then refresh the page.
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "All questions",
            value: totalCount,
            color: "bg-blue-50 text-blue-700",
          },
          {
            label: "Active questions",
            value: activeCount,
            color: "bg-emerald-50 text-emerald-700",
          },
          {
            label: "Archived questions",
            value: archivedCount,
            color: "bg-amber-50 text-amber-700",
          },
          {
            label: "Shared questions",
            value: publicCount,
            color: "bg-violet-50 text-violet-700",
          },
        ].map((stat) => (
          <article
            key={stat.label}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <p className="text-sm font-medium text-slate-500">
              {stat.label}
            </p>
            <p className="mt-3 text-3xl font-bold text-slate-950">
              {stat.value}
            </p>
            <span
              className={`mt-3 inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${stat.color}`}
            >
              Question library
            </span>
          </article>
        ))}
      </section>

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-5 sm:px-7">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
            <div>
              <h2 className="text-xl font-bold text-slate-950">
                Your saved questions
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Search, filter, and manage your reusable questions.
              </p>
            </div>

            <form
              action="/teacher/question-bank"
              method="GET"
              className="flex w-full flex-col gap-2 sm:flex-row lg:max-w-xl"
            >
              <div className="relative flex-1">
                <Search
                  size={17}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="search"
                  name="q"
                  defaultValue={searchTerm}
                  placeholder="Search question text or topic..."
                  className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                />
              </div>

              <input
                type="hidden"
                name="subject"
                value={selectedSubject}
              />
              <input
                type="hidden"
                name="grade"
                value={selectedGrade}
              />
              <input
                type="hidden"
                name="difficulty"
                value={selectedDifficulty}
              />
              <input
                type="hidden"
                name="status"
                value={selectedStatus}
              />

              <button
                type="submit"
                className="rounded-xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-800"
              >
                Search
              </button>
            </form>
          </div>

          <form
            action="/teacher/question-bank"
            method="GET"
            className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
          >
            <input type="hidden" name="q" value={searchTerm} />

            <select
              name="subject"
              defaultValue={selectedSubject}
              className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-blue-500"
            >
              <option value="">All subjects</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </select>

            <select
              name="grade"
              defaultValue={selectedGrade}
              className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-blue-500"
            >
              <option value="">All grades</option>
              {grades.map((grade) => (
                <option key={grade.id} value={grade.id}>
                  {grade.name}
                </option>
              ))}
            </select>

            <select
              name="difficulty"
              defaultValue={selectedDifficulty}
              className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-blue-500"
            >
              <option value="">All difficulty levels</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>

            <select
              name="status"
              defaultValue={selectedStatus}
              className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-blue-500"
            >
              <option value="active">Active questions</option>
              <option value="archived">Archived questions</option>
              <option value="all">All statuses</option>
            </select>

            <div className="flex flex-wrap gap-2 sm:col-span-2 lg:col-span-4">
              <button
                type="submit"
                className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Apply filters
              </button>

              {hasFilters && (
                <Link
                  href="/teacher/question-bank"
                  className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Reset filters
                </Link>
              )}
            </div>
          </form>
        </div>

        {questions.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
              <CircleHelp size={30} />
            </div>

            <h3 className="mt-5 text-lg font-bold text-slate-950">
              {hasFilters
                ? "No matching questions"
                : "Your question bank is ready"}
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              {hasFilters
                ? "Try changing your search or filters to find questions."
                : "Create your first reusable question and start building your personal teaching library."}
            </p>

            <Link
              href="/teacher/question-bank/new"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-800"
            >
              <Plus size={17} />
              Create question
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {questions.map((question) => (
              <article
                key={question.id}
                className="px-5 py-5 transition hover:bg-slate-50/70 sm:px-7"
              >
                <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                        {typeLabel(question.question_type)}
                      </span>

                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${difficultyStyle(question.difficulty)}`}
                      >
                        {question.difficulty}
                      </span>

                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                        {question.marks} marks
                      </span>

                      {question.is_public && (
                        <span className="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700">
                          Shared
                        </span>
                      )}
                    </div>

                    <h3 className="mt-3 whitespace-pre-wrap text-base font-semibold leading-7 text-slate-950">
                      {question.question_text}
                    </h3>

                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-500">
                      <span className="inline-flex items-center gap-1.5">
                        <BookOpen size={15} />
                        {relationName(question.subjects)}
                      </span>

                      <span>
                        Grade: {relationName(question.grades)}
                      </span>

                      {question.topic && (
                        <span>Topic: {question.topic}</span>
                      )}

                      {question.subtopic && (
                        <span>Subtopic: {question.subtopic}</span>
                      )}
                    </div>

                    {question.tags && question.tags.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {question.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-500"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2">
                    <Link
                      href={`/teacher/question-bank/${question.id}`}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-800"
                    >
                      <ClipboardList size={16} />
                      View / edit
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default function TeacherQuestionBankPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    subject?: string;
    grade?: string;
    difficulty?: string;
    status?: string;
  }>;
}) {
  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-9">
      <Suspense fallback={<LoadingState />}>
        <QuestionBankContent searchParams={searchParams} />
      </Suspense>
    </main>
  );
}