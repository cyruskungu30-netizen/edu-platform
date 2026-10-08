 import { Suspense } from "react";
import ExamPaperForm from "@/components/teacher/ExamPaperForm";

export const metadata = {
  title: "Edit Examination | EduMarket",
  description: "Edit and manage your examination paper on EduMarket.",
};

function ExamLoading() {
  return (
    <div className="space-y-6">
      <div className="h-32 animate-pulse rounded-3xl bg-slate-100" />
      <div className="h-64 animate-pulse rounded-3xl bg-slate-100" />
      <div className="h-96 animate-pulse rounded-3xl bg-slate-100" />
    </div>
  );
}

async function ExamEditor({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <ExamPaperForm examId={id} />;
}

export default function EditExamPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-9">
      <Suspense fallback={<ExamLoading />}>
        <ExamEditor params={params} />
      </Suspense>
    </main>
  );
}