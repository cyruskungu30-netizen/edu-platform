 import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";

async function SupabaseTest() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("categories")
    .select("id, name, slug")
    .order("sort_order");

  if (error) {
    return (
      <div className="mt-8 rounded-2xl border border-red-500/30 bg-red-500/10 p-6">
        <p className="font-bold text-red-400">
          Connection failed
        </p>

        <pre className="mt-3 whitespace-pre-wrap text-sm text-red-200">
          {error.message}
        </pre>
      </div>
    );
  }

  return (
    <div className="mt-8 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6">
      <p className="font-bold text-emerald-400">
        Supabase connected successfully ✓
      </p>

      <div className="mt-5 space-y-2">
        {data?.map((category) => (
          <div
            key={category.id}
            className="rounded-xl bg-white/5 px-4 py-3"
          >
            {category.name}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function TestSupabasePage() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-16 text-white">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold">
          Supabase Connection Test
        </h1>

        <Suspense
          fallback={
            <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6">
              <p className="text-slate-300">
                Connecting to Supabase...
              </p>
            </div>
          }
        >
          <SupabaseTest />
        </Suspense>
      </div>
    </main>
  );
}