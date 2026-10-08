import Link from "next/link";
import { Suspense } from "react";
import {
  ArrowRight,
  BookOpen,
  ClipboardList,
  Clock3,
  FilePlus2,
  FileText,
  GraduationCap,
  Plus,
  Search,
} from "lucide-react";

import { requireTeacher } from "@/lib/auth/teacher";

export const metadata = {
  title: "Exam Paper Builder | EduMarket",
  description:
    "Create, manage, and organize examination papers in your EduMarket teacher workspace.",
};

type ExamPaper = {
  id: string;
  title: string;
  instructions: string | null;
  exam_type: string | null;
  academic_year: number | null;
  total_marks: number | null;
  duration_minutes: number | null;
  status: string;
  created_at: string;
  subjects:
    | { name: string }
    | { name: string }[]
    | null;
  grades:
    | { name: string }
    | { name: string }[]
    | null;
  terms:
    | { name: string }
    | { name: string }[]
    | null;
  exam_questions: { id: string }[];
};

function relationName(
  relation:
    | { name: string }
    | { name: string }[]
    | null
    | undefined,
) {
  if (!relation) return "Not specified";

  if (Array.isArray(relation)) {
    return relation[0]?.name ?? "Not specified";
  }

  return relation.name;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function statusStyles(status: string) {
  switch (status) {
    case "published":
      return "bg-emerald-50 text-emerald-700 ring-emerald-600/20";
    case "archived":
      return "bg-slate-100 text-slate-600 ring-slate-500/20";
    default:
      return "bg-amber-50 text-amber-700 ring-amber-600/20";
  }
}

function ExamDashboardLoading() {
  return (
    <div className="space-y-6">
      <div className="h-40 animate-pulse rounded-3xl bg-slate-100" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-28 animate-pulse rounded-2xl bg-slate-100"
          />
        ))}
      </div>
      <div className="h-72 animate-pulse rounded-3xl bg-slate-100" />
    </div>
  );
}

