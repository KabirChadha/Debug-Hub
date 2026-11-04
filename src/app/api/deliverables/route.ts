import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";

export const maxDuration = 30;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = (searchParams.get("code") || "FIX-DEMO").trim().toUpperCase();

  const supabase = createAdminClient ? createAdminClient() : await createClient();

  // Real Project Deliverable: Fetch from Supabase Storage 'deliverables' bucket
  try {
    // 1. Check if order record specifies fixed_zip_url or deliverable_url
    const { data: order } = await supabase
      .from("orders")
      .select("fixed_zip_url, deliverable_url, status, payment_status")
      .ilike("order_code", code)
      .maybeSingle();

    const directUrl = (order as Record<string, unknown>)?.deliverable_url as string || order?.fixed_zip_url;
    if (directUrl) {
      const fixedUrl = directUrl.trim();
      // If absolute remote URL, redirect directly
      if (fixedUrl.startsWith("http://") || fixedUrl.startsWith("https://")) {
        return NextResponse.redirect(fixedUrl);
      }
    }

    // 2. Query Supabase Storage from bucket 'deliverables'
    let storagePath = `${code}/fixed-project.zip`;
    try {
      const { data: listFiles } = await supabase.storage.from("deliverables").list(code);
      if (listFiles && listFiles.length > 0) {
        storagePath = `${code}/${listFiles[0].name}`;
      }
    } catch {
      // Fallback to default path
    }

    // Attempt 1: Generate signed URL with download attachment header
    const { data: signedData, error: signedError } = await supabase.storage
      .from("deliverables")
      .createSignedUrl(storagePath, 3600, { download: `fixed-project-${code}.zip` });

    if (!signedError && signedData?.signedUrl) {
      return NextResponse.redirect(signedData.signedUrl);
    }

    // Attempt 2: Direct binary download stream from deliverables bucket
    const { data: fileData, error: fileError } = await supabase.storage
      .from("deliverables")
      .download(storagePath);

    if (!fileError && fileData) {
      const arrayBuffer = await fileData.arrayBuffer();
      return new NextResponse(arrayBuffer, {
        status: 200,
        headers: {
          "Content-Type": "application/zip",
          "Content-Disposition": `attachment; filename="fixed-project-${code}.zip"`,
        },
      });
    }

    // If file cannot be found in storage
    return NextResponse.json(
      {
        error: "Deliverable package not found. Ensure the fixed project archive has been uploaded.",
        order_code: code,
      },
      { status: 404 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Deliverable retrieval failed";
    console.error("Deliverable download error:", message);
    return NextResponse.json(
      {
        error: "Deliverable package not found. Ensure the fixed project archive has been uploaded.",
        order_code: code,
      },
      { status: 404 }
    );
  }
}
