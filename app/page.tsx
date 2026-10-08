 import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  FileText,
  GraduationCap,
  Layers3,
  Search,
  Sparkles,
} from "lucide-react";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

const categories = [
  {
    title: "Exams & Assessments",
    description: "Ready-to-use assessment materials.",
    icon: FileText,
  },
  {
    title: "Schemes of Work",
    description: "Structured teaching plans for every term.",
    icon: Layers3,
  },
  {
    title: "Lesson Plans",
    description: "Practical lesson preparation resources.",
    icon: BookOpen,
  },
  {
    title: "Notes & Revision",
    description: "Quality learning and revision materials.",
    icon: GraduationCap,
  },
];

export default function HomePage() {
  return (
    <>
      <Header />

      <main>
        <section className="overflow-hidden bg-slate-950">
          <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
            <div className="max-w-4xl">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-sm font-medium text-emerald-300">
                <Sparkles size={16} />
                Kenya&apos;s modern education resource marketplace
              </div>

              <h1 className="text-4xl font-black leading-tight tracking-tight text-white sm:text-5xl lg:text-7xl">
                Everything you need to{" "}
                <span className="text-emerald-400">
                  teach, learn and succeed.
                </span>
              </h1>

              <p className="mt-6 max-w-2xl text-base leading-8 text-slate-400 sm:text-lg">
                Discover high-quality schemes of work, lesson plans,
                notes, exams, assessments, past papers and thousands
                of educational resources in one powerful platform.
              </p>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/resources"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-6 py-3.5 font-bold text-slate-950 transition hover:bg-emerald-400"
                >
                  Explore Resources
                  <ArrowRight size={18} />
                </Link>

                <Link
                  href="/auth/register"
                  className="inline-flex items-center justify-center rounded-xl border border-white/15 px-6 py-3.5 font-bold text-white transition hover:bg-white/10"
                >
                  Create Free Account
                </Link>
              </div>
            </div>

            <div className="mt-14 max-w-3xl rounded-2xl border border-white/10 bg-white/[0.05] p-2">
              <div className="flex items-center gap-3 rounded-xl bg-white px-4 py-3">
                <Search size={20} className="text-slate-400" />

                <input
                  type="search"
                  placeholder="What are you looking for?"
                  className="flex-1 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
                />

                <button className="hidden rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white sm:block">
                  Search
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <p className="text-sm font-bold uppercase tracking-wider text-emerald-600">
                  Browse resources
                </p>

                <h2 className="mt-2 text-3xl font-black text-slate-900">
                  Find exactly what you need
                </h2>
              </div>

              <Link
                href="/categories"
                className="inline-flex items-center gap-2 text-sm font-bold text-emerald-600"
              >
                View all
                <ArrowRight size={16} />
              </Link>
            </div>

            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {categories.map((category) => {
                const Icon = category.icon;

                return (
                  <Link
                    key={category.title}
                    href="/resources"
                    className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-emerald-300 hover:shadow-lg"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                      <Icon size={23} />
                    </div>

                    <h3 className="mt-5 font-bold text-slate-900">
                      {category.title}
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      {category.description}
                    </p>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        <section className="bg-slate-50 py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
              <div>
                <p className="text-sm font-bold uppercase tracking-wider text-emerald-600">
                  Built for education
                </p>

                <h2 className="mt-3 text-3xl font-black text-slate-900 sm:text-4xl">
                  More than a resource store.
                </h2>

                <p className="mt-5 leading-8 text-slate-600">
                  EduMarket brings teaching resources, learning
                  materials, assessments and powerful productivity
                  tools together in one platform.
                </p>

                <div className="mt-8 space-y-4">
                  {[
                    "Quality resources from educators",
                    "Instant access after purchase",
                    "Secure personal resource library",
                    "Teacher productivity tools",
                  ].map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-3 text-sm font-medium text-slate-700"
                    >
                      <CheckCircle2
                        size={19}
                        className="shrink-0 text-emerald-600"
                      />
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl bg-slate-950 p-8 shadow-2xl sm:p-10">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500 text-slate-950">
                  <Sparkles size={25} />
                </div>

                <h3 className="mt-7 text-2xl font-black text-white">
                  Your teaching workspace is coming.
                </h3>

                <p className="mt-4 leading-7 text-slate-400">
                  Build schemes of work, generate lesson plans,
                  create assessments, manage resources and organize
                  your teaching workflow from one dashboard.
                </p>

                <Link
                  href="/auth/register"
                  className="mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 font-bold text-slate-950 transition hover:bg-slate-100"
                >
                  Get started
                  <ArrowRight size={17} />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}