import { Suspense } from "react";
import AssessmentForm from "@/components/teacher/AssessmentForm";

export const metadata = {
  title: "Manage Assessment | EduMarket",
};

function AssessmentLoading() {
  return (
    <div className="space-y-5">
      <div className="h-28 animate-pulse rounded-2xl bg-slate-100" />
      <div className="h-64 animate-pulse rounded-2xl bg-slate-100" />
      <div className="h-80 animate-pulse rounded-2xl bg-slate-100" />
    </div>
  );
}

async function AssessmentEditor({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <AssessmentForm assessmentId={id} />;
}

export default function ManageAssessmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-9">
      <Suspense fallback={<AssessmentLoading />}>
        <AssessmentEditor params={params} />
      </Suspense>
    </main>
  );
}