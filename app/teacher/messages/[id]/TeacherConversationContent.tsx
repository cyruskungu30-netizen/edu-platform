"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ConversationView from "@/components/messaging/ConversationView";
import { createClient } from "@/lib/supabase/client";

export default function TeacherConversationContent() {
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
              `/teacher/messages/${discussionId}`
            )}`
          );
          return;
        }

        const { data: profile, error: profileError } =
          await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .maybeSingle();

        if (profileError) throw profileError;

        if (profile?.role !== "teacher") {
          router.replace("/");
          return;
        }

        const { data: teacherProfile, error: teacherError } =
          await supabase
            .from("teacher_profiles")
            .select("id")
            .eq("user_id", user.id)
            .maybeSingle();

        if (teacherError) throw teacherError;

        if (!teacherProfile) {
          router.replace("/teacher/onboarding");
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
          role="teacher"
        />
      </div>
    </main>
  );
}