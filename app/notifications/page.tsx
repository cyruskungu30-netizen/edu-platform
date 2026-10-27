  import Link from "next/link";
import { connection } from "next/server";
import {
  ArrowLeft,
  Bell,
  Check,
  CheckCheck,
  CircleCheck,
  CreditCard,
  Download,
  FileText,
  Headphones,
  Info,
  MessageCircle,
  ShoppingBag,
  Star,
  GraduationCap,
  Clock,
  ExternalLink,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";

type Notification = {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
};

function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Recently";
  }

  return new Intl.DateTimeFormat("en-KE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getNotificationIcon(type: string) {
  const normalized = type.toLowerCase();

  if (
    normalized.includes("purchase") ||
    normalized.includes("order")
  ) {
    return ShoppingBag;
  }

  if (normalized.includes("payment")) {
    return CreditCard;
  }

  if (normalized.includes("download")) {
    return Download;
  }

  if (
    normalized.includes("support") ||
    normalized.includes("ticket")
  ) {
    return Headphones;
  }

  if (normalized.includes("review")) {
    return Star;
  }

  if (
    normalized.includes("message") ||
    normalized.includes("reply") ||
    normalized.includes("discussion")
  ) {
    return MessageCircle;
  }

  if (
    normalized.includes("grade") ||
    normalized.includes("grading") ||
    normalized.includes("feedback")
  ) {
    return GraduationCap;
  }

  if (
    normalized.includes("assignment") ||
    normalized.includes("deadline")
  ) {
    return FileText;
  }

  if (
    normalized.includes("success") ||
    normalized.includes("completed")
  ) {
    return CircleCheck;
  }

  if (
    normalized.includes("reminder") ||
    normalized.includes("due")
  ) {
    return Clock;
  }

  return Info;
}

function getNotificationStyle(type: string): string {
  const normalized = type.toLowerCase();

  if (
    normalized.includes("payment") ||
    normalized.includes("purchase") ||
    normalized.includes("order")
  ) {
    return "bg-emerald-50 text-emerald-700 ring-emerald-100";
  }

  if (
    normalized.includes("message") ||
    normalized.includes("reply") ||
    normalized.includes("discussion")
  ) {
    return "bg-blue-50 text-blue-700 ring-blue-100";
  }

  if (
    normalized.includes("grade") ||
    normalized.includes("grading") ||
    normalized.includes("feedback")
  ) {
    return "bg-violet-50 text-violet-700 ring-violet-100";
  }

  if (
    normalized.includes("assignment") ||
    normalized.includes("deadline") ||
    normalized.includes("due") ||
    normalized.includes("reminder")
  ) {
    return "bg-amber-50 text-amber-700 ring-amber-100";
  }

  if (normalized.includes("support")) {
    return "bg-orange-50 text-orange-700 ring-orange-100";
  }

  if (
    normalized.includes("success") ||
    normalized.includes("completed")
  ) {
    return "bg-emerald-50 text-emerald-700 ring-emerald-100";
  }

  return "bg-slate-100 text-slate-700 ring-slate-200";
}

function getSafeInternalLink(link: string | null): string | null {
  if (!link) {
    return null;
  }

  const trimmed = link.trim();

  // Only allow local application paths.
  if (
    !trimmed.startsWith("/") ||
    trimmed.startsWith("//") ||
    trimmed.includes("\\") ||
    trimmed.includes("\n") ||
    trimmed.includes("\r")
  ) {
    return null;
  }

  try {
    const parsed = new URL(trimmed, "https://edumarket.local");

    if (parsed.origin !== "https://edumarket.local") {
      return null;
    }

    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return null;
  }
}

function NotificationsLoading() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-4xl animate-pulse">
        <div className="mb-8 h-5 w-32 rounded bg-slate-200" />

        <div className="mb-8 rounded-3xl border border-slate-200 bg-white p-6">
          <div className="h-8 w-56 rounded bg-slate-200" />
          <div className="mt-3 h-4 w-80 max-w-full rounded bg-slate-100" />
        </div>

        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="rounded-2xl border border-slate-200 bg-white p-5"
            >
              <div className="flex gap-4">
                <div className="h-12 w-12 shrink-0 rounded-2xl bg-slate-200" />

                <div className="flex-1 space-y-3">
                  <div className="h-4 w-48 max-w-full rounded bg-slate-200" />
                  <div className="h-4 w-full rounded bg-slate-100" />
                  <div className="h-4 w-32 rounded bg-slate-100" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

