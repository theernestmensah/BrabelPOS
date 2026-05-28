"use client";

import { db, type AuditLog, type Sale, type StockMovement, type SyncQueueEntry } from "@/lib/db";
import { generateId } from "@/lib/utils";

const TERMINAL_ID_KEY = "brabelpos_terminal_id";

export function getTerminalId(): string {
  if (typeof window === "undefined") return "server";

  const existing = window.localStorage.getItem(TERMINAL_ID_KEY);
  if (existing) return existing;

  const terminalId = `terminal_${generateId()}`;
  window.localStorage.setItem(TERMINAL_ID_KEY, terminalId);
  return terminalId;
}

export async function enqueueSync(
  entry: Omit<SyncQueueEntry, "id" | "operationId" | "status" | "attemptCount" | "createdAt" | "updatedAt">
): Promise<void> {
  const now = Date.now();
  await db.syncQueue.add({
    ...entry,
    operationId: `op_${generateId()}`,
    status: "pending",
    attemptCount: 0,
    createdAt: now,
    updatedAt: now,
  });
}

export async function createAuditLog(
  log: Omit<AuditLog, "id" | "auditId" | "createdAt" | "synced_status">
): Promise<AuditLog> {
  const auditLog: AuditLog = {
    ...log,
    auditId: `audit_${generateId()}`,
    createdAt: Date.now(),
    synced_status: "pending",
  };
  await db.auditLogs.add(auditLog);
  await enqueueSync({
    entityType: "audit_log",
    entityId: auditLog.auditId,
    payload: auditLog,
  });
  return auditLog;
}

export async function recordStockMovementsForSale({
  sale,
  staffId,
  terminalId,
}: {
  sale: Sale;
  staffId: string;
  terminalId: string;
}): Promise<StockMovement[]> {
  const movements: StockMovement[] = sale.items.map((item) => ({
    movementId: `move_${generateId()}`,
    branchId: sale.branchId ?? "branch_default",
    productId: item.productId,
    saleId: sale.saleId,
    type: "sale",
    quantityDelta: -item.quantity,
    reason: `Sale ${sale.saleId}`,
    staffId,
    terminalId,
    createdAt: sale.timestamp,
    synced_status: "pending",
  }));

  await db.stockMovements.bulkAdd(movements);
  await Promise.all(
    movements.map((movement) =>
      enqueueSync({
        entityType: "stock_movement",
        entityId: movement.movementId,
        payload: movement,
      })
    )
  );

  return movements;
}

export async function syncPendingOperations(): Promise<{ pushed: number; failed: number }> {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return { pushed: 0, failed: 0 };
  }

  const pending = await db.syncQueue
    .where("status")
    .anyOf(["pending", "failed"])
    .sortBy("createdAt");

  let pushed = 0;
  let failed = 0;

  for (const entry of pending) {
    try {
      const response = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operationId: entry.operationId,
          entityType: entry.entityType,
          entityId: entry.entityId,
          payload: entry.payload,
        }),
      });

      if (!response.ok) {
        throw new Error(`Sync failed with ${response.status}`);
      }

      await db.syncQueue.update(entry.id!, {
        status: "synced",
        updatedAt: Date.now(),
        lastError: undefined,
      });

      if (entry.entityType === "sale") {
        await db.sales.where("saleId").equals(entry.entityId).modify({
          synced_status: "synced",
          lastSyncError: undefined,
        });
      }

      pushed += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown sync error";
      await db.syncQueue.update(entry.id!, {
        status: "failed",
        attemptCount: entry.attemptCount + 1,
        updatedAt: Date.now(),
        lastError: message,
      });
      failed += 1;
    }
  }

  return { pushed, failed };
}
