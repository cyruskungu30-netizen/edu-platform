import Link from "next/link";
import { connection } from "next/server";
import { ArrowRight, BookOpen, Sparkles } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import BookmarkButton from "@/components/resources/BookmarkButton";

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
  format: string | null;
  pricing_model: string | null;
  category: Category | Category[] | null;
};

function formatMoney(value: number | string | null | undefined) {
  const amount = Number(value ?? 0);

  if (amount <= 0) return "Free";

  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(amount);
}

function getCategory(category: Resource["category"]): Category | null {
  if (Array.isArray(category)) return category[0] ?? null;
  return category;
}

export default async function RecommendedResources() {
  await connection();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let resources: Resource[] = [];
  let sectionDescription =
    "Explore useful learning materials selected from the EduMarket library.";

  if (user) {
    const { data: history } = await supabase
      .from("recently_viewed_resources")
      .select(
        `
          resource_id,
          viewed_at,
          resource:resources (
            id,
            category:categories (
              id,
              name,
              slug
            )
          )
        `,
      )
      .eq("user_id", user.id)
      .order("viewed_at", { ascending: false })
      .limit(12);

    const viewedIds = (history ?? [])
      .map((row: any) => row.resource_id as string)
      .filter(Boolean);

    const categoryIds = Array.from(
      new Set(
        (history ?? [])
          .flatMap((row: any) => {
            const resource = Array.isArray(row.resource)
              ? row.resource[0]
              : row.resource;
            const category = Array.isArray(resource?.category)
              ? resource.category[0]
              : resource?.category;

            return category?.id ? [category.id as string] : [];
          }),
      ),
    );

    if (categoryIds.length > 0) {
      const { data: related } = await supabase
        .from("resources")
        .select(
          `
            id,
            title,
            slug,
            description,
            price,
            format,
            pricing_model,
            category:categories (
              id,
              name,
              slug
            )
          `,
        )
        .eq("status", "published")
        .in("category_id", categoryIds)
        .order("created_at", { ascending: false })
        .limit(12);

      resources = ((related ?? []) as unknown as Resource[]).filter(
        (resource) => !viewedIds.includes(resource.id),
      );

      if (resources.length > 0) {
        sectionDescription =
          "Based on the subjects and resources you have recently explored.";
      }
    }
  }

  if (resources.length < 4) {
    const excludedIds = resources.map((resource) => resource.id);
    let query = supabase
      .from("resources")
      .select(
        `
          id,
          title,
          slug,
          description,
          price,
          format,
          pricing_model,
          category:categories (
            id,
            name,
            slug
          )
        `,
      )
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(8);

    if (excludedIds.length > 0) {
      query = query.not("id", "in", `(${excludedIds.join(",")})`);
    }

    const { data: latest } = await query;
    const existingIds = new Set(resources.map((resource) => resource.id));

    for (const item of (latest ?? []) as unknown as Resource[]) {
      if (!existingIds.has(item.id) && resources.length < 8) {
        resources.push(item);
        existingIds.add(item.id);
      }
    }
  }

  if (resources.length === 0) return null;

  return (
    <section className="border-b border-slate-200 bg-gradient-to-b from-emerald-50/70 to-white">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-800">
              <Sparkles className="h-4 w-4" />
              Curated for you
            </div>
            <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
              Recommended resources
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              {sectionDescription}
            </p>
          </div>

          <Link
            href="/resources"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:border-emerald-300 hover:text-emerald-700"
          >
            Browse all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {resources.slice(0, 8).map((resource) => {
            const category = getCategory(resource.category);
            const isFree =
              resource.pricing_model === "free" ||
              Number(resource.price ?? 0) <= 0;

            return (
              <article
                key={resource.id}
                className="group flex min-w-0 flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-lg"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <BookmarkButton resourceId={resource.id} />
                </div>

                {category && (
                  <Link
                    href={`/resources?category=${encodeURIComponent(category.slug)}`}
                    className="mt-4 w-fit max-w-full truncate rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold text-slate-600 transition hover:bg-emerald-50 hover:text-emerald-700"
                  >
                    {category.name}
                  </Link>
                )}

                <h3 className="mt-3 line-clamp-2 min-h-12 text-base font-bold leading-6 text-slate-900 group-hover:text-emerald-700">
                  <Link href={`/resources/${resource.slug}`}>
                    {resource.title}
                  </Link>
                </h3>

                <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-slate-500">
                  {resource.description ||
                    "A practical educational resource for teaching, learning and revision."}
                </p>

                <div className="mt-auto flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
                  <span
                    className={`text-sm font-black ${
                      isFree ? "text-emerald-700" : "text-slate-900"
                    }`}
                  >
                    {formatMoney(resource.price)}
                  </span>
                  {resource.format && (
                    <span className="max-w-[50%] truncate rounded-lg bg-slate-50 px-2 py-1 text-[11px] font-semibold text-slate-500">
                      {resource.format}
                    </span>
                  )}
                </div>

                <Link
                  href={`/resources/${resource.slug}`}
                  className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700"
                >
                  View resource
                </Link>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
