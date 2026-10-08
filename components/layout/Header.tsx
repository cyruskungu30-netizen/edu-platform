  "use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Bell,
  BookOpen,
  Bookmark,
  Clock3,
  Menu,
  MessageCircle,
  Search,
  ShoppingCart,
  User,
  X,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { useCart } from "@/hooks/useCart";

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [role, setRole] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const { itemCount } = useCart();

  useEffect(() => {
    let mounted = true;

    async function loadUserData() {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!mounted) return;

      if (!user) {
        setUnreadCount(0);
        setRole(null);
        setIsAuthenticated(false);
        return;
      }

      setIsAuthenticated(true);

      const [{ count }, { data: profile }] = await Promise.all([
        supabase
          .from("notifications")
          .select("id", {
            count: "exact",
            head: true,
          })
          .eq("user_id", user.id)
          .eq("is_read", false),

        supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle(),
      ]);

      if (mounted) {
        setUnreadCount(count ?? 0);
        setRole(profile?.role ?? null);
      }
    }

    void loadUserData();

    const supabase = createClient();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void loadUserData();
    });

    const interval = window.setInterval(() => {
      void loadUserData();
    }, 30000);

    return () => {
      mounted = false;
      window.clearInterval(interval);
      subscription.unsubscribe();
    };
  }, []);

  const messagesHref =
    role === "teacher" ? "/teacher/messages" : "/student/messages";

  const showMessages =
    role === "student" || role === "teacher";

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center gap-6 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white">
            <BookOpen size={21} />
          </div>

          <div>
            <div className="text-lg font-black tracking-tight text-slate-900">
              Edu<span className="text-emerald-600">Market</span>
            </div>

            <div className="hidden text-[10px] font-medium uppercase tracking-wider text-slate-400 sm:block">
              Learn. Teach. Grow.
            </div>
          </div>
        </Link>

        {/* Desktop navigation */}
        <nav className="hidden items-center gap-6 lg:flex">
          <Link
            href="/resources"
            className="text-sm font-medium text-slate-600 transition hover:text-emerald-600"
          >
            Resources
          </Link>

          <Link
            href="/categories"
            className="text-sm font-medium text-slate-600 transition hover:text-emerald-600"
          >
            Categories
          </Link>

          <Link
            href="/teachers"
            className="text-sm font-medium text-slate-600 transition hover:text-emerald-600"
          >
            Teachers
          </Link>

          {isAuthenticated && (
            <Link
              href="/account/bookmarks"
              className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-emerald-600"
            >
              <Bookmark size={17} />
              Bookmarks
            </Link>
          )}

          {isAuthenticated && (
            <Link
              href="/account/recently-viewed"
              className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-emerald-600"
            >
              <Clock3 size={17} />
              Recently Viewed
            </Link>
          )}

          {showMessages && (
            <Link
              href={messagesHref}
              className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-emerald-600"
            >
              <MessageCircle size={17} />
              Messages
            </Link>
          )}
        </nav>

        {/* Search */}
        <div className="hidden flex-1 md:block">
          <form
            action="/resources"
            className="mx-auto flex max-w-xl items-center rounded-xl border border-slate-200 bg-slate-50 px-3"
          >
            <Search size={18} className="text-slate-400" />

            <input
              type="search"
              name="search"
              placeholder="Search resources, notes, exams..."
              aria-label="Search resources"
              className="w-full bg-transparent px-3 py-2.5 text-sm text-slate-700 outline-none placeholder:text-slate-400"
            />
          </form>
        </div>

        {/* Header actions */}
        <div className="ml-auto flex items-center gap-2">
          {isAuthenticated && (
            <Link
              href="/account/bookmarks"
              className="hidden rounded-xl p-2.5 text-slate-600 transition hover:bg-slate-100 hover:text-emerald-600 sm:inline-flex"
              aria-label="Saved bookmarks"
              title="Bookmarks"
            >
              <Bookmark size={21} />
            </Link>
          )}

          {isAuthenticated && (
            <Link
              href="/account/recently-viewed"
              className="hidden rounded-xl p-2.5 text-slate-600 transition hover:bg-slate-100 hover:text-emerald-600 sm:inline-flex"
              aria-label="Recently viewed resources"
              title="Recently Viewed"
            >
              <Clock3 size={21} />
            </Link>
          )}

          {showMessages && (
            <Link
              href={messagesHref}
              className="rounded-xl p-2.5 text-slate-600 transition hover:bg-slate-100 hover:text-emerald-600"
              aria-label="Messages"
              title="Messages"
            >
              <MessageCircle size={21} />
            </Link>
          )}

          <Link
            href="/notifications"
            className="relative rounded-xl p-2.5 text-slate-600 transition hover:bg-slate-100 hover:text-emerald-600"
            aria-label={
              unreadCount > 0
                ? `${unreadCount} unread notifications`
                : "Notifications"
            }
          >
            <Bell size={21} />

            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-black text-white ring-2 ring-white">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </Link>

          <Link
            href="/cart"
            className="relative rounded-xl p-2.5 text-slate-600 transition hover:bg-slate-100 hover:text-emerald-600"
            aria-label="Shopping cart"
          >
            <ShoppingCart size={21} />

            {itemCount > 0 && (
              <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-emerald-600 px-1 text-[10px] font-black text-white">
                {itemCount > 99 ? "99+" : itemCount}
              </span>
            )}
          </Link>

          {!isAuthenticated && (
            <Link
              href="/auth/login"
              className="hidden items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-emerald-500 hover:text-emerald-600 sm:flex"
            >
              <User size={17} />
              Sign in
            </Link>
          )}

          <button
            type="button"
            onClick={() => setMobileOpen((value) => !value)}
            className="rounded-xl p-2.5 text-slate-700 hover:bg-slate-100 lg:hidden"
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile navigation */}
      {mobileOpen && (
        <div className="border-t border-slate-200 bg-white px-4 py-5 lg:hidden">
          <div className="space-y-2">
            <form action="/resources" className="mb-4 flex items-center rounded-xl border border-slate-200 bg-slate-50 px-3">
              <Search size={17} className="text-slate-400" />

              <input
                type="search"
                name="search"
                placeholder="Search resources..."
                aria-label="Search resources"
                className="w-full bg-transparent px-3 py-3 text-sm text-slate-700 outline-none"
              />
            </form>

            <Link
              href="/resources"
              onClick={() => setMobileOpen(false)}
              className="block rounded-xl px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Resources
            </Link>

            <Link
              href="/categories"
              onClick={() => setMobileOpen(false)}
              className="block rounded-xl px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Categories
            </Link>

            <Link
              href="/teachers"
              onClick={() => setMobileOpen(false)}
              className="block rounded-xl px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Teachers
            </Link>

            {isAuthenticated && (
              <Link
                href="/account/bookmarks"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <Bookmark className="h-4 w-4" />
                Bookmarks
              </Link>
            )}

            {isAuthenticated && (
              <Link
                href="/account/recently-viewed"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <Clock3 className="h-4 w-4" />
                Recently Viewed
              </Link>
            )}

            {showMessages && (
              <Link
                href={messagesHref}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <MessageCircle className="h-4 w-4" />
                Messages
              </Link>
            )}

            <Link
              href="/notifications"
              onClick={() => setMobileOpen(false)}
              className="flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <span className="flex items-center gap-3">
                <Bell className="h-4 w-4" />
                Notifications
              </span>

              {unreadCount > 0 && (
                <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-bold text-red-700">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </Link>

            <Link
              href="/cart"
              onClick={() => setMobileOpen(false)}
              className="flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <span className="flex items-center gap-3">
                <ShoppingCart className="h-4 w-4" />
                Shopping Cart
              </span>

              {itemCount > 0 && (
                <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-bold text-emerald-700">
                  {itemCount > 99 ? "99+" : itemCount}
                </span>
              )}
            </Link>

            {!isAuthenticated && (
              <Link
                href="/auth/login"
                onClick={() => setMobileOpen(false)}
                className="block rounded-xl bg-emerald-600 px-4 py-3 text-center text-sm font-semibold text-white"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}