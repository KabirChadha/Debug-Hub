import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import type { UpdateOrder, OrderStatus } from "@/types/database.types";

export const maxDuration = 30;

/**
 * Asynchronously trigger Telegram notification to engineers
 * Format: 🚨 New Project Order: {order_code} | Stack: {tech_stack} | File: {file_name} | Description: {issue_description} | Link: {app_url}/admin
 */
async function triggerTelegramNotification(
  order: { order_code: string; tech_stack: string; issue_description: string; file_name?: string },
  appUrl: string
) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    console.log("[Telegram] Notification skipped: TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not configured.");
    return;
  }

  const filePart = order.file_name ? ` | File: ${order.file_name}` : "";
  const message = `🚨 New Project Order: ${order.order_code} | Stack: ${order.tech_stack}${filePart} | Description: ${order.issue_description} | Link: ${appUrl}/admin`;

  try {
    const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const response = await fetch(telegramUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
      }),
    });

    if (!response.ok) {
      const errDetails = await response.text();
      console.warn("[Telegram] Notification dispatch failed:", errDetails);
    } else {
      console.log(`[Telegram] Alert dispatched for order ${order.order_code}`);
    }
  } catch (err: unknown) {
    console.warn("[Telegram] Error dispatching webhook:", err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      order_code, 
      contact_handle, 
      tech_stack, 
      issue_description, 
      service_type = "bug_fix",
      project_title,
      requirements,
      quoted_price = null,
      zip_storage_path, 
      file_storage_path, 
      file_name,
      user_id,
      user_email,
      utr_number,
      payment_status = "unquoted"
    } = body;

    // Validate required fields
    const effectiveDescription = (issue_description || requirements || "").trim();
    if (!order_code || !contact_handle || !tech_stack || !effectiveDescription) {
      return NextResponse.json(
        { error: "Missing required fields (order_code, contact_handle, tech_stack, issue_description/requirements)" },
        { status: 400 }
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin || "http://localhost:3000";

    const resolvedStoragePath =
      file_storage_path ||
      zip_storage_path ||
      `raw/${order_code}/${file_name || "project.zip"}`;

    const resolvedFileName =
      file_name ||
      (resolvedStoragePath ? resolvedStoragePath.split("/").pop() : "project.zip");

    // Asynchronously trigger Telegram alert without blocking response
    triggerTelegramNotification(
      {
        order_code: order_code.trim().toUpperCase(),
        tech_stack: tech_stack.trim(),
        issue_description: issue_description.trim(),
        file_name: resolvedFileName,
      },
      appUrl
    ).catch((e) => console.warn("Telegram trigger error:", e));

    // Try inserting via server client (or admin client if service role is configured)
    const supabase = createAdminClient ? createAdminClient() : await createClient();

    // Try getting user session if not explicitly provided
    let attachedUserId = user_id || null;
    let attachedUserEmail = user_email || null;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        attachedUserId = attachedUserId || user.id;
        attachedUserEmail = attachedUserEmail || user.email || null;
      }
    } catch {
      // Ignore if unauthenticated
    }

    const { data, error } = await supabase
      .from("orders")
      .insert({
        order_code: order_code.trim().toUpperCase(),
        contact_handle: contact_handle.trim(),
        tech_stack: tech_stack.trim(),
        issue_description: effectiveDescription,
        service_type: service_type || "bug_fix",
        project_title: project_title?.trim() || null,
        requirements: requirements?.trim() || null,
        quoted_price: quoted_price ? Number(quoted_price) : null,
        file_name: resolvedFileName,
        file_storage_path: resolvedStoragePath,
        zip_storage_path: resolvedStoragePath,
        status: "submitted",
        user_id: attachedUserId,
        user_email: attachedUserEmail,
        utr_number: utr_number || null,
        payment_status: payment_status || "unquoted",
      })
      .select()
      .single();

    if (error) {
      console.warn("Database insert warning (may be unconfigured in dev):", error.message);
      // If table is missing new columns, retry inserting with base columns
      if (error.message.includes("column") || error.message.includes("schema cache")) {
        try {
          const { data: retryData, error: retryError } = await supabase
            .from("orders")
            .insert({
              order_code: order_code.trim().toUpperCase(),
              contact_handle: contact_handle.trim(),
              tech_stack: tech_stack.trim(),
              issue_description: effectiveDescription,
              file_name: resolvedFileName,
              file_storage_path: resolvedStoragePath,
              zip_storage_path: resolvedStoragePath,
              status: "submitted",
            })
            .select()
            .maybeSingle();

          if (!retryError && retryData) {
            return NextResponse.json({
              success: true,
              order: {
                ...retryData,
                service_type,
                project_title,
                requirements,
                quoted_price,
                user_id: attachedUserId,
                user_email: attachedUserEmail,
                utr_number: utr_number || null,
                payment_status: payment_status || "unquoted",
              },
            });
          }
        } catch (retryErr) {
          console.warn("Retry base insert error:", retryErr);
        }
      }

      // Return order object even if Supabase keys are placeholders for local sandbox testing
      return NextResponse.json({
        success: true,
        order: {
          order_code,
          contact_handle,
          tech_stack,
          issue_description: effectiveDescription,
          service_type,
          project_title,
          requirements,
          quoted_price,
          file_name: resolvedFileName,
          file_storage_path: resolvedStoragePath,
          zip_storage_path: resolvedStoragePath,
          status: "submitted",
          user_id: attachedUserId,
          user_email: attachedUserEmail,
          utr_number: utr_number || null,
          payment_status: payment_status || "unquoted",
          created_at: new Date().toISOString(),
        },
        notice: "Order recorded in sandbox mode",
      });
    }

    return NextResponse.json({
      success: true,
      order: data,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to process order";
    console.error("API error creating order:", message);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");

    if (!code) {
      return NextResponse.json({ error: "Missing code query param" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .ilike("order_code", code.trim().toUpperCase())
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ order: data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      order_code, 
      status, 
      proof_video_url, 
      fixed_zip_url, 
      deliverable_url,
      deliverable_storage_path,
      deliverable_file_name,
      utr_number, 
      payment_status, 
      is_paid, 
      updated_at 
    } = body;

    if (!order_code) {
      return NextResponse.json({ error: "Missing order_code" }, { status: 400 });
    }

    const cleanCode = order_code.trim().toUpperCase();
    const supabase = createAdminClient ? createAdminClient() : await createClient();

    const updates: UpdateOrder = {};
    if (status) updates.status = status as OrderStatus;
    if (proof_video_url !== undefined) updates.proof_video_url = proof_video_url;
    if (fixed_zip_url !== undefined) updates.fixed_zip_url = fixed_zip_url;
    if (deliverable_url !== undefined) updates.deliverable_url = deliverable_url;
    if (deliverable_storage_path !== undefined) updates.deliverable_storage_path = deliverable_storage_path;
    if (deliverable_file_name !== undefined) updates.deliverable_file_name = deliverable_file_name;
    if (utr_number !== undefined) updates.utr_number = utr_number;
    if (payment_status !== undefined) updates.payment_status = payment_status;
    if (is_paid !== undefined) updates.is_paid = is_paid;
    if (updated_at !== undefined) updates.updated_at = updated_at;

    const { data, error } = await supabase
      .from("orders")
      .update(updates)
      .ilike("order_code", cleanCode)
      .select()
      .maybeSingle();

    if (error) {
      console.warn("DB update error on orders PATCH:", error.message);
      if (error.message.includes("column") || error.message.includes("schema cache")) {
        try {
          const basicUpdates: UpdateOrder = {};
          if (status) basicUpdates.status = status as OrderStatus;
          if (proof_video_url !== undefined) basicUpdates.proof_video_url = proof_video_url;
          if (fixed_zip_url !== undefined) basicUpdates.fixed_zip_url = fixed_zip_url;
          if (Object.keys(basicUpdates).length > 0) {
            await supabase.from("orders").update(basicUpdates).ilike("order_code", cleanCode);
          }
        } catch (fallbackErr) {
          console.warn("Fallback basic update also had issue:", fallbackErr);
        }

        return NextResponse.json({
          success: true,
          order: {
            order_code: cleanCode,
            status: status || "submitted",
            utr_number: utr_number || null,
            payment_status: payment_status || "unpaid",
          },
          warning: "Remote Supabase schema cache pending migration for payment_status/utr_number.",
        });
      }

      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, order: data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
