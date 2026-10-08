 import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
} from "lucide-react";

import { requireTeacher } from "@/lib/auth/teacher";
import LessonPlanEditor from "@/components/teacher/LessonPlanEditor";

type LessonPlanPageProps = {
  params: Promise<{
    id: string;
  }>;
};

function LoadingState() {
  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-5xl">
        <div className="h-5 w-40 animate-pulse rounded bg-slate-200" />

        <div className="mt-6 h-10 w-80 animate-pulse rounded-lg bg-slate-200" />

        <div className="mt-8 h-[700px] animate-pulse rounded-3xl bg-white" />
      </div>
    </main>
  );
}

async function LessonPlanPageContent({
  id,
}: {
  id: string;
}) {
  const { teacherProfile, supabase } = await requireTeacher();

  const { data: lessonPlan, error } = await supabase
    .from("lesson_plans")
    .select(
      `
        id,
        teacher_id,
        title,
        curriculum_id,
        education_level_id,
        grade_id,
        subject_id,
        term_id,
        week_number,
        lesson_number,
        topic,
        subtopic,
        objectives,
        competencies,
        values,
        resources,
        introduction,
        lesson_activities,
        assessment,
        conclusion,
        teacher_notes,
        duration_minutes,
        status,
        created_at,
        updated_at
      `,
    )
    .eq("id", id)
    .eq("teacher_id", teacherProfile.id)
    .maybeSingle();

  if (error) {
    console.error(
      "Lesson plan lookup failed:",
      error,
    );

    notFound();
  }

  if (!lessonPlan) {
    notFound();
  }

  const [
    curriculaResult,
    levelsResult,
    gradesResult,
    subjectsResult,
    termsResult,
  ] = await Promise.all([
    supabase
      .from("curricula")
      .select("id, name")
      .order("name"),

    supabase
      .from("education_levels")
      .select("id, name")
      .eq("is_active", true)
      .order("name"),

    supabase
      .from("grades")
      .select("id, name, education_level_id")
      .eq("is_active", true)
      .order("name"),

    supabase
      .from("subjects")
      .select("id, name")
      .eq("is_active", true)
      .order("name"),

    supabase
      .from("terms")
      .select("id, name")
      .eq("is_active", true)
      .order("name"),
  ]);

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <Link
            href="/teacher/lesson-plans"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-blue-600"
          >
            <ArrowLeft size={16} />
            Back to Lesson Plans
          </Link>

          <div className="mt-5 flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-100">
              <BookOpen size={23} />
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
                Lesson Plan
              </p>

              <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
                Edit lesson plan
              </h1>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Update, publish, duplicate or archive your lesson
                plan.
              </p>
            </div>
          </div>
        </div>

        <LessonPlanEditor
          lessonPlan={lessonPlan}
          curricula={curriculaResult.data ?? []}
          educationLevels={levelsResult.data ?? []}
          grades={gradesResult.data ?? []}
          subjects={subjectsResult.data ?? []}
          terms={termsResult.data ?? []}
        />
      </div>
    </main>
  );
}

export default function LessonPlanPage({
  params,
}: LessonPlanPageProps) {
  return (
    <Suspense fallback={<LoadingState />}>
      <LessonPlanPageContentWrapper params={params} />
    </Suspense>
  );
}

async function LessonPlanPageContentWrapper({
  params,
}: LessonPlanPageProps) {
  const { id } = await params;

  return <LessonPlanPageContent id={id} />;
}