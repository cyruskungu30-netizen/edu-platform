"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowDown,
  ArrowUp,
  BookOpen,
  CalendarDays,
  Check,
  ChevronLeft,
  GraduationCap,
  Loader2,
  Plus,
  Save,
  Trash2,
  WandSparkles,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

type Option = {
  id: string;
  name: string;
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

type FormState = {
  title: string;
  curriculum_id: string;
  education_level_id: string;
  grade_id: string;
  subject_id: string;
  term_id: string;
  academic_year: string;
};

const createEntry = (
  weekNumber = 1,
  lessonNumber = 1,
): SchemeEntry => ({
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
});

const initialForm: FormState = {
  title: "",
  curriculum_id: "",
  education_level_id: "",
  grade_id: "",
  subject_id: "",
  term_id: "",
  academic_year: new Date().getFullYear().toString(),
};

function linesToArray(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function inputClassName() {
  return "mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10";
}

export default function SchemeOfWorkForm() {
  const supabase = useMemo(() => createClient(), []);

  const [form, setForm] = useState<FormState>(initialForm);
  const [entries, setEntries] = useState<SchemeEntry[]>([
    createEntry(1, 1),
  ]);

  const [curricula, setCurricula] = useState<Option[]>([]);
  const [educationLevels, setEducationLevels] = useState<Option[]>([]);
  const [grades, setGrades] = useState<Option[]>([]);
  const [subjects, setSubjects] = useState<Option[]>([]);
  const [terms, setTerms] = useState<Option[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMode, setSaveMode] = useState<"draft" | "published" | null>(
    null,
  );
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadOptions() {
      setLoading(true);
      setError("");

      const [
        curriculaResult,
        levelsResult,
        gradesResult,
        subjectsResult,
        termsResult,
      ] = await Promise.all([
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

      setCurricula((curriculaResult.data ?? []) as Option[]);
      setEducationLevels((levelsResult.data ?? []) as Option[]);
      setGrades((gradesResult.data ?? []) as Option[]);
      setSubjects((subjectsResult.data ?? []) as Option[]);
      setTerms((termsResult.data ?? []) as Option[]);

      setLoading(false);
    }

    loadOptions();

    return () => {
      mounted = false;
    };
  }, [supabase]);

  function updateForm<K extends keyof FormState>(
    field: K,
    value: FormState[K],
  ) {
    setForm((current) => ({
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
      const lastEntry = current[current.length - 1];

      const nextLesson =
        (lastEntry?.lesson_number ?? current.length) + 1;

      const nextWeek = lastEntry?.week_number ?? 1;

      return [...current, createEntry(nextWeek, nextLesson)];
    });
  }

  function addLessonForWeek(weekNumber: number) {
    setEntries((current) => {
      const lessonsForWeek = current.filter(
        (entry) => entry.week_number === weekNumber,
      );

      const nextLesson =
        lessonsForWeek.length > 0
          ? Math.max(
              ...lessonsForWeek.map(
                (entry) => entry.lesson_number ?? 0,
              ),
            ) + 1
          : 1;

      return [
        ...current,
        createEntry(weekNumber, nextLesson),
      ];
    });
  }

  function removeEntry(entryId: string) {
    if (entries.length === 1) {
      return;
    }

    setEntries((current) =>
      current.filter((entry) => entry.id !== entryId),
    );
  }

  function duplicateEntry(entryId: string) {
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

      next.splice(index + 1, 0, duplicate);

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

      if (index === -1) return current;

      const targetIndex =
        direction === "up" ? index - 1 : index + 1;

      if (
        targetIndex < 0 ||
        targetIndex >= current.length
      ) {
        return current;
      }

      const next = [...current];

      const temp = next[index];
      next[index] = next[targetIndex];
      next[targetIndex] = temp;

      return next;
    });
  }

  function clearMessages() {
    setError("");
    setSuccess("");
  }

  function validate() {
    if (!form.title.trim()) {
      return "Please enter a scheme title.";
    }

    if (!form.curriculum_id) {
      return "Please select a curriculum.";
    }

    if (!form.education_level_id) {
      return "Please select an education level.";
    }

    if (!form.grade_id) {
      return "Please select a grade.";
    }

    if (!form.subject_id) {
      return "Please select a subject.";
    }

    if (!form.term_id) {
      return "Please select a term.";
    }

    if (!form.academic_year.trim()) {
      return "Please enter the academic year.";
    }

    if (entries.length === 0) {
      return "Add at least one lesson to the scheme.";
    }

    return null;
  }

  async function saveScheme(
    status: "draft" | "published",
  ) {
    clearMessages();

    const validationError = validate();

    if (validationError) {
      setError(validationError);
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
      return;
    }

    setSaving(true);
    setSaveMode(status);

    try {
      const {
        data: {
          user,
        },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw new Error(userError.message);
      }

      if (!user) {
        throw new Error(
          "Your session has expired. Please sign in again.",
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
        throw new Error(teacherError.message);
      }

      if (!teacherProfile) {
        throw new Error(
          "Teacher profile not found. Complete teacher onboarding first.",
        );
      }

      const academicYear = Number.parseInt(
        form.academic_year,
        10,
      );

      if (
        Number.isNaN(academicYear) ||
        academicYear < 2000 ||
        academicYear > 2100
      ) {
        throw new Error(
          "Please enter a valid academic year between 2000 and 2100.",
        );
      }

      const {
        data: scheme,
        error: schemeError,
      } = await supabase
        .from("schemes_of_work")
        .insert({
          teacher_id: teacherProfile.id,
          title: form.title.trim(),
          curriculum_id: form.curriculum_id,
          education_level_id: form.education_level_id,
          grade_id: form.grade_id,
          subject_id: form.subject_id,
          term_id: form.term_id,
          academic_year: academicYear,
          status,
        })
        .select("id")
        .single();

      if (schemeError || !scheme) {
        throw new Error(
          schemeError?.message ??
            "Unable to create the scheme.",
        );
      }

      const entryRows = entries.map((entry) => ({
        scheme_id: scheme.id,
        week_number: entry.week_number,
        lesson_number: entry.lesson_number,
        strand: entry.strand.trim() || null,
        sub_strand: entry.sub_strand.trim() || null,
        topic: entry.topic.trim() || null,
        subtopic: entry.subtopic.trim() || null,
        specific_learning_outcomes:
          linesToArray(
            entry.specific_learning_outcomes,
          ),
        learning_experiences:
          entry.learning_experiences.trim() || null,
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
          entry.teacher_remarks.trim() || null,
      }));

      const {
        error: entriesError,
      } = await supabase
        .from("scheme_entries")
        .insert(entryRows);

      if (entriesError) {
        await supabase
          .from("schemes_of_work")
          .delete()
          .eq("id", scheme.id);

        throw new Error(entriesError.message);
      }

      setSuccess(
        status === "published"
          ? "Scheme published successfully."
          : "Scheme saved as a draft successfully.",
      );

      window.setTimeout(() => {
        window.location.href = `/teacher/schemes/${scheme.id}`;
      }, 700);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Something went wrong while saving the scheme.",
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } finally {
      setSaving(false);
      setSaveMode(null);
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />
            <p className="mt-3 text-sm font-medium text-slate-500">
              Loading scheme builder...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Messages */}
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-semibold text-red-700">
            {error}
          </p>
        </div>
      )}

      {success && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex items-center gap-2">
            <Check className="h-5 w-5 text-emerald-600" />
            <p className="text-sm font-semibold text-emerald-700">
              {success}
            </p>
          </div>
        </div>
      )}

      {/* Basic information */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
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
                Define the class and curriculum this scheme belongs
                to.
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
              value={form.title}
              onChange={(event) =>
                updateForm(
                  "title",
                  event.target.value,
                )
              }
              placeholder="e.g. Grade 6 Mathematics Scheme of Work - Term 1"
              className={inputClassName()}
            />
          </div>

          <div>
            <label className="text-sm font-bold text-slate-700">
              Curriculum
            </label>

            <select
              value={form.curriculum_id}
              onChange={(event) =>
                updateForm(
                  "curriculum_id",
                  event.target.value,
                )
              }
              className={inputClassName()}
            >
              <option value="">
                Select curriculum
              </option>

              {curricula.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-bold text-slate-700">
              Education Level
            </label>

            <select
              value={form.education_level_id}
              onChange={(event) =>
                updateForm(
                  "education_level_id",
                  event.target.value,
                )
              }
              className={inputClassName()}
            >
              <option value="">
                Select education level
              </option>

              {educationLevels.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-bold text-slate-700">
              Grade
            </label>

            <select
              value={form.grade_id}
              onChange={(event) =>
                updateForm(
                  "grade_id",
                  event.target.value,
                )
              }
              className={inputClassName()}
            >
              <option value="">
                Select grade
              </option>

              {grades.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-bold text-slate-700">
              Subject
            </label>

            <select
              value={form.subject_id}
              onChange={(event) =>
                updateForm(
                  "subject_id",
                  event.target.value,
                )
              }
              className={inputClassName()}
            >
              <option value="">
                Select subject
              </option>

              {subjects.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-bold text-slate-700">
              Term
            </label>

            <select
              value={form.term_id}
              onChange={(event) =>
                updateForm(
                  "term_id",
                  event.target.value,
                )
              }
              className={inputClassName()}
            >
              <option value="">
                Select term
              </option>

              {terms.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
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
              value={form.academic_year}
              onChange={(event) =>
                updateForm(
                  "academic_year",
                  event.target.value,
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
                  Build your scheme lesson by lesson.
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
          {entries.map((entry, index) => (
            <article
              key={entry.id}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
            >
              {/* Entry header */}
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
                      Complete the learning plan for this lesson.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      moveEntry(entry.id, "up")
                    }
                    disabled={index === 0}
                    className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 transition hover:border-blue-200 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-30"
                    title="Move up"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      moveEntry(entry.id, "down")
                    }
                    disabled={
                      index === entries.length - 1
                    }
                    className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 transition hover:border-blue-200 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-30"
                    title="Move down"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      duplicateEntry(entry.id)
                    }
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 transition hover:border-blue-200 hover:text-blue-600"
                  >
                    Duplicate
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      removeEntry(entry.id)
                    }
                    disabled={entries.length === 1}
                    className="rounded-lg border border-red-100 bg-white p-2 text-red-500 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-30"
                    title="Delete lesson"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Entry details */}
              <div className="space-y-6 p-4 sm:p-6">
                {/* Week / lesson */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-sm font-bold text-slate-700">
                      Week Number
                    </label>

                    <input
                      type="number"
                      min="1"
                      value={entry.week_number ?? ""}
                      onChange={(event) =>
                        updateEntry(
                          entry.id,
                          "week_number",
                          event.target.value
                            ? Number(event.target.value)
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
                      value={entry.lesson_number ?? ""}
                      onChange={(event) =>
                        updateEntry(
                          entry.id,
                          "lesson_number",
                          event.target.value
                            ? Number(event.target.value)
                            : null,
                        )
                      }
                      className={inputClassName()}
                    />
                  </div>
                </div>

                {/* Strand */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-sm font-bold text-slate-700">
                      Strand
                    </label>

                    <input
                      type="text"
                      value={entry.strand}
                      onChange={(event) =>
                        updateEntry(
                          entry.id,
                          "strand",
                          event.target.value,
                        )
                      }
                      placeholder="e.g. Numbers"
                      className={inputClassName()}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-bold text-slate-700">
                      Sub-Strand
                    </label>

                    <input
                      type="text"
                      value={entry.sub_strand}
                      onChange={(event) =>
                        updateEntry(
                          entry.id,
                          "sub_strand",
                          event.target.value,
                        )
                      }
                      placeholder="e.g. Whole Numbers"
                      className={inputClassName()}
                    />
                  </div>
                </div>

                {/* Topic */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-sm font-bold text-slate-700">
                      Topic
                    </label>

                    <input
                      type="text"
                      value={entry.topic}
                      onChange={(event) =>
                        updateEntry(
                          entry.id,
                          "topic",
                          event.target.value,
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
                      value={entry.subtopic}
                      onChange={(event) =>
                        updateEntry(
                          entry.id,
                          "subtopic",
                          event.target.value,
                        )
                      }
                      placeholder="Enter subtopic"
                      className={inputClassName()}
                    />
                  </div>
                </div>

                {/* SLO */}
                <div>
                  <label className="text-sm font-bold text-slate-700">
                    Specific Learning Outcomes
                  </label>

                  <p className="mt-1 text-xs text-slate-400">
                    Enter one outcome per line.
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
                    placeholder={`By the end of the lesson, the learner should be able to:\nIdentify...\nExplain...\nApply...`}
                    className={`${inputClassName()} resize-y`}
                  />
                </div>

                {/* Learning experiences */}
                <div>
                  <label className="text-sm font-bold text-slate-700">
                    Learning Experiences
                  </label>

                  <p className="mt-1 text-xs text-slate-400">
                    Describe the activities learners will undertake.
                  </p>

                  <textarea
                    rows={6}
                    value={entry.learning_experiences}
                    onChange={(event) =>
                      updateEntry(
                        entry.id,
                        "learning_experiences",
                        event.target.value,
                      )
                    }
                    placeholder="Describe introduction, teacher activities, learner activities, group work, practical activities and conclusion..."
                    className={`${inputClassName()} resize-y`}
                  />
                </div>

                {/* Inquiry questions */}
                <div>
                  <label className="text-sm font-bold text-slate-700">
                    Key Inquiry Questions
                  </label>

                  <p className="mt-1 text-xs text-slate-400">
                    Enter one question per line.
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
                    placeholder={`What is...?\nHow can...?\nWhy do we...?`}
                    className={`${inputClassName()} resize-y`}
                  />
                </div>

                {/* Resources / assessment */}
                <div className="grid gap-5 lg:grid-cols-2">
                  <div>
                    <label className="text-sm font-bold text-slate-700">
                      Learning Resources
                    </label>

                    <p className="mt-1 text-xs text-slate-400">
                      Enter one resource per line.
                    </p>

                    <textarea
                      rows={5}
                      value={entry.learning_resources}
                      onChange={(event) =>
                        updateEntry(
                          entry.id,
                          "learning_resources",
                          event.target.value,
                        )
                      }
                      placeholder={`Learner's book\nCharts\nManila paper\nDigital resources`}
                      className={`${inputClassName()} resize-y`}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-bold text-slate-700">
                      Assessment Methods
                    </label>

                    <p className="mt-1 text-xs text-slate-400">
                      Enter one assessment method per line.
                    </p>

                    <textarea
                      rows={5}
                      value={entry.assessment_methods}
                      onChange={(event) =>
                        updateEntry(
                          entry.id,
                          "assessment_methods",
                          event.target.value,
                        )
                      }
                      placeholder={`Observation\nOral questions\nWritten exercise\nGroup activity`}
                      className={`${inputClassName()} resize-y`}
                    />
                  </div>
                </div>

                {/* Remarks */}
                <div>
                  <label className="text-sm font-bold text-slate-700">
                    Teacher Remarks
                  </label>

                  <textarea
                    rows={3}
                    value={entry.teacher_remarks}
                    onChange={(event) =>
                      updateEntry(
                        entry.id,
                        "teacher_remarks",
                        event.target.value,
                      )
                    }
                    placeholder="Add notes, reflections or follow-up actions..."
                    className={`${inputClassName()} resize-y`}
                  />
                </div>
              </div>
            </article>
          ))}

          {/* Add lesson controls */}
          <div className="flex flex-col gap-3 rounded-2xl border border-dashed border-blue-200 bg-blue-50/50 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-black text-slate-900">
                Need another lesson?
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Continue building your scheme week by week.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={addEntry}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
                Add Lesson
              </button>

              <button
                type="button"
                onClick={() =>
                  addLessonForWeek(
                    entries[entries.length - 1]
                      ?.week_number ?? 1,
                  )
                }
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-200 bg-white px-4 py-2.5 text-sm font-bold text-blue-700 transition hover:bg-blue-50"
              >
                <CalendarDays className="h-4 w-4" />
                Add Same Week
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom actions */}
      <section className="sticky bottom-4 z-20 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-2xl backdrop-blur sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <WandSparkles className="h-5 w-5 text-blue-600" />

              <p className="text-sm font-black text-slate-900">
                {entries.length} lesson
                {entries.length === 1 ? "" : "s"} prepared
              </p>
            </div>

            <p className="mt-1 text-xs text-slate-500">
              Save your work now and continue editing later.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Link
              href="/teacher/schemes"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
            >
              <ChevronLeft className="h-4 w-4" />
              Cancel
            </Link>

            <button
              type="button"
              disabled={saving}
              onClick={() => saveScheme("draft")}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-5 py-3 text-sm font-bold text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving && saveMode === "draft" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}

              Save Draft
            </button>

            <button
              type="button"
              disabled={saving}
              onClick={() => saveScheme("published")}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving && saveMode === "published" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}

              Publish Scheme
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}