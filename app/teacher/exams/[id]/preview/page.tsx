import { Suspense } from "react";
import ExamPaperPreview from "@/components/teacher/ExamPaperPreview";

export const metadata = {
  title: "Examination Preview | EduMarket",
  description:
    "Preview and print examination papers and marking schemes.",
};

function PreviewLoading() {
  return (
    <div className="space-y-5">
      <div className="h-28 animate-pulse rounded-2xl bg-slate-100" />
      <div className="h-20 animate-pulse rounded-2xl bg-slate-100" />
      <div className="h-[600px] animate-pulse rounded-2xl bg-slate-100" />
    </div>
  );
}

function PreviewContent({ id }: { id: string }) {
  return <ExamPaperPreview examId={id} />;
}

async function PreviewPageContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <PreviewContent id={id} />;
}

export default function ExamPreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-9">
      <Suspense fallback={<PreviewLoading />}>
        <PreviewPageContent params={params} />
      </Suspense>
    </main>
  );
}