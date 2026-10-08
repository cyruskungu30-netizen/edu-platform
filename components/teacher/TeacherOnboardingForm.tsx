"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Check,
  GraduationCap,
  Loader2,
  School,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

type TaxonomyItem = {
  id: string;
  name: string;
};

type TeacherOnboardingFormProps = {
  userId: string;
  userEmail: string;
  subjects: TaxonomyItem[];
  educationLevels: TaxonomyItem[];
};

export default function TeacherOnboardingForm({
  userId,
  userEmail,
  subjects,
  educationLevels,
}: TeacherOnboardingFormProps) {
  const router = useRouter();

  const [displayName, setDisplayName] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [county, setCounty] = useState("");
  const [tscNumber, setTscNumber] = useState("");

  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(
    [],
  );

  const [selectedLevels, setSelectedLevels] = useState<string[]>(
    [],
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const supabase = createClient();

  function toggleSubject(subjectName: string) {
    setSelectedSubjects((current) =>
      current.includes(subjectName)
        ? current.filter((item) => item !== subjectName)
        : [...current, subjectName],
    );
  }

  function toggleLevel(levelName: string) {
    setSelectedLevels((current) =>
      current.includes(levelName)
        ? current.filter((item) => item !== levelName)
        : [...current, levelName],
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErrorMessage("");

    const cleanDisplayName = displayName.trim();
    const cleanSchoolName = schoolName.trim();
    const cleanCounty = county.trim();
    const cleanTscNumber = tscNumber.trim();

    if (!cleanDisplayName) {
      setErrorMessage("Please enter your display name.");
      return;
    }

    if (!cleanSchoolName) {
      setErrorMessage("Please enter your school or institution.");
      return;
    }

    if (!cleanCounty) {
      setErrorMessage("Please enter your county.");
      return;
    }

    if (selectedSubjects.length === 0) {
      setErrorMessage("Please select at least one subject.");
      return;
    }

    if (selectedLevels.length === 0) {
      setErrorMessage(
        "Please select at least one education level.",
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const { error: teacherError } = await supabase
        .from("teacher_profiles")
        .insert({
          user_id: userId,
          display_name: cleanDisplayName,
          school_name: cleanSchoolName,
          county: cleanCounty,
          tsc_number: cleanTscNumber || null,
          subjects: selectedSubjects,
          education_levels: selectedLevels,
          verification_status: "pending",
          is_verified: false,
        });

      if (teacherError) {
        if (teacherError.code === "23505") {
          router.replace("/teacher");
          router.refresh();
          return;
        }

        throw teacherError;
      }

      await supabase
        .from("profiles")
        .update({
          full_name: cleanDisplayName,
        })
        .eq("id", userId);

      router.replace("/teacher");
      router.refresh();
    } catch (error) {
      console.error("Teacher onboarding failed:", error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "We could not create your teacher profile. Please try again.",
      );

      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/50"
    >
      <div className="border-b border-slate-200 bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 px-6 py-7 text-white sm:px-8">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10 backdrop-blur">
            <GraduationCap size={24} />
          </div>

          <div>
            <h2 className="text-xl font-bold">
              Your teaching profile
            </h2>

            <p className="mt-1 text-sm leading-6 text-blue-100">
              This information helps EduMarket personalize your
              teaching tools.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-8 p-6 sm:p-8">
        <section>
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <School size={18} />
            </div>

            <div>
              <h3 className="font-bold text-slate-900">
                Basic information
              </h3>

              <p className="text-xs text-slate-500">
                Tell us who you are and where you teach.
              </p>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label
                htmlFor="displayName"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Display name
              </label>

              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(event) =>
                  setDisplayName(event.target.value)
                }
                placeholder="e.g. Kush Kungu"
                autoComplete="name"
                className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Account email
              </label>

              <input
                id="email"
                type="email"
                value={userEmail}
                readOnly
                className="h-12 w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-500 outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="schoolName"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                School / institution
              </label>

              <input
                id="schoolName"
                type="text"
                value={schoolName}
                onChange={(event) =>
                  setSchoolName(event.target.value)
                }
                placeholder="e.g. Example Secondary School"
                autoComplete="organization"
                className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div>
              <label
                htmlFor="county"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                County
              </label>

              <input
                id="county"
                type="text"
                value={county}
                onChange={(event) =>
                  setCounty(event.target.value)
                }
                placeholder="e.g. Nakuru"
                autoComplete="address-level1"
                className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div className="md:col-span-2">
              <label
                htmlFor="tscNumber"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                TSC number
                <span className="ml-2 font-normal text-slate-400">
                  Optional
                </span>
              </label>

              <input
                id="tscNumber"
                type="text"
                value={tscNumber}
                onChange={(event) =>
                  setTscNumber(event.target.value)
                }
                placeholder="Enter your TSC number if applicable"
                autoComplete="off"
                className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />

              <p className="mt-2 text-xs text-slate-400">
                You can leave this blank and add it later.
              </p>
            </div>
          </div>
        </section>

        <section>
          <div className="mb-4">
            <h3 className="font-bold text-slate-900">
              Subjects you teach
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Select every subject you currently teach.
            </p>
          </div>

          {subjects.length === 0 ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
              No subjects are currently available. You can still
              continue after the administrator adds subjects.
            </div>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {subjects.map((subject) => {
                const selected = selectedSubjects.includes(
                  subject.name,
                );

                return (
                  <button
                    key={subject.id}
                    type="button"
                    onClick={() => toggleSubject(subject.name)}
                    className={[
                      "flex min-h-12 items-center justify-between rounded-xl border px-4 py-3 text-left text-sm font-medium transition",
                      selected
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-slate-50",
                    ].join(" ")}
                  >
                    <span>{subject.name}</span>

                    {selected && (
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white">
                        <Check size={14} />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          <p className="mt-3 text-xs text-slate-400">
            {selectedSubjects.length} subject
            {selectedSubjects.length === 1 ? "" : "s"} selected
          </p>
        </section>

        <section>
          <div className="mb-4">
            <h3 className="font-bold text-slate-900">
              Education levels
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Select the education levels you work with.
            </p>
          </div>

          {educationLevels.length === 0 ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
              No education levels are currently available.
            </div>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {educationLevels.map((level) => {
                const selected = selectedLevels.includes(
                  level.name,
                );

                return (
                  <button
                    key={level.id}
                    type="button"
                    onClick={() => toggleLevel(level.name)}
                    className={[
                      "flex min-h-12 items-center justify-between rounded-xl border px-4 py-3 text-left text-sm font-medium transition",
                      selected
                        ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                        : "border-slate-200 bg-white text-slate-700 hover:border-indigo-200 hover:bg-slate-50",
                    ].join(" ")}
                  >
                    <span>{level.name}</span>

                    {selected && (
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-white">
                        <Check size={14} />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          <p className="mt-3 text-xs text-slate-400">
            {selectedLevels.length} level
            {selectedLevels.length === 1 ? "" : "s"} selected
          </p>
        </section>

        {errorMessage && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium leading-6 text-red-700"
          >
            {errorMessage}
          </div>
        )}

        <div className="border-t border-slate-200 pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-md text-xs leading-5 text-slate-400">
              You can update your teacher profile later from your
              workspace settings.
            </p>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 text-sm font-bold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader2
                    size={18}
                    className="animate-spin"
                  />
                  Creating profile...
                </>
              ) : (
                <>
                  Enter Teacher Workspace
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}