import Link from "next/link";
import { connection } from "next/server";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Clock,
  Eye,
  History,
  Search,
  Trash2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Recently Viewed | EduMarket",
  description:
    "Revisit educational resources you have recently explored on EduMarket.",
};

type ViewedItem = {
  id: string;
  resource_id: string;
  created_at: string;
};

type Resource = {
  id: string;
  title: string;
  description?: string | null;
  category?: string | null;
  price?: number | null;
  thumbnail_url?: string | null;
  created_at?: string | null;
};

export default async function RecentlyViewedPage() {
  await connection();

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <History
            size={46}
            className="mx-auto text-blue-700"
          />

          <h1 className="mt-5 text-2xl font-black text-slate-950">
            Your viewing history
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-500">
            Sign in to see educational resources you have recently
            explored.
          </p>

          <Link
            href="/auth"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-700 px-6 py-3 font-bold text-white transition hover:bg-blue-800"
          >
            Sign in <ArrowRight size={17} />
          </Link>
        </div>
      </main>
    );
  }

  const { data: viewedData, error } = await supabase
    .from("recently_viewed")
    .select("id, resource_id, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  const viewedItems = (viewedData ?? []) as ViewedItem[];

  const resourceIds = [
    ...new Set(
      viewedItems
        .map((item) => item.resource_id)
        .filter(Boolean),
    ),
  ];

  let resourceMap = new Map<string, Resource>();

  if (resourceIds.length > 0) {
    const { data: resourceData } = await supabase
      .from("resources")
      .select(
        "id, title, description, category, price, thumbnail_url, created_at",
      )
      .in("id", resourceIds);

    resourceMap = new Map(
      ((resourceData ?? []) as Resource[]).map((resource) => [
        resource.id,
        resource,
      ]),
    );
  }

  const history = viewedItems
    .map((item) => ({
      ...item,
      resource: resourceMap.get(item.resource_id),
    }))
    .filter(
      (
        item,
      ): item is ViewedItem & {
        resource: Resource;
      } => Boolean(item.resource),
    );

  const uniqueResources = new Set(
    history.map((item) => item.resource_id),
  ).size;

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="bg-slate-950 px-5 py-12 text-white sm:px-8 sm:py-16">
        <div className="mx-auto max-w-7xl">
          <Link
            href="/learning-dashboard"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-300 transition hover:text-white"
          >
            <ArrowLeft size={17} />
            Learning dashboard
          </Link>

          <div className="mt-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm font-bold text-blue-300">
                <History size={19} />
                YOUR LEARNING HISTORY
              </div>

              <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
                Recently viewed
              </h1>

              <p className="mt-4 max-w-2xl leading-7 text-slate-300">
                Return to the educational resources you have explored
                and continue learning where you left off.
              </p>
            </div>

            <Link
              href="/resources"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-bold text-white transition hover:bg-blue-500"
            >
              Discover resources <Search size={18} />
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            icon={<Eye size={22} />}
            label="Viewing records"
            value={viewedItems.length}
            style="bg-blue-50 text-blue-700"
          />

          <StatCard
            icon={<BookOpen size={22} />}
            label="Unique resources"
            value={uniqueResources}
            style="bg-emerald-50 text-emerald-700"
          />

          <StatCard
            icon={<Clock size={22} />}
            label="Latest activity"
            value={
              history[0]?.created_at
                ? new Date(history[0].created_at).toLocaleDateString(
                    "en-KE",
                    {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    },
                  )
                : "No activity"
            }
            style="bg-violet-50 text-violet-700"
          />
        </div>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-black text-slate-950">
              Your history
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Your latest recorded resource views appear first.
            </p>
          </div>

          <span className="w-fit rounded-full bg-white px-4 py-2 text-sm font-bold text-slate-600 ring-1 ring-slate-200">
            {history.length} records
          </span>
        </div>

        {error ? (
          <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-6">
            <h3 className="font-bold text-red-800">
              Could not load viewing history
            </h3>

            <p className="mt-2 text-sm leading-6 text-red-700">
              Please try again later. If the problem continues, check
              your database permissions and table configuration.
            </p>
          </div>
        ) : history.length === 0 ? (
          <div className="mt-8 rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
              <History size={32} />
            </div>

            <h3 className="mt-5 text-xl font-black text-slate-950">
              Your history starts here
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              Resources you view will appear here once your application
              records them in your viewing history.
            </p>

            <Link
              href="/resources"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-800"
            >
              Browse resources <ArrowRight size={17} />
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {history.map((item) => (
              <article
                key={item.id}
                className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl"
              >
                <Link
                  href={`/resources/${encodeURIComponent(item.resource.id)}`}
                  className="block"
                >
                  {item.resource.thumbnail_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.resource.thumbnail_url}
                      alt={item.resource.title}
                      loading="lazy"
                      className="h-48 w-full object-cover transition duration-500 group-hover:scale-[1.02]"
                    />
                  ) : (
                    <div className="flex h-48 items-center justify-center bg-gradient-to-br from-slate-950 to-blue-800 text-white">
                      <BookOpen size={42} />
                    </div>
                  )}
                </Link>

                <div className="p-5">
                  {item.resource.category && (
                    <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">
                      {item.resource.category}
                    </span>
                  )}

                  <Link
                    href={`/resources/${encodeURIComponent(item.resource.id)}`}
                  >
                    <h3 className="mt-4 line-clamp-2 text-lg font-black text-slate-950 transition hover:text-blue-700">
                      {item.resource.title}
                    </h3>
                  </Link>

                  <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-500">
                    {item.resource.description ||
                      "Explore this educational resource to continue learning."}
                  </p>

                  <div className="mt-4 flex items-center justify-between gap-3">
                    <span className="text-xs text-slate-400">
                      Viewed{" "}
                      {new Date(item.created_at).toLocaleDateString(
                        "en-KE",
                        {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        },
                      )}
                    </span>

                    <span className="font-black text-slate-950">
                      {item.resource.price == null ||
                      Number(item.resource.price) === 0
                        ? "Free"
                        : `KSh ${Number(item.resource.price).toLocaleString("en-KE")}`}
                    </span>
                  </div>

                  <div className="mt-5 border-t border-slate-100 pt-4">
                    <Link
                      href={`/resources/${encodeURIComponent(item.resource.id)}`}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
                    >
                      Continue learning <ArrowRight size={16} />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        <div className="mt-10 rounded-2xl border border-blue-100 bg-blue-50 p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-blue-700 shadow-sm">
              <Trash2 size={22} />
            </div>

            <div>
              <h3 className="font-black text-slate-950">
                Manage your viewing history
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Your history is loaded from your account. To support
                clearing records, implement a protected deletion action
                in your recently viewed API and connect it to this page.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function StatCard({
  icon,
  label,
  value,
  style,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  style: string;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-500">{label}</p>

          <p className="mt-3 break-words text-2xl font-black text-slate-950">
            {value}
          </p>
        </div>

        <div className={`rounded-xl p-3 ${style}`}>{icon}</div>
      </div>
    </article>
  );
}