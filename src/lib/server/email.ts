type EmailAddress = {
  email: string;
  name?: string;
};

type SendEmailInput = {
  to: EmailAddress[];
  subject: string;
  htmlContent: string;
  textContent?: string;
  tags?: string[];
};

export type ReceiptEmailInput = {
  customerName?: string;
  saleId: string;
  total: string;
  items: Array<{
    name: string;
    quantity: number;
    lineTotal: string;
  }>;
};

const BREVO_ENDPOINT = "https://api.brevo.com/v3/smtp/email";

export function emailConfigured() {
  return Boolean(
    process.env.BREVO_API_KEY &&
      process.env.MESSAGING_FROM_EMAIL &&
      process.env.MESSAGING_FROM_NAME
  );
}

function sender() {
  return {
    email: process.env.MESSAGING_FROM_EMAIL ?? "",
    name: process.env.MESSAGING_FROM_NAME ?? "BrAbel POS",
  };
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderShell(title: string, body: string) {
  return `
    <html>
      <body style="margin:0;background:#f6f7fb;font-family:Arial,Helvetica,sans-serif;color:#101828;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f6f7fb;padding:32px 12px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#ffffff;border:1px solid #e4e7ec;border-radius:12px;overflow:hidden;">
                <tr>
                  <td style="background:#111827;color:#ffffff;padding:22px 28px;">
                    <div style="font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:#d1d5db;">BrAbel POS</div>
                    <h1 style="margin:8px 0 0;font-size:24px;line-height:1.25;">${escapeHtml(title)}</h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding:28px;">
                    ${body}
                  </td>
                </tr>
                <tr>
                  <td style="padding:18px 28px;background:#f9fafb;color:#667085;font-size:12px;line-height:1.5;">
                    This is an automated email from BrAbel POS.
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

export function welcomeEmail(name?: string) {
  const displayName = name?.trim() || "there";
  const body = `
    <p style="font-size:16px;line-height:1.6;margin:0 0 16px;">Hi ${escapeHtml(displayName)},</p>
    <p style="font-size:16px;line-height:1.6;margin:0 0 16px;">Welcome to BrAbel POS. Your workspace is ready for selling, inventory tracking, barcode scanning, receipts, staff roles, and offline-first shop operations.</p>
    <p style="font-size:16px;line-height:1.6;margin:0;">Start by adding your products, opening a cash shift, and running your first test sale.</p>
  `;

  return {
    subject: "Welcome to BrAbel POS",
    htmlContent: renderShell("Welcome to BrAbel POS", body),
    textContent:
      `Hi ${displayName},\n\nWelcome to BrAbel POS. Your workspace is ready for selling, inventory, barcode scanning, receipts, staff roles, and offline-first shop operations.\n\nStart by adding your products, opening a cash shift, and running your first test sale.`,
  };
}

export function receiptEmail(input: ReceiptEmailInput) {
  const rows = input.items
    .map(
      (item) => `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #eaecf0;">${escapeHtml(item.name)}</td>
          <td align="center" style="padding:10px 0;border-bottom:1px solid #eaecf0;">${item.quantity}</td>
          <td align="right" style="padding:10px 0;border-bottom:1px solid #eaecf0;">${escapeHtml(item.lineTotal)}</td>
        </tr>
      `
    )
    .join("");

  const body = `
    <p style="font-size:16px;line-height:1.6;margin:0 0 18px;">Thank you${input.customerName ? `, ${escapeHtml(input.customerName)}` : ""}. Here is your receipt.</p>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;font-size:14px;">
      <thead>
        <tr>
          <th align="left" style="padding:0 0 10px;color:#475467;">Item</th>
          <th align="center" style="padding:0 0 10px;color:#475467;">Qty</th>
          <th align="right" style="padding:0 0 10px;color:#475467;">Total</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <p style="font-size:18px;font-weight:700;margin:20px 0 0;text-align:right;">Total: ${escapeHtml(input.total)}</p>
    <p style="font-size:13px;color:#667085;margin:10px 0 0;text-align:right;">Sale ID: ${escapeHtml(input.saleId)}</p>
  `;

  return {
    subject: `Your BrAbel POS receipt ${input.saleId}`,
    htmlContent: renderShell("Your Receipt", body),
    textContent:
      `Receipt ${input.saleId}\n\n` +
      input.items.map((item) => `${item.quantity} x ${item.name}: ${item.lineTotal}`).join("\n") +
      `\n\nTotal: ${input.total}`,
  };
}

export function lowStockEmail(productName: string, quantity: number) {
  const body = `
    <p style="font-size:16px;line-height:1.6;margin:0 0 16px;">${escapeHtml(productName)} is running low.</p>
    <p style="font-size:16px;line-height:1.6;margin:0;">Current stock: <strong>${quantity}</strong>. Restock or review inventory before sales are affected.</p>
  `;

  return {
    subject: `Low stock alert: ${productName}`,
    htmlContent: renderShell("Low Stock Alert", body),
    textContent: `${productName} is running low. Current stock: ${quantity}.`,
  };
}

export async function sendTransactionalEmail(input: SendEmailInput) {
  const apiKey = process.env.BREVO_API_KEY;

  if (!apiKey || !emailConfigured()) {
    return {
      ok: false,
      status: "unconfigured",
      error: "Brevo email is not configured.",
    };
  }

  const response = await fetch(BREVO_ENDPOINT, {
    method: "POST",
    headers: {
      accept: "application/json",
      "api-key": apiKey,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      sender: sender(),
      to: input.to,
      subject: input.subject,
      htmlContent: input.htmlContent,
      textContent: input.textContent,
      tags: input.tags,
    }),
    cache: "no-store",
  });

  const result = await response.json().catch(() => null);

  if (!response.ok) {
    return {
      ok: false,
      status: "failed",
      providerResponse: result,
    };
  }

  return {
    ok: true,
    status: "sent",
    messageId: result?.messageId,
    providerResponse: result,
  };
}
