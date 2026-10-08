"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Archive,
  ArrowDown,
  ArrowUp,
  BookOpen,
  CalendarDays,
  Check,
  ChevronLeft,
  Copy,
  FileText,
  GraduationCap,
  Loader2,
  Plus,
  Save,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

type Option = {
  id: string;
  name: string;
};

type SchemeStatus =
  | "draft"
  | "published"
  | "archived";

type Scheme = {
  id: string;
  title: string;
  curriculum_id: string | null;
  education_level_id: string | null;
  grade_id: string | null;
  subject_id: string | null;
  term_id: string | null;
  academic_year: number | null;
  status: SchemeStatus;
};

type SchemeEntry = {
  id: string;
  week_number: number | null;
  lesson_number: number | null;
  strand: string;
  sub_strand: string;
  topic: string;
  subtopic: string;
  specific_learning_outcomes: string;
  learning_experiences: string;
  key_inquiry_questions: string;
  learning_resources: string;
  assessment_methods: string;
  teacher_remarks: string;
};

type Props = {
  schemeId: string;
  initialScheme: Scheme;
};

function linesToArray(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function arrayToLines(
  value: string[] | null | undefined,
) {
  return Array.isArray(value)
    ? value.join("\n")
    : "";
}

function createBlankEntry(
  weekNumber = 1,
  lessonNumber = 1,
): SchemeEntry {
  return {
    id: crypto.randomUUID(),
    week_number: weekNumber,
    lesson_number: lessonNumber,
    strand: "",
    sub_strand: "",
    topic: "",
    subtopic: "",
    specific_learning_outcomes: "",
    learning_experiences: "",
    key_inquiry_questions: "",
    learning_resources: "",
    assessment_methods: "",
    teacher_remarks: "",
  };
}

function inputClassName() {
  return "mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10";
}

function statusClasses(status: SchemeStatus) {
  switch (status) {
    case "published":
      return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200";

    case "archived":
      return "bg-slate-100 text-slate-600 ring-1 ring-slate-200";

    default:
      return "bg-amber-50 text-amber-700 ring-1 ring-amber-200";
  }
}

export default function SchemeOfWorkEditor({
  schemeId,
  initialScheme,
}: Props) {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();

  const [scheme, setScheme] =
    useState<Scheme>(initialScheme);

  const [entries, setEntries] = useState<SchemeEntry[]>(
    [],
  );

  const [curricula, setCurricula] = useState<Option[]>(
    [],
  );

  const [educationLevels, setEducationLevels] =
    useState<Option[]>([]);

  const [grades, setGrades] = useState<Option[]>([]);

  const [subjects, setSubjects] = useState<Option[]>(
    [],
  );

  const [terms, setTerms] = useState<Option[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [action, setAction] = useState<
    | "save"
    | "publish"
    | "archive"
    | "duplicate"
    | "delete"
    | null
  >(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showDeleteModal, setShowDeleteModal] =
    useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadEditorData() {
      setLoading(true);
      setError("");

      const [
        entriesResult,
        curriculaResult,
        levelsResult,
        gradesResult,
        subjectsResult,
        termsResult,
      ] = await Promise.all([
        supabase
          .from("scheme_entries")
          .select(
            `
              id,
              week_number,
              lesson_number,
              strand,
              sub_strand,
              topic,
              subtopic,
              specific_learning_outcomes,
              learning_experiences,
              key_inquiry_questions,
              learning_resources,
              assessment_methods,
              teacher_remarks
            `,
          )
          .eq("scheme_id", schemeId)
          .order("week_number", {
            ascending: true,
          })
          .order("lesson_number", {
            ascending: true,
          }),

        supabase
          .from("curricula")
          .select("id,name")
          .eq("is_active", true)
          .order("name"),

        supabase
          .from("education_levels")
          .select("id,name")
          .eq("is_active", true)
          .order("name"),

        supabase
          .from("grades")
          .select("id,name")
          .eq("is_active", true)
          .order("name"),

        supabase
          .from("subjects")
          .select("id,name")
          .eq("is_active", true)
          .order("name"),

        supabase
          .from("terms")
          .select("id,name")
          .eq("is_active", true)
          .order("name"),
      ]);

      if (!mounted) return;

      const firstError =
        entriesResult.error ??
        curriculaResult.error ??
        levelsResult.error ??
        gradesResult.error ??
        subjectsResult.error ??
        termsResult.error;

      if (firstError) {
        setError(firstError.message);
        setLoading(false);
        return;
      }

      const loadedEntries: SchemeEntry[] = (
        entriesResult.data ?? []
      ).map((entry) => ({
        id: entry.id,
        week_number: entry.week_number,
        lesson_number: entry.lesson_number,
        strand: entry.strand ?? "",
        sub_strand: entry.sub_strand ?? "",
        topic: entry.topic ?? "",
        subtopic: entry.subtopic ?? "",
        specific_learning_outcomes:
          arrayToLines(
            entry.specific_learning_outcomes,
          ),
        learning_experiences:
          entry.learning_experiences ?? "",
        key_inquiry_questions:
          arrayToLines(
            entry.key_inquiry_questions,
          ),
        learning_resources:
          arrayToLines(
            entry.learning_resources,
          ),
        assessment_methods:
          arrayToLines(
            entry.assessment_methods,
          ),
        teacher_remarks:
          entry.teacher_remarks ?? "",
      }));

      setEntries(loadedEntries);

      setCurricula(
        (curriculaResult.data ?? []) as Option[],
      );

      setEducationLevels(
        (levelsResult.data ?? []) as Option[],
      );

      setGrades(
        (gradesResult.data ?? []) as Option[],
      );

      setSubjects(
        (subjectsResult.data ?? []) as Option[],
      );

      setTerms(
        (termsResult.data ?? []) as Option[],
      );

      setLoading(false);
    }

    loadEditorData();

    return () => {
      mounted = false;
    };
  }, [schemeId, supabase]);

  function clearMessages() {
    setError("");
    setSuccess("");
  }

  function updateScheme(
    field: keyof Scheme,
    value: string | number | null,
  ) {
    setScheme((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function updateEntry(
    entryId: string,
    field: keyof SchemeEntry,
    value: string | number | null,
  ) {
    setEntries((current) =>
      current.map((entry) =>
        entry.id === entryId
          ? {
              ...entry,
              [field]: value,
            }
          : entry,
      ),
    );
  }

  function addEntry() {
    setEntries((current) => {
      const last = current[current.length - 1];

      const nextWeek = last?.week_number ?? 1;

      const nextLesson =
        (last?.lesson_number ?? current.length) + 1;

      return [
        ...current,
        createBlankEntry(
          nextWeek,
          nextLesson,
        ),
      ];
    });
  }

  function addLessonForWeek(
    weekNumber: number,
  ) {
    setEntries((current) => {
      const weekEntries = current.filter(
        (entry) =>
          entry.week_number === weekNumber,
      );

      const nextLesson =
        weekEntries.length > 0
          ? Math.max(
              ...weekEntries.map(
                (entry) =>
                  entry.lesson_number ?? 0,
              ),
            ) + 1
          : 1;

      return [
        ...current,
        createBlankEntry(
          weekNumber,
          nextLesson,
        ),
      ];
    });
  }

  function removeEntry(entryId: string) {
    setEntries((current) =>
      current.filter(
        (entry) => entry.id !== entryId,
      ),
    );
  }

  function duplicateEntry(
    entryId: string,
  ) {
    setEntries((current) => {
      const index = current.findIndex(
        (entry) => entry.id === entryId,
      );

      if (index === -1) return current;

      const source = current[index];

      const duplicate: SchemeEntry = {
        ...source,
        id: crypto.randomUUID(),
        lesson_number:
          (source.lesson_number ?? index + 1) + 1,
      };

      const next = [...current];

      next.splice(
        index + 1,
        0,
        duplicate,
      );

      return next;
    });
  }

  function moveEntry(
    entryId: string,
    direction: "up" | "down",
  ) {
    setEntries((current) => {
      const index = current.findIndex(
        (entry) => entry.id === entryId,
      );

      if (index === -1) {
        return current;
      }

      const target =
        direction === "up"
          ? index - 1
          : index + 1;

      if (
        target < 0 ||
        target >= current.length
      ) {
        return current;
      }

      const next = [...current];

      const temp = next[index];

      next[index] = next[target];
      next[target] = temp;

      return next;
    });
  }

  async function saveScheme(
    targetStatus?: SchemeStatus,
  ) {
    clearMessages();

    if (!scheme.title.trim()) {
      setError(
        "Please enter a scheme title.",
      );
      return;
    }

    if (!scheme.curriculum_id) {
      setError(
        "Please select a curriculum.",
      );
      return;
    }

    if (!scheme.education_level_id) {
      setError(
        "Please select an education level.",
      );
      return;
    }

    if (!scheme.grade_id) {
      setError(
        "Please select a grade.",
      );
      return;
    }

    if (!scheme.subject_id) {
      setError(
        "Please select a subject.",
      );
      return;
    }

    if (!scheme.term_id) {
      setError(
        "Please select a term.",
      );
      return;
    }

    if (!scheme.academic_year) {
      setError(
        "Please enter an academic year.",
      );
      return;
    }

    if (entries.length === 0) {
      setError(
        "Add at least one lesson before saving.",
      );
      return;
    }

    setSaving(true);
    setAction(
      targetStatus === "published"
        ? "publish"
        : targetStatus === "archived"
          ? "archive"
          : "save",
    );

    try {
      const {
        error: schemeError,
      } = await supabase
        .from("schemes_of_work")
        .update({
          title: scheme.title.trim(),
          curriculum_id:
            scheme.curriculum_id,
          education_level_id:
            scheme.education_level_id,
          grade_id: scheme.grade_id,
          subject_id:
            scheme.subject_id,
          term_id: scheme.term_id,
          academic_year:
            scheme.academic_year,
          status:
            targetStatus ?? scheme.status,
        })
        .eq("id", schemeId);

      if (schemeError) {
        throw new Error(
          schemeError.message,
        );
      }

      const existingIds = entries
        .filter(
          (entry) =>
            !entry.id.startsWith(
              "new-",
            ),
        )
        .map((entry) => entry.id);

      const {
        data: existingEntries,
        error: existingError,
      } = await supabase
        .from("scheme_entries")
        .select("id")
        .eq("scheme_id", schemeId);

      if (existingError) {
        throw new Error(
          existingError.message,
        );
      }

      const databaseIds =
        (existingEntries ?? []).map(
          (entry) => entry.id,
        );

      const idsToDelete =
        databaseIds.filter(
          (id) =>
            !existingIds.includes(id),
        );

      if (idsToDelete.length > 0) {
        const {
          error: deleteError,
        } = await supabase
          .from("scheme_entries")
          .delete()
          .in("id", idsToDelete);

        if (deleteError) {
          throw new Error(
            deleteError.message,
          );
        }
      }

      for (const entry of entries) {
        const payload = {
          scheme_id: schemeId,
          week_number:
            entry.week_number,
          lesson_number:
            entry.lesson_number,
          strand:
            entry.strand.trim() || null,
          sub_strand:
            entry.sub_strand.trim() ||
            null,
          topic:
            entry.topic.trim() || null,
          subtopic:
            entry.subtopic.trim() ||
            null,
          specific_learning_outcomes:
            linesToArray(
              entry.specific_learning_outcomes,
            ),
          learning_experiences:
            entry.learning_experiences.trim() ||
            null,
          key_inquiry_questions:
            linesToArray(
              entry.key_inquiry_questions,
            ),
          learning_resources:
            linesToArray(
              entry.learning_resources,
            ),
          assessment_methods:
            linesToArray(
              entry.assessment_methods,
            ),
          teacher_remarks:
            entry.teacher_remarks.trim() ||
            null,
        };

        if (
          entry.id.startsWith(
            "new-",
          )
        ) {
          const {
            error: insertError,
          } = await supabase
            .from("scheme_entries")
            .insert(payload);

          if (insertError) {
            throw new Error(
              insertError.message,
            );
          }
        } else {
          const {
            error: updateError,
          } = await supabase
            .from("scheme_entries")
            .update(payload)
            .eq("id", entry.id)
            .eq(
              "scheme_id",
              schemeId,
            );

          if (updateError) {
            throw new Error(
              updateError.message,
            );
          }
        }
      }

      const finalStatus =
        targetStatus ?? scheme.status;

      setScheme((current) => ({
        ...current,
        status: finalStatus,
      }));

      setSuccess(
        finalStatus === "published"
          ? "Scheme published successfully."
          : finalStatus === "archived"
            ? "Scheme archived successfully."
            : "Scheme saved successfully.",
      );
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to save the scheme.",
      );
    } finally {
      setSaving(false);
      setAction(null);
    }
  }

  async function archiveScheme() {
    await saveScheme("archived");
  }

  async function duplicateScheme() {
    clearMessages();

    setSaving(true);
    setAction("duplicate");

    try {
      const {
        data: {
          user,
        },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error(
          "Your session has expired.",
        );
      }

      const {
        data: teacherProfile,
        error: teacherError,
      } = await supabase
        .from("teacher_profiles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (teacherError) {
        throw new Error(
          teacherError.message,
        );
      }

      if (!teacherProfile) {
        throw new Error(
          "Teacher profile not found.",
        );
      }

      const {
        data: duplicated,
        error: duplicateError,
      } = await supabase
        .from("schemes_of_work")
        .insert({
          teacher_id:
            teacherProfile.id,
          title: `${scheme.title} (Copy)`,
          curriculum_id:
            scheme.curriculum_id,
          education_level_id:
            scheme.education_level_id,
          grade_id:
            scheme.grade_id,
          subject_id:
            scheme.subject_id,
          term_id:
            scheme.term_id,
          academic_year:
            scheme.academic_year,
          status: "draft",
        })
        .select("id")
        .single();

      if (duplicateError || !duplicated) {
        throw new Error(
          duplicateError?.message ??
            "Unable to duplicate scheme.",
        );
      }

      if (entries.length > 0) {
        const entryPayload = entries.map(
          (entry) => ({
            scheme_id:
              duplicated.id,
            week_number:
              entry.week_number,
            lesson_number:
              entry.lesson_number,
            strand:
              entry.strand.trim() ||
              null,
            sub_strand:
              entry.sub_strand.trim() ||
              null,
            topic:
              entry.topic.trim() ||
              null,
            subtopic:
              entry.subtopic.trim() ||
              null,
            specific_learning_outcomes:
              linesToArray(
                entry.specific_learning_outcomes,
              ),
            learning_experiences:
              entry.learning_experiences.trim() ||
              null,
            key_inquiry_questions:
              linesToArray(
                entry.key_inquiry_questions,
              ),
            learning_resources:
              linesToArray(
                entry.learning_resources,
              ),
            assessment_methods:
              linesToArray(
                entry.assessment_methods,
              ),
            teacher_remarks:
              entry.teacher_remarks.trim() ||
              null,
          }),
        );

        const {
          error: entriesError,
        } = await supabase
          .from("scheme_entries")
          .insert(entryPayload);

        if (entriesError) {
          await supabase
            .from("schemes_of_work")
            .delete()
            .eq(
              "id",
              duplicated.id,
            );

          throw new Error(
            entriesError.message,
          );
        }
      }

      setSuccess(
        "Scheme duplicated successfully. Opening the copy...",
      );

      router.push(
        `/teacher/schemes/${duplicated.id}`,
      );
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to duplicate the scheme.",
      );

      setSaving(false);
      setAction(null);
    }
  }

  async function deleteScheme() {
    clearMessages();

    setSaving(true);
    setAction("delete");

    try {
      const {
        error: deleteError,
      } = await supabase
        .from("schemes_of_work")
        .delete()
        .eq("id", schemeId);

      if (deleteError) {
        throw new Error(
          deleteError.message,
        );
      }

      router.push(
        "/teacher/schemes",
      );
      router.refresh();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to delete the scheme.",
      );

      setSaving(false);
      setAction(null);
      setShowDeleteModal(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />

            <p className="mt-3 text-sm font-medium text-slate-500">
              Loading scheme editor...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Messages */}
      {error && (
        <div className="mb-6 flex items-start justify-between gap-4 rounded-2xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-semibold text-red-700">
            {error}
          </p>

          <button
            type="button"
            onClick={() => setError("")}
            className="text-red-500"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {success && (
        <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex items-center gap-2">
            <Check className="h-5 w-5 text-emerald-600" />

            <p className="text-sm font-semibold text-emerald-700">
              {success}
            </p>
          </div>
        </div>
      )}

      {/* Top actions */}
      <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
              <FileText className="h-5 w-5" />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold ${statusClasses(
                    scheme.status,
                  )}`}
                >
                  {scheme.status
                    .charAt(0)
                    .toUpperCase() +
                    scheme.status.slice(1)}
                </span>

                <span className="text-xs text-slate-400">
                  {entries.length} lesson
                  {entries.length === 1
                    ? ""
                    : "s"}
                </span>
              </div>

              <p className="mt-1 text-xs text-slate-500">
                Changes are saved to your teacher workspace.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/teacher/schemes"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
            >
              <ChevronLeft className="h-4 w-4" />
              Schemes
            </Link>

            <button
              type="button"
              disabled={saving}
              onClick={duplicateScheme}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-4 py-2.5 text-sm font-bold text-violet-700 transition hover:bg-violet-100 disabled:opacity-50"
            >
              {action === "duplicate" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Copy className="h-4 w-4" />
              )}

              Duplicate
            </button>

            {scheme.status !== "archived" && (
              <button
                type="button"
                disabled={saving}
                onClick={archiveScheme}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
              >
                {action === "archive" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Archive className="h-4 w-4" />
                )}

                Archive
              </button>
            )}

            <button
              type="button"
              disabled={saving}
              onClick={() =>
                saveScheme()
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:opacity-50"
            >
              {action === "save" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}

              Save Changes
            </button>

            {scheme.status !== "published" && (
              <button
                type="button"
                disabled={saving}
                onClick={() =>
                  saveScheme("published")
                }
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:opacity-50"
              >
                {action === "publish" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}

                Publish
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Scheme information */}
      <section className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-slate-50 px-5 py-5 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-100 p-2.5 text-blue-600">
              <BookOpen className="h-5 w-5" />
            </div>

            <div>
              <h2 className="font-black text-slate-950">
                Scheme Information
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Update the class, subject and curriculum details.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-5 p-5 sm:grid-cols-2 lg:grid-cols-3 sm:p-6">
          <div className="sm:col-span-2 lg:col-span-3">
            <label className="text-sm font-bold text-slate-700">
              Scheme Title
            </label>

            <input
              type="text"
              value={scheme.title}
              onChange={(event) =>
                updateScheme(
                  "title",
                  event.target.value,
                )
              }
              className={inputClassName()}
            />
          </div>

          <div>
            <label className="text-sm font-bold text-slate-700">
              Curriculum
            </label>

            <select
              value={
                scheme.curriculum_id ?? ""
              }
              onChange={(event) =>
                updateScheme(
                  "curriculum_id",
                  event.target.value ||
                    null,
                )
              }
              className={inputClassName()}
            >
              <option value="">
                Select curriculum
              </option>

              {curricula.map(
                (item) => (
                  <option
                    key={item.id}
                    value={item.id}
                  >
                    {item.name}
                  </option>
                ),
              )}
            </select>
          </div>

          <div>
            <label className="text-sm font-bold text-slate-700">
              Education Level
            </label>

            <select
              value={
                scheme.education_level_id ??
                ""
              }
              onChange={(event) =>
                updateScheme(
                  "education_level_id",
                  event.target.value ||
                    null,
                )
              }
              className={inputClassName()}
            >
              <option value="">
                Select education level
              </option>

              {educationLevels.map(
                (item) => (
                  <option
                    key={item.id}
                    value={item.id}
                  >
                    {item.name}
                  </option>
                ),
              )}
            </select>
          </div>

          <div>
            <label className="text-sm font-bold text-slate-700">
              Grade
            </label>

            <select
              value={
                scheme.grade_id ?? ""
              }
              onChange={(event) =>
                updateScheme(
                  "grade_id",
                  event.target.value ||
                    null,
                )
              }
              className={inputClassName()}
            >
              <option value="">
                Select grade
              </option>

              {grades.map(
                (item) => (
                  <option
                    key={item.id}
                    value={item.id}
                  >
                    {item.name}
                  </option>
                ),
              )}
            </select>
          </div>

          <div>
            <label className="text-sm font-bold text-slate-700">
              Subject
            </label>

            <select
              value={
                scheme.subject_id ?? ""
              }
              onChange={(event) =>
                updateScheme(
                  "subject_id",
                  event.target.value ||
                    null,
                )
              }
              className={inputClassName()}
            >
              <option value="">
                Select subject
              </option>

              {subjects.map(
                (item) => (
                  <option
                    key={item.id}
                    value={item.id}
                  >
                    {item.name}
                  </option>
                ),
              )}
            </select>
          </div>

          <div>
            <label className="text-sm font-bold text-slate-700">
              Term
            </label>

            <select
              value={
                scheme.term_id ?? ""
              }
              onChange={(event) =>
                updateScheme(
                  "term_id",
                  event.target.value ||
                    null,
                )
              }
              className={inputClassName()}
            >
              <option value="">
                Select term
              </option>

              {terms.map(
                (item) => (
                  <option
                    key={item.id}
                    value={item.id}
                  >
                    {item.name}
                  </option>
                ),
              )}
            </select>
          </div>

          <div>
            <label className="text-sm font-bold text-slate-700">
              Academic Year
            </label>

            <input
              type="number"
              min="2000"
              max="2100"
              value={
                scheme.academic_year ??
                ""
              }
              onChange={(event) =>
                updateScheme(
                  "academic_year",
                  event.target.value
                    ? Number(
                        event.target.value,
                      )
                    : null,
                )
              }
              className={inputClassName()}
            />
          </div>
        </div>
      </section>

      {/* Entries */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-slate-50 px-5 py-5 sm:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-violet-100 p-2.5 text-violet-600">
                <GraduationCap className="h-5 w-5" />
              </div>

              <div>
                <h2 className="font-black text-slate-950">
                  Lessons & Learning Activities
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Manage every lesson in your scheme.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={addEntry}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Add Lesson
            </button>
          </div>
        </div>

        <div className="space-y-6 p-5 sm:p-6">
          {entries.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
              <BookOpen className="mx-auto h-10 w-10 text-slate-300" />

              <h3 className="mt-4 font-black text-slate-900">
                No lessons in this scheme
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Add your first lesson to continue.
              </p>

              <button
                type="button"
                onClick={addEntry}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white"
              >
                <Plus className="h-4 w-4" />
                Add First Lesson
              </button>
            </div>
          ) : (
            entries.map(
              (entry, index) => (
                <article
                  key={entry.id}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                >
                  <div className="flex flex-col gap-4 border-b border-slate-100 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-sm font-black text-white">
                        {index + 1}
                      </div>

                      <div>
                        <h3 className="font-black text-slate-950">
                          Lesson {index + 1}
                        </h3>

                        <p className="text-xs text-slate-500">
                          Week{" "}
                          {entry.week_number ??
                            "—"}{" "}
                          • Lesson{" "}
                          {entry.lesson_number ??
                            "—"}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          moveEntry(
                            entry.id,
                            "up",
                          )
                        }
                        disabled={
                          index === 0
                        }
                        className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 transition hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-30"
                        title="Move up"
                      >
                        <ArrowUp className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          moveEntry(
                            entry.id,
                            "down",
                          )
                        }
                        disabled={
                          index ===
                          entries.length -
                            1
                        }
                        className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 transition hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-30"
                        title="Move down"
                      >
                        <ArrowDown className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          duplicateEntry(
                            entry.id,
                          )
                        }
                        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 transition hover:border-blue-200 hover:text-blue-600"
                      >
                        Duplicate
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          removeEntry(
                            entry.id,
                          )
                        }
                        className="rounded-lg border border-red-100 bg-white p-2 text-red-500 transition hover:bg-red-50"
                        title="Delete lesson"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-6 p-4 sm:p-6">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="text-sm font-bold text-slate-700">
                          Week Number
                        </label>

                        <input
                          type="number"
                          min="1"
                          value={
                            entry.week_number ??
                            ""
                          }
                          onChange={(event) =>
                            updateEntry(
                              entry.id,
                              "week_number",
                              event.target
                                .value
                                ? Number(
                                    event.target
                                      .value,
                                  )
                                : null,
                            )
                          }
                          className={inputClassName()}
                        />
                      </div>

                      <div>
                        <label className="text-sm font-bold text-slate-700">
                          Lesson Number
                        </label>

                        <input
                          type="number"
                          min="1"
                          value={
                            entry.lesson_number ??
                            ""
                          }
                          onChange={(event) =>
                            updateEntry(
                              entry.id,
                              "lesson_number",
                              event.target
                                .value
                                ? Number(
                                    event.target
                                      .value,
                                  )
                                : null,
                            )
                          }
                          className={inputClassName()}
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="text-sm font-bold text-slate-700">
                          Strand
                        </label>

                        <input
                          type="text"
                          value={
                            entry.strand
                          }
                          onChange={(event) =>
                            updateEntry(
                              entry.id,
                              "strand",
                              event.target
                                .value,
                            )
                          }
                          placeholder="Enter strand"
                          className={inputClassName()}
                        />
                      </div>

                      <div>
                        <label className="text-sm font-bold text-slate-700">
                          Sub-Strand
                        </label>

                        <input
                          type="text"
                          value={
                            entry.sub_strand
                          }
                          onChange={(event) =>
                            updateEntry(
                              entry.id,
                              "sub_strand",
                              event.target
                                .value,
                            )
                          }
                          placeholder="Enter sub-strand"
                          className={inputClassName()}
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="text-sm font-bold text-slate-700">
                          Topic
                        </label>

                        <input
                          type="text"
                          value={
                            entry.topic
                          }
                          onChange={(event) =>
                            updateEntry(
                              entry.id,
                              "topic",
                              event.target
                                .value,
                            )
                          }
                          placeholder="Enter topic"
                          className={inputClassName()}
                        />
                      </div>

                      <div>
                        <label className="text-sm font-bold text-slate-700">
                          Subtopic
                        </label>

                        <input
                          type="text"
                          value={
                            entry.subtopic
                          }
                          onChange={(event) =>
                            updateEntry(
                              entry.id,
                              "subtopic",
                              event.target
                                .value,
                            )
                          }
                          placeholder="Enter subtopic"
                          className={inputClassName()}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-bold text-slate-700">
                        Specific Learning Outcomes
                      </label>

                      <p className="mt-1 text-xs text-slate-400">
                        One outcome per line.
                      </p>

                      <textarea
                        rows={5}
                        value={
                          entry.specific_learning_outcomes
                        }
                        onChange={(event) =>
                          updateEntry(
                            entry.id,
                            "specific_learning_outcomes",
                            event.target.value,
                          )
                        }
                        placeholder="Enter specific learning outcomes..."
                        className={`${inputClassName()} resize-y`}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-bold text-slate-700">
                        Learning Experiences
                      </label>

                      <textarea
                        rows={6}
                        value={
                          entry.learning_experiences
                        }
                        onChange={(event) =>
                          updateEntry(
                            entry.id,
                            "learning_experiences",
                            event.target.value,
                          )
                        }
                        placeholder="Describe teacher and learner activities..."
                        className={`${inputClassName()} resize-y`}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-bold text-slate-700">
                        Key Inquiry Questions
                      </label>

                      <p className="mt-1 text-xs text-slate-400">
                        One question per line.
                      </p>

                      <textarea
                        rows={4}
                        value={
                          entry.key_inquiry_questions
                        }
                        onChange={(event) =>
                          updateEntry(
                            entry.id,
                            "key_inquiry_questions",
                            event.target.value,
                          )
                        }
                        placeholder="Enter key inquiry questions..."
                        className={`${inputClassName()} resize-y`}
                      />
                    </div>

                    <div className="grid gap-5 lg:grid-cols-2">
                      <div>
                        <label className="text-sm font-bold text-slate-700">
                          Learning Resources
                        </label>

                        <p className="mt-1 text-xs text-slate-400">
                          One resource per line.
                        </p>

                        <textarea
                          rows={5}
                          value={
                            entry.learning_resources
                          }
                          onChange={(event) =>
                            updateEntry(
                              entry.id,
                              "learning_resources",
                              event.target
                                .value,
                            )
                          }
                          placeholder="Books&#10;Charts&#10;Digital resources"
                          className={`${inputClassName()} resize-y`}
                        />
                      </div>

                      <div>
                        <label className="text-sm font-bold text-slate-700">
                          Assessment Methods
                        </label>

                        <p className="mt-1 text-xs text-slate-400">
                          One method per line.
                        </p>

                        <textarea
                          rows={5}
                          value={
                            entry.assessment_methods
                          }
                          onChange={(event) =>
                            updateEntry(
                              entry.id,
                              "assessment_methods",
                              event.target
                                .value,
                            )
                          }
                          placeholder="Observation&#10;Oral questions&#10;Written exercise"
                          className={`${inputClassName()} resize-y`}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-bold text-slate-700">
                        Teacher Remarks
                      </label>

                      <textarea
                        rows={3}
                        value={
                          entry.teacher_remarks
                        }
                        onChange={(event) =>
                          updateEntry(
                            entry.id,
                            "teacher_remarks",
                            event.target.value,
                          )
                        }
                        placeholder="Add teacher notes or reflections..."
                        className={`${inputClassName()} resize-y`}
                      />
                    </div>
                  </div>
                </article>
              ),
            )
          )}

          {/* Add lesson */}
          <div className="flex flex-col gap-4 rounded-2xl border border-dashed border-blue-200 bg-blue-50/50 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-black text-slate-900">
                Continue building your scheme
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Add another lesson or add a lesson to the current
                week.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={addEntry}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
                Add Lesson
              </button>

              <button
                type="button"
                onClick={() =>
                  addLessonForWeek(
                    entries[
                      entries.length - 1
                    ]?.week_number ?? 1,
                  )
                }
                className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-white px-4 py-2.5 text-sm font-bold text-blue-700 transition hover:bg-blue-50"
              >
                <CalendarDays className="h-4 w-4" />
                Add Same Week
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom save bar */}
      <section className="sticky bottom-4 z-20 mt-6 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-2xl backdrop-blur sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600">
              <Sparkles className="h-5 w-5" />
            </div>

            <div>
              <p className="text-sm font-black text-slate-900">
                {entries.length} lesson
                {entries.length === 1
                  ? ""
                  : "s"} in this scheme
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Save your changes before leaving this page.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              disabled={saving}
              onClick={() =>
                setShowDeleteModal(true)
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-bold text-red-700 transition hover:bg-red-100 disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
              Delete Scheme
            </button>

            <button
              type="button"
              disabled={saving}
              onClick={() =>
                saveScheme()
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-5 py-3 text-sm font-bold text-blue-700 transition hover:bg-blue-100 disabled:opacity-50"
            >
              {action === "save" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}

              Save Changes
            </button>

            {scheme.status !==
              "published" && (
              <button
                type="button"
                disabled={saving}
                onClick={() =>
                  saveScheme(
                    "published",
                  )
                }
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:opacity-50"
              >
                {action ===
                "publish" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}

                Publish Scheme
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Delete confirmation */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-100 text-red-600">
                  <Trash2 className="h-5 w-5" />
                </div>

                <h2 className="mt-4 text-xl font-black text-slate-950">
                  Delete this scheme?
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  This will permanently delete the scheme and all
                  of its lessons. This action cannot be undone.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowDeleteModal(false)
                }
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() =>
                  setShowDeleteModal(false)
                }
                className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={saving}
                onClick={deleteScheme}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-red-700 disabled:opacity-50"
              >
                {action ===
                "delete" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}

                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}