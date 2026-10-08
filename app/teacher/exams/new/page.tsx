import { Suspense } from "react";
import ExamPaperForm from "@/components/teacher/ExamPaperForm";

export const metadata = {
  title: "Create Examination | EduMarket",
};

export default function NewExamPage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-9">
      <Suspense
        fallback={
          <div className="rounded-2xl bg-slate-100 p-10 text-center text-slate-500">
            Preparing examination builder...
          </div>
        }
      >
        <ExamPaperForm />
      </Suspense>
    </main>
  );
}