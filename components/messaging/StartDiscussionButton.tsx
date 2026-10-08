"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  LoaderCircle,
  MessageCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function StartDiscussionButton({
  assignmentId,
}: {
  assignmentId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function startDiscussion() {
    if (loading) return;

    setLoading(true);
    setError("");

    try {
      const supabase = createClient();

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;

      if (!user) {
        router.push(
          `/login?redirect=${encodeURIComponent(
            `/student/assignments/${assignmentId}`
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

      if (profile?.role !== "student") {
        throw new Error(
          "Only student accounts can start assignment discussions."
        );
      }

      const { data: assignment, error: assignmentError } =
        await supabase
          .from("assignments")
          .select("id, teacher_id, status")
          .eq("id", assignmentId)
          .eq("status", "published")
          .maybeSingle();

      if (assignmentError) throw assignmentError;

      if (!assignment) {
        throw new Error(
          "This assignment is not available for discussion."
        );
      }

      const { data: existing, error: existingError } =
        await supabase
          .from("assignment_discussions")
          .select("id")
          .eq("assignment_id", assignmentId)
          .eq("student_id", user.id)
          .maybeSingle();

      if (existingError) throw existingError;

      if (existing?.id) {
        router.push(
          `/student/messages/${existing.id}`
        );
        return;
      }

      const { data: created, error: createError } =
        await supabase
          .from("assignment_discussions")
          .insert({
            assignment_id: assignment.id,
            student_id: user.id,
            teacher_id: assignment.teacher_id,
          })
          .select("id")
          .single();

      if (createError) {
        // Recover if another request created the discussion first.
        const { data: concurrent } = await supabase
          .from("assignment_discussions")
          .select("id")
          .eq("assignment_id", assignmentId)
          .eq("student_id", user.id)
          .maybeSingle();

        if (concurrent?.id) {
          router.push(
            `/student/messages/${concurrent.id}`
          );
          return;
        }

        throw createError;
      }

      router.push(
        `/student/messages/${created.id}`
      );
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Could not start the discussion."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={startDiscussion}
        disabled={loading}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:opacity-60"
      >
        {loading ? (
          <LoaderCircle className="h-4 w-4 animate-spin" />
        ) : (
          <MessageCircle className="h-4 w-4" />
        )}

        {loading ? "Opening discussion..." : "Ask your teacher"}
      </button>

      {error && (
        <p
          role="alert"
          className="mt-3 text-xs leading-5 text-rose-700"
        >
          {error}
        </p>
      )}
    </div>
  );
}