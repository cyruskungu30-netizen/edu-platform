import Link from "next/link";
import { Suspense } from "react";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  Plus,
  Search,
  Users,
} from "lucide-react";
import { requireTeacher } from "@/lib/auth/teacher";

export const metadata = {
  title: "Assignments & Homework | EduMarket",
  description:
    "Create, organize, and track classroom assignments and homework.",
};

type Assignment = {
  id: string;
  title: string;
  description: string | null;
  assignment_type: string;
  total_marks: number;
  due_at: string | null;
  status: string;
  created_at: string;
  subjects: { name: string } | { name: string }[] | null;
  grades: { name: string } | { name: string }[] | null;
};

type SubmissionSummary = {
  assignment_id: string;
  status: string;
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
    homework: "Homework",
    classwork: "Classwork",
    project: "Project",
    research: "Research",
    practical: "Practical",
    revision: "Revision",
    group_work: "Group work",
  };

  return labels[type] ?? type.replace(/[_-]/g, " ");
}

function statusStyle(status: string) {
  switch (status) {
    case "published":
      return "bg-emerald-50 text-emerald-700";
    case "closed":
      return "bg-slate-100 text-slate-700";
    case "archived":
      return "bg-violet-50 text-violet-700";
    default:
      return "bg-amber-50 text-amber-700";
  }
}

function formatDate(value: string | null) {
  if (!value) return "No deadline";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Invalid date";

  return new Intl.DateTimeFormat("en-KE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function LoadingState() {
  return (
    <div className="space-y-5">
      <div className="h-44 animate-pulse rounded-3xl bg-slate-100" />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-28 animate-pulse rounded-2xl bg-slate-100"
          />
        ))}
      </div>

      <div className="h-96 animate-pulse rounded-3xl bg-slate-100" />
    </div>
  );
}

