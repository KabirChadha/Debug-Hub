import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { EmailOtpType } from "@supabase/supabase-js";

export const maxDuration = 30;

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") || "/dashboard";

  // PKCE Code Exchange flow (default for Supabase email magic link with @supabase/ssr)
  if (code) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        return NextResponse.redirect(`${origin}${next}`);
      }
      console.warn("Magic link code exchange notice:", error.message);
    } catch (err: unknown) {
      console.warn("Auth callback exception during exchangeCodeForSession:", err);
    }
  }

  // Token Hash OTP verify flow (alternative email magic link flow)
  if (token_hash && type) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.verifyOtp({
        type,
        token_hash,
      });
      if (!error) {
        return NextResponse.redirect(`${origin}${next}`);
      }
      console.warn("Magic link verifyOtp notice:", error.message);
    } catch (err: unknown) {
      console.warn("Auth callback exception during verifyOtp:", err);
    }
  }

  // Fallback redirect to dashboard or home
  return NextResponse.redirect(`${origin}${next}`);
}
