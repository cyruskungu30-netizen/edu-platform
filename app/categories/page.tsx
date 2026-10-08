import Link from "next/link";
import { ArrowRight, BookOpen, Layers3 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
export const instant = false;
export default async function CategoriesPage() {
  const supabase = await createClient();

  const { data: categories, error } = await supabase
    .from("categories")
    .select("id, name, slug")
    .order("sort_order", { ascending: true });

  return (
    <>
      <Header />

      <main className="min-h-screen bg-slate-50">
        <section className="bg-slate-950 px-4 py-16 text-white sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <p className="text-sm font-bold uppercase tracking-wider text-emerald-400">
              Explore
            </p>

            <h1 className="mt-3 text-4xl font-black sm:text-5xl">
              Education Resource Categories
            </h1>

            <p className="mt-5 max-w-2xl leading-7 text-slate-400">
              Browse teaching, learning and assessment resources
              organized into simple categories.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          {error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
              <h2 className="font-bold text-red-700">
                Unable to load categories
              </h2>

              <p className="mt-2 text-sm text-red-600">
                {error.message}
              </p>
            </div>
          ) : categories && categories.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/resources?category=${category.slug}`}
                  className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-emerald-300 hover:shadow-lg"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                    <Layers3 size={23} />
                  </div>

                  <h2 className="mt-5 text-lg font-bold text-slate-900">
                    {category.name}
                  </h2>

                  <div className="mt-5 flex items-center gap-2 text-sm font-bold text-emerald-600">
                    Browse resources
                    <ArrowRight
                      size={16}
                      className="transition-transform group-hover:translate-x-1"
                    />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
              <BookOpen
                size={40}
                className="mx-auto text-slate-300"
              />

              <h2 className="mt-4 text-xl font-bold text-slate-900">
                No categories available
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Categories will appear here once they are added.
              </p>
            </div>
          )}
        </section>
      </main>

      <Footer />
    </>
  );
}