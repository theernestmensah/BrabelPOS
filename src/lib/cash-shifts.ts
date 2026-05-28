"use client";

import { db, type CashShift } from "@/lib/db";
import { toCents, fromCents } from "@/lib/domain";
import { enqueueSync, createAuditLog } from "@/lib/offline-sync";
import { generateId } from "@/lib/utils";

export async function getOpenShift({
  terminalId,
  cashierId,
}: {
  terminalId: string;
  cashierId: string;
}): Promise<CashShift | undefined> {
  return db.cashShifts
    .where("status")
    .equals("open")
    .filter(
      (shift) => shift.terminalId === terminalId && shift.cashierId === cashierId
    )
    .first();
}

export async function openShift({
  branchId,
  terminalId,
  cashierId,
  cashierName,
  openingFloat,
}: {
  branchId: string;
  terminalId: string;
  cashierId: string;
  cashierName: string;
  openingFloat: number;
}): Promise<CashShift> {
  const existing = await getOpenShift({ terminalId, cashierId });
  if (existing) return existing;

  const openingFloatCents = toCents(openingFloat);
  const shift: CashShift = {
    shiftId: `shift_${generateId()}`,
    branchId,
    terminalId,
    cashierId,
    cashierName,
    openedAt: Date.now(),
    openingFloat,
    openingFloatCents,
    cashSales: 0,
    cashSalesCents: 0,
    expectedCash: openingFloat,
    expectedCashCents: openingFloatCents,
    status: "open",
    synced_status: "pending",
  };

  await db.cashShifts.add(shift);
  await enqueueSync({
    entityType: "cash_shift",
    entityId: shift.shiftId,
    payload: shift,
  });
  await createAuditLog({
    actorId: cashierId,
    action: "shift.open",
    entityType: "cash_shift",
    entityId: shift.shiftId,
    metadata: {
      branchId,
      terminalId,
      openingFloatCents,
    },
  });

  return shift;
}

export async function recordCashSaleForShift({
  shiftId,
  amount,
}: {
  shiftId: string;
  amount: number;
}): Promise<void> {
  const amountCents = toCents(amount);
  await db.cashShifts.where("shiftId").equals(shiftId).modify((shift) => {
    shift.cashSalesCents += amountCents;
    shift.cashSales = fromCents(shift.cashSalesCents);
    shift.expectedCashCents = shift.openingFloatCents + shift.cashSalesCents;
    shift.expectedCash = fromCents(shift.expectedCashCents);
    shift.synced_status = "pending";
  });
}

export async function closeShift({
  shiftId,
  countedCash,
  note,
}: {
  shiftId: string;
  countedCash: number;
  note?: string;
}): Promise<CashShift> {
  const shift = await db.cashShifts.where("shiftId").equals(shiftId).first();
  if (!shift || shift.status !== "open") {
    throw new Error("No open shift found.");
  }

  const countedCashCents = toCents(countedCash);
  const varianceCents = countedCashCents - shift.expectedCashCents;
  const updated: CashShift = {
    ...shift,
    closedAt: Date.now(),
    countedCash,
    countedCashCents,
    variance: fromCents(varianceCents),
    varianceCents,
    status: "closed",
    note,
    synced_status: "pending",
  };

  await db.cashShifts.where("shiftId").equals(shiftId).modify(updated);
  await enqueueSync({
    entityType: "cash_shift",
    entityId: updated.shiftId,
    payload: updated,
  });
  await createAuditLog({
    actorId: updated.cashierId,
    action: "shift.close",
    entityType: "cash_shift",
    entityId: updated.shiftId,
    metadata: {
      expectedCashCents: updated.expectedCashCents,
      countedCashCents,
      varianceCents,
      note,
    },
  });

  return updated;
}