async function NotificationsContent() {
  await connection();

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
            <Bell size={30} />
          </div>

          <h1 className="mt-5 text-2xl font-bold text-slate-900">
            Your notifications
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-600">
            Sign in to view your notifications, assignment updates,
            messages, and account activity.
          </p>

          <Link
            href="/auth/login?redirect=/notifications"
            className="mt-6 inline-flex items-center justify-center rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            Sign in to continue
          </Link>
        </div>
      </main>
    );
  }

  const {
    data: notificationsData,
    error: notificationsError,
  } = await supabase
    .from("notifications")
    .select(
      "id, type, title, message, link, is_read, created_at",
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  const notifications: Notification[] = (notificationsData ?? []).map(
    (item) => ({
      id: String(item.id),
      type: String(item.type ?? "info"),
      title: String(item.title ?? "Notification"),
      message: String(item.message ?? ""),
      link: typeof item.link === "string" ? item.link : null,
      is_read: Boolean(item.is_read),
      created_at: String(item.created_at ?? ""),
    }),
  );

  const unreadCount = notifications.filter(
    (notification) => !notification.is_read,
  ).length;

  async function markAsRead(formData: FormData) {
    "use server";

    const notificationId = formData.get("notificationId");

    if (
      typeof notificationId !== "string" ||
      notificationId.length === 0
    ) {
      return;
    }

    const supabase = await createClient();

    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();

    if (!currentUser) {
      return;
    }

    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notificationId)
      .eq("user_id", currentUser.id)
      .eq("is_read", false);
  }

  async function markAllAsRead() {
    "use server";

    const supabase = await createClient();

    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();

    if (!currentUser) {
      return;
    }

    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", currentUser.id)
      .eq("is_read", false);
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/account"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-slate-950"
        >
          <ArrowLeft size={17} />
          Back to account
        </Link>

        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 px-6 py-8 text-white sm:px-8">
            <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
              <div>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20">
                  <Bell size={25} />
                </div>

                <h1 className="text-3xl font-bold tracking-tight">
                  Notifications
                </h1>

                <p className="mt-2 max-w-lg text-sm leading-6 text-slate-300">
                  Stay informed about your purchases, messages,
                  assignments, grades, and account activity.
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-3 rounded-2xl border border-white/10 bg-white/10 px-4 py-3">
                <div>
                  <p className="text-2xl font-bold">
                    {unreadCount}
                  </p>

                  <p className="text-xs text-slate-300">
                    Unread
                  </p>
                </div>

                <Bell
                  size={22}
                  className="text-blue-200"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-between gap-3 border-b border-slate-100 px-6 py-4 sm:flex-row sm:items-center sm:px-8">
            <div>
              <h2 className="font-semibold text-slate-900">
                Your activity
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {notifications.length}{" "}
                {notifications.length === 1
                  ? "notification"
                  : "notifications"}
                {" "}shown
              </p>
            </div>

            {unreadCount > 0 && (
              <form action={markAllAsRead}>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  <CheckCheck size={17} />
                  Mark all as read
                </button>
              </form>
            )}
          </div>

          <div className="p-4 sm:p-6">
            {notificationsError ? (
              <div
                role="alert"
                className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700"
              >
                <h3 className="font-semibold">
                  Unable to load notifications
                </h3>

                <p className="mt-2 leading-6">
                  Please refresh the page and try again. If the
                  problem continues, check your notifications table
                  permissions and database connection.
                </p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-14 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm ring-1 ring-slate-200">
                  <Bell size={29} />
                </div>

                <h3 className="mt-5 text-lg font-bold text-slate-900">
                  You&apos;re all caught up!
                </h3>

                <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
                  When there is activity on your account, your
                  notifications will appear here.
                </p>

                <Link
                  href="/account"
                  className="mt-6 inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
                >
                  Return to account
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map((notification) => {
                  const Icon = getNotificationIcon(
                    notification.type,
                  );

                  const iconStyle = getNotificationStyle(
                    notification.type,
                  );

                  const safeLink = getSafeInternalLink(
                    notification.link,
                  );

                  return (
                    <article
                      key={notification.id}
                      className={`group rounded-2xl border p-4 transition sm:p-5 ${
                        notification.is_read
                          ? "border-slate-200 bg-white"
                          : "border-blue-200 bg-blue-50/40 shadow-sm"
                      }`}
                    >
                      <div className="flex items-start gap-3 sm:gap-4">
                        <div
                          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1 ${iconStyle}`}
                        >
                          <Icon size={21} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="break-words font-semibold text-slate-900">
                                  {notification.title}
                                </h3>

                                {!notification.is_read && (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-blue-700">
                                    <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                                    New
                                  </span>
                                )}
                              </div>

                              <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-600">
                                {notification.message}
                              </p>
                            </div>

                            <time
                              dateTime={notification.created_at}
                              className="shrink-0 text-xs text-slate-400"
                            >
                              {formatDate(notification.created_at)}
                            </time>
                          </div>

                          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-3">
                            {safeLink && (
                              <Link
                                href={safeLink}
                                className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-700 transition hover:text-blue-900"
                              >
                                View details
                                <ExternalLink size={14} />
                              </Link>
                            )}

                            {!notification.is_read && (
                              <form action={markAsRead}>
                                <input
                                  type="hidden"
                                  name="notificationId"
                                  value={notification.id}
                                />

                                <button
                                  type="submit"
                                  className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-slate-900"
                                >
                                  <Check size={15} />
                                  Mark as read
                                </button>
                              </form>
                            )}

                            {notification.is_read && (
                              <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
                                <CheckCircleIcon />
                                Read
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>

          <div className="border-t border-slate-100 bg-slate-50 px-6 py-4 sm:px-8">
            <p className="text-xs leading-5 text-slate-500">
              Notifications are private to your account. Only
              notifications belonging to your signed-in account are
              displayed and updated.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

function CheckCircleIcon() {
  return <CircleCheck size={14} />;
}

export default function NotificationsPage() {
  return (
    <NotificationsBoundary />
  );
}

function NotificationsBoundary() {
  return (
    <div>
      <NotificationsContentWithFallback />
    </div>
  );
}

function NotificationsContentWithFallback() {
  return (
    <NotificationsSuspense />
  );
}

import { Suspense } from "react";

function NotificationsSuspense() {
  return (
    <Suspense fallback={<NotificationsLoading />}>
      <NotificationsContent />
    </Suspense>
  );
}