  import Link from "next/link";
import { Suspense } from "react";
import {
  ArrowLeft,
  BookOpen,
  Loader2,
} from "lucide-react";

import { requireTeacher } from "@/lib/auth/teacher";
import SchemeOfWorkEditor from "@/components/teacher/SchemeOfWorkEditor";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

function LoadingState() {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />

            <p className="mt-3 text-sm font-medium text-slate-500">
              Loading scheme...
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

async function SchemeEditorContent({
  params,
}: PageProps) {
  const { id } = await params;

  const { supabase, user } = await requireTeacher();

  const { data: teacherProfile, error: teacherError } =
    await supabase
      .from("teacher_profiles")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

  if (teacherError || !teacherProfile) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
            <h1 className="text-lg font-black text-red-800">
              Teacher profile unavailable
            </h1>

            <p className="mt-2 text-sm text-red-700">
              {teacherError?.message ??
                "Complete teacher onboarding before accessing schemes."}
            </p>

            <Link
              href="/teacher/onboarding"
              className="mt-5 inline-flex rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
            >
              Go to Teacher Onboarding
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const { data: scheme, error: schemeError } =
    await supabase
      .from("schemes_of_work")
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
          academic_year,
          status,
          created_at,
          updated_at
        `,
      )
      .eq("id", id)
      .eq("teacher_id", teacherProfile.id)
      .maybeSingle();

  if (schemeError) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
            <h1 className="text-lg font-black text-red-800">
              Unable to load scheme
            </h1>

            <p className="mt-2 text-sm text-red-700">
              {schemeError.message}
            </p>

            <Link
              href="/teacher/schemes"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Schemes
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (!scheme) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <BookOpen className="h-8 w-8" />
            </div>

            <h1 className="mt-5 text-2xl font-black text-slate-950">
              Scheme not found
            </h1>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              The scheme may have been deleted, or you may not have
              permission to access it.
            </p>

            <Link
              href="/teacher/schemes"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Schemes
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="mb-6">
          <Link
            href="/teacher/schemes"
            className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-blue-600"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Schemes
          </Link>
        </div>

        <div className="mb-8">
          <div className="flex items-start gap-4">
            <div className="hidden rounded-2xl bg-blue-100 p-3 text-blue-600 sm:block">
              <BookOpen className="h-7 w-7" />
            </div>

            <div>
              <div className="mb-2 text-sm font-semibold text-blue-600">
                Scheme of Work Editor
              </div>

              <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                {scheme.title}
              </h1>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
                Edit your scheme, manage lessons and keep your
                classroom planning organised in one place.
              </p>
            </div>
          </div>
        </div>

        <SchemeOfWorkEditor
          schemeId={scheme.id}
          initialScheme={{
            id: scheme.id,
            title: scheme.title,
            curriculum_id: scheme.curriculum_id,
            education_level_id: scheme.education_level_id,
            grade_id: scheme.grade_id,
            subject_id: scheme.subject_id,
            term_id: scheme.term_id,
            academic_year: scheme.academic_year,
            status: scheme.status,
          }}
        />
      </div>
    </main>
  );
}

export default function SchemeEditorPage({
  params,
}: PageProps) {
  return (
    <Suspense fallback={<LoadingState />}>
      <SchemeEditorContent params={params} />
    </Suspense>
  );
}