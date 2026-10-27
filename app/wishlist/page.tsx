 import Link from "next/link";
import { connection } from "next/server";
import {
  ArrowRight,
  BookOpen,
  Heart,
  LockKeyhole,
  Trash2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "My Wishlist | EduMarket",
  description: "Manage your saved educational resources on EduMarket.",
};

type WishlistItem = {
  id: string;
  resource_id: string;
  created_at: string;
};

type Resource = {
  id: string;
  title: string;
  description: string | null;
  price: number | null;
  category: string | null;
  thumbnail_url: string | null;
};

export default async function WishlistPage() {
  await connection();

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5 py-16">
        <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
            <LockKeyhole size={30} />
          </div>

          <h1 className="mt-6 text-2xl font-black text-slate-950">
            Sign in to view your wishlist
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-500">
            Keep your favourite learning resources together and find them
            whenever you need them.
          </p>

          <Link
            href="/auth"
            className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3 font-bold text-white transition hover:bg-blue-800"
          >
            Sign in <ArrowRight size={18} />
          </Link>

          <Link
            href="/resources"
            className="mt-4 inline-block text-sm font-semibold text-slate-600 hover:text-blue-700"
          >
            Explore resources
          </Link>
        </section>
      </main>
    );
  }

  const { data: wishlistData, error: wishlistError } = await supabase
    .from("wishlist")
    .select("id, resource_id, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const wishlistItems = (wishlistData ?? []) as WishlistItem[];

  let resources: Resource[] = [];
  let resourceError = false;

  if (!wishlistError && wishlistItems.length > 0) {
    const resourceIds = [
      ...new Set(wishlistItems.map((item) => item.resource_id)),
    ];

    const { data, error } = await supabase
      .from("resources")
      .select("id, title, description, price, category, thumbnail_url")
      .in("id", resourceIds);

    if (error) {
      resourceError = true;
    } else {
      resources = (data ?? []) as Resource[];
    }
  }

  const resourceMap = new Map(resources.map((resource) => [resource.id, resource]));

  const savedResources = wishlistItems
    .map((item) => ({
      ...item,
      resource: resourceMap.get(item.resource_id),
    }))
    .filter(
      (
        item,
      ): item is WishlistItem & {
        resource: Resource;
      } => Boolean(item.resource),
    );

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="relative overflow-hidden bg-slate-950 px-5 py-14 text-white sm:px-8 sm:py-20">
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-rose-500/20 blur-3xl" />

        <div className="relative mx-auto max-w-7xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-rose-400/20 bg-rose-400/10 px-4 py-2 text-sm font-bold text-rose-300">
            <Heart size={16} className="fill-current" />
            Your personal collection
          </div>

          <h1 className="mt-6 text-4xl font-black tracking-tight sm:text-6xl">
            My <span className="text-rose-400">Wishlist.</span>
          </h1>

          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
            Save valuable learning materials, revisit your favourites, and
            keep your next learning opportunity within reach.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <div className="rounded-xl border border-white/10 bg-white/5 px-5 py-3">
              <p className="text-2xl font-black">{wishlistItems.length}</p>
              <p className="mt-1 text-xs text-slate-400">Saved items</p>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 px-5 py-3">
              <p className="text-2xl font-black">
                {savedResources.length}
              </p>
              <p className="mt-1 text-xs text-slate-400">Available resources</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-rose-600">
              Saved for later
            </p>

            <h2 className="mt-2 text-3xl font-black text-slate-950">
              Your collection
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Resources you have chosen to keep close.
            </p>
          </div>

          <Link
            href="/resources"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-800"
          >
            Discover resources <ArrowRight size={17} />
          </Link>
        </div>

        {wishlistError ? (
          <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
            Your wishlist could not be loaded. Please try again later.
          </div>
        ) : resourceError ? (
          <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
            Your saved resources could not be loaded. Please try again later.
          </div>
        ) : savedResources.length === 0 ? (
          <div className="mt-10 rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-rose-50 text-rose-500">
              <Heart size={36} />
            </div>

            <h3 className="mt-6 text-2xl font-black text-slate-950">
              Your wishlist starts here
            </h3>

            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">
              Find resources that inspire you and save them to build your own
              personalised learning collection.
            </p>

            <Link
              href="/resources"
              className="mt-7 inline-flex items-center gap-2 rounded-xl bg-rose-600 px-6 py-3 font-bold text-white transition hover:bg-rose-700"
            >
              <BookOpen size={18} />
              Explore resources
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {savedResources.map(({ id, resource, created_at }) => (
              <article
                key={id}
                className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-rose-200 hover:shadow-xl"
              >
                <Link
                  href={`/resources/${resource.id}`}
                  className="block"
                  aria-label={`View ${resource.title}`}
                >
                  <div className="flex h-44 items-center justify-center overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-rose-950">
                    {resource.thumbnail_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={resource.thumbnail_url}
                        alt={resource.title}
                        loading="lazy"
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <BookOpen
                        size={52}
                        className="text-white/60 transition group-hover:scale-110"
                      />
                    )}
                  </div>
                </Link>

                <div className="p-5">
                  <p className="text-xs font-bold uppercase tracking-wide text-rose-600">
                    {resource.category || "Learning resource"}
                  </p>

                  <h3 className="mt-2 line-clamp-2 text-lg font-bold text-slate-950">
                    {resource.title}
                  </h3>

                  <p className="mt-2 line-clamp-3 min-h-[60px] text-sm leading-5 text-slate-500">
                    {resource.description ||
                      "Explore this educational resource on EduMarket."}
                  </p>

                  <div className="mt-5 border-t border-slate-100 pt-4">
                    <p className="text-xs text-slate-400">
                      Saved{" "}
                      {Number.isNaN(Date.parse(created_at))
                        ? "previously"
                        : new Date(created_at).toLocaleDateString("en-KE", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                    </p>

                    <div className="mt-3 flex items-center justify-between gap-3">
                      <span className="font-black text-slate-950">
                        {typeof resource.price === "number"
                          ? resource.price === 0
                            ? "Free"
                            : `KES ${resource.price.toLocaleString("en-KE")}`
                          : "View details"}
                      </span>

                      <form action="/api/wishlist" method="post">
                        <button
                          type="submit"
                          disabled
                          title="Remove saved resource using the wishlist button on the resource page"
                          aria-label={`Remove ${resource.title} from wishlist`}
                          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-400 opacity-60"
                        >
                          <Trash2 size={17} />
                        </button>
                      </form>
                    </div>

                    <Link
                      href={`/resources/${resource.id}`}
                      className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white transition hover:bg-rose-600"
                    >
                      View resource <ArrowRight size={16} />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}