async function ExamDashboardContent() {
  const { supabase, user } = await requireTeacher();

  const { data: teacherProfile, error: teacherError } = await supabase
    .from("teacher_profiles")
    .select("id, display_name, school_name")
    .eq("user_id", user.id)
    .maybeSingle();

  if (teacherError || !teacherProfile) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800">
        <h2 className="font-semibold">Teacher profile unavailable</h2>
        <p className="mt-2 text-sm">
          We could not load your teacher profile. Please refresh the page or
          complete your teacher onboarding.
        </p>
      </div>
    );
  }

  const { data: examData, error: examError } = await supabase
    .from("exam_papers")
    .select(
      `
        id,
        title,
        instructions,
        exam_type,
        academic_year,
        total_marks,
        duration_minutes,
        status,
        created_at,
        subjects(name),
        grades(name),
        terms(name),
        exam_questions(id)
      `,
    )
    .eq("teacher_id", teacherProfile.id)
    .order("created_at", { ascending: false });

  const exams = (examData ?? []) as unknown as ExamPaper[];

  const totalExams = exams.length;
  const publishedExams = exams.filter(
    (exam) => exam.status === "published",
  ).length;
  const draftExams = exams.filter(
    (exam) => exam.status === "draft",
  ).length;
  const totalQuestions = exams.reduce(
    (sum, exam) => sum + (exam.exam_questions?.length ?? 0),
    0,
  );

  const statistics = [
    {
      label: "Total exam papers",
      value: totalExams,
      icon: FileText,
      color: "bg-blue-50 text-blue-700",
    },
    {
      label: "Draft papers",
      value: draftExams,
      icon: ClipboardList,
      color: "bg-amber-50 text-amber-700",
    },
    {
      label: "Published papers",
      value: publishedExams,
      icon: BookOpen,
      color: "bg-emerald-50 text-emerald-700",
    },
    {
      label: "Questions created",
      value: totalQuestions,
      icon: GraduationCap,
      color: "bg-violet-50 text-violet-700",
    },
  ];

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-blue-950 to-blue-800 px-6 py-8 text-white shadow-xl sm:px-9 sm:py-10">
        <div className="absolute -right-12 -top-16 h-64 w-64 rounded-full bg-blue-400/10 blur-3xl" />
        <div className="absolute -bottom-20 right-1/3 h-48 w-48 rounded-full bg-indigo-400/10 blur-3xl" />

        <div className="relative z-10 flex flex-col justify-between gap-7 lg:flex-row lg:items-center">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-blue-100">
              <ClipboardList size={14} />
              Teacher workspace
            </div>

            <h1 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl">
              Exam Paper Builder
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-7 text-blue-100 sm:text-base">
              Create structured examinations, organize questions, assign
              marks, and prepare professional assessment papers for your
              learners.
            </p>

            <p className="mt-4 text-sm text-blue-200">
              Welcome back,{" "}
              <span className="font-semibold text-white">
                {teacherProfile.display_name || "Teacher"}
              </span>
              {teacherProfile.school_name
                ? ` · ${teacherProfile.school_name}`
                : ""}
            </p>
          </div>

          <Link
            href="/teacher/exams/new"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3.5 text-sm font-semibold text-blue-950 shadow-lg transition hover:bg-blue-50"
          >
            <Plus size={18} />
            Create exam paper
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {examError && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <p className="font-semibold">Unable to load all exam papers.</p>
          <p className="mt-1">
            Check that your exam tables and their access policies have been
            configured correctly, then refresh this page.
          </p>
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statistics.map((statistic) => {
          const Icon = statistic.icon;

          return (
            <article
              key={statistic.label}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    {statistic.label}
                  </p>
                  <p className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
                    {statistic.value}
                  </p>
                </div>

                <div
                  className={`rounded-xl p-3 ${statistic.color}`}
                >
                  <Icon size={21} />
                </div>
              </div>
            </article>
          );
        })}
      </section>

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:px-7">
          <div>
            <h2 className="text-xl font-bold text-slate-950">
              Your examination papers
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Manage your drafts, published examinations, and archived papers.
            </p>
          </div>

          <Link
            href="/teacher/exams/new"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-800"
          >
            <FilePlus2 size={17} />
            New examination
          </Link>
        </div>

        {exams.length === 0 ? (
          <div className="px-6 py-16 text-center sm:px-10">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
              <ClipboardList size={30} />
            </div>

            <h3 className="mt-5 text-lg font-bold text-slate-950">
              Your exam workspace is ready
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              You have not created an examination paper yet. Start with a
              subject, select a grade, and build your first assessment.
            </p>

            <Link
              href="/teacher/exams/new"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-800"
            >
              Create your first exam
              <ArrowRight size={17} />
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {exams.map((exam) => (
              <article
                key={exam.id}
                className="px-5 py-5 transition hover:bg-slate-50/80 sm:px-7"
              >
                <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-bold text-slate-950 sm:text-lg">
                        {exam.title}
                      </h3>

                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ring-1 ring-inset ${statusStyles(exam.status)}`}
                      >
                        {exam.status}
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-500">
                      <span className="inline-flex items-center gap-1.5">
                        <BookOpen size={15} />
                        {relationName(exam.subjects)}
                      </span>

                      <span className="inline-flex items-center gap-1.5">
                        <GraduationCap size={15} />
                        {relationName(exam.grades)}
                      </span>

                      <span className="inline-flex items-center gap-1.5">
                        <Clock3 size={15} />
                        {exam.duration_minutes ?? 60} minutes
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-400">
                      <span>
                        {exam.exam_questions?.length ?? 0} questions
                      </span>
                      <span>{exam.total_marks ?? 0} marks</span>
                      <span>
                        {exam.academic_year ?? "Year not set"}
                      </span>
                      <span>Created {formatDate(exam.created_at)}</span>
                    </div>
                  </div>

                  <Link
                    href={`/teacher/exams/${exam.id}`}
                    className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-800 lg:self-center"
                  >
                    Open exam
                    <ArrowRight size={16} />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Link
          href="/teacher/lesson-plans"
          className="group flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-blue-200 hover:shadow-sm"
        >
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-blue-50 p-3 text-blue-700">
              <BookOpen size={22} />
            </div>
            <div>
              <h3 className="font-semibold text-slate-950">
                Lesson Plan Builder
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Organize lessons and learning activities.
              </p>
            </div>
          </div>
          <ArrowRight
            size={18}
            className="shrink-0 text-slate-400 transition group-hover:translate-x-1 group-hover:text-blue-700"
          />
        </Link>

        <Link
          href="/teacher/schemes"
          className="group flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-blue-200 hover:shadow-sm"
        >
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-violet-50 p-3 text-violet-700">
              <ClipboardList size={22} />
            </div>
            <div>
              <h3 className="font-semibold text-slate-950">
                Scheme of Work Builder
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Plan teaching content across the term.
              </p>
            </div>
          </div>
          <ArrowRight
            size={18}
            className="shrink-0 text-slate-400 transition group-hover:translate-x-1 group-hover:text-blue-700"
          />
        </Link>
      </section>
    </div>
  );
}

export default function TeacherExamsPage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-9">
      <Suspense fallback={<ExamDashboardLoading />}>
        <ExamDashboardContent />
      </Suspense>
    </main>
  );
}