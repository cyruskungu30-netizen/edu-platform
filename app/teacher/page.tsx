  import { Suspense } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  ClipboardCheck,
  FileQuestion,
  FileText,
  GraduationCap,
  Plus,
  Sparkles,
} from "lucide-react";

import { requireTeacher } from "@/lib/auth/teacher";
import TeacherLayoutClient from "@/components/teacher/TeacherLayoutClient";
import TeacherStatCard from "@/components/teacher/TeacherStatCard";

function TeacherLoading() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex min-h-screen">
        <div className="hidden w-[280px] bg-white lg:block" />

        <div className="flex-1">
          <div className="h-20 border-b border-slate-200 bg-white" />

          <main className="p-6 lg:p-8">
            <div className="mx-auto max-w-7xl">
              <div className="h-10 w-72 animate-pulse rounded-lg bg-slate-200" />

              <div className="mt-3 h-5 w-96 animate-pulse rounded bg-slate-200" />

              <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-36 animate-pulse rounded-2xl bg-white"
                  />
                ))}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

async function TeacherDashboardContent() {
  const { user, teacherProfile, supabase } = await requireTeacher();

  const [
    lessonPlansResult,
    schemesResult,
    questionsResult,
    examsResult,
    assessmentsResult,
  ] = await Promise.all([
    supabase
      .from("lesson_plans")
      .select("id", { count: "exact", head: true })
      .eq("teacher_id", teacherProfile.id),

    supabase
      .from("schemes_of_work")
      .select("id", { count: "exact", head: true })
      .eq("teacher_id", teacherProfile.id),

    supabase
      .from("question_bank")
      .select("id", { count: "exact", head: true })
      .eq("teacher_id", teacherProfile.id),

    supabase
      .from("exam_papers")
      .select("id", { count: "exact", head: true })
      .eq("teacher_id", teacherProfile.id),

    supabase
      .from("assessments")
      .select("id", { count: "exact", head: true })
      .eq("teacher_id", teacherProfile.id),
  ]);

  const lessonPlans = lessonPlansResult.count ?? 0;
  const schemes = schemesResult.count ?? 0;
  const questions = questionsResult.count ?? 0;
  const exams = examsResult.count ?? 0;
  const assessments = assessmentsResult.count ?? 0;

  const displayName = teacherProfile.display_name || "Teacher";

  const totalResources =
    lessonPlans +
    schemes +
    questions +
    exams +
    assessments;

  const quickActions = [
    {
      title: "Create Lesson Plan",
      description:
        "Build a structured lesson plan for your next class.",
      href: "/teacher/lesson-plans/new",
      icon: BookOpen,
    },
    {
      title: "Create Scheme of Work",
      description:
        "Plan your term with structured weekly coverage.",
      href: "/teacher/schemes/new",
      icon: FileText,
    },
    {
      title: "Build an Exam",
      description:
        "Create an exam using your question bank.",
      href: "/teacher/exams/new",
      icon: GraduationCap,
    },
    {
      title: "Generate with AI",
      description:
        "Use EduMarket AI to accelerate lesson preparation.",
      href: "/teacher/ai",
      icon: Sparkles,
    },
  ];

  return (
    <TeacherLayoutClient
      teacherName={displayName}
      userEmail={user.email}
    >
      <main className="p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl">
          <section className="rounded-3xl bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 p-6 text-white shadow-lg sm:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold backdrop-blur">
                  <Sparkles size={14} />
                  Teacher Workspace
                </div>

                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                  Welcome back, {displayName.split(/\s+/)[0]} 👋
                </h1>

                <p className="mt-3 max-w-xl text-sm leading-6 text-blue-100 sm:text-base">
                  Plan lessons, build assessments, manage your
                  question bank and prepare teaching materials from
                  one powerful workspace.
                </p>
              </div>

              <Link
                href="/teacher/lesson-plans/new"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-blue-700 shadow-sm transition hover:bg-blue-50"
              >
                <Plus size={18} />
                Create New Resource
              </Link>
            </div>
          </section>

          <section className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <TeacherStatCard
              label="Lesson Plans"
              value={lessonPlans}
              description="Your saved lesson plans"
              icon={BookOpen}
            />

            <TeacherStatCard
              label="Schemes"
              value={schemes}
              description="Schemes of work"
              icon={FileText}
            />

            <TeacherStatCard
              label="Questions"
              value={questions}
              description="Questions in your bank"
              icon={FileQuestion}
            />

            <TeacherStatCard
              label="Assessments"
              value={assessments}
              description="Assessments created"
              icon={ClipboardCheck}
            />
          </section>

          <section className="mt-10">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Quick actions
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Start preparing your next teaching resource.
                </p>
              </div>

              <span className="hidden text-sm font-medium text-slate-400 sm:block">
                {totalResources} total resources
              </span>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {quickActions.map((action) => {
                const Icon = action.icon;

                return (
                  <Link
                    key={action.href}
                    href={action.href}
                    className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-5">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                        <Icon size={22} />
                      </div>

                      <ArrowRight
                        size={19}
                        className="text-slate-300 transition group-hover:translate-x-1 group-hover:text-blue-600"
                      />
                    </div>

                    <h3 className="mt-5 font-bold text-slate-900">
                      {action.title}
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      {action.description}
                    </p>
                  </Link>
                );
              })}
            </div>
          </section>

          <section className="mt-10 grid gap-5 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <GraduationCap size={20} />
                </div>

                <div>
                  <h2 className="font-bold text-slate-900">
                    Exam Builder
                  </h2>

                  <p className="text-sm text-slate-500">
                    {exams} exam paper{exams === 1 ? "" : "s"} created
                  </p>
                </div>
              </div>

              <Link
                href="/teacher/exams"
                className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700"
              >
                Open exam builder
                <ArrowRight size={16} />
              </Link>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <Sparkles size={20} />
                </div>

                <div>
                  <h2 className="font-bold text-slate-900">
                    EduMarket AI
                  </h2>

                  <p className="text-sm text-slate-500">
                    Your teaching preparation assistant
                  </p>
                </div>
              </div>

              <Link
                href="/teacher/ai"
                className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700"
              >
                Open AI assistant
                <ArrowRight size={16} />
              </Link>
            </div>
          </section>

          <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-bold text-slate-900">
                  Teacher account
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {user.email}
                </p>
              </div>

              <Link
                href="/teacher/settings"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Manage settings
                <ArrowRight size={16} />
              </Link>
            </div>
          </section>
        </div>
      </main>
    </TeacherLayoutClient>
  );
}

export default function TeacherPage() {
  return (
    <Suspense fallback={<TeacherLoading />}>
      <TeacherDashboardContent />
    </Suspense>
  );
}