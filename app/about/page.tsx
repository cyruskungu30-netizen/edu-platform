import Link from "next/link";
import {
  GraduationCap,
  BookOpen,
  Users,
  Target,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

export const metadata = {
  title: "About Us | EduMarket",
  description:
    "Learn about EduMarket, our mission, and how we help educators and learners access educational resources.",
};

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <section className="relative overflow-hidden bg-slate-950 px-6 py-24 text-white sm:py-32">
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-blue-500/20 blur-3xl" />

        <div className="relative mx-auto max-w-6xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm text-blue-200">
            <GraduationCap size={18} />
            About EduMarket
          </span>

          <h1 className="mt-8 max-w-4xl text-4xl font-black leading-tight tracking-tight sm:text-6xl">
            Making quality learning resources easier to discover.
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
            EduMarket connects learners with educational resources
            and helps educators share knowledge through a digital
            learning marketplace.
          </p>

          <Link
            href="/resources"
            className="mt-9 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-500"
          >
            Explore resources
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid gap-12 md:grid-cols-2 md:items-center">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-600">
              Our purpose
            </p>

            <h2 className="mt-4 text-3xl font-black sm:text-4xl">
              Education deserves better access.
            </h2>

            <p className="mt-6 leading-8 text-slate-600">
              Finding useful learning materials should be simple.
              EduMarket provides a platform where learners can
              discover resources and educators can make their
              educational materials available to a wider audience.
            </p>

            <p className="mt-4 leading-8 text-slate-600">
              Our goal is to make educational resources easier to
              find, purchase, organize, and use while supporting
              the people who create them.
            </p>
          </div>

          <div className="rounded-3xl bg-slate-950 p-8 text-white sm:p-10">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600">
              <Target size={28} />
            </div>

            <h3 className="mt-6 text-2xl font-bold">
              Our mission
            </h3>

            <p className="mt-4 leading-8 text-slate-300">
              To create a dependable digital marketplace that
              brings educational resources, educators, and learners
              closer together.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-slate-50 px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-600">
              What we offer
            </p>

            <h2 className="mt-4 text-3xl font-black sm:text-4xl">
              Designed around learning.
            </h2>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            <article className="rounded-2xl border border-slate-200 bg-white p-7">
              <BookOpen className="text-blue-600" size={30} />

              <h3 className="mt-5 text-xl font-bold">
                Learning resources
              </h3>

              <p className="mt-3 leading-7 text-slate-600">
                Discover educational materials that support
                learning, revision, and academic development.
              </p>
            </article>

            <article className="rounded-2xl border border-slate-200 bg-white p-7">
              <Users className="text-blue-600" size={30} />

              <h3 className="mt-5 text-xl font-bold">
                Educator community
              </h3>

              <p className="mt-3 leading-7 text-slate-600">
                Give educators a platform to organize and share
                their knowledge and learning materials.
              </p>
            </article>

            <article className="rounded-2xl border border-slate-200 bg-white p-7">
              <ShieldCheck className="text-blue-600" size={30} />

              <h3 className="mt-5 text-xl font-bold">
                Account-based access
              </h3>

              <p className="mt-3 leading-7 text-slate-600">
                Support account management, order tracking, and
                access to purchased resources.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="px-6 py-20">
        <div className="mx-auto max-w-4xl rounded-3xl bg-blue-50 p-8 text-center sm:p-12">
          <h2 className="text-3xl font-black">
            Your learning journey starts here.
          </h2>

          <p className="mx-auto mt-4 max-w-xl leading-7 text-slate-600">
            Explore available resources and discover opportunities
            to learn, teach, and grow.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/resources"
              className="rounded-xl bg-blue-700 px-6 py-3 font-semibold text-white hover:bg-blue-800"
            >
              Browse resources
            </Link>

            <Link
              href="/teachers"
              className="rounded-xl border border-slate-300 bg-white px-6 py-3 font-semibold hover:bg-slate-100"
            >
              Meet our teachers
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}