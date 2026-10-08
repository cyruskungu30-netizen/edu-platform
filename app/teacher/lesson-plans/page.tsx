import { Suspense } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  Clock3,
  FilePlus2,
  Plus,
} from "lucide-react";

import { requireTeacher } from "@/lib/auth/teacher";

function LoadingState() {
  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="h-10 w-64 animate-pulse rounded-lg bg-slate-200" />

        <div className="mt-3 h-5 w-96 max-w-full animate-pulse rounded bg-slate-200" />

        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="h-56 animate-pulse rounded-2xl bg-white"
            />
          ))}
        </div>
      </div>
    </main>
  );
}

async function LessonPlansContent() {
  const { teacherProfile, supabase } = await requireTeacher();

  const { data: lessonPlans, error } = await supabase
    .from("lesson_plans")
    .select(
      `
        id,
        title,
        topic,
        subtopic,
        week_number,
        lesson_number,
        duration_minutes,
        status,
        created_at,
        updated_at,
        curricula (
          id,
          name
        ),
        education_levels (
          id,
          name
        ),
        grades (
          id,
          name
        ),
        subjects (
          id,
          name
        ),
        terms (
          id,
          name
        )
      `,
    )
    .eq("teacher_id", teacherProfile.id)
    .order("updated_at", { ascending: false });

  const publishedCount =
    lessonPlans?.filter((item) => item.status === "published")
      .length ?? 0;

  const draftCount =
    lessonPlans?.filter((item) => item.status === "draft").length ??
    0;

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <section className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">
              <BookOpen size={14} />
              Teaching Preparation
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Lesson Plans
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Create, organize and manage structured lesson plans
              for your classes.
            </p>
          </div>

          <Link
            href="/teacher/lesson-plans/new"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-100 transition hover:bg-blue-700"
          >
            <Plus size={18} />
            New Lesson Plan
          </Link>
        </section>

        <section className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Total Plans
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {lessonPlans?.length ?? 0}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Drafts
            </p>

            <p className="mt-2 text-3xl font-bold text-amber-600">
              {draftCount}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Published
            </p>

            <p className="mt-2 text-3xl font-bold text-emerald-600">
              {publishedCount}
            </p>
          </div>
        </section>

        {error && (
          <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm leading-6 text-red-700">
            We could not load your lesson plans. Please refresh the
            page and try again.
          </div>
        )}

        {!error && (!lessonPlans || lessonPlans.length === 0) && (
          <section className="mt-8 rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center sm:p-16">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <FilePlus2 size={28} />
            </div>

            <h2 className="mt-5 text-xl font-bold text-slate-900">
              No lesson plans yet
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              Create your first lesson plan and keep all your
              teaching preparation organized in one place.
            </p>

            <Link
              href="/teacher/lesson-plans/new"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700"
            >
              <Plus size={18} />
              Create your first lesson plan
            </Link>
          </section>
        )}

        {!error && lessonPlans && lessonPlans.length > 0 && (
          <section className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {lessonPlans.map((plan) => {
              const curriculum = Array.isArray(plan.curricula)
                ? plan.curricula[0]
                : plan.curricula;

              const level = Array.isArray(plan.education_levels)
                ? plan.education_levels[0]
                : plan.education_levels;

              const grade = Array.isArray(plan.grades)
                ? plan.grades[0]
                : plan.grades;

              const subject = Array.isArray(plan.subjects)
                ? plan.subjects[0]
                : plan.subjects;

              const term = Array.isArray(plan.terms)
                ? plan.terms[0]
                : plan.terms;

              return (
                <article
                  key={plan.id}
                  className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <BookOpen size={21} />
                    </div>

                    <span
                      className={[
                        "rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide",
                        plan.status === "published"
                          ? "bg-emerald-50 text-emerald-700"
                          : plan.status === "archived"
                            ? "bg-slate-100 text-slate-600"
                            : "bg-amber-50 text-amber-700",
                      ].join(" ")}
                    >
                      {plan.status}
                    </span>
                  </div>

                  <h2 className="mt-5 line-clamp-2 text-lg font-bold text-slate-900">
                    {plan.title}
                  </h2>

                  {plan.topic && (
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">
                      {plan.topic}
                      {plan.subtopic
                        ? ` • ${plan.subtopic}`
                        : ""}
                    </p>
                  )}

                  <div className="mt-5 space-y-2 text-xs text-slate-500">
                    {subject?.name && (
                      <div className="flex items-center gap-2">
                        <BookOpen size={14} />
                        <span>{subject.name}</span>
                      </div>
                    )}

                    {(grade?.name || level?.name) && (
                      <div className="flex items-center gap-2">
                        <CalendarDays size={14} />

                        <span>
                          {[level?.name, grade?.name]
                            .filter(Boolean)
                            .join(" • ")}
                        </span>
                      </div>
                    )}

                    {plan.duration_minutes && (
                      <div className="flex items-center gap-2">
                        <Clock3 size={14} />
                        <span>
                          {plan.duration_minutes} minutes
                        </span>
                      </div>
                    )}

                    {(curriculum?.name || term?.name) && (
                      <div className="text-xs text-slate-400">
                        {[curriculum?.name, term?.name]
                          .filter(Boolean)
                          .join(" • ")}
                      </div>
                    )}
                  </div>

                  <div className="mt-auto pt-6">
                    <Link
                      href={`/teacher/lesson-plans/${plan.id}`}
                      className="inline-flex items-center gap-2 text-sm font-bold text-blue-600 transition hover:text-blue-700"
                    >
                      Open lesson plan
                      <ArrowRight
                        size={16}
                        className="transition group-hover:translate-x-1"
                      />
                    </Link>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </div>
    </main>
  );
}

export default function LessonPlansPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <LessonPlansContent />
    </Suspense>
  );
}