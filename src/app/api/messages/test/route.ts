import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  emailConfigured,
  receiptEmail,
  sendTransactionalEmail,
  welcomeEmail,
} from "@/lib/server/email";

const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";
const clerkEnabled =
  clerkKey.length > 0 &&
  !clerkKey.includes("REPLACE_ME") &&
  clerkKey.startsWith("pk_");

export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production" && clerkEnabled) {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { ok: false, error: "Authentication required." },
        { status: 401 }
      );
    }
  }

  const body = await request.json().catch(() => ({}));
  const to = typeof body?.to === "string" ? body.to.trim() : "";
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const type = body?.type === "receipt" ? "receipt" : "welcome";

  if (!to || !to.includes("@")) {
    return NextResponse.json(
      { ok: false, error: "A valid recipient email is required." },
      { status: 400 }
    );
  }

  if (!emailConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        status: "unconfigured",
        error:
          "Set BREVO_API_KEY, MESSAGING_FROM_EMAIL, and MESSAGING_FROM_NAME first.",
      },
      { status: 503 }
    );
  }

  const message =
    type === "receipt"
      ? receiptEmail({
          customerName: name || undefined,
          saleId: "TEST-RECEIPT",
          total: "GHS 125.00",
          items: [
            { name: "Demo Product", quantity: 2, lineTotal: "GHS 90.00" },
            { name: "Demo Service", quantity: 1, lineTotal: "GHS 35.00" },
          ],
        })
      : welcomeEmail(name || undefined);

  const result = await sendTransactionalEmail({
    to: [{ email: to, name: name || undefined }],
    subject: message.subject,
    htmlContent: message.htmlContent,
    textContent: message.textContent,
    tags: ["brabel-pos", "test-email", type],
  });

  const status = result.ok ? 200 : result.status === "unconfigured" ? 503 : 400;
  return NextResponse.json(result, { status });
}
