 import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  Download,
  FileText,
  LibraryBig,
  Lock,
} from "lucide-react";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { createClient } from "@/lib/supabase/server";

type Entitlement = {
  id: string;
  resource_id: string;
  download_limit: number | null;
  download_count: number | null;
  purchased_at: string;
  expires_at: string | null;
};

type Resource = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  format: string;
  price: number | string | null;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-KE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatMoney(
  value: number | string | null | undefined,
) {
  const amount = Number(value ?? 0);

  if (amount <= 0) {
    return "Free";
  }

  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 2,
  }).format(amount);
}

function LibraryLoading() {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="h-10 w-48 animate-pulse rounded-xl bg-slate-200" />

        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-64 animate-pulse rounded-2xl bg-white shadow-sm"
            />
          ))}
        </div>
      </div>
    </main>
  );
}

async function LibraryContent() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?redirect=/library");
  }

  const { data: entitlements, error: entitlementError } =
    await supabase
      .from("entitlements")
      .select(
        "id, resource_id, download_limit, download_count, purchased_at, expires_at",
      )
      .eq("user_id", user.id)
      .order("purchased_at", { ascending: false });

  if (entitlementError) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
            <h1 className="text-lg font-bold text-red-800">
              Unable to load your library
            </h1>

            <p className="mt-2 text-sm text-red-700">
              {entitlementError.message}
            </p>
          </div>
        </div>
      </main>
    );
  }

  const entitlementList =
    (entitlements ?? []) as Entitlement[];

  const resourceIds = [
    ...new Set(
      entitlementList.map(
        (entitlement) => entitlement.resource_id,
      ),
    ),
  ];

  let resources: Resource[] = [];

  if (resourceIds.length > 0) {
    const { data: resourceData } = await supabase
      .from("resources")
      .select(
        "id, title, slug, description, format, price",
      )
      .in("id", resourceIds);

    resources = (resourceData ?? []) as Resource[];
  }

  const resourceMap = new Map(
    resources.map((resource) => [
      resource.id,
      resource,
    ]),
  );

  const libraryItems = entitlementList
    .map((entitlement) => {
      const resource = resourceMap.get(
        entitlement.resource_id,
      );

      if (!resource) {
        return null;
      }

      return {
        entitlement,
        resource,
      };
    })
    .filter(
      (
        item,
      ): item is {
        entitlement: Entitlement;
        resource: Resource;
      } => item !== null,
    );

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
          <Link
            href="/account"
            className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Account
          </Link>

          <div className="mt-5 flex items-center justify-between gap-4">
            <div>
              <h1 className="flex items-center gap-3 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                My Library
                <LibraryBig className="h-7 w-7 text-blue-600" />
              </h1>

              <p className="mt-2 text-sm text-slate-500">
                Your purchased educational resources.
              </p>
            </div>

            <div className="hidden h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 sm:flex">
              <BookOpen className="h-6 w-6" />
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {libraryItems.length === 0 ? (
          <section className="rounded-3xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <LibraryBig className="h-8 w-8" />
            </div>

            <h2 className="mt-6 text-xl font-bold text-slate-950">
              Your library is empty
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              Resources you purchase will appear here and remain
              available through your EduMarket account.
            </p>

            <Link
              href="/resources"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
            >
              Browse Resources
              <BookOpen className="h-4 w-4" />
            </Link>
          </section>
        ) : (
          <>
            <div className="mb-6 flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500">
                {libraryItems.length}{" "}
                {libraryItems.length === 1
                  ? "resource"
                  : "resources"}{" "}
                in your library
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {libraryItems.map(
                ({ entitlement, resource }) => {
                  const expired =
                    entitlement.expires_at !== null &&
                    new Date(
                      entitlement.expires_at,
                    ).getTime() <= Date.now();

                  const downloadCount = Number(
                    entitlement.download_count ?? 0,
                  );

                  const hasLimit =
                    entitlement.download_limit !== null;

                  const limitReached =
                    hasLimit &&
                    downloadCount >=
                      Number(
                        entitlement.download_limit,
                      );

                  const unavailable =
                    expired || limitReached;

                  return (
                    <article
                      key={entitlement.id}
                      className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
                    >
                      <div className="p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                            <FileText className="h-6 w-6" />
                          </div>

                          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                            Purchased
                          </span>
                        </div>

                        <Link
                          href={`/resources/${resource.slug}`}
                          className="mt-5 block text-lg font-bold leading-6 text-slate-950 hover:text-blue-600"
                        >
                          {resource.title}
                        </Link>

                        {resource.description && (
                          <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-500">
                            {resource.description}
                          </p>
                        )}

                        <div className="mt-5 flex flex-wrap gap-2">
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                            {resource.format}
                          </span>

                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                            {formatMoney(resource.price)}
                          </span>
                        </div>

                        <div className="mt-5 space-y-3 border-t border-slate-100 pt-5">
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <CalendarDays className="h-4 w-4" />
                            Purchased{" "}
                            {formatDate(
                              entitlement.purchased_at,
                            )}
                          </div>

                          {entitlement.expires_at && (
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                              <Lock className="h-4 w-4" />
                              {expired
                                ? "Access expired"
                                : `Access expires ${formatDate(
                                    entitlement.expires_at,
                                  )}`}
                            </div>
                          )}

                          {hasLimit && (
                            <div className="text-xs text-slate-500">
                              Downloads:{" "}
                              <strong className="text-slate-700">
                                {downloadCount}/
                                {entitlement.download_limit}
                              </strong>
                            </div>
                          )}
                        </div>

                        <div className="mt-5">
                          {unavailable ? (
                            <div className="rounded-xl bg-slate-100 px-4 py-3 text-center text-xs font-bold text-slate-500">
                              {expired
                                ? "Access Expired"
                                : "Download Limit Reached"}
                            </div>
                          ) : (
                            <a
                              href={`/api/resources/${resource.id}/download`}
                              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
                            >
                              <Download className="h-4 w-4" />
                              Download Resource
                            </a>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                },
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
}

export default function LibraryPage() {
  return (
    <Suspense fallback={<LibraryLoading />}>
      <LibraryContent />
    </Suspense>
  );
}