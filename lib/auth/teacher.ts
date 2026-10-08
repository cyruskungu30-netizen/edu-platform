import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function requireTeacher() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?redirect=/teacher");
  }

  const { data: teacherProfile, error } = await supabase
    .from("teacher_profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    console.error("Teacher profile lookup failed:", error);
  }

  if (!teacherProfile) {
    redirect("/teacher/onboarding");
  }

  return {
    user,
    teacherProfile,
    supabase,
  };
}