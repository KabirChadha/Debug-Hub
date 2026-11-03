import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import type { Order } from "@/types/database.types";

export const maxDuration = 30;

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { searchParams } = new URL(request.url);
    const queryEmail = searchParams.get("email");

    const effectiveUserId = user?.id;
    const effectiveEmail = user?.email || queryEmail;

    if (!effectiveUserId && !effectiveEmail) {
      return NextResponse.json({ orders: [], message: "No authenticated session" });
    }

    const adminSupabase = createAdminClient ? createAdminClient() : supabase;

    let query = adminSupabase.from("orders").select("*");

    if (effectiveUserId && effectiveEmail) {
      query = query.or(`user_id.eq.${effectiveUserId},user_email.eq.${effectiveEmail}`);
    } else if (effectiveUserId) {
      query = query.eq("user_id", effectiveUserId);
    } else if (effectiveEmail) {
      query = query.eq("user_email", effectiveEmail);
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) {
      console.warn("User orders query warning:", error.message);
      // Fallback if user_email / user_id columns are not yet migrated on remote DB
      if (error.message.includes("column") || error.message.includes("schema cache")) {
        try {
          const searchHandle = effectiveEmail ? effectiveEmail.split("@")[0] : "";
          if (searchHandle) {
            const fallbackQuery = adminSupabase
              .from("orders")
              .select("*")
              .ilike("contact_handle", `%${searchHandle}%`)
              .order("created_at", { ascending: false });

            const { data: fallbackData } = await fallbackQuery;
            if (fallbackData) {
              return NextResponse.json({ orders: fallbackData as Order[] });
            }
          }
        } catch (fallbackErr) {
          console.warn("Fallback orders query error:", fallbackErr);
        }
      }
      return NextResponse.json({ orders: [] });
    }

    return NextResponse.json({ orders: (data as Order[]) || [] });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error fetching user orders";
    return NextResponse.json({ error: message, orders: [] }, { status: 500 });
  }
}

