 "use client";

import { useState } from "react";

import TeacherHeader from "@/components/teacher/TeacherHeader";
import TeacherSidebar from "@/components/teacher/TeacherSidebar";

type TeacherLayoutClientProps = {
  children: React.ReactNode;
  teacherName?: string | null;
  userEmail?: string | null;
};

export default function TeacherLayoutClient({
  children,
  teacherName,
  userEmail,
}: TeacherLayoutClientProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50">
      <TeacherSidebar
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />

      <div className="lg:pl-[280px]">
        <TeacherHeader
          teacherName={teacherName}
          userEmail={userEmail}
          onMenuClick={() => setMobileOpen(true)}
        />

        {children}
      </div>
    </div>
  );
}