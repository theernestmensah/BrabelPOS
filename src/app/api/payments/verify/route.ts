import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { reference } = await request.json().catch(() => ({ reference: "" }));

  if (!reference || typeof reference !== "string") {
    return NextResponse.json(
      { ok: false, error: "Payment reference is required." },
      { status: 400 }
    );
  }

  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json(
      {
        ok: false,
        status: "unconfigured",
        error: "PAYSTACK_SECRET_KEY is not configured.",
      },
      { status: 503 }
    );
  }

  const response = await fetch(
    `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
    {
      headers: {
        Authorization: `Bearer ${secretKey}`,
      },
      cache: "no-store",
    }
  );

  const result = await response.json().catch(() => null);

  if (!response.ok || !result?.status) {
    return NextResponse.json(
      { ok: false, status: "failed", providerResponse: result },
      { status: 400 }
    );
  }

  return NextResponse.json({
    ok: true,
    status: result.data?.status ?? "unknown",
    reference,
    amount: result.data?.amount,
    paidAt: result.data?.paid_at,
    channel: result.data?.channel,
    providerResponse: result,
  });
}
