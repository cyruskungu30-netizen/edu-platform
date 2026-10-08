 "use client";

import Link from "next/link";
import { Bell, Menu, Search } from "lucide-react";

type TeacherHeaderProps = {
  onMenuClick?: () => void;
  teacherName?: string | null;
  userEmail?: string | null;
};

export default function TeacherHeader({
  onMenuClick,
  teacherName,
  userEmail,
}: TeacherHeaderProps) {
  const firstName =
    teacherName?.trim().split(/\s+/)[0] || "Teacher";

  const initials = firstName.charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="flex h-20 items-center gap-4 px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={onMenuClick}
          className="rounded-xl border border-slate-200 p-2.5 text-slate-600 hover:bg-slate-50 lg:hidden"
          aria-label="Open navigation"
        >
          <Menu size={21} />
        </button>

        <div className="hidden flex-1 md:block">
          <div className="relative max-w-xl">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="search"
              placeholder="Search your workspace..."
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
            />
          </div>
        </div>

        <div className="ml-auto flex items-center gap-3">
          <Link
            href="/notifications"
            className="relative rounded-xl border border-slate-200 p-2.5 text-slate-600 transition hover:bg-slate-50"
            aria-label="Notifications"
          >
            <Bell size={19} />

            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-blue-600" />
          </Link>

          <div className="hidden h-9 w-px bg-slate-200 sm:block" />

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <div className="text-sm font-semibold text-slate-900">
                {firstName}
              </div>

              <div className="max-w-[220px] truncate text-xs text-slate-500">
                {userEmail || "Teacher"}
              </div>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
              {initials}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}