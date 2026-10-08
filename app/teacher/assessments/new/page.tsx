import { Suspense } from "react";
import AssessmentForm from "@/components/teacher/AssessmentForm";

export const metadata = {
  title: "Create Assessment | EduMarket",
};

export default function NewAssessmentPage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-9">
      <Suspense
        fallback={
          <div className="animate-pulse rounded-2xl bg-slate-100 p-10 text-center text-slate-500">
            Preparing assessment editor...
          </div>
        }
      >
        <AssessmentForm />
      </Suspense>
    </main>
  );
}