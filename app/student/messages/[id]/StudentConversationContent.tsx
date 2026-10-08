"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ConversationView from "@/components/messaging/ConversationView";
import { createClient } from "@/lib/supabase/client";

export default function StudentConversationContent() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const discussionId = params.id;

  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let active = true;

    async function checkRole() {
      try {
        const supabase = createClient();

        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) throw authError;

        if (!user) {
          router.replace(
            `/login?redirect=${encodeURIComponent(
              `/student/messages/${discussionId}`
            )}`
          );
          return;
        }

        const { data: profile, error } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();

        if (error) throw error;

        if (profile?.role !== "student") {
          router.replace("/");
          return;
        }

        if (active) setAllowed(true);
      } catch {
        if (active) router.replace("/login");
      } finally {
        if (active) setChecking(false);
      }
    }

    void checkRole();

    return () => {
      active = false;
    };
  }, [discussionId, router]);

  if (checking) {
    return (
      <main className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto h-64 max-w-5xl animate-pulse rounded-3xl bg-white" />
      </main>
    );
  }

  if (!allowed) return null;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-8 sm:py-10">
      <div className="mx-auto max-w-5xl">
        <ConversationView
          discussionId={discussionId}
          role="student"
        />
      </div>
    </main>
  );
}