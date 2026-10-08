  import { Suspense } from "react";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import TeacherOnboardingForm from "@/components/teacher/TeacherOnboardingForm";

function LoadingState() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-2xl">
        <div className="animate-pulse rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="h-10 w-64 rounded-lg bg-slate-200" />
          <div className="mt-3 h-5 w-96 max-w-full rounded bg-slate-200" />

          <div className="mt-8 space-y-5">
            <div className="h-12 rounded-xl bg-slate-200" />
            <div className="h-12 rounded-xl bg-slate-200" />
            <div className="h-12 rounded-xl bg-slate-200" />
          </div>
        </div>
      </div>
    </main>
  );
}

async function TeacherOnboardingContent() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?redirect=/teacher/onboarding");
  }

  const { data: existingTeacher } = await supabase
    .from("teacher_profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingTeacher) {
    redirect("/teacher");
  }

  const [subjectsResult, levelsResult] = await Promise.all([
    supabase
      .from("subjects")
      .select("id, name")
      .eq("is_active", true)
      .order("name"),

    supabase
      .from("education_levels")
      .select("id, name")
      .eq("is_active", true)
      .order("name"),
  ]);

  if (subjectsResult.error) {
    console.error(
      "Failed to load subjects:",
      subjectsResult.error,
    );
  }

  if (levelsResult.error) {
    console.error(
      "Failed to load education levels:",
      levelsResult.error,
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-4xl items-center justify-center">
        <div className="w-full">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-xl font-bold text-white shadow-lg shadow-blue-200">
              E
            </div>

            <p className="text-sm font-semibold text-blue-600">
              EduMarket Teacher Workspace
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Set up your teaching profile
            </h1>

            <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
              Tell us a little about your teaching background so we
              can personalize your EduMarket workspace and tools.
            </p>
          </div>

          <TeacherOnboardingForm
            userId={user.id}
            userEmail={user.email ?? ""}
            subjects={subjectsResult.data ?? []}
            educationLevels={levelsResult.data ?? []}
          />
        </div>
      </div>
    </main>
  );
}

export default function TeacherOnboardingPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <TeacherOnboardingContent />
    </Suspense>
  );
}