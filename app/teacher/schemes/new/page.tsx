import { Suspense } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  Loader2,
} from "lucide-react";

import { requireTeacher } from "@/lib/auth/teacher";
import SchemeOfWorkForm from "@/components/teacher/SchemeOfWorkForm";

function LoadingState() {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center py-24">
          <div className="text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />
            <p className="mt-3 text-sm text-slate-500">
              Loading scheme builder...
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

async function NewSchemeContent() {
  await requireTeacher();

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="mb-6">
          <Link
            href="/teacher/schemes"
            className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-blue-600"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Schemes
          </Link>
        </div>

        <div className="mb-8">
          <div className="flex items-start gap-4">
            <div className="hidden rounded-2xl bg-blue-100 p-3 text-blue-600 sm:block">
              <BookOpen className="h-7 w-7" />
            </div>

            <div>
              <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                Create Scheme of Work
              </h1>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
                Build a structured scheme of work with weekly lessons,
                learning outcomes, experiences, resources and assessment
                methods.
              </p>
            </div>
          </div>
        </div>

        <SchemeOfWorkForm />
      </div>
    </main>
  );
}

export default function NewSchemePage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <NewSchemeContent />
    </Suspense>
  );
}