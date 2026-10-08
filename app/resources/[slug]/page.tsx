 import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  FileText,
  ShieldCheck,
  ShoppingCart,
} from "lucide-react";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { createClient } from "@/lib/supabase/server";
import AddToCartButton from "@/components/resources/AddToCartButton";
import BuyNowButton from "@/components/resources/BuyNowButton";
import WishlistButton from "@/components/resources/WishlistButton";
import BookmarkButton from "@/components/resources/BookmarkButton";
import ResourceReviews from "@/components/resources/ResourceReviews";
import RecentlyViewedTracker from "@/components/resources/RecentlyViewedTracker";

type ResourcePageProps = {
  params: Promise<{
    slug: string;
  }>;
};

type Category = {
  id: string;
  name: string;
  slug: string;
};

type Resource = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  price: number | string | null;
  format: string;
  pricing_model: string;
  status: string;
  category: Category | Category[] | null;
};

function formatMoney(value: number | string | null | undefined) {
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

function ResourceLoading() {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="h-5 w-64 animate-pulse rounded bg-slate-200" />
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_390px]">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="h-16 w-16 animate-pulse rounded-2xl bg-slate-200" />
            <div className="mt-6 h-7 w-32 animate-pulse rounded-full bg-slate-200" />
            <div className="mt-5 h-10 w-3/4 animate-pulse rounded bg-slate-200" />
            <div className="mt-5 h-6 w-48 animate-pulse rounded bg-slate-100" />
            <div className="mt-8 h-32 animate-pulse rounded-2xl bg-slate-100" />

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <div className="h-24 animate-pulse rounded-2xl bg-slate-100" />
              <div className="h-24 animate-pulse rounded-2xl bg-slate-100" />
              <div className="h-24 animate-pulse rounded-2xl bg-slate-100" />
              <div className="h-24 animate-pulse rounded-2xl bg-slate-100" />
            </div>
          </section>

          <aside className="h-fit">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="h-4 w-28 animate-pulse rounded bg-slate-100" />
              <div className="mt-3 h-10 w-36 animate-pulse rounded bg-slate-200" />
              <div className="mt-6 h-20 animate-pulse rounded-2xl bg-slate-100" />

              <div className="mt-6 space-y-3">
                <div className="h-12 animate-pulse rounded-xl bg-slate-200" />
                <div className="h-12 animate-pulse rounded-xl bg-slate-100" />
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

async function ResourceContent({
  params,
}: {
  params: Promise<{
    slug: string;
  }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: resource, error } = await supabase
    .from("resources")
    .select(`
      id,
      title,
      slug,
      description,
      price,
      format,
      pricing_model,
      status,
      category:categories (
        id,
        name,
        slug
      )
    `)
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error || !resource) {
    notFound();
  }

  const typedResource = resource as Resource;

  const category = Array.isArray(typedResource.category)
    ? typedResource.category[0]
    : typedResource.category;

  const isFree =
    typedResource.pricing_model === "free" ||
    Number(typedResource.price ?? 0) <= 0;

  return (
    <>
      <RecentlyViewedTracker resourceId={typedResource.id} />

      <main className="min-h-screen bg-slate-50">
        {/* Breadcrumb */}
        <div className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
              <Link
                href="/resources"
                className="inline-flex items-center gap-1.5 font-medium text-blue-600 hover:text-blue-700"
              >
                <ArrowLeft className="h-4 w-4" />
                Resources
              </Link>

              <span>/</span>

              {category && (
                <>
                  <Link
                    href={`/resources?category=${encodeURIComponent(category.slug)}`}
                    className="hover:text-blue-600"
                  >
                    {category.name}
                  </Link>

                  <span>/</span>
                </>
              )}

              <span className="max-w-[220px] truncate text-slate-600">
                {typedResource.title}
              </span>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[1fr_390px]">
            {/* Resource information */}
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <FileText className="h-8 w-8" />
              </div>

              {category && (
                <div className="mt-6">
                  <Link
                    href={`/resources?category=${encodeURIComponent(category.slug)}`}
                    className="inline-flex rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 transition hover:bg-blue-100"
                  >
                    {category.name}
                  </Link>
                </div>
              )}

              <h1 className="mt-5 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                {typedResource.title}
              </h1>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700">
                  <FileText className="h-4 w-4" />
                  {typedResource.format}
                </span>

                {isFree ? (
                  <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
                    Free Resource
                  </span>
                ) : (
                  <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">
                    Premium Resource
                  </span>
                )}
              </div>

              {/* Bookmark and wishlist */}
              <div className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="mr-auto">
                  <h2 className="text-sm font-bold text-slate-900">
                    Keep this resource
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Save it to your bookmarks or wishlist for later.
                  </p>
                </div>

                <BookmarkButton resourceId={typedResource.id} />
                <WishlistButton resourceId={typedResource.id} />
              </div>

              {/* Description */}
              <div className="mt-8">
                <h2 className="text-lg font-bold text-slate-950">
                  About this resource
                </h2>

                <div className="mt-3 rounded-2xl bg-slate-50 p-5">
                  <p className="whitespace-pre-line text-sm leading-7 text-slate-600">
                    {typedResource.description ||
                      "This educational resource has been prepared to support teaching, learning, revision and assessment."}
                  </p>
                </div>
              </div>

              {/* Resource benefits */}
              <div className="mt-8">
                <h2 className="text-lg font-bold text-slate-950">
                  What you get
                </h2>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="flex items-start gap-3 rounded-2xl border border-slate-200 p-4">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                    <div>
                      <p className="text-sm font-bold text-slate-900">
                        Ready to use
                      </p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        Downloadable educational material for immediate use.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 rounded-2xl border border-slate-200 p-4">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                    <div>
                      <p className="text-sm font-bold text-slate-900">
                        Digital format
                      </p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        Access the resource digitally whenever you need it.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 rounded-2xl border border-slate-200 p-4">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                    <div>
                      <p className="text-sm font-bold text-slate-900">
                        Secure access
                      </p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        Purchased resources are protected through your account.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 rounded-2xl border border-slate-200 p-4">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                    <div>
                      <p className="text-sm font-bold text-slate-900">
                        Personal library
                      </p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        Your purchases remain available in your EduMarket library.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Purchase panel */}
            <aside className="h-fit lg:sticky lg:top-6">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Resource Price
                  </p>

                  <p className="mt-2 text-3xl font-bold text-slate-950">
                    {formatMoney(typedResource.price)}
                  </p>
                </div>

                <div className="mt-6 rounded-2xl bg-slate-50 p-4">
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
                    <div>
                      <p className="text-sm font-bold text-slate-900">
                        Secure purchase
                      </p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        Your purchase is linked to your EduMarket account and
                        protected downloads are provided after payment.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  {isFree ? (
                    <Link
                      href={`/auth/login?redirect=${encodeURIComponent(`/resources/${typedResource.slug}`)}`}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-emerald-700"
                    >
                      <BookOpen className="h-5 w-5" />
                      Get Free Resource
                    </Link>
                  ) : (
                    <>
                      <BuyNowButton resourceId={typedResource.id} />
                      <AddToCartButton resourceId={typedResource.id} />
                    </>
                  )}
                </div>

                <div className="mt-6 border-t border-slate-200 pt-5">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-4 text-sm">
                      <span className="text-slate-500">Format</span>
                      <span className="font-semibold text-slate-800">
                        {typedResource.format}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-4 text-sm">
                      <span className="text-slate-500">Access</span>
                      <span className="font-semibold text-slate-800">
                        Digital download
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-4 text-sm">
                      <span className="text-slate-500">Availability</span>
                      <span className="font-semibold text-emerald-600">
                        Available
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <Link
                href="/resources"
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                <ShoppingCart className="h-4 w-4" />
                Continue Shopping
              </Link>
            </aside>
          </div>

          {/* Reviews */}
          <section className="mt-10">
            <ResourceReviews resourceId={typedResource.id} />
          </section>
        </div>
      </main>
    </>
  );
}

export default function ResourcePage({
  params,
}: ResourcePageProps) {
  return (
    <Suspense fallback={<ResourceLoading />}>
      <ResourceContent params={params} />
    </Suspense>
  );
}