async function AssignmentDashboardContent({
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
    assignmentResult,
    allAssignmentsResult,
    submissionsResult,
  ] = await Promise.all([
    (() => {
      let query = supabase
        .from("assignments")
        .select(
          `
            id,
            title,
            description,
            assignment_type,
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
        ["draft", "published", "closed", "archived"].includes(
          selectedStatus,
        )
      ) {
        query = query.eq("status", selectedStatus);
      }

      if (selectedType) {
        query = query.eq("assignment_type", selectedType);
      }

      if (searchTerm) {
        const safeSearch = searchTerm.replace(/[%_,()]/g, " ");
        query = query.ilike("title", `%${safeSearch}%`);
      }

      return query;
    })(),

    supabase
      .from("assignments")
      .select("id,status")
      .eq("teacher_id", teacher.id),

    supabase
      .from("assignment_submissions")
      .select("assignment_id,status"),
  ]);

  const assignments = (assignmentResult.data ?? []) as unknown as Assignment[];
  const allAssignments = allAssignmentsResult.data ?? [];
  const submissions = (submissionsResult.data ?? []) as SubmissionSummary[];

  const totalCount = allAssignments.length;

  const draftCount = allAssignments.filter(
    (item) => item.status === "draft",
  ).length;

  const publishedCount = allAssignments.filter(
    (item) => item.status === "published",
  ).length;

  const closedCount = allAssignments.filter(
    (item) => item.status === "closed",
  ).length;

  const publishedIds = new Set(
    allAssignments
      .filter((item) => item.status === "published")
      .map((item) => item.id),
  );

  const submissionCount = submissions.filter((submission) =>
    publishedIds.has(submission.assignment_id),
  ).length;

  const hasFilters =
    Boolean(searchTerm) ||
    Boolean(selectedType) ||
    selectedStatus !== "all";

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-teal-950 to-emerald-800 px-6 py-8 text-white shadow-xl sm:px-9 sm:py-10">
        <div className="absolute -right-10 -top-16 h-56 w-56 rounded-full bg-emerald-300/10 blur-3xl" />

        <div className="relative flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-emerald-100">
              <BookOpen size={14} />
              Teacher workspace
            </span>

            <h1 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl">
              Assignments & Homework
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-7 text-emerald-100 sm:text-base">
              Prepare assignments, set deadlines, organize classwork,
              and build a foundation for tracking learner submissions.
            </p>
          </div>

          <Link
            href="/teacher/assignments/new"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3.5 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-50"
          >
            <Plus size={18} />
            Create assignment
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {assignmentResult.error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          Unable to load assignments. Check the assignments table columns
          and row-level security policies.
        </div>
      )}

      {allAssignmentsResult.error && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Some assignment statistics could not be loaded.
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Total assignments",
            value: totalCount,
            icon: BookOpen,
            style: "bg-indigo-50 text-indigo-700",
          },
          {
            label: "Published",
            value: publishedCount,
            icon: CheckCircle2,
            style: "bg-emerald-50 text-emerald-700",
          },
          {
            label: "Drafts",
            value: draftCount,
            icon: FileText,
            style: "bg-amber-50 text-amber-700",
          },
          {
            label: "Submission records",
            value: submissionCount,
            icon: Users,
            style: "bg-sky-50 text-sky-700",
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
                Your assignments
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Find, filter, and manage your learning activities.
              </p>
            </div>

            <form
              action="/teacher/assignments"
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
                  placeholder="Search by assignment title..."
                  className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-3 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
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
                className="rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-800"
              >
                Search
              </button>
            </form>
          </div>

          <form
            action="/teacher/assignments"
            method="GET"
            className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
          >
            <input type="hidden" name="q" value={searchTerm} />

            <select
              name="status"
              defaultValue={selectedStatus}
              className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-emerald-500"
            >
              <option value="all">All statuses</option>
              <option value="draft">Drafts</option>
              <option value="published">Published</option>
              <option value="closed">Closed</option>
              <option value="archived">Archived</option>
            </select>

            <select
              name="type"
              defaultValue={selectedType}
              className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-emerald-500"
            >
              <option value="">All assignment types</option>
              <option value="homework">Homework</option>
              <option value="classwork">Classwork</option>
              <option value="project">Project</option>
              <option value="research">Research</option>
              <option value="practical">Practical</option>
              <option value="revision">Revision</option>
              <option value="group_work">Group work</option>
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
                  href="/teacher/assignments"
                  className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Reset
                </Link>
              )}
            </div>
          </form>
        </div>

        {assignments.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
              <BookOpen size={30} />
            </div>

            <h3 className="mt-5 text-lg font-bold text-slate-950">
              {hasFilters
                ? "No matching assignments"
                : "Your assignment workspace is ready"}
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              {hasFilters
                ? "Try changing the search term or filters."
                : "Create your first assignment to begin organizing homework, classwork, and projects."}
            </p>

            <Link
              href="/teacher/assignments/new"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-800"
            >
              <Plus size={17} />
              Create assignment
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {assignments.map((assignment) => (
              <article
                key={assignment.id}
                className="px-5 py-5 transition hover:bg-slate-50/70 sm:px-7"
              >
                <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                        {typeLabel(assignment.assignment_type)}
                      </span>

                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusStyle(assignment.status)}`}
                      >
                        {assignment.status.replace(/_/g, " ")}
                      </span>
                    </div>

                    <h3 className="mt-3 text-lg font-bold text-slate-950">
                      {assignment.title}
                    </h3>

                    {assignment.description && (
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">
                        {assignment.description}
                      </p>
                    )}

                    <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-500">
                      <span>
                        Subject: {relationName(assignment.subjects)}
                      </span>

                      <span>
                        Grade: {relationName(assignment.grades)}
                      </span>

                      <span>{assignment.total_marks} marks</span>

                      <span className="inline-flex items-center gap-1.5">
                        <CalendarDays size={15} />
                        {formatDate(assignment.due_at)}
                      </span>
                    </div>
                  </div>

                  <Link
                    href={`/teacher/assignments/${assignment.id}`}
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800"
                  >
                    Manage assignment
                    <ArrowRight size={16} />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}

        {closedCount > 0 && (
          <div className="flex items-center gap-2 border-t border-slate-100 px-5 py-4 text-xs text-slate-500 sm:px-7">
            <Clock3 size={15} />
            {closedCount} assignment{closedCount === 1 ? "" : "s"} closed.
          </div>
        )}
      </section>
    </div>
  );
}

export default function TeacherAssignmentsPage({
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
        <AssignmentDashboardContent searchParams={searchParams} />
      </Suspense>
    </main>
  );
}