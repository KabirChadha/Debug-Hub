import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";

export const maxDuration = 60;

const ADMIN_SECRET = process.env.ADMIN_ACCESS_KEY || "campus-fix-admin-2026";

function isAuthorized(request: NextRequest): boolean {
  const authHeader = request.headers.get("x-admin-key");
  const cookieKey = request.cookies.get("admin_access_key")?.value;
  const { searchParams } = new URL(request.url);
  const queryKey = searchParams.get("key");

  return (
    authHeader === ADMIN_SECRET ||
    cookieKey === ADMIN_SECRET ||
    queryKey === ADMIN_SECRET
  );
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const path = searchParams.get("path");
  const filename = searchParams.get("filename") || (path ? path.split("/").pop() : "source_file");

  if (!path) {
    return NextResponse.json(
      { error: "File not found in storage. Ensure the student completed file upload." },
      { status: 404 }
    );
  }

  try {
    const supabase = createAdminClient ? createAdminClient() : await createClient();

    // 1. Try generating a signed URL with service role permissions (valid for 3600 seconds)
    const { data: signedData, error: signedError } = await supabase.storage
      .from("project-intakes")
      .createSignedUrl(path, 3600, { download: filename || true });

    if (!signedError && signedData?.signedUrl) {
      if (
        request.headers.get("accept")?.includes("application/json") ||
        searchParams.get("format") === "json"
      ) {
        return NextResponse.json({ success: true, signedUrl: signedData.signedUrl });
      }
      return NextResponse.redirect(signedData.signedUrl);
    }

    // 2. Direct download stream fallback if signedUrl is not supported
    const { data: fileBlob, error: downloadError } = await supabase.storage
      .from("project-intakes")
      .download(path);

    if (downloadError || !fileBlob) {
      return NextResponse.json(
        { error: "File not found in storage. Ensure the student completed file upload." },
        { status: 404 }
      );
    }

    const arrayBuffer = await fileBlob.arrayBuffer();
    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": fileBlob.type || "application/octet-stream",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Download failed";
    console.error("Admin intake download error:", message);
    return NextResponse.json(
      { error: "File not found in storage. Ensure the student completed file upload." },
      { status: 404 }
    );
  }
}
