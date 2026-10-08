import Link from "next/link";
import { Suspense } from "react";
import {
  ArrowRight,
  CalendarDays,
  ClipboardCheck,
  Clock3,
  FileText,
  Plus,
  Search,
} from "lucide-react";
import { requireTeacher } from "@/lib/auth/teacher";

export const metadata = {
  title: "Assessments | EduMarket",
  description:
    "Create, organize, and manage classroom assessments in EduMarket.",
};

type Assessment = {
  id: string;
  title: string;
  description: string | null;
  assessment_type: string;
  duration_minutes: number;
  total_marks: number;
  due_at: string | null;
  status: string;
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

function typeLabel(type: string) {
  const labels: Record<string, string> = {
    quiz: "Quiz",
    cat: "Continuous Assessment Test",
    homework: "Homework",
    classwork: "Classwork",
    midterm: "Mid-Term",
    endterm: "End-Term",
    revision: "Revision",
    project: "Project",
  };

  return labels[type] ?? type.replace(/[_-]/g, " ");
}

function statusStyle(status: string) {
  if (status === "published") {
    return "bg-emerald-50 text-emerald-700";
  }

  if (status === "archived") {
    return "bg-slate-100 text-slate-600";
  }

  return "bg-amber-50 text-amber-700";
}

function formatDate(date: string | null) {
  if (!date) return "No deadline";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) return "Invalid date";

  return new Intl.DateTimeFormat("en-KE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed);
}

function LoadingState() {
  return (
    <div className="space-y-5">
      <div className="h-40 animate-pulse rounded-3xl bg-slate-100" />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-24 animate-pulse rounded-2xl bg-slate-100"
          />
        ))}
      </div>

      <div className="h-80 animate-pulse rounded-3xl bg-slate-100" />
    </div>
  );
}

