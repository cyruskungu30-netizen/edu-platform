 import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

const BUCKET_NAME = "resources";
const SIGNED_URL_SECONDS = 60;

export async function GET(
  _request: Request,
  {
    params,
  }: {
    params: Promise<{ id: string }>;
  },
) {
  try {
    const { id } = await params;

    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: "You must be signed in to download this resource.",
        },
        { status: 401 },
      );
    }

    const { data: resource, error: resourceError } = await supabase
      .from("resources")
      .select(
        "id, title, status, pricing_model",
      )
      .eq("id", id)
      .maybeSingle();

    if (resourceError) {
      return NextResponse.json(
        {
          success: false,
          error: resourceError.message,
        },
        { status: 500 },
      );
    }

    if (!resource || resource.status !== "published") {
      return NextResponse.json(
        {
          success: false,
          error: "Resource not found.",
        },
        { status: 404 },
      );
    }

    const isFree =
      resource.pricing_model === "free";

    let entitlement: {
      id: string;
      download_limit: number | null;
      download_count: number | null;
      expires_at: string | null;
    } | null = null;

    if (!isFree) {
      const { data, error: entitlementError } = await supabase
        .from("entitlements")
        .select(
          "id, download_limit, download_count, expires_at",
        )
        .eq("user_id", user.id)
        .eq("resource_id", resource.id)
        .maybeSingle();

      if (entitlementError) {
        return NextResponse.json(
          {
            success: false,
            error: entitlementError.message,
          },
          { status: 500 },
        );
      }

      entitlement = data;

      if (!entitlement) {
        return NextResponse.json(
          {
            success: false,
            error:
              "You do not have access to this resource.",
          },
          { status: 403 },
        );
      }

      if (
        entitlement.expires_at &&
        new Date(entitlement.expires_at).getTime() <= Date.now()
      ) {
        return NextResponse.json(
          {
            success: false,
            error: "Your access to this resource has expired.",
          },
          { status: 403 },
        );
      }

      if (
        entitlement.download_limit !== null &&
        Number(entitlement.download_count ?? 0) >=
          Number(entitlement.download_limit)
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "You have reached the download limit for this resource.",
          },
          { status: 403 },
        );
      }
    }

    const { data: resourceFile, error: fileError } =
      await supabase
        .from("resource_files")
        .select(
          "id, storage_path, file_name, mime_type",
        )
        .eq("resource_id", resource.id)
        .order("id", { ascending: true })
        .limit(1)
        .maybeSingle();

    if (fileError) {
      return NextResponse.json(
        {
          success: false,
          error: fileError.message,
        },
        { status: 500 },
      );
    }

    if (!resourceFile) {
      return NextResponse.json(
        {
          success: false,
          error: "No downloadable file is attached to this resource.",
        },
        { status: 404 },
      );
    }

    const serviceRoleKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!serviceRoleKey) {
      console.error(
        "SUPABASE_SERVICE_ROLE_KEY is missing.",
      );

      return NextResponse.json(
        {
          success: false,
          error: "Download service is not configured.",
        },
        { status: 500 },
      );
    }

    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    );

    const { data: signedUrlData, error: signedUrlError } =
      await supabaseAdmin.storage
        .from(BUCKET_NAME)
        .createSignedUrl(
          resourceFile.storage_path,
          SIGNED_URL_SECONDS,
          {
            download: resourceFile.file_name,
          },
        );

    if (signedUrlError || !signedUrlData?.signedUrl) {
      console.error(
        "SIGNED_URL_ERROR:",
        signedUrlError,
      );

      return NextResponse.json(
        {
          success: false,
          error:
            signedUrlError?.message ??
            "Unable to generate a secure download link.",
        },
        { status: 500 },
      );
    }

    if (entitlement) {
      const currentCount = Number(
        entitlement.download_count ?? 0,
      );

      const { error: updateError } = await supabase
        .from("entitlements")
        .update({
          download_count: currentCount + 1,
        })
        .eq("id", entitlement.id)
        .eq("user_id", user.id);

      if (updateError) {
        console.error(
          "ENTITLEMENT_UPDATE_ERROR:",
          updateError,
        );

        return NextResponse.json(
          {
            success: false,
            error:
              "The download could not be recorded.",
          },
          { status: 500 },
        );
      }
    }

    const { error: downloadLogError } =
      await supabase.from("downloads").insert({
        user_id: user.id,
        resource_id: resource.id,
        entitlement_id: entitlement?.id ?? null,
      });

    if (downloadLogError) {
      console.error(
        "DOWNLOAD_LOG_ERROR:",
        downloadLogError,
      );
    }

    return NextResponse.redirect(
      signedUrlData.signedUrl,
      {
        status: 302,
      },
    );
  } catch (error) {
    console.error("DOWNLOAD_ROUTE_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to process the download.",
      },
      { status: 500 },
    );
  }
}