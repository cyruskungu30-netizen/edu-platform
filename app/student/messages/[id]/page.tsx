  import { Suspense } from "react";
import StudentConversationContent from "./StudentConversationContent";

export default function StudentConversationPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-slate-50 p-6">
          <div className="mx-auto h-64 max-w-5xl animate-pulse rounded-3xl bg-white" />
        </main>
      }
    >
      <StudentConversationContent />
    </Suspense>
  );
}