async function AssessmentDashboardContent({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    status?: string;
    type?: string;
  }>;
}) {
  const { supabase, user } = await requireTeacher();
  const filters = await searchParams;

  const searchTerm = filters.q?.trim() ?? "";
  const selectedStatus = filters.status ?? "all";
  const selectedType = filters.type ?? "";

  const { data: teacher, error: teacherError } = await supabase
    .from("teacher_profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (teacherError || !teacher) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-800">
        Your teacher profile could not be loaded. Please complete teacher
        onboarding or try again.
      </div>
    );
  }

  const [
    assessmentResult,
    allAssessmentsResult,
  ] = await Promise.all([
    (() => {
      let query = supabase
        .from("assessments")
        .select(
          `
            id,
            title,
            description,
            assessment_type,
            duration_minutes,
            total_marks,
            due_at,
            status,
            created_at,
            subjects(name),
            grades(name)
          `,
        )
        .eq("teacher_id", teacher.id)
        .order("created_at", { ascending: false });

      if (
        ["draft", "published", "archived"].includes(selectedStatus)
      ) {
        query = query.eq("status", selectedStatus);
      }

      if (selectedType) {
        query = query.eq("assessment_type", selectedType);
      }

      if (searchTerm) {
        const safeSearch = searchTerm.replace(/[%_,()]/g, " ");
        query = query.or(
          `title.ilike.%${safeSearch}%,description.ilike.%${safeSearch}%`,
        );
      }

      return query;
    })(),
    supabase
      .from("assessments")
      .select("id,status")
      .eq("teacher_id", teacher.id),
  ]);

  const assessments = (assessmentResult.data ?? []) as unknown as Assessment[];
  const allAssessments = allAssessmentsResult.data ?? [];

  const totalCount = allAssessments.length;
  const draftCount = allAssessments.filter(
    (assessment) => assessment.status === "draft",
  ).length;
  const publishedCount = allAssessments.filter(
    (assessment) => assessment.status === "published",
  ).length;
  const archivedCount = allAssessments.filter(
    (assessment) => assessment.status === "archived",
  ).length;

  const hasFilters =
    Boolean(searchTerm) ||
    Boolean(selectedType) ||
    selectedStatus !== "all";

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-indigo-950 to-violet-800 px-6 py-8 text-white shadow-xl sm:px-9 sm:py-10">
        <div className="absolute -right-10 -top-16 h-56 w-56 rounded-full bg-violet-300/10 blur-3xl" />

        <div className="relative flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-violet-100">
              <ClipboardCheck size={14} />
              Teacher workspace
            </span>

            <h1 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl">
              Assessment Centre
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-7 text-violet-100 sm:text-base">
              Create quizzes, CATs, homework, classwork, projects, and
              revision assessments from one organized workspace.
            </p>
          </div>

          <Link
            href="/teacher/assessments/new"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3.5 text-sm font-semibold text-indigo-950 transition hover:bg-violet-50"
          >
            <Plus size={18} />
            Create assessment
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {assessmentResult.error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          Unable to load assessments. Confirm that the assessments table
          has the expected columns and that its RLS policies are enabled.
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "All assessments",
            value: totalCount,
            icon: ClipboardCheck,
            style: "bg-indigo-50 text-indigo-700",
          },
          {
            label: "Drafts",
            value: draftCount,
            icon: FileText,
            style: "bg-amber-50 text-amber-700",
          },
          {
            label: "Published",
            value: publishedCount,
            icon: CalendarDays,
            style: "bg-emerald-50 text-emerald-700",
          },
          {
            label: "Archived",
            value: archivedCount,
            icon: Clock3,
            style: "bg-slate-100 text-slate-700",
          },
        ].map((stat) => {
          const Icon = stat.icon;

          return (
            <article
              key={stat.label}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-slate-500">
                  {stat.label}
                </p>

                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.style}`}
                >
                  <Icon size={20} />
                </span>
              </div>

              <p className="mt-4 text-3xl font-bold text-slate-950">
                {stat.value}
              </p>
            </article>
          );
        })}
      </section>

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-5 sm:px-7">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
            <div>
              <h2 className="text-xl font-bold text-slate-950">
                Your assessments
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Search and manage your assessment collection.
              </p>
            </div>

            <form
              action="/teacher/assessments"
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
                  placeholder="Search assessments..."
                  className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                />

                <input
                  type="hidden"
                  name="status"
                  value={selectedStatus}
                />

                <input
                  type="hidden"
                  name="type"
                  value={selectedType}
                />
              </div>

              <button
                type="submit"
                className="rounded-xl bg-indigo-700 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-800"
              >
                Search
              </button>
            </form>
          </div>

          <form
            action="/teacher/assessments"
            method="GET"
            className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
          >
            <input type="hidden" name="q" value={searchTerm} />

            <select
              name="status"
              defaultValue={selectedStatus}
              className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-indigo-500"
            >
              <option value="all">All statuses</option>
              <option value="draft">Drafts</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>

            <select
              name="type"
              defaultValue={selectedType}
              className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-indigo-500"
            >
              <option value="">All assessment types</option>
              <option value="quiz">Quiz</option>
              <option value="cat">CAT</option>
              <option value="homework">Homework</option>
              <option value="classwork">Classwork</option>
              <option value="midterm">Mid-Term</option>
              <option value="endterm">End-Term</option>
              <option value="revision">Revision</option>
              <option value="project">Project</option>
            </select>

            <div className="flex gap-2">
              <button
                type="submit"
                className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Apply filters
              </button>

              {hasFilters && (
                <Link
                  href="/teacher/assessments"
                  className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Reset
                </Link>
              )}
            </div>
          </form>
        </div>

        {assessments.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700">
              <ClipboardCheck size={30} />
            </div>

            <h3 className="mt-5 text-lg font-bold text-slate-950">
              {hasFilters
                ? "No matching assessments"
                : "Your assessment centre is ready"}
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              {hasFilters
                ? "Try changing the search or filters."
                : "Create your first assessment to begin organizing quizzes, CATs, and classroom activities."}
            </p>

            <Link
              href="/teacher/assessments/new"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-700 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-800"
            >
              <Plus size={17} />
              Create assessment
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {assessments.map((assessment) => (
              <article
                key={assessment.id}
                className="px-5 py-5 transition hover:bg-slate-50/70 sm:px-7"
              >
                <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
                        {typeLabel(assessment.assessment_type)}
                      </span>

                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusStyle(assessment.status)}`}
                      >
                        {assessment.status}
                      </span>
                    </div>

                    <h3 className="mt-3 text-lg font-bold text-slate-950">
                      {assessment.title}
                    </h3>

                    {assessment.description && (
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">
                        {assessment.description}
                      </p>
                    )}

                    <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-500">
                      <span>
                        Subject: {relationName(assessment.subjects)}
                      </span>

                      <span>
                        Grade: {relationName(assessment.grades)}
                      </span>

                      <span>
                        {assessment.total_marks} marks
                      </span>

                      <span>
                        {assessment.duration_minutes} minutes
                      </span>

                      <span className="inline-flex items-center gap-1.5">
                        <CalendarDays size={15} />
                        {formatDate(assessment.due_at)}
                      </span>
                    </div>
                  </div>

                  <Link
                    href={`/teacher/assessments/${assessment.id}`}
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-800"
                  >
                    Manage assessment
                    <ArrowRight size={16} />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default function TeacherAssessmentsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    status?: string;
    type?: string;
  }>;
}) {
  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-9">
      <Suspense fallback={<LoadingState />}>
        <AssessmentDashboardContent searchParams={searchParams} />
      </Suspense>
    </main>
  );
}