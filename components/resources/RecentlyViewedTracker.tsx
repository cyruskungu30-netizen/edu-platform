"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

type RecentlyViewedTrackerProps = {
  resourceId: string;
};

export default function RecentlyViewedTracker({
  resourceId,
}: RecentlyViewedTrackerProps) {
  useEffect(() => {
    let cancelled = false;

    async function trackResource() {
      const supabase = createClient();

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (cancelled || authError || !user) {
        return;
      }

      const { error: updateError } = await supabase
        .from("recently_viewed_resources")
        .update({
          viewed_at: new Date().toISOString(),
        })
        .eq("user_id", user.id)
        .eq("resource_id", resourceId);

      if (cancelled || updateError) {
        return;
      }

      const { data: existing, error: lookupError } = await supabase
        .from("recently_viewed_resources")
        .select("id")
        .eq("user_id", user.id)
        .eq("resource_id", resourceId)
        .maybeSingle();

      if (cancelled || lookupError || existing) {
        return;
      }

      await supabase.from("recently_viewed_resources").insert({
        user_id: user.id,
        resource_id: resourceId,
        viewed_at: new Date().toISOString(),
      });
    }

    void trackResource();

    return () => {
      cancelled = true;
    };
  }, [resourceId]);

  return null;
}