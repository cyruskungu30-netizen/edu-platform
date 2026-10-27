 import Link from "next/link";
import { connection } from "next/server";
import {
  ArrowRight,
  BookOpen,
  Clock,
  GraduationCap,
  Heart,
  History,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Learning Dashboard | EduMarket",
  description:
    "Track your learning activity and discover educational resources on EduMarket.",
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

type ViewedItem = {
  resource_id: string;
  created_at?: string | null;
};

type WishlistItem = {
  resource_id: string;
  created_at?: string | null;
};

type Order = {
  id: string;
  status?: string | null;
  total_amount?: number | null;
  created_at?: string | null;
};

export default async function LearningDashboardPage() {
  await connection();

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <GraduationCap
            size={46}
            className="mx-auto text-blue-700"
          />

          <h1 className="mt-5 text-2xl font-black text-slate-950">
            Your learning journey starts here
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-500">
            Sign in to access your saved resources, recently viewed
            materials, and learning activity.
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

  const [
    { data: viewedData },
    { data: wishlistData },
    { data: orderData },
  ] = await Promise.all([
    supabase
      .from("recently_viewed")
      .select("resource_id, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(12),

    supabase
      .from("wishlist")
      .select("resource_id, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(12),

    supabase
      .from("orders")
      .select("id, status, total_amount, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  const viewedItems = (viewedData ?? []) as ViewedItem[];
  const wishlistItems = (wishlistData ?? []) as WishlistItem[];
  const orders = (orderData ?? []) as Order[];

  const viewedIds = [
    ...new Set(viewedItems.map((item) => item.resource_id).filter(Boolean)),
  ];

  const wishlistIds = [
    ...new Set(wishlistItems.map((item) => item.resource_id).filter(Boolean)),
  ];

  const allResourceIds = [
    ...new Set([...viewedIds, ...wishlistIds]),
  ];

  let resourceMap = new Map<string, Resource>();

  if (allResourceIds.length > 0) {
    const { data: resourceData } = await supabase
      .from("resources")
      .select(
        "id, title, description, category, price, thumbnail_url, created_at",
      )
      .in("id", allResourceIds);

    resourceMap = new Map(
      ((resourceData ?? []) as Resource[]).map((resource) => [
        resource.id,
        resource,
      ]),
    );
  }

  const recentlyViewed = viewedIds
    .map((id) => resourceMap.get(id))
    .filter((resource): resource is Resource => Boolean(resource));

  const wishlist = wishlistIds
    .map((id) => resourceMap.get(id))
    .filter((resource): resource is Resource => Boolean(resource));

  const completedOrders = orders.filter((order) =>
    ["completed", "paid", "success"].includes(
      (order.status ?? "").toLowerCase(),
    ),
  );

  const totalSpent = completedOrders.reduce(
    (sum, order) => sum + Number(order.total_amount ?? 0),
    0,
  );

  const recentActivity = [
    ...viewedItems.map((item) => ({
      id: `view-${item.resource_id}-${item.created_at ?? ""}`,
      title:
        resourceMap.get(item.resource_id)?.title ??
        "Educational resource",
      description: "Recently viewed resource",
      date: item.created_at,
      href: `/resources/${encodeURIComponent(item.resource_id)}`,
      icon: <History size={17} />,
      style: "bg-blue-50 text-blue-700",
    })),
    ...wishlistItems.map((item) => ({
      id: `wishlist-${item.resource_id}-${item.created_at ?? ""}`,
      title:
        resourceMap.get(item.resource_id)?.title ??
        "Educational resource",
      description: "Added to your wishlist",
      date: item.created_at,
      href: `/resources/${encodeURIComponent(item.resource_id)}`,
      icon: <Heart size={17} />,
      style: "bg-pink-50 text-pink-700",
    })),
  ]
    .sort(
      (a, b) =>
        new Date(b.date ?? 0).getTime() -
        new Date(a.date ?? 0).getTime(),
    )
    .slice(0, 8);

  const displayName =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split("@")[0] ||
    "Learner";

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="relative overflow-hidden bg-slate-950 px-5 py-12 text-white sm:px-8 sm:py-16">
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-blue-600/20 blur-3xl" />

        <div className="relative mx-auto max-w-7xl">
          <div className="flex items-center gap-2 text-sm font-bold text-blue-300">
            <GraduationCap size={19} />
            YOUR PERSONAL LEARNING SPACE
          </div>

          <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-5xl">
            Welcome back,{" "}
            <span className="text-blue-400">{displayName}</span>
          </h1>

          <p className="mt-4 max-w-2xl leading-7 text-slate-300">
            Continue exploring educational materials, revisit saved
            resources, and keep building your knowledge.
          </p>

          <Link
            href="/resources"
            className="mt-7 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-bold text-white transition hover:bg-blue-500"
          >
            Discover resources <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            title="Recently viewed"
            value={recentlyViewed.length}
            subtitle="Resources in your recent history"
            icon={<History size={22} />}
            iconStyle="bg-blue-50 text-blue-700"
          />

          <MetricCard
            title="Saved resources"
            value={wishlist.length}
            subtitle="Items in your wishlist"
            icon={<Heart size={22} />}
            iconStyle="bg-pink-50 text-pink-700"
          />

          <MetricCard
            title="Completed orders"
            value={completedOrders.length}
            subtitle="Orders recorded as completed or paid"
            icon={<BookOpen size={22} />}
            iconStyle="bg-emerald-50 text-emerald-700"
          />

          <MetricCard
            title="Recorded spending"
            value={`KSh ${totalSpent.toLocaleString("en-KE", {
              maximumFractionDigits: 2,
            })}`}
            subtitle="Based on completed order amounts"
            icon={<TrendingUp size={22} />}
            iconStyle="bg-amber-50 text-amber-700"
          />
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1.5fr_1fr]">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-black text-slate-950">
                  Pick up where you left off
                </h2>

                <p className="mt-2 text-sm text-slate-500">
                  Revisit your recently explored resources.
                </p>
              </div>

              <History size={23} className="text-blue-700" />
            </div>

            {recentlyViewed.length === 0 ? (
              <EmptyState
                title="Your learning history is empty"
                description="Explore resources to start building your learning history."
                href="/resources"
                linkText="Explore resources"
              />
            ) : (
              <div className="mt-6 space-y-3">
                {recentlyViewed.slice(0, 6).map((resource) => (
                  <Link
                    key={resource.id}
                    href={`/resources/${encodeURIComponent(resource.id)}`}
                    className="flex items-center gap-4 rounded-xl border border-slate-100 p-4 transition hover:border-blue-200 hover:bg-blue-50/50"
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                      <BookOpen size={22} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-bold text-slate-950">
                        {resource.title}
                      </h3>

                      <p className="mt-1 truncate text-sm text-slate-500">
                        {resource.category || "Learning resource"}
                      </p>
                    </div>

                    <ArrowRight
                      size={18}
                      className="shrink-0 text-slate-400"
                    />
                  </Link>
                ))}

                <Link
                  href="/recently-viewed"
                  className="inline-flex items-center gap-2 pt-2 text-sm font-bold text-blue-700 hover:text-blue-900"
                >
                  View recent history <ArrowRight size={16} />
                </Link>
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-black text-slate-950">
                  Your learning shortcuts
                </h2>

                <p className="mt-2 text-sm text-slate-500">
                  Quickly access your favorite areas.
                </p>
              </div>

              <Sparkles size={23} className="text-violet-700" />
            </div>

            <div className="mt-6 space-y-3">
              <Shortcut
                href="/wishlist"
                title="My wishlist"
                description="Return to saved resources"
                icon={<Heart size={20} />}
                style="bg-pink-50 text-pink-700"
              />

              <Shortcut
                href="/recently-viewed"
                title="Recently viewed"
                description="Revisit learning materials"
                icon={<Clock size={20} />}
                style="bg-blue-50 text-blue-700"
              />

              <Shortcut
                href="/search"
                title="Find resources"
                description="Search by topic or category"
                icon={<BookOpen size={20} />}
                style="bg-emerald-50 text-emerald-700"
              />

              <Shortcut
                href="/trending"
                title="Trending resources"
                description="Discover popular materials"
                icon={<TrendingUp size={20} />}
                style="bg-amber-50 text-amber-700"
              />
            </div>
          </section>
        </div>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-black text-slate-950">
                Your saved resources
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Learning materials you have added to your wishlist.
              </p>
            </div>

            <Heart size={23} className="text-pink-600" />
          </div>

          {wishlist.length === 0 ? (
            <EmptyState
              title="Nothing saved yet"
              description="Save resources you want to revisit later."
              href="/resources"
              linkText="Find resources"
            />
          ) : (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {wishlist.slice(0, 6).map((resource) => (
                <Link
                  key={resource.id}
                  href={`/resources/${encodeURIComponent(resource.id)}`}
                  className="group overflow-hidden rounded-xl border border-slate-200 transition hover:border-blue-200 hover:shadow-lg"
                >
                  {resource.thumbnail_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={resource.thumbnail_url}
                      alt={resource.title}
                      loading="lazy"
                      className="h-40 w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-40 items-center justify-center bg-gradient-to-br from-slate-950 to-blue-800 text-white">
                      <BookOpen size={35} />
                    </div>
                  )}

                  <div className="p-4">
                    <h3 className="line-clamp-2 font-bold text-slate-950 transition group-hover:text-blue-700">
                      {resource.title}
                    </h3>

                    <div className="mt-3 flex items-center justify-between gap-3">
                      <span className="text-sm font-black text-slate-950">
                        {resource.price == null ||
                        Number(resource.price) === 0
                          ? "Free"
                          : `KSh ${Number(resource.price).toLocaleString("en-KE")}`}
                      </span>

                      <ArrowRight
                        size={17}
                        className="text-slate-400 group-hover:text-blue-700"
                      />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {wishlist.length > 0 && (
            <Link
              href="/wishlist"
              className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-blue-700 hover:text-blue-900"
            >
              View complete wishlist <ArrowRight size={16} />
            </Link>
          )}
        </section>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-black text-slate-950">
                Recent learning activity
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                A combined timeline of recent views and saved resources.
              </p>
            </div>

            <Clock size={23} className="text-blue-700" />
          </div>

          {recentActivity.length === 0 ? (
            <EmptyState
              title="No recent activity"
              description="Your activity will appear here as you explore and save resources."
              href="/resources"
              linkText="Start exploring"
            />
          ) : (
            <div className="mt-6 divide-y divide-slate-100">
              {recentActivity.map((activity) => (
                <Link
                  key={activity.id}
                  href={activity.href}
                  className="flex items-center gap-4 py-4 transition hover:bg-slate-50"
                >
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${activity.style}`}
                  >
                    {activity.icon}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-slate-900">
                      {activity.title}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {activity.description}
                    </p>
                  </div>

                  <div className="hidden shrink-0 text-xs text-slate-400 sm:block">
                    {activity.date
                      ? new Date(activity.date).toLocaleDateString(
                          "en-KE",
                          {
                            month: "short",
                            day: "numeric",
                          },
                        )
                      : ""}
                  </div>

                  <ArrowRight
                    size={17}
                    className="shrink-0 text-slate-400"
                  />
                </Link>
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

function MetricCard({
  title,
  value,
  subtitle,
  icon,
  iconStyle,
}: {
  title: string;
  value: number | string;
  subtitle: string;
  icon: React.ReactNode;
  iconStyle: string;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-500">{title}</p>

          <p className="mt-3 break-words text-2xl font-black text-slate-950">
            {value}
          </p>
        </div>

        <div className={`rounded-xl p-3 ${iconStyle}`}>{icon}</div>
      </div>

      <p className="mt-4 text-xs leading-5 text-slate-500">{subtitle}</p>
    </article>
  );
}

function Shortcut({
  href,
  title,
  description,
  icon,
  style,
}: {
  href: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  style: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-xl border border-slate-100 p-4 transition hover:border-blue-200 hover:bg-slate-50"
    >
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${style}`}
      >
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <p className="font-bold text-slate-950">{title}</p>

        <p className="mt-1 text-xs leading-5 text-slate-500">
          {description}
        </p>
      </div>

      <ArrowRight size={17} className="shrink-0 text-slate-400" />
    </Link>
  );
}

function EmptyState({
  title,
  description,
  href,
  linkText,
}: {
  title: string;
  description: string;
  href: string;
  linkText: string;
}) {
  return (
    <div className="mt-6 rounded-2xl border border-dashed border-slate-200 px-5 py-10 text-center">
      <BookOpen size={34} className="mx-auto text-slate-300" />

      <h3 className="mt-4 font-black text-slate-950">{title}</h3>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
        {description}
      </p>

      <Link
        href={href}
        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-800"
      >
        {linkText} <ArrowRight size={16} />
      </Link>
    </div>
  );
}
