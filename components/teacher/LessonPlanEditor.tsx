"use client";

import {
  FormEvent,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  Archive,
  ArrowLeft,
  Check,
  Copy,
  FileText,
  Loader2,
  Save,
  Sparkles,
  Trash2,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

type Item = {
  id: string;
  name: string;
};

type Grade = {
  id: string;
  name: string;
  education_level_id: string | null;
};

type LessonPlan = {
  id: string;
  teacher_id: string;
  title: string;

  curriculum_id: string | null;
  education_level_id: string | null;
  grade_id: string | null;
  subject_id: string | null;
  term_id: string | null;

  week_number: number | null;
  lesson_number: number | null;

  topic: string | null;
  subtopic: string | null;

  objectives: string[] | null;
  competencies: string[] | null;
  values: string[] | null;
  resources: string[] | null;

  introduction: string | null;
  lesson_activities: string | null;
  assessment: string | null;
  conclusion: string | null;
  teacher_notes: string | null;

  duration_minutes: number | null;

  status: "draft" | "published" | "archived";

  created_at: string;
  updated_at: string;
};

type LessonPlanEditorProps = {
  lessonPlan: LessonPlan;
  curricula: Item[];
  educationLevels: Item[];
  grades: Grade[];
  subjects: Item[];
  terms: Item[];
};

function joinLines(value: string[] | null) {
  if (!Array.isArray(value)) {
    return "";
  }

  return value.join("\n");
}

function splitLines(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function LessonPlanEditor({
  lessonPlan,
  curricula,
  educationLevels,
  grades,
  subjects,
  terms,
}: LessonPlanEditorProps) {
  const router = useRouter();
  const supabase = createClient();

  const [title, setTitle] = useState(
    lessonPlan.title,
  );

  const [curriculumId, setCurriculumId] =
    useState(lessonPlan.curriculum_id ?? "");

  const [educationLevelId, setEducationLevelId] =
    useState(
      lessonPlan.education_level_id ?? "",
    );

  const [gradeId, setGradeId] = useState(
    lessonPlan.grade_id ?? "",
  );

  const [subjectId, setSubjectId] = useState(
    lessonPlan.subject_id ?? "",
  );

  const [termId, setTermId] = useState(
    lessonPlan.term_id ?? "",
  );

  const [weekNumber, setWeekNumber] = useState(
    lessonPlan.week_number?.toString() ?? "",
  );

  const [lessonNumber, setLessonNumber] =
    useState(
      lessonPlan.lesson_number?.toString() ?? "",
    );

  const [topic, setTopic] = useState(
    lessonPlan.topic ?? "",
  );

  const [subtopic, setSubtopic] = useState(
    lessonPlan.subtopic ?? "",
  );

  const [objectives, setObjectives] = useState(
    joinLines(lessonPlan.objectives),
  );

  const [competencies, setCompetencies] =
    useState(
      joinLines(lessonPlan.competencies),
    );

  const [values, setValues] = useState(
    joinLines(lessonPlan.values),
  );

  const [resources, setResources] = useState(
    joinLines(lessonPlan.resources),
  );

  const [introduction, setIntroduction] =
    useState(
      lessonPlan.introduction ?? "",
    );

  const [lessonActivities, setLessonActivities] =
    useState(
      lessonPlan.lesson_activities ?? "",
    );

  const [assessment, setAssessment] = useState(
    lessonPlan.assessment ?? "",
  );

  const [conclusion, setConclusion] =
    useState(
      lessonPlan.conclusion ?? "",
    );

  const [teacherNotes, setTeacherNotes] =
    useState(
      lessonPlan.teacher_notes ?? "",
    );

  const [durationMinutes, setDurationMinutes] =
    useState(
      lessonPlan.duration_minutes?.toString() ??
        "40",
    );

  const [status, setStatus] = useState<
    "draft" | "published" | "archived"
  >(lessonPlan.status);

  const [isSaving, setIsSaving] = useState(false);
  const [isDuplicating, setIsDuplicating] =
    useState(false);
  const [isArchiving, setIsArchiving] =
    useState(false);
  const [isDeleting, setIsDeleting] =
    useState(false);

  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] =
    useState("");

  const filteredGrades = useMemo(() => {
    if (!educationLevelId) {
      return grades;
    }

    return grades.filter(
      (grade) =>
        grade.education_level_id ===
        educationLevelId,
    );
  }, [grades, educationLevelId]);

  function handleEducationLevelChange(
    value: string,
  ) {
    setEducationLevelId(value);

    if (
      gradeId &&
      !grades.some(
        (grade) =>
          grade.id === gradeId &&
          grade.education_level_id === value,
      )
    ) {
      setGradeId("");
    }
  }

  function clearMessages() {
    setMessage("");
    setErrorMessage("");
  }

  async function handleSave(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    clearMessages();

    const cleanTitle = title.trim();

    if (!cleanTitle) {
      setErrorMessage(
        "Please enter a lesson plan title.",
      );
      return;
    }

    if (!subjectId) {
      setErrorMessage(
        "Please select a subject.",
      );
      return;
    }

    if (!educationLevelId) {
      setErrorMessage(
        "Please select an education level.",
      );
      return;
    }

    if (!gradeId) {
      setErrorMessage(
        "Please select a grade.",
      );
      return;
    }

    if (!topic.trim()) {
      setErrorMessage(
        "Please enter the lesson topic.",
      );
      return;
    }

    const duration = Number(durationMinutes);

    if (
      !Number.isFinite(duration) ||
      duration < 1 ||
      duration > 600
    ) {
      setErrorMessage(
        "Lesson duration must be between 1 and 600 minutes.",
      );
      return;
    }

    setIsSaving(true);

    try {
      const { error } = await supabase
        .from("lesson_plans")
        .update({
          title: cleanTitle,

          curriculum_id:
            curriculumId || null,

          education_level_id:
            educationLevelId || null,

          grade_id: gradeId || null,

          subject_id: subjectId || null,

          term_id: termId || null,

          week_number: weekNumber
            ? Number(weekNumber)
            : null,

          lesson_number: lessonNumber
            ? Number(lessonNumber)
            : null,

          topic: topic.trim() || null,

          subtopic:
            subtopic.trim() || null,

          objectives:
            splitLines(objectives),

          competencies:
            splitLines(competencies),

          values: splitLines(values),

          resources:
            splitLines(resources),

          introduction:
            introduction.trim() || null,

          lesson_activities:
            lessonActivities.trim() || null,

          assessment:
            assessment.trim() || null,

          conclusion:
            conclusion.trim() || null,

          teacher_notes:
            teacherNotes.trim() || null,

          duration_minutes: duration,

          status,
        })
        .eq("id", lessonPlan.id);

      if (error) {
        throw error;
      }

      setMessage(
        "Lesson plan saved successfully.",
      );

      router.refresh();
    } catch (error) {
      console.error(
        "Lesson plan update failed:",
        error,
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "We could not save the lesson plan.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDuplicate() {
    clearMessages();

    setIsDuplicating(true);

    try {
      const { data, error } = await supabase
        .from("lesson_plans")
        .insert({
          teacher_id:
            lessonPlan.teacher_id,

          title: `${title.trim() || lessonPlan.title} — Copy`,

          curriculum_id:
            curriculumId || null,

          education_level_id:
            educationLevelId || null,

          grade_id:
            gradeId || null,

          subject_id:
            subjectId || null,

          term_id:
            termId || null,

          week_number: weekNumber
            ? Number(weekNumber)
            : null,

          lesson_number: lessonNumber
            ? Number(lessonNumber)
            : null,

          topic:
            topic.trim() || null,

          subtopic:
            subtopic.trim() || null,

          objectives:
            splitLines(objectives),

          competencies:
            splitLines(competencies),

          values:
            splitLines(values),

          resources:
            splitLines(resources),

          introduction:
            introduction.trim() || null,

          lesson_activities:
            lessonActivities.trim() || null,

          assessment:
            assessment.trim() || null,

          conclusion:
            conclusion.trim() || null,

          teacher_notes:
            teacherNotes.trim() || null,

          duration_minutes:
            Number(durationMinutes) || 40,

          status: "draft",
        })
        .select("id")
        .single();

      if (error) {
        throw error;
      }

      if (!data) {
        throw new Error(
          "The duplicate was created but could not be opened.",
        );
      }

      router.push(
        `/teacher/lesson-plans/${data.id}`,
      );

      router.refresh();
    } catch (error) {
      console.error(
        "Lesson plan duplication failed:",
        error,
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "We could not duplicate this lesson plan.",
      );

      setIsDuplicating(false);
    }
  }

  async function handleArchive() {
    clearMessages();

    const confirmed = window.confirm(
      "Archive this lesson plan? You can no longer treat it as an active lesson plan.",
    );

    if (!confirmed) {
      return;
    }

    setIsArchiving(true);

    try {
      const { error } = await supabase
        .from("lesson_plans")
        .update({
          status: "archived",
        })
        .eq("id", lessonPlan.id);

      if (error) {
        throw error;
      }

      router.push(
        "/teacher/lesson-plans",
      );

      router.refresh();
    } catch (error) {
      console.error(
        "Lesson plan archive failed:",
        error,
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "We could not archive this lesson plan.",
      );

      setIsArchiving(false);
    }
  }

  async function handleDelete() {
    clearMessages();

    const confirmed = window.confirm(
      "Delete this lesson plan permanently? This action cannot be undone.",
    );

    if (!confirmed) {
      return;
    }

    setIsDeleting(true);

    try {
      const { error } = await supabase
        .from("lesson_plans")
        .delete()
        .eq("id", lessonPlan.id);

      if (error) {
        throw error;
      }

      router.push(
        "/teacher/lesson-plans",
      );

      router.refresh();
    } catch (error) {
      console.error(
        "Lesson plan deletion failed:",
        error,
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "We could not delete this lesson plan.",
      );

      setIsDeleting(false);
    }
  }

  const inputClass =
    "h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100";

  const selectClass =
    "h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100";

  const textareaClass =
    "min-h-[130px] w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100";

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <span
            className={[
              "rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-wide",
              status === "published"
                ? "bg-emerald-50 text-emerald-700"
                : status === "archived"
                  ? "bg-slate-100 text-slate-600"
                  : "bg-amber-50 text-amber-700",
            ].join(" ")}
          >
            {status}
          </span>

          <span className="text-xs text-slate-400">
            Last updated{" "}
            {new Date(
              lessonPlan.updated_at,
            ).toLocaleDateString()}
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleDuplicate}
            disabled={
              isDuplicating ||
              isSaving ||
              isArchiving ||
              isDeleting
            }
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            {isDuplicating ? (
              <Loader2
                size={15}
                className="animate-spin"
              />
            ) : (
              <Copy size={15} />
            )}

            Duplicate
          </button>

          <button
            type="button"
            onClick={handleArchive}
            disabled={
              isArchiving ||
              isSaving ||
              isDuplicating ||
              isDeleting ||
              status === "archived"
            }
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            {isArchiving ? (
              <Loader2
                size={15}
                className="animate-spin"
              />
            ) : (
              <Archive size={15} />
            )}

            Archive
          </button>

          {status === "draft" && (
            <button
              type="button"
              onClick={() =>
                setStatus("published")
              }
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-3.5 py-2.5 text-xs font-bold text-white transition hover:bg-emerald-700"
            >
              <Check size={15} />
              Publish
            </button>
          )}
        </div>
      </div>

      <form
        onSubmit={handleSave}
        className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
      >
        <div className="border-b border-slate-200 bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 p-6 text-white sm:p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10">
              <FileText size={24} />
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-blue-100">
                Lesson Plan Editor
              </p>

              <h2 className="mt-1 text-2xl font-bold">
                {title || "Untitled lesson plan"}
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100">
                Make changes to your lesson plan and save them
                securely to your teacher workspace.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-10 p-6 sm:p-8">
          <section>
            <div className="mb-5">
              <h3 className="text-lg font-bold text-slate-900">
                Lesson information
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Curriculum, class and lesson details.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div className="md:col-span-2">
                <label
                  htmlFor="title"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Lesson plan title
                </label>

                <input
                  id="title"
                  value={title}
                  onChange={(event) =>
                    setTitle(
                      event.target.value,
                    )
                  }
                  className={inputClass}
                />
              </div>

              <div>
                <label
                  htmlFor="curriculum"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Curriculum
                </label>

                <select
                  id="curriculum"
                  value={curriculumId}
                  onChange={(event) =>
                    setCurriculumId(
                      event.target.value,
                    )
                  }
                  className={selectClass}
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
                <label
                  htmlFor="educationLevel"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Education level
                </label>

                <select
                  id="educationLevel"
                  value={educationLevelId}
                  onChange={(event) =>
                    handleEducationLevelChange(
                      event.target.value,
                    )
                  }
                  className={selectClass}
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
                <label
                  htmlFor="grade"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Grade / class
                </label>

                <select
                  id="grade"
                  value={gradeId}
                  onChange={(event) =>
                    setGradeId(
                      event.target.value,
                    )
                  }
                  className={selectClass}
                >
                  <option value="">
                    Select grade
                  </option>

                  {filteredGrades.map(
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
                <label
                  htmlFor="subject"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Subject
                </label>

                <select
                  id="subject"
                  value={subjectId}
                  onChange={(event) =>
                    setSubjectId(
                      event.target.value,
                    )
                  }
                  className={selectClass}
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
                <label
                  htmlFor="term"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Term
                </label>

                <select
                  id="term"
                  value={termId}
                  onChange={(event) =>
                    setTermId(
                      event.target.value,
                    )
                  }
                  className={selectClass}
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
                <label
                  htmlFor="week"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Week number
                </label>

                <input
                  id="week"
                  type="number"
                  min="1"
                  max="52"
                  value={weekNumber}
                  onChange={(event) =>
                    setWeekNumber(
                      event.target.value,
                    )
                  }
                  className={inputClass}
                />
              </div>

              <div>
                <label
                  htmlFor="lesson"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Lesson number
                </label>

                <input
                  id="lesson"
                  type="number"
                  min="1"
                  max="100"
                  value={lessonNumber}
                  onChange={(event) =>
                    setLessonNumber(
                      event.target.value,
                    )
                  }
                  className={inputClass}
                />
              </div>

              <div>
                <label
                  htmlFor="topic"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Topic
                </label>

                <input
                  id="topic"
                  value={topic}
                  onChange={(event) =>
                    setTopic(
                      event.target.value,
                    )
                  }
                  className={inputClass}
                />
              </div>

              <div>
                <label
                  htmlFor="subtopic"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Subtopic
                </label>

                <input
                  id="subtopic"
                  value={subtopic}
                  onChange={(event) =>
                    setSubtopic(
                      event.target.value,
                    )
                  }
                  className={inputClass}
                />
              </div>
            </div>
          </section>

          <section>
            <div className="mb-5">
              <h3 className="text-lg font-bold text-slate-900">
                Learning framework
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Learning objectives, competencies, values and
                resources.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label
                  htmlFor="objectives"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Learning objectives
                </label>

                <textarea
                  id="objectives"
                  value={objectives}
                  onChange={(event) =>
                    setObjectives(
                      event.target.value,
                    )
                  }
                  className={textareaClass}
                />

                <p className="mt-2 text-xs text-slate-400">
                  One objective per line.
                </p>
              </div>

              <div>
                <label
                  htmlFor="competencies"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Competencies
                </label>

                <textarea
                  id="competencies"
                  value={competencies}
                  onChange={(event) =>
                    setCompetencies(
                      event.target.value,
                    )
                  }
                  className={textareaClass}
                />

                <p className="mt-2 text-xs text-slate-400">
                  One competency per line.
                </p>
              </div>

              <div>
                <label
                  htmlFor="values"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Values
                </label>

                <textarea
                  id="values"
                  value={values}
                  onChange={(event) =>
                    setValues(
                      event.target.value,
                    )
                  }
                  className={textareaClass}
                />
              </div>

              <div>
                <label
                  htmlFor="resources"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Learning resources
                </label>

                <textarea
                  id="resources"
                  value={resources}
                  onChange={(event) =>
                    setResources(
                      event.target.value,
                    )
                  }
                  className={textareaClass}
                />
              </div>
            </div>
          </section>

          <section>
            <div className="mb-5">
              <h3 className="text-lg font-bold text-slate-900">
                Lesson flow
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Structure the actual classroom experience.
              </p>
            </div>

            <div className="space-y-5">
              <div>
                <label
                  htmlFor="introduction"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Introduction
                </label>

                <textarea
                  id="introduction"
                  value={introduction}
                  onChange={(event) =>
                    setIntroduction(
                      event.target.value,
                    )
                  }
                  className={textareaClass}
                />
              </div>

              <div>
                <label
                  htmlFor="activities"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Lesson activities
                </label>

                <textarea
                  id="activities"
                  value={lessonActivities}
                  onChange={(event) =>
                    setLessonActivities(
                      event.target.value,
                    )
                  }
                  className="min-h-[190px] w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div>
                <label
                  htmlFor="assessment"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Assessment
                </label>

                <textarea
                  id="assessment"
                  value={assessment}
                  onChange={(event) =>
                    setAssessment(
                      event.target.value,
                    )
                  }
                  className={textareaClass}
                />
              </div>

              <div>
                <label
                  htmlFor="conclusion"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Conclusion
                </label>

                <textarea
                  id="conclusion"
                  value={conclusion}
                  onChange={(event) =>
                    setConclusion(
                      event.target.value,
                    )
                  }
                  className={textareaClass}
                />
              </div>

              <div>
                <label
                  htmlFor="teacherNotes"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Teacher notes
                </label>

                <textarea
                  id="teacherNotes"
                  value={teacherNotes}
                  onChange={(event) =>
                    setTeacherNotes(
                      event.target.value,
                    )
                  }
                  className={textareaClass}
                />
              </div>
            </div>
          </section>

          <section>
            <div className="mb-5">
              <h3 className="text-lg font-bold text-slate-900">
                Settings
              </h3>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label
                  htmlFor="duration"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Duration in minutes
                </label>

                <input
                  id="duration"
                  type="number"
                  min="1"
                  max="600"
                  value={durationMinutes}
                  onChange={(event) =>
                    setDurationMinutes(
                      event.target.value,
                    )
                  }
                  className={inputClass}
                />
              </div>

              <div>
                <label
                  htmlFor="status"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Status
                </label>

                <select
                  id="status"
                  value={status}
                  onChange={(event) =>
                    setStatus(
                      event.target.value as
                        | "draft"
                        | "published"
                        | "archived",
                    )
                  }
                  className={selectClass}
                >
                  <option value="draft">
                    Draft
                  </option>

                  <option value="published">
                    Published
                  </option>

                  <option value="archived">
                    Archived
                  </option>
                </select>
              </div>
            </div>
          </section>

          {message && (
            <div
              role="status"
              className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700"
            >
              {message}
            </div>
          )}

          {errorMessage && (
            <div
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium leading-6 text-red-700"
            >
              {errorMessage}
            </div>
          )}

          <div className="flex flex-col gap-4 border-t border-slate-200 pt-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Sparkles size={15} />

              <span>
                Your lesson plan is protected by your teacher
                workspace permissions.
              </span>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={handleDelete}
                disabled={
                  isDeleting ||
                  isSaving ||
                  isDuplicating ||
                  isArchiving
                }
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-red-200 px-5 text-sm font-bold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
              >
                {isDeleting ? (
                  <Loader2
                    size={17}
                    className="animate-spin"
                  />
                ) : (
                  <Trash2 size={17} />
                )}

                Delete
              </button>

              <button
                type="submit"
                disabled={
                  isSaving ||
                  isDuplicating ||
                  isArchiving ||
                  isDeleting
                }
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-7 text-sm font-bold text-white shadow-lg shadow-blue-100 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? (
                  <>
                    <Loader2
                      size={18}
                      className="animate-spin"
                    />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}