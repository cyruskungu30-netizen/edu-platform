 "use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import MessageInbox from "@/components/messaging/MessageInbox";
import { createClient } from "@/lib/supabase/client";

export default function TeacherMessagesPage() {
  const router = useRouter();
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
            "/login?redirect=%2Fteacher%2Fmessages"
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
        if (active) {
          router.replace(
            "/login?redirect=%2Fteacher%2Fmessages"
          );
        }
      } finally {
        if (active) setChecking(false);
      }
    }

    void checkRole();

    return () => {
      active = false;
    };
  }, [router]);

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-8 sm:px-8 sm:py-10">
      <div className="mx-auto max-w-7xl">
        {checking ? (
          <div className="h-64 animate-pulse rounded-3xl bg-white" />
        ) : allowed ? (
          <MessageInbox role="teacher" />
        ) : null}
      </div>
    </main>
  );
}