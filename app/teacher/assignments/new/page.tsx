import { Suspense } from "react";
import AssignmentForm from "@/components/teacher/AssignmentForm";

export const metadata = {
  title: "Create Assignment | EduMarket",
  description: "Create homework, classwork, and projects in EduMarket.",
};

export default function NewAssignmentPage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-9">
      <Suspense
        fallback={
          <div className="animate-pulse rounded-2xl bg-slate-100 p-10 text-center text-slate-500">
            Preparing assignment editor...
          </div>
        }
      >
        <AssignmentForm />
      </Suspense>
    </main>
  );
}