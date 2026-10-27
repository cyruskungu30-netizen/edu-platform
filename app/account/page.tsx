 import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import {
Bell,
BookOpen,
ChevronRight,
Heart,
LifeBuoy,
LogOut,
Package,
ShieldCheck,
ShoppingBag,
User,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import AccountSettingsForm from "@/components/Account/AccountSettingsForm";

type Profile = {
id: string;
full_name: string | null;
avatar_url: string | null;
role: string | null;
created_at: string;
updated_at: string;
};

async function AccountContent() {
await connection();

const supabase = await createClient();

const {
data: { user },
} = await supabase.auth.getUser();

if (!user) {
return ( <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8"> <div className="mx-auto max-w-lg rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm"> <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600"> <User className="h-7 w-7" /> </div>

      <h1 className="mt-6 text-2xl font-black text-slate-900">
        Sign in to your account
      </h1>

      <p className="mt-2 text-sm leading-6 text-slate-500">
        Sign in to manage your EduMarket profile, purchases, library,
        wishlist, notifications, and support requests.
      </p>

      <Link
        href="/auth/login?redirect=/account"
        className="mt-7 inline-flex rounded-xl bg-emerald-600 px-6 py-3 text-sm font-black text-white transition hover:bg-emerald-700"
      >
        Sign in
      </Link>
    </div>
  </main>
);

}

const [
profileResult,
ordersResult,
entitlementsResult,
wishlistResult,
notificationsResult,
supportResult,
reviewsResult,
] = await Promise.all([
supabase
.from("profiles")
.select("*")
.eq("id", user.id)
.maybeSingle(),

supabase
  .from("orders")
  .select("id", { count: "exact", head: true })
  .eq("user_id", user.id),

supabase
  .from("entitlements")
  .select("id", { count: "exact", head: true })
  .eq("user_id", user.id),

supabase
  .from("wishlists")
  .select("id", { count: "exact", head: true })
  .eq("user_id", user.id),

supabase
  .from("notifications")
  .select("id", { count: "exact", head: true })
  .eq("user_id", user.id)
  .eq("is_read", false),

supabase
  .from("support_tickets")
  .select("id", { count: "exact", head: true })
  .eq("user_id", user.id),

supabase
  .from("reviews")
  .select("id", { count: "exact", head: true })
  .eq("user_id", user.id),

]);

const profile = (profileResult.data ?? null) as Profile | null;

const displayName =
profile?.full_name?.trim() ||
user.email?.split("@")[0] ||
"EduMarket User";

const initials = displayName
.split(/\s+/)
.filter(Boolean)
.slice(0, 2)
.map((part) => part.charAt(0).toUpperCase())
.join("");

const orderCount = ordersResult.count ?? 0;
const libraryCount = entitlementsResult.count ?? 0;
const wishlistCount = wishlistResult.count ?? 0;
const unreadCount = notificationsResult.count ?? 0;
const supportCount = supportResult.count ?? 0;
const reviewCount = reviewsResult.count ?? 0;

const memberSince = profile?.created_at
? new Date(profile.created_at).toLocaleDateString("en-KE", {
month: "long",
year: "numeric",
})
: "Recently";

return ( <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8"> <div className="mb-8"> <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-600">
My Account </p>

    <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
      Account &amp; Settings
    </h1>

    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
      Manage your profile, security, purchases, learning resources, and
      EduMarket preferences from one place.
    </p>
  </div>

  <section className="mb-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
    <div className="h-28 bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-500" />

    <div className="px-5 pb-6 sm:px-8">
      <div className="-mt-12 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={displayName}
              className="h-24 w-24 rounded-3xl border-4 border-white object-cover shadow-lg"
            />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-3xl border-4 border-white bg-slate-900 text-2xl font-black text-white shadow-lg">
              {initials || "U"}
            </div>
          )}

          <div className="pb-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-2xl font-black text-slate-900">
                {displayName}
              </h2>

              {profile?.role === "admin" && (
                <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-emerald-700">
                  Admin
                </span>
              )}
            </div>

            <p className="mt-1 text-sm text-slate-500">{user.email}</p>

            <p className="mt-1 text-xs text-slate-400">
              Member since {memberSince}
            </p>
          </div>
        </div>

        <Link
          href="/library"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-black text-white transition hover:bg-emerald-700"
        >
          <BookOpen className="h-4 w-4" />
          My Library
        </Link>
      </div>
    </div>
  </section>

  <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
    <AccountStat
      icon={<ShoppingBag className="h-5 w-5" />}
      label="Orders"
      value={orderCount}
      href="/orders"
    />

    <AccountStat
      icon={<BookOpen className="h-5 w-5" />}
      label="Library"
      value={libraryCount}
      href="/library"
    />

    <AccountStat
      icon={<Heart className="h-5 w-5" />}
      label="Wishlist"
      value={wishlistCount}
      href="/wishlist"
    />

    <AccountStat
      icon={<Bell className="h-5 w-5" />}
      label="Unread Alerts"
      value={unreadCount}
      href="/notifications"
    />
  </section>

  <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
    <div>
      <AccountSettingsForm
        userId={user.id}
        email={user.email ?? ""}
        initialFullName={profile?.full_name ?? ""}
        initialAvatarUrl={profile?.avatar_url ?? ""}
      />
    </div>

    <aside className="space-y-5">
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-5">
          <p className="text-xs font-black uppercase tracking-[0.15em] text-slate-400">
            Account Activity
          </p>

          <h2 className="mt-1 text-lg font-black text-slate-900">
            Your EduMarket
          </h2>
        </div>

        <div className="space-y-1">
          <AccountLink
            href="/orders"
            icon={<Package className="h-4 w-4" />}
            label="My Orders"
            value={String(orderCount)}
          />

          <AccountLink
            href="/library"
            icon={<BookOpen className="h-4 w-4" />}
            label="My Library"
            value={String(libraryCount)}
          />

          <AccountLink
            href="/wishlist"
            icon={<Heart className="h-4 w-4" />}
            label="Wishlist"
            value={String(wishlistCount)}
          />

          <AccountLink
            href="/reviews"
            icon={<ShoppingBag className="h-4 w-4" />}
            label="My Reviews"
            value={String(reviewCount)}
          />

          <AccountLink
            href="/support"
            icon={<LifeBuoy className="h-4 w-4" />}
            label="Support Tickets"
            value={String(supportCount)}
          />

          <AccountLink
            href="/notifications"
            icon={<Bell className="h-4 w-4" />}
            label="Notifications"
            value={String(unreadCount)}
          />
        </div>
      </div>

      <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm">
          <ShieldCheck className="h-5 w-5" />
        </div>

        <h3 className="mt-4 font-black text-emerald-950">
          Your account is protected
        </h3>

        <p className="mt-2 text-sm leading-6 text-emerald-800/80">
          EduMarket uses Supabase authentication and row-level security to
          protect your account and personal data.
        </p>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
            <LogOut className="h-5 w-5" />
          </div>

          <div>
            <h3 className="font-black text-slate-900">
              Finished for now?
            </h3>

            <p className="mt-1 text-xs text-slate-500">
              You can securely sign out below.
            </p>
          </div>
        </div>

        <SignOutButton />
      </div>
    </aside>
  </div>
</main>

);
}

