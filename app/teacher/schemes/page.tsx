 import Link from "next/link";
import { Suspense } from "react";
import {
  BookOpen,
  CalendarDays,
  ChevronRight,
  ClipboardList,
  FileText,
  GraduationCap,
  Plus,
  Search,
  Sparkles,
} from "lucide-react";

import { requireTeacher } from "@/lib/auth/teacher";

type Scheme = {
  id: string;
  title: string;
  academic_year: number | null;
  status: "draft" | "published" | "archived";
  created_at: string;
  updated_at: string;
  subject:
    | {
        id: string;
        name: string;
      }
    | null;
  grade:
    | {
        id: string;
        name: string;
      }
    | null;
  term:
    | {
        id: string;
        name: string;
      }
    | null;
  curriculum:
    | {
        id: string;
        name: string;
      }
    | null;
  education_level:
    | {
        id: string;
        name: string;
      }
    | null;
  scheme_entries: {
    id: string;
  }[];
};

function LoadingState() {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="h-10 w-72 animate-pulse rounded-xl bg-slate-200" />

        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-32 animate-pulse rounded-2xl bg-white shadow-sm"
            />
          ))}
        </div>
      </div>
    </main>
  );
}

function statusClasses(status: Scheme["status"]) {
  switch (status) {
    case "published":
      return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200";

    case "archived":
      return "bg-slate-100 text-slate-600 ring-1 ring-slate-200";

    default:
      return "bg-amber-50 text-amber-700 ring-1 ring-amber-200";
  }
}

function formatStatus(status: Scheme["status"]) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

