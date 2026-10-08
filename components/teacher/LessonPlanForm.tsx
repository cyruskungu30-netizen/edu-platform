"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Check,
  Clock3,
  FileText,
  Loader2,
  Save,
  Sparkles,
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

type LessonPlanFormProps = {
  userId: string;
  curricula: Item[];
  educationLevels: Item[];
  grades: Grade[];
  subjects: Item[];
  terms: Item[];
};

function splitLines(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function LessonPlanForm({
  userId,
  curricula,
  educationLevels,
  grades,
  subjects,
  terms,
}: LessonPlanFormProps) {
  const router = useRouter();
  const supabase = createClient();

  const [title, setTitle] = useState("");
  const [curriculumId, setCurriculumId] = useState("");
  const [educationLevelId, setEducationLevelId] = useState("");
  const [gradeId, setGradeId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [termId, setTermId] = useState("");

  const [weekNumber, setWeekNumber] = useState("");
  const [lessonNumber, setLessonNumber] = useState("");
  const [topic, setTopic] = useState("");
  const [subtopic, setSubtopic] = useState("");

  const [objectives, setObjectives] = useState("");
  const [competencies, setCompetencies] = useState("");
  const [values, setValues] = useState("");
  const [resources, setResources] = useState("");

  const [introduction, setIntroduction] = useState("");
  const [lessonActivities, setLessonActivities] =
    useState("");
  const [assessment, setAssessment] = useState("");
  const [conclusion, setConclusion] = useState("");
  const [teacherNotes, setTeacherNotes] = useState("");

  const [durationMinutes, setDurationMinutes] =
    useState("40");

  const [status, setStatus] = useState<
    "draft" | "published"
  >("draft");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const filteredGrades = useMemo(() => {
    if (!educationLevelId) {
      return grades;
    }

    return grades.filter(
      (grade) =>
        grade.education_level_id === educationLevelId,
    );
  }, [grades, educationLevelId]);

  function handleEducationLevelChange(value: string) {
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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErrorMessage("");

    const cleanTitle = title.trim();

    if (!cleanTitle) {
      setErrorMessage("Please enter a lesson plan title.");
      return;
    }

    if (!subjectId) {
      setErrorMessage("Please select a subject.");
      return;
    }

    if (!educationLevelId) {
      setErrorMessage("Please select an education level.");
      return;
    }

    if (!gradeId) {
      setErrorMessage("Please select a grade.");
      return;
    }

    if (!topic.trim()) {
      setErrorMessage("Please enter the lesson topic.");
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

    setIsSubmitting(true);

    try {
      const {
        data: teacherProfile,
        error: teacherError,
      } = await supabase
        .from("teacher_profiles")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      if (teacherError) {
        throw teacherError;
      }

      if (!teacherProfile) {
        throw new Error(
          "Your teacher profile could not be found.",
        );
      }

      const { data: createdPlan, error: insertError } =
        await supabase
          .from("lesson_plans")
          .insert({
            teacher_id: teacherProfile.id,
            title: cleanTitle,

            curriculum_id: curriculumId || null,
            education_level_id: educationLevelId || null,
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
            subtopic: subtopic.trim() || null,

            objectives: splitLines(objectives),
            competencies: splitLines(competencies),
            values: splitLines(values),
            resources: splitLines(resources),

            introduction: introduction.trim() || null,
            lesson_activities:
              lessonActivities.trim() || null,
            assessment: assessment.trim() || null,
            conclusion: conclusion.trim() || null,
            teacher_notes: teacherNotes.trim() || null,

            duration_minutes: duration,

            status,
          })
          .select("id")
          .single();

      if (insertError) {
        throw insertError;
      }

      if (!createdPlan) {
        throw new Error(
          "The lesson plan was created but could not be opened.",
        );
      }

      router.push(
        `/teacher/lesson-plans/${createdPlan.id}`,
      );

      router.refresh();
    } catch (error) {
      console.error("Lesson plan creation failed:", error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "We could not save your lesson plan. Please try again.",
      );

      setIsSubmitting(false);
    }
  }

  const inputClass =
    "h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100";

  const selectClass =
    "h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100";

  const textareaClass =
    "min-h-[130px] w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100";

  return (
    <form
      onSubmit={handleSubmit}
      className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
    >
      <div className="border-b border-slate-200 bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 p-6 text-white sm:p-8">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10">
            <BookOpen size={24} />
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-blue-100">
              Lesson Plan Builder
            </p>

            <h2 className="mt-1 text-2xl font-bold">
              Build your lesson
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100">
              Complete the sections below. You can save the plan
              as a draft and refine it later.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-10 p-6 sm:p-8">
        <section>
          <div className="mb-5">
            <h3 className="text-lg font-bold text-slate-900">
              1. Lesson information
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Identify the class, curriculum and lesson.
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
                  setTitle(event.target.value)
                }
                placeholder="e.g. Introduction to Fractions"
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
                  setCurriculumId(event.target.value)
                }
                className={selectClass}
              >
                <option value="">Select curriculum</option>

                {curricula.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
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

                {educationLevels.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
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
                  setGradeId(event.target.value)
                }
                className={selectClass}
              >
                <option value="">Select grade</option>

                {filteredGrades.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
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
                  setSubjectId(event.target.value)
                }
                className={selectClass}
              >
                <option value="">Select subject</option>

                {subjects.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
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
                  setTermId(event.target.value)
                }
                className={selectClass}
              >
                <option value="">Select term</option>

                {terms.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
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
                  setWeekNumber(event.target.value)
                }
                placeholder="e.g. 3"
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
                  setLessonNumber(event.target.value)
                }
                placeholder="e.g. 2"
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
                  setTopic(event.target.value)
                }
                placeholder="e.g. Fractions"
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
                  setSubtopic(event.target.value)
                }
                placeholder="e.g. Adding fractions"
                className={inputClass}
              />
            </div>
          </div>
        </section>

        <section>
          <div className="mb-5">
            <h3 className="text-lg font-bold text-slate-900">
              2. Learning framework
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Add the outcomes and resources that guide the
              lesson.
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
                  setObjectives(event.target.value)
                }
                placeholder={`One objective per line\nExplain what a fraction represents\nIdentify numerator and denominator`}
                className={textareaClass}
              />

              <p className="mt-2 text-xs text-slate-400">
                Enter one objective per line.
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
                  setCompetencies(event.target.value)
                }
                placeholder={`One competency per line\nCommunication\nCritical thinking`}
                className={textareaClass}
              />

              <p className="mt-2 text-xs text-slate-400">
                Enter one competency per line.
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
                  setValues(event.target.value)
                }
                placeholder={`One value per line\nResponsibility\nRespect`}
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
                  setResources(event.target.value)
                }
                placeholder={`One resource per line\nTextbook\nChalkboard\nFraction cards`}
                className={textareaClass}
              />
            </div>
          </div>
        </section>

        <section>
          <div className="mb-5">
            <h3 className="text-lg font-bold text-slate-900">
              3. Lesson flow
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Structure exactly how you intend to teach the lesson.
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
                  setIntroduction(event.target.value)
                }
                placeholder="Describe how you will introduce the lesson..."
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
                  setLessonActivities(event.target.value)
                }
                placeholder="Describe teacher activities, learner activities, group work, demonstrations and other learning experiences..."
                className="min-h-[190px] w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
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
                  setAssessment(event.target.value)
                }
                placeholder="Describe how learners will be assessed..."
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
                  setConclusion(event.target.value)
                }
                placeholder="Describe how you will conclude the lesson..."
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
                  setTeacherNotes(event.target.value)
                }
                placeholder="Private notes, reminders or follow-up actions..."
                className={textareaClass}
              />
            </div>
          </div>
        </section>

        <section>
          <div className="mb-5">
            <h3 className="text-lg font-bold text-slate-900">
              4. Lesson settings
            </h3>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label
                htmlFor="duration"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Duration
              </label>

              <div className="relative">
                <Clock3
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

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
                  className={`${inputClass} pl-11 pr-20`}
                />

                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                  minutes
                </span>
              </div>
            </div>

            <div>
              <label
                htmlFor="status"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Save status
              </label>

              <select
                id="status"
                value={status}
                onChange={(event) =>
                  setStatus(
                    event.target.value as
                      | "draft"
                      | "published",
                  )
                }
                className={selectClass}
              >
                <option value="draft">
                  Draft — continue editing later
                </option>

                <option value="published">
                  Published — ready to use
                </option>
              </select>
            </div>
          </div>
        </section>

        {errorMessage && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium leading-6 text-red-700"
          >
            {errorMessage}
          </div>
        )}

        <div className="flex flex-col gap-4 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Sparkles size={15} />
            AI assistance will be added to this builder in the next
            phase.
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-7 text-sm font-bold text-white shadow-lg shadow-blue-100 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? (
              <>
                <Loader2
                  size={18}
                  className="animate-spin"
                />
                Saving lesson plan...
              </>
            ) : (
              <>
                <Save size={18} />
                Save Lesson Plan
                <Check size={17} />
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}