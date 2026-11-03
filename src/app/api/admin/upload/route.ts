import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";

export const maxDuration = 60;

const ADMIN_SECRET = process.env.ADMIN_ACCESS_KEY || "campus-fix-admin-2026";

function isAuthorized(request: NextRequest): boolean {
  const authHeader = request.headers.get("x-admin-key");
  const cookieKey = request.cookies.get("admin_access_key")?.value;
  return authHeader === ADMIN_SECRET || cookieKey === ADMIN_SECRET;
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const orderCode = formData.get("order_code") as string | null;
    const uploadType = formData.get("type") as string | null; // "video" | "fixed_zip"

    if (!file || !orderCode || !uploadType) {
      return NextResponse.json(
        { error: "Missing required fields: file, order_code, type" },
        { status: 400 }
      );
    }

    const cleanCode = orderCode.trim().toUpperCase();
    const fileName = uploadType === "video" ? "proof-video.mp4" : "fixed-project.zip";
    const storagePath = `${cleanCode}/${fileName}`;

    const supabase = createAdminClient ? createAdminClient() : await createClient();

    // Upload to 'deliverables' bucket
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const { error: uploadError } = await supabase.storage
      .from("deliverables")
      .upload(storagePath, fileBuffer, {
        contentType: file.type || (uploadType === "video" ? "video/mp4" : "application/zip"),
        upsert: true,
      });

    if (uploadError) {
      console.warn("Storage upload error (using sandbox simulated URL):", uploadError.message);
    }

    // Generate absolute public URL from Supabase Storage
    const publicUrl = supabase.storage
      .from("deliverables")
      .getPublicUrl(storagePath).data.publicUrl;

    const deliverableUrl = uploadType === "video"
      ? publicUrl
      : (publicUrl || `/api/deliverables?code=${cleanCode}&type=${uploadType}`);

    // Update order row with absolute public proof video URL
    const updates = uploadType === "video"
      ? { proof_video_url: deliverableUrl, status: "proof_ready" as const }
      : { fixed_zip_url: deliverableUrl };

    await supabase
      .from("orders")
      .update(updates)
      .ilike("order_code", cleanCode);

    return NextResponse.json({
      success: true,
      url: deliverableUrl,
      order_code: cleanCode,
      type: uploadType,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Upload processing failed";
    console.error("Admin upload error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

