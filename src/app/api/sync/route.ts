import { NextResponse } from "next/server";
import { persistSyncOperation } from "@/lib/server/sync-repository";

const allowedEntityTypes = new Set([
  "sale",
  "stock_movement",
  "audit_log",
  "cash_shift",
  "customer",
  "supplier",
  "expense",
  "branch_transfer",
  "manager_approval",
]);

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (
      typeof body?.operationId !== "string" ||
      typeof body?.entityType !== "string" ||
      typeof body?.entityId !== "string" ||
      !allowedEntityTypes.has(body.entityType) ||
      body.payload == null
    ) {
      return NextResponse.json(
        { ok: false, error: "Invalid sync operation payload." },
        { status: 400 }
      );
    }

    const result = await persistSyncOperation({
      operationId: body.operationId,
      entityType: body.entityType,
      entityId: body.entityId,
      payload: body.payload,
    });

    return NextResponse.json({
      ok: true,
      duplicate: result.duplicate,
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Could not process sync operation." },
      { status: 500 }
    );
  }
}
