 "use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  BookOpen,
  ClipboardCheck,
  FileQuestion,
  FileText,
  GraduationCap,
  LayoutDashboard,
  MessageCircle,
  Settings,
  Sparkles,
  Users,
  X,
} from "lucide-react";

type TeacherSidebarProps = {
  mobileOpen?: boolean;
  onClose?: () => void;
};

const navigation = [
  {
    label: "Dashboard",
    href: "/teacher",
    icon: LayoutDashboard,
  },
  {
    label: "Lesson Plans",
    href: "/teacher/lesson-plans",
    icon: BookOpen,
  },
  {
    label: "Schemes of Work",
    href: "/teacher/schemes",
    icon: FileText,
  },
  {
    label: "Question Bank",
    href: "/teacher/questions",
    icon: FileQuestion,
  },
  {
    label: "Exam Builder",
    href: "/teacher/exams",
    icon: GraduationCap,
  },
  {
    label: "Assessments",
    href: "/teacher/assessments",
    icon: ClipboardCheck,
  },
  {
    label: "Messages",
    href: "/teacher/messages",
    icon: MessageCircle,
  },
  {
    label: "AI Teaching Assistant",
    href: "/teacher/ai",
    icon: Sparkles,
  },
];

const secondaryNavigation = [
  {
    label: "Analytics",
    href: "/teacher/analytics",
    icon: BarChart3,
  },
  {
    label: "Students",
    href: "/teacher/students",
    icon: Users,
  },
  {
    label: "Settings",
    href: "/teacher/settings",
    icon: Settings,
  },
];

export default function TeacherSidebar({
  mobileOpen = false,
  onClose,
}: TeacherSidebarProps) {
  const pathname = usePathname();

  function isActive(href: string) {
    return (
      pathname === href ||
      (href !== "/teacher" && pathname.startsWith(`${href}/`))
    );
  }

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
        />
      )}

      <aside
        className={[
          "fixed left-0 top-0 z-50 flex h-screen w-[280px] flex-col border-r border-slate-200 bg-white",
          "transition-transform duration-200",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          "lg:translate-x-0",
        ].join(" ")}
      >
        <div className="flex h-20 items-center justify-between border-b border-slate-200 px-6">
          <Link
            href="/teacher"
            onClick={onClose}
            className="flex items-center gap-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
              <GraduationCap size={22} />
            </div>

            <div>
              <div className="text-lg font-bold tracking-tight text-slate-900">
                EduMarket
              </div>

              <div className="text-xs font-medium text-slate-500">
                Teacher Workspace
              </div>
            </div>
          </Link>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
            aria-label="Close navigation"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-6">
          <div className="mb-3 px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Workspace
          </div>

          <nav className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  aria-current={active ? "page" : undefined}
                  className={[
                    "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition",
                    active
                      ? "bg-blue-50 text-blue-700"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                  ].join(" ")}
                >
                  <Icon size={19} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="mb-3 mt-8 px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Management
          </div>

          <nav className="space-y-1">
            {secondaryNavigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  aria-current={active ? "page" : undefined}
                  className={[
                    "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition",
                    active
                      ? "bg-blue-50 text-blue-700"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                  ].join(" ")}
                >
                  <Icon size={19} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="border-t border-slate-200 p-4">
          <Link
            href="/"
            onClick={onClose}
            className="flex items-center justify-center rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Back to EduMarket
          </Link>
        </div>
      </aside>
    </>
  );
}