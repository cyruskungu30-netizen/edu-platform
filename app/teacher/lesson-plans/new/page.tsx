 import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen } from "lucide-react";

import { requireTeacher } from "@/lib/auth/teacher";
import { createClient } from "@/lib/supabase/server";
import LessonPlanForm from "@/components/teacher/LessonPlanForm";

function LoadingState() {
  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-5xl">
        <div className="h-8 w-48 animate-pulse rounded bg-slate-200" />

        <div className="mt-3 h-5 w-96 max-w-full animate-pulse rounded bg-slate-200" />

        <div className="mt-8 h-[700px] animate-pulse rounded-3xl bg-white" />
      </div>
    </main>
  );
}

async function NewLessonPlanContent() {
  const { user } = await requireTeacher();
  const supabase = await createClient();

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
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                Create Lesson Plan
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Build a structured lesson plan aligned with your
                curriculum, class and subject.
              </p>
            </div>
          </div>
        </div>

        <LessonPlanForm
          userId={user.id}
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

export default function NewLessonPlanPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <NewLessonPlanContent />
    </Suspense>
  );
}