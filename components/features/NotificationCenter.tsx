"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Bell,
  BellRing,
  BookOpen,
  Check,
  CheckCheck,
  Clock,
  LoaderCircle,
  MessageSquare,
  RefreshCw,
  ShoppingBag,
  Sparkles,
  Trash2,
} from "lucide-react";

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  type: string | null;
  is_read: boolean;
  created_at: string;
  link?: string | null;
};

type NotificationResponse = {
  notifications?: NotificationItem[];
  unreadCount?: number;
  error?: string;
  message?: string;
};

const MAX_NOTIFICATIONS = 100;

const styles: Record<
  string,
  { icon: typeof Bell; color: string; background: string }
> = {
  order: {
    icon: ShoppingBag,
    color: "text-emerald-700",
    background: "bg-emerald-50",
  },
  resource: {
    icon: BookOpen,
    color: "text-blue-700",
    background: "bg-blue-50",
  },
  message: {
    icon: MessageSquare,
    color: "text-violet-700",
    background: "bg-violet-50",
  },
  system: {
    icon: Sparkles,
    color: "text-orange-700",
    background: "bg-orange-50",
  },
};

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Recently";

  return new Intl.DateTimeFormat("en-KE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function isInternalLink(value: string | null | undefined): value is string {
  return Boolean(
    value &&
      value.startsWith("/") &&
      !value.startsWith("//") &&
      !value.startsWith("/\\"),
  );
}

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const unreadCount = notifications.filter(
    (notification) => !notification.is_read,
  ).length;

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch("/api/notifications", {
        method: "GET",
        credentials: "same-origin",
        cache: "no-store",
      });

      const result: NotificationResponse = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Unable to load your notifications.",
        );
      }

      setNotifications(
        Array.isArray(result.notifications)
          ? result.notifications.slice(0, MAX_NOTIFICATIONS)
          : [],
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load your notifications.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  const updateNotification = async (
    id: string,
    action: "read" | "delete",
  ) => {
    if (busyId || markingAll) return;

    setBusyId(id);
    setError("");
    setNotice("");

    try {
      const response = await fetch("/api/notifications", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify({ id, action }),
      });

      const result: NotificationResponse = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Unable to update this notification.",
        );
      }

      if (action === "delete") {
        setNotifications((current) =>
          current.filter((notification) => notification.id !== id),
        );
        setNotice("Notification deleted.");
      } else {
        setNotifications((current) =>
          current.map((notification) =>
            notification.id === id
              ? { ...notification, is_read: true }
              : notification,
          ),
        );
        setNotice("Notification marked as read.");
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update this notification.",
      );
    } finally {
      setBusyId(null);
    }
  };

  const markAllAsRead = async () => {
    if (markingAll || busyId || unreadCount === 0) return;

    setMarkingAll(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch("/api/notifications", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify({ action: "read_all" }),
      });

      const result: NotificationResponse = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Unable to mark notifications as read.",
        );
      }

      setNotifications((current) =>
        current.map((notification) => ({
          ...notification,
          is_read: true,
        })),
      );

      setNotice("All notifications marked as read.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update notifications.",
      );
    } finally {
      setMarkingAll(false);
    }
  };

  return (
    <section className="w-full">
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="relative overflow-hidden bg-slate-950 px-5 py-7 text-white sm:px-8 sm:py-9">
          <div className="absolute -right-12 -top-20 h-52 w-52 rounded-full bg-blue-500/20 blur-3xl" />

          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-400/10 px-3 py-1.5 text-xs font-bold text-blue-300">
                <BellRing size={14} />
                ACTIVITY CENTRE
              </div>

              <h2 className="mt-4 text-2xl font-black sm:text-3xl">
                Notifications
              </h2>

              <p className="mt-2 max-w-lg text-sm leading-6 text-slate-300">
                Stay on top of important updates from your EduMarket account.
              </p>
            </div>

            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-5 py-4">
              <Bell size={24} className="text-blue-300" />

              <div>
                <p className="text-2xl font-black">{unreadCount}</p>
                <p className="text-xs text-slate-400">Unread updates</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="text-sm text-slate-500">
            {notifications.length}{" "}
            {notifications.length === 1 ? "notification" : "notifications"}
          </p>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void loadNotifications()}
              disabled={loading || Boolean(busyId) || markingAll}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw
                size={15}
                className={loading ? "animate-spin" : ""}
              />
              Refresh
            </button>

            <button
              type="button"
              onClick={() => void markAllAsRead()}
              disabled={
                loading ||
                unreadCount === 0 ||
                Boolean(busyId) ||
                markingAll
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-3 py-2.5 text-sm font-bold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {markingAll ? (
                <LoaderCircle size={15} className="animate-spin" />
              ) : (
                <CheckCheck size={15} />
              )}
              Mark all read
            </button>
          </div>
        </div>

        {(error || notice) && (
          <div
            role={error ? "alert" : "status"}
            className={`mx-4 mt-4 flex items-start gap-3 rounded-xl border p-4 text-sm sm:mx-6 ${
              error
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-emerald-200 bg-emerald-50 text-emerald-700"
            }`}
          >
            {error ? (
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
            ) : (
              <Check size={18} className="mt-0.5 shrink-0" />
            )}

            <p>{error || notice}</p>
          </div>
        )}

        {loading ? (
          <div className="space-y-4 p-5 sm:p-6">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="flex animate-pulse gap-4 rounded-2xl border border-slate-100 p-4"
              >
                <div className="h-12 w-12 shrink-0 rounded-xl bg-slate-200" />

                <div className="flex-1 space-y-3">
                  <div className="h-4 w-1/3 rounded bg-slate-200" />
                  <div className="h-3 w-full rounded bg-slate-100" />
                  <div className="h-3 w-2/3 rounded bg-slate-100" />
                </div>
              </div>
            ))}
          </div>
        ) : error && notifications.length === 0 ? (
          <div className="px-5 py-12 text-center sm:px-8">
            <AlertCircle
              size={34}
              className="mx-auto text-red-400"
            />

            <h3 className="mt-4 text-lg font-black text-slate-950">
              Notifications unavailable
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              Check your connection and try again.
            </p>

            <button
              type="button"
              onClick={() => void loadNotifications()}
              className="mt-5 rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white hover:bg-blue-800"
            >
              Try again
            </button>
          </div>
        ) : notifications.length === 0 ? (
          <div className="px-5 py-14 text-center sm:px-8">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
              <Bell size={30} />
            </div>

            <h3 className="mt-5 text-xl font-black text-slate-950">
              You&apos;re all caught up
            </h3>

            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
              New notifications will appear here when they are created for
              your account.
            </p>

            <Link
              href="/resources"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-800"
            >
              Explore resources
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {notifications.map((notification) => {
              const style =
                styles[notification.type ?? "system"] ?? styles.system;

              const Icon = style.icon;
              const busy = busyId === notification.id;

              return (
                <article
                  key={notification.id}
                  className={`p-4 transition sm:p-6 ${
                    notification.is_read ? "bg-white" : "bg-blue-50/40"
                  }`}
                >
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl sm:h-12 sm:w-12 ${style.background} ${style.color}`}
                    >
                      <Icon size={21} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="break-words font-bold text-slate-950">
                          {notification.title}
                        </h3>

                        {!notification.is_read && (
                          <span className="rounded-full bg-blue-100 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-blue-700">
                            New
                          </span>
                        )}
                      </div>

                      <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-600">
                        {notification.message}
                      </p>

                      <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-slate-400">
                        <Clock size={13} />
                        {formatDate(notification.created_at)}
                      </p>

                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        {isInternalLink(notification.link) && (
                          <Link
                            href={notification.link}
                            className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-3 py-2 text-xs font-bold text-white transition hover:bg-blue-800"
                          >
                            View details
                          </Link>
                        )}

                        {!notification.is_read && (
                          <button
                            type="button"
                            onClick={() =>
                              void updateNotification(notification.id, "read")
                            }
                            disabled={Boolean(busyId) || markingAll}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 transition hover:bg-white disabled:opacity-50"
                          >
                            {busy ? (
                              <LoaderCircle
                                size={14}
                                className="animate-spin"
                              />
                            ) : (
                              <Check size={14} />
                            )}
                            Mark as read
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() =>
                            void updateNotification(
                              notification.id,
                              "delete",
                            )
                          }
                          disabled={Boolean(busyId) || markingAll}
                          aria-label={`Delete notification: ${notification.title}`}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
                        >
                          {busy ? (
                            <LoaderCircle
                              size={14}
                              className="animate-spin"
                            />
                          ) : (
                            <Trash2 size={14} />
                          )}
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}