function AccountStat({
icon,
label,
value,
href,
}: {
icon: React.ReactNode;
label: string;
value: number;
href: string;
}) {
return ( <Link
   href={href}
   className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md"
 > <div className="flex items-center justify-between"> <div> <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
{label} </p>

      <p className="mt-2 text-3xl font-black text-slate-900">{value}</p>
    </div>

    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition group-hover:bg-emerald-600 group-hover:text-white">
      {icon}
    </div>
  </div>
</Link>

);
}

function AccountLink({
href,
icon,
label,
value,
}: {
href: string;
icon: React.ReactNode;
label: string;
value: string;
}) {
return ( <Link
   href={href}
   className="flex items-center gap-3 rounded-xl px-3 py-3 transition hover:bg-slate-50"
 > <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
{icon} </div>

  <span className="flex-1 text-sm font-semibold text-slate-700">
    {label}
  </span>

  <span className="text-xs font-bold text-slate-400">{value}</span>

  <ChevronRight className="h-4 w-4 text-slate-300" />
</Link>

);
}

function SignOutButton() {
return ( <form action="/auth/logout" method="post"> <button
     type="submit"
     className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
   > <LogOut className="h-4 w-4" />
Sign Out </button> </form>
);
}

export default function AccountPage() {
return (
<Suspense
fallback={ <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8"> <div className="animate-pulse space-y-6"> <div className="h-10 w-72 rounded-xl bg-slate-200" /> <div className="h-52 rounded-3xl bg-slate-200" />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-28 rounded-2xl bg-slate-200"
            />
          ))}
        </div>

        <div className="h-96 rounded-3xl bg-slate-200" />
      </div>
    </main>
  }
>
  <AccountContent />
</Suspense>

);
}