async function SchemesContent() {
  const { supabase, user } = await requireTeacher();

  const { data: teacherProfile, error: teacherError } =
    await supabase
      .from("teacher_profiles")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

  if (teacherError) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
            <h1 className="text-lg font-bold text-red-800">
              Unable to load teacher profile
            </h1>

            <p className="mt-2 text-sm text-red-700">
              {teacherError.message}
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (!teacherProfile) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
            <h1 className="text-lg font-bold text-amber-800">
              Teacher profile not found
            </h1>

            <p className="mt-2 text-sm text-amber-700">
              Please complete teacher onboarding before creating
              schemes of work.
            </p>

            <Link
              href="/teacher/onboarding"
              className="mt-5 inline-flex rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
            >
              Complete Teacher Onboarding
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const { data: schemesData, error } = await supabase
    .from("schemes_of_work")
    .select(
      `
        id,
        title,
        academic_year,
        status,
        created_at,
        updated_at,
        subject:subjects (
          id,
          name
        ),
        grade:grades (
          id,
          name
        ),
        term:terms (
          id,
          name
        ),
        curriculum:curricula (
          id,
          name
        ),
        education_level:education_levels (
          id,
          name
        ),
        scheme_entries (
          id
        )
      `,
    )
    .eq("teacher_id", teacherProfile.id)
    .order("updated_at", { ascending: false });

  const schemes = (schemesData ?? []) as unknown as Scheme[];

  const totalSchemes = schemes.length;

  const publishedSchemes = schemes.filter(
    (scheme) => scheme.status === "published",
  ).length;

  const draftSchemes = schemes.filter(
    (scheme) => scheme.status === "draft",
  ).length;

  const totalLessons = schemes.reduce(
    (total, scheme) =>
      total + (scheme.scheme_entries?.length ?? 0),
    0,
  );

  if (error) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
            <h1 className="text-lg font-bold text-red-800">
              Unable to load schemes
            </h1>

            <p className="mt-2 text-sm text-red-700">
              {error.message}
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {/* Header */}
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-blue-600">
              <Link
                href="/teacher"
                className="transition hover:text-blue-800"
              >
                Teacher Workspace
              </Link>

              <ChevronRight className="h-4 w-4" />

              <span className="text-slate-500">
                Schemes of Work
              </span>
            </div>

            <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              Schemes of Work
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
              Create, organise and manage complete CBC-ready
              schemes of work for your classes.
            </p>
          </div>

          <Link
            href="/teacher/schemes/new"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
          >
            <Plus className="h-5 w-5" />
            Create Scheme
          </Link>
        </div>

        {/* Stats */}
        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                <FileText className="h-5 w-5" />
              </div>

              <span className="text-xs font-semibold text-slate-400">
                TOTAL
              </span>
            </div>

            <p className="mt-5 text-3xl font-black text-slate-950">
              {totalSchemes}
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Schemes of work
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
                <Sparkles className="h-5 w-5" />
              </div>

              <span className="text-xs font-semibold text-slate-400">
                PUBLISHED
              </span>
            </div>

            <p className="mt-5 text-3xl font-black text-slate-950">
              {publishedSchemes}
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Ready for classroom use
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="rounded-xl bg-amber-50 p-3 text-amber-600">
                <ClipboardList className="h-5 w-5" />
              </div>

              <span className="text-xs font-semibold text-slate-400">
                DRAFTS
              </span>
            </div>

            <p className="mt-5 text-3xl font-black text-slate-950">
              {draftSchemes}
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Still being prepared
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="rounded-xl bg-violet-50 p-3 text-violet-600">
                <BookOpen className="h-5 w-5" />
              </div>

              <span className="text-xs font-semibold text-slate-400">
                LESSONS
              </span>
            </div>

            <p className="mt-5 text-3xl font-black text-slate-950">
              {totalLessons}
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Planned lessons
            </p>
          </div>
        </section>

        {/* Productivity banner */}
        <section className="mt-8 overflow-hidden rounded-2xl bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-600 shadow-xl">
          <div className="flex flex-col gap-6 p-6 sm:p-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-white ring-1 ring-white/20">
                <Sparkles className="h-3.5 w-3.5" />
                Teacher Productivity
              </div>

              <h2 className="text-xl font-black text-white sm:text-2xl">
                Build your scheme faster.
              </h2>

              <p className="mt-2 text-sm leading-6 text-blue-100">
                Organise weekly lessons, strands, sub-strands,
                learning outcomes, experiences, resources and
                assessment methods in one workspace.
              </p>
            </div>

            <Link
              href="/teacher/schemes/new"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-blue-700 shadow-lg transition hover:bg-blue-50"
            >
              <Plus className="h-5 w-5" />
              Start New Scheme
            </Link>
          </div>
        </section>

        {/* Scheme list */}
        <section className="mt-8">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-black text-slate-950">
                Your Schemes
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Manage all your schemes of work from here.
              </p>
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500 shadow-sm">
              <Search className="h-4 w-4" />
              <span>{totalSchemes} schemes</span>
            </div>
          </div>

          {schemes.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-sm">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <BookOpen className="h-8 w-8" />
              </div>

              <h3 className="mt-5 text-xl font-black text-slate-950">
                No schemes yet
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                Create your first scheme of work and start
                organising your lessons, outcomes, activities
                and assessments.
              </p>

              <Link
                href="/teacher/schemes/new"
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
              >
                <Plus className="h-5 w-5" />
                Create Your First Scheme
              </Link>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2">
              {schemes.map((scheme) => {
                const entryCount =
                  scheme.scheme_entries?.length ?? 0;

                return (
                  <article
                    key={scheme.id}
                    className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                          <BookOpen className="h-5 w-5" />
                        </div>

                        <div className="min-w-0">
                          <h3 className="truncate text-lg font-black text-slate-950">
                            {scheme.title}
                          </h3>

                          <p className="mt-1 text-sm text-slate-500">
                            {scheme.subject?.name ??
                              "Subject not set"}

                            {scheme.grade?.name
                              ? ` • ${scheme.grade.name}`
                              : ""}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${statusClasses(
                          scheme.status,
                        )}`}
                      >
                        {formatStatus(scheme.status)}
                      </span>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-3">
                      <div className="rounded-xl bg-slate-50 p-3">
                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                          <GraduationCap className="h-4 w-4" />
                          Grade
                        </div>

                        <p className="mt-1 truncate text-sm font-bold text-slate-800">
                          {scheme.grade?.name ?? "Not set"}
                        </p>
                      </div>

                      <div className="rounded-xl bg-slate-50 p-3">
                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                          <CalendarDays className="h-4 w-4" />
                          Term
                        </div>

                        <p className="mt-1 truncate text-sm font-bold text-slate-800">
                          {scheme.term?.name ?? "Not set"}
                        </p>
                      </div>

                      <div className="rounded-xl bg-slate-50 p-3">
                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                          <BookOpen className="h-4 w-4" />
                          Curriculum
                        </div>

                        <p className="mt-1 truncate text-sm font-bold text-slate-800">
                          {scheme.curriculum?.name ??
                            "Not set"}
                        </p>
                      </div>

                      <div className="rounded-xl bg-slate-50 p-3">
                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                          <ClipboardList className="h-4 w-4" />
                          Lessons
                        </div>

                        <p className="mt-1 text-sm font-bold text-slate-800">
                          {entryCount}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                      <div className="text-xs text-slate-400">
                        {scheme.academic_year
                          ? `Academic year ${scheme.academic_year}`
                          : "Academic year not set"}
                      </div>

                      <Link
                        href={`/teacher/schemes/${scheme.id}`}
                        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-bold text-blue-600 transition hover:bg-blue-50"
                      >
                        Open Scheme
                        <ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

export default function TeacherSchemesPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <SchemesContent />
    </Suspense>
  );
}