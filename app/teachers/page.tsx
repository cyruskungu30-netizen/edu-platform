 import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  GraduationCap,
  Search,
  BookOpen,
  ShieldCheck,
  ArrowRight,
  UserRound,
} from "lucide-react";

export const metadata = {
  title: "Find Teachers | EduMarket",
  description:
    "Discover educators and explore learning resources on EduMarket.",
};

type Teacher = {
  id: string;
  user_id: string;
  bio: string | null;
  subjects: string[] | null;
  is_verified: boolean;
  verification_status: string;
  profile?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  };
};

function TeachersLoading() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-20">
      <div className="mx-auto max-w-7xl animate-pulse">
        <div className="h-10 w-64 rounded-lg bg-slate-200" />
        <div className="mt-4 h-5 max-w-xl rounded bg-slate-200" />
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-64 rounded-3xl border border-slate-200 bg-white"
            />
          ))}
        </div>
      </div>
    </main>
  );
}

async function TeachersContent() {
  await connection();

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: teachers, error } = await supabase
    .from("teacher_profiles")
    .select(
      "id, user_id, bio, subjects, is_verified, verification_status",
    )
    .eq("is_verified", true)
    .eq("verification_status", "verified")
    .order("created_at", { ascending: false });

  const teacherIds = (teachers ?? []).map(
    (teacher) => teacher.user_id,
  );

  let profiles: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  }[] = [];

  if (teacherIds.length > 0) {
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url")
      .in("id", teacherIds);

    profiles = data ?? [];
  }

  const profileMap = new Map(
    profiles.map((profile) => [profile.id, profile]),
  );

  const teacherList: Teacher[] = (teachers ?? []).map(
    (teacher) => ({
      ...teacher,
      subjects: Array.isArray(teacher.subjects)
        ? (teacher.subjects as string[])
        : [],
      profile: profileMap.get(teacher.user_id),
    }),
  );

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="relative overflow-hidden bg-slate-950 px-6 py-20 text-white sm:py-28">
        <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-indigo-500/20 blur-3xl" />

        <div className="relative mx-auto max-w-7xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm text-blue-100">
            <GraduationCap size={18} />
            Learn from verified educators
          </div>

          <h1 className="max-w-3xl text-4xl font-black tracking-tight sm:text-6xl">
            Meet the teachers shaping your future.
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
            Discover verified educators, explore their subjects,
            and find learning resources that help you progress.
          </p>

          <div className="mt-9 flex flex-wrap gap-4">
            <a
              href="#verified-teachers"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-500"
            >
              Explore teachers
              <ArrowRight size={18} />
            </a>

            {!user && (
              <Link
                href="/auth"
                className="rounded-xl border border-white/20 px-6 py-3 font-semibold transition hover:bg-white/10"
              >
                Join EduMarket
              </Link>
            )}
          </div>

          <div className="mt-12 grid max-w-2xl gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <ShieldCheck className="mb-3 text-emerald-400" size={25} />
              <p className="font-bold">Verified educators</p>
              <p className="mt-1 text-sm text-slate-400">
                Profiles reviewed for verification.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <BookOpen className="mb-3 text-blue-400" size={25} />
              <p className="font-bold">Learning resources</p>
              <p className="mt-1 text-sm text-slate-400">
                Find resources for your studies.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <GraduationCap className="mb-3 text-purple-400" size={25} />
              <p className="font-bold">Academic growth</p>
              <p className="mt-1 text-sm text-slate-400">
                Discover educators by subject.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section
        id="verified-teachers"
        className="mx-auto max-w-7xl px-6 py-16 sm:py-20"
      >
        <div className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-600">
              The teaching community
            </p>

            <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
              Verified teachers
            </h2>

            <p className="mt-3 max-w-xl text-slate-600">
              Explore educators whose profiles have been verified
              on EduMarket.
            </p>
          </div>

          <Link
            href="/resources"
            className="inline-flex items-center gap-2 font-semibold text-blue-700 hover:text-blue-900"
          >
            Browse resources
            <ArrowRight size={18} />
          </Link>
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800">
            <h3 className="font-bold">
              Teachers could not be loaded
            </h3>
            <p className="mt-2 text-sm">
              Please refresh the page. If the problem continues,
              check the database permissions and policies.
            </p>
          </div>
        ) : teacherList.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
              <Search size={30} />
            </div>

            <h3 className="mt-6 text-xl font-bold">
              No verified teachers yet
            </h3>

            <p className="mx-auto mt-3 max-w-lg leading-7 text-slate-600">
              Verified teacher profiles will appear here when
              educators have completed the verification process.
            </p>

            <Link
              href="/resources"
              className="mt-7 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white transition hover:bg-slate-700"
            >
              Explore learning resources
              <ArrowRight size={18} />
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {teacherList.map((teacher) => {
              const profile = teacher.profile;

              const initials = (
                profile?.full_name || "Teacher"
              )
                .split(/\s+/)
                .slice(0, 2)
                .map((part) => part[0])
                .join("")
                .toUpperCase();

              return (
                <article
                  key={teacher.id}
                  className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl"
                >
                  <div className="flex items-start justify-between">
                    {profile?.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={profile.avatar_url}
                        alt={profile.full_name || "Teacher"}
                        className="h-16 w-16 rounded-2xl object-cover"
                      />
                    ) : (
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-xl font-black text-blue-700">
                        {initials || <UserRound size={26} />}
                      </div>
                    )}

                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
                      <ShieldCheck size={14} />
                      Verified
                    </span>
                  </div>

                  <h3 className="mt-5 text-xl font-bold">
                    {profile?.full_name || "Verified Teacher"}
                  </h3>

                  <p className="mt-3 min-h-20 leading-7 text-slate-600">
                    {teacher.bio ||
                      "An educator sharing knowledge and supporting learners on EduMarket."}
                  </p>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {(teacher.subjects ?? [])
                      .slice(0, 5)
                      .map((subject: string) => (
                        <span
                          key={subject}
                          className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700"
                        >
                          {subject}
                        </span>
                      ))}
                  </div>

                  <Link
                    href="/resources"
                    className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 font-semibold transition group-hover:border-blue-600 group-hover:bg-blue-600 group-hover:text-white"
                  >
                    Explore resources
                    <ArrowRight size={17} />
                  </Link>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="border-t border-slate-200 bg-white px-6 py-14">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 rounded-3xl bg-blue-50 p-8 sm:flex-row sm:items-center sm:p-10">
          <div>
            <h2 className="text-2xl font-black">
              Ready to continue learning?
            </h2>
            <p className="mt-2 text-slate-600">
              Explore educational resources available on EduMarket.
            </p>
          </div>

          <Link
            href="/resources"
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-blue-700 px-6 py-3 font-semibold text-white transition hover:bg-blue-800"
          >
            Browse resources
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </main>
  );
}

export default function TeachersPage() {
  return (
    <Suspense fallback={<TeachersLoading />}>
      <TeachersContent />
    </Suspense>
  );
}