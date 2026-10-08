 import Link from "next/link";
import { Suspense } from "react";
import {
  ArrowLeft,
  Edit,
  FileText,
  Plus,
  Search,
} from "lucide-react";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { requireAdmin } from "@/lib/auth/admin";

type Resource = {
  id: string;
  title: string;
  slug: string;
  price: number | null;
  pricing_model: string | null;
  format: string | null;
  status: string | null;
  created_at: string;
  categories:
    | {
        name: string;
      }
    | {
        name: string;
      }[]
    | null;
};

function LoadingState() {
  return (
    <>
      <Header />

      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-64 rounded-lg bg-slate-200" />
            <div className="h-5 w-96 max-w-full rounded bg-slate-200" />
            <div className="h-16 rounded-2xl bg-white ring-1 ring-slate-200" />
            <div className="h-96 rounded-2xl bg-white ring-1 ring-slate-200" />
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}

function AccessDenied({ message }: { message: string }) {
  return (
    <>
      <Header />

      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto flex min-h-[60vh] max-w-2xl items-center justify-center px-4 py-16">
          <div className="w-full rounded-3xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200 sm:p-12">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50">
              <FileText className="h-8 w-8 text-red-600" />
            </div>

            <h1 className="mt-6 text-2xl font-bold text-slate-900">
              Access Denied
            </h1>

            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-600">
              {message}
            </p>

            <Link
              href="/"
              className="mt-7 inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Return Home
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}

async function AdminResourcesContent() {
  const { supabase } = await requireAdmin();

  const { data, error } = await supabase
    .from("resources")
    .select(
      `
        id,
        title,
        slug,
        price,
        pricing_model,
        format,
        status,
        created_at,
        categories (
          name
        )
      `,
    )
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <>
        <Header />

        <main className="min-h-screen bg-slate-50">
          <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
            <Link
              href="/admin"
              className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-slate-900"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to dashboard
            </Link>

            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
              <h1 className="font-semibold">Unable to load resources</h1>

              <p className="mt-2 text-sm">
                {error.message}
              </p>
            </div>
          </div>
        </main>

        <Footer />
      </>
    );
  }

  const resources = (data ?? []) as Resource[];

  return (
    <>
      <Header />

      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          {/* Top navigation */}
          <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Link
                href="/admin"
                className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-slate-900"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to dashboard
              </Link>

              <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                Resource Management
              </h1>

              <p className="mt-2 text-sm text-slate-600">
                Manage, organize and publish educational resources on
                EduMarket.
              </p>
            </div>

            <Link
              href="/admin/resources/new"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              <Plus className="h-5 w-5" />
              Add Resource
            </Link>
          </div>

          {/* Search */}
          <div className="mb-6 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

              <input
                type="search"
                placeholder="Search resources..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-12 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
              />
            </div>
          </div>

          {/* Resource list */}
          {resources.length === 0 ? (
            <div className="rounded-3xl bg-white px-6 py-16 text-center shadow-sm ring-1 ring-slate-200">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
                <FileText className="h-8 w-8 text-slate-500" />
              </div>

              <h2 className="mt-6 text-xl font-bold text-slate-900">
                No resources yet
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
                Start building the EduMarket library by adding your first
                educational resource.
              </p>

              <Link
                href="/admin/resources/new"
                className="mt-7 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                <Plus className="h-5 w-5" />
                Add Resource
              </Link>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Resource
                      </th>

                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Category
                      </th>

                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Price
                      </th>

                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Format
                      </th>

                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Status
                      </th>

                      <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-200">
                    {resources.map((resource) => {
                      const category =
                        Array.isArray(resource.categories)
                          ? resource.categories[0]?.name
                          : resource.categories?.name;

                      const isFree =
                        resource.pricing_model === "free" ||
                        resource.price === 0 ||
                        resource.price === null;

                      const formattedPrice = isFree
                        ? "FREE"
                        : `KSh ${Number(resource.price).toLocaleString(
                            "en-KE",
                          )}`;

                      const status = resource.status ?? "draft";

                      const statusClasses =
                        status === "published"
                          ? "bg-emerald-50 text-emerald-700"
                          : status === "draft"
                            ? "bg-amber-50 text-amber-700"
                            : "bg-slate-100 text-slate-700";

                      return (
                        <tr
                          key={resource.id}
                          className="transition hover:bg-slate-50"
                        >
                          <td className="px-6 py-5">
                            <div className="max-w-sm">
                              <p className="font-semibold text-slate-900">
                                {resource.title}
                              </p>

                              <p className="mt-1 truncate text-xs text-slate-500">
                                /{resource.slug}
                              </p>
                            </div>
                          </td>

                          <td className="whitespace-nowrap px-6 py-5 text-sm text-slate-600">
                            {category || "Uncategorized"}
                          </td>

                          <td className="whitespace-nowrap px-6 py-5 text-sm font-semibold text-slate-900">
                            {formattedPrice}
                          </td>

                          <td className="whitespace-nowrap px-6 py-5 text-sm uppercase text-slate-600">
                            {resource.format || "—"}
                          </td>

                          <td className="whitespace-nowrap px-6 py-5">
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusClasses}`}
                            >
                              {status}
                            </span>
                          </td>

                          <td className="whitespace-nowrap px-6 py-5 text-right">
                            <Link
                              href={`/admin/resources/${resource.id}`}
                              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                            >
                              <Edit className="h-4 w-4" />
                              Edit
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}

export default function AdminResourcesPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <AdminResourcesContent />
    </Suspense>
  );
}