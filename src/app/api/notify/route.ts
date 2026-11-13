import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 15;

function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const {
      type,
      order_code,
      service_type,
      stack,
      details,
      utr,
      quoted_price,
    } = body;

    const botToken = process.env.TELEGRAM_BOT_TOKEN?.trim();
    const chatId = process.env.TELEGRAM_CHAT_ID?.trim();

    if (!botToken || !chatId) {
      return NextResponse.json(
        { ok: false, error: "Missing Telegram config" },
        { status: 200 }
      );
    }

    if (!order_code) {
      return NextResponse.json(
        { ok: false, error: "Missing order_code" },
        { status: 200 }
      );
    }

    const safeCode = escapeHtml(String(order_code).trim().toUpperCase());

    let formattedMessage = "";

    if (type === "new_order") {
      const serviceLabel =
        service_type === "custom_project" ? "New Project Build" : "Bug Fix";
      const safeStack = escapeHtml(stack?.trim() || "Not specified");
      const rawDetails = details ? String(details).trim().slice(0, 120) : "Check dashboard";
      const safeDetails = escapeHtml(rawDetails);

      formattedMessage = [
        "🚨 <b>NEW ORDER RECEIVED!</b>",
        "━━━━━━━━━━━━━━━━━━",
        `🆔 <b>Code:</b> <code>${safeCode}</code>`,
        `🛠️ <b>Service:</b> ${serviceLabel}`,
        `💻 <b>Stack:</b> ${safeStack}`,
        `📝 <b>Details:</b> ${safeDetails}`,
        "━━━━━━━━━━━━━━━━━━",
        "👉 Open Admin Dashboard to send quote",
      ].join("\n");
    } else if (type === "utr_submitted") {
      const amountStr = quoted_price ? `₹${quoted_price}` : "Check order";
      const safeUtr = escapeHtml(utr?.trim() || "Not provided");

      formattedMessage = [
        "💰 <b>PAYMENT UTR SUBMITTED!</b>",
        "━━━━━━━━━━━━━━━━━━",
        `🆔 <b>Code:</b> <code>${safeCode}</code>`,
        `💵 <b>Amount:</b> ${amountStr}`,
        `🧾 <b>UTR Ref:</b> <code>${safeUtr}</code>`,
        "━━━━━━━━━━━━━━━━━━",
        "👉 Verify in UPI & approve on Admin Dashboard",
      ].join("\n");
    } else {
      return NextResponse.json(
        { ok: false, error: `Unsupported notification type: ${type}` },
        { status: 200 }
      );
    }

    const telegramRes = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: formattedMessage,
          parse_mode: "HTML",
        }),
      }
    );

    if (!telegramRes.ok) {
      const errBody = await telegramRes.text().catch(() => "");
      console.warn("[Telegram] API delivery error:", errBody);
      return NextResponse.json(
        { ok: false, error: `Telegram error: ${telegramRes.status}` },
        { status: 200 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    console.warn("[Telegram] Error processing notification:", message);
    return NextResponse.json({ ok: false, error: message }, { status: 200 });
  }
}
