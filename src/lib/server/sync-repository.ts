import "server-only";

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/server/prisma";
import { toCents } from "@/lib/domain";

type SyncEntityType =
  | "sale"
  | "stock_movement"
  | "audit_log"
  | "cash_shift"
  | "customer"
  | "supplier"
  | "expense"
  | "branch_transfer"
  | "manager_approval";

export interface SyncOperationInput {
  operationId: string;
  entityType: SyncEntityType;
  entityId: string;
  payload: unknown;
}

interface StoredOperation extends SyncOperationInput {
  receivedAt: string;
}

const memoryStore = new Map<string, StoredOperation>();
type PrismaWriter = any;

function asRecord(value: unknown): Record<string, any> {
  return value && typeof value === "object" ? (value as Record<string, any>) : {};
}

async function ensureBusinessGraph(client: PrismaWriter, {
  branchId,
  terminalId,
  cashierId,
  cashierName,
}: {
  branchId: string;
  terminalId: string;
  cashierId: string;
  cashierName: string;
}) {
  await client.organization.upsert({
    where: { id: "org_default" },
    update: {},
    create: {
      id: "org_default",
      name: "BrAbel Retail",
    },
  });

  await client.branch.upsert({
    where: { id: branchId },
    update: {},
    create: {
      id: branchId,
      organizationId: "org_default",
      name: "Default Branch",
      city: "Accra",
    },
  });

  await client.terminal.upsert({
    where: { id: terminalId },
    update: { lastSeenAt: new Date() },
    create: {
      id: terminalId,
      branchId,
      label: terminalId,
      lastSeenAt: new Date(),
    },
  });

  await client.staffMember.upsert({
    where: { id: cashierId },
    update: { fullName: cashierName },
    create: {
      id: cashierId,
      branchId,
      fullName: cashierName,
      role: "Cashier",
    },
  });
}

async function ensureProductFromSnapshot(
  client: PrismaWriter,
  item: Record<string, any>,
  currency: string
) {
  await client.product.upsert({
    where: { id: String(item.productId) },
    update: {
      sku: item.sku ? String(item.sku) : undefined,
      barcode: item.barcode ? String(item.barcode) : undefined,
      name: String(item.name ?? "Unnamed product"),
      category: String(item.category ?? "General"),
      priceCents: toCents(Number(item.price ?? 0)),
      currency,
    },
    create: {
      id: String(item.productId),
      organizationId: "org_default",
      sku: item.sku ? String(item.sku) : null,
      barcode: item.barcode ? String(item.barcode) : null,
      name: String(item.name ?? "Unnamed product"),
      category: String(item.category ?? "General"),
      priceCents: toCents(Number(item.price ?? 0)),
      currency,
    },
  });
}

function verifySalePayload(payload: Record<string, any>) {
  const items = Array.isArray(payload.items) ? payload.items.map(asRecord) : [];
  if (!payload.saleId || items.length === 0) {
    throw new Error("Sale payload is missing saleId or items.");
  }

  const subtotalCents = items.reduce(
    (sum, item) => sum + toCents(Number(item.price ?? 0)) * Number(item.quantity ?? 0),
    0
  );
  const discountCents = Math.min(
    Number(payload.discountCents ?? 0),
    subtotalCents
  );
  const taxRate = Number(payload.taxRate ?? 0.125);
  const taxCents = Math.round((subtotalCents - discountCents) * taxRate);
  const totalCents = subtotalCents - discountCents + taxCents;

  if (
    Number(payload.subtotalCents ?? subtotalCents) !== subtotalCents ||
    Number(payload.discountCents ?? discountCents) !== discountCents ||
    Number(payload.taxCents ?? taxCents) !== taxCents ||
    Number(payload.totalCents ?? totalCents) !== totalCents
  ) {
    throw new Error("Sale totals do not match server recalculation.");
  }

  return { items, subtotalCents, discountCents, taxCents, totalCents, taxRate };
}

async function persistSalePayload(client: PrismaWriter, payload: Record<string, any>) {
  const currency = String(payload.currency ?? "GHS");
  const branchId = String(payload.branchId ?? "branch_default");
  const terminalId = String(payload.terminalId ?? "terminal_unknown");
  const cashierId = String(payload.cashierId ?? "staff_unknown");
  const cashierName = String(payload.cashierName ?? "Unknown Cashier");
  const { items, subtotalCents, discountCents, taxCents, totalCents, taxRate } =
    verifySalePayload(payload);

  await ensureBusinessGraph(client, { branchId, terminalId, cashierId, cashierName });
  await Promise.all(
    items.map((item) => ensureProductFromSnapshot(client, item, currency))
  );

  if (payload.shiftId) {
    await persistCashShiftPayload(client, {
      shiftId: payload.shiftId,
      branchId,
      terminalId,
      cashierId,
      cashierName,
      openedAt: payload.timestamp ?? Date.now(),
      openingFloatCents: 0,
      cashSalesCents: 0,
      expectedCashCents: 0,
      status: "open",
    });
  }

  const paymentPayloads =
    Array.isArray(payload.payments) && payload.payments.length > 0
      ? payload.payments.map(asRecord)
      : [
          {
            method: payload.paymentMethod ?? "cash",
            amountCents: totalCents,
            status: payload.paymentMethod === "cash" ? "paid" : "pending",
          },
        ];

  await client.sale.upsert({
    where: { id: String(payload.saleId) },
    update: {},
    create: {
      id: String(payload.saleId),
      branchId,
      terminalId,
      cashierId,
      shiftId: payload.shiftId ? String(payload.shiftId) : null,
      paymentMethod: String(payload.paymentMethod ?? "cash"),
      subtotalCents,
      discountCents,
      taxCents,
      totalCents,
      currency,
      taxRate: new Prisma.Decimal(taxRate),
      clientTimestamp: new Date(Number(payload.timestamp ?? Date.now())),
      refundedAt: payload.refundedAt ? new Date(Number(payload.refundedAt)) : null,
      refundReason: payload.refundReason ? String(payload.refundReason) : null,
      items: {
        create: items.map((item) => ({
          productId: String(item.productId),
          nameSnapshot: String(item.name ?? "Unnamed product"),
          categorySnapshot: String(item.category ?? "General"),
          unitPriceCents: toCents(Number(item.price ?? 0)),
          quantity: Number(item.quantity ?? 0),
          lineTotalCents: toCents(Number(item.price ?? 0)) * Number(item.quantity ?? 0),
        })),
      },
      payments: {
        create: paymentPayloads.map((payment, index) => ({
            id: `payment_${payload.saleId}_${index}`,
            method: String(payment.method ?? payload.paymentMethod ?? "cash"),
            amountCents: Number(payment.amountCents ?? totalCents),
            status: String(payment.status ?? "pending"),
            providerReference: payment.reference
              ? String(payment.reference)
              : null,
          })),
      },
    },
  });
}

async function persistStockMovementPayload(
  client: PrismaWriter,
  payload: Record<string, any>
) {
  const branchId = String(payload.branchId ?? "branch_default");
  const terminalId = String(payload.terminalId ?? "terminal_unknown");
  const staffId = String(payload.staffId ?? "staff_unknown");
  const productId = String(payload.productId);

  await ensureBusinessGraph(client, {
    branchId,
    terminalId,
    cashierId: staffId,
    cashierName: staffId,
  });

  await client.product.upsert({
    where: { id: productId },
    update: {},
    create: {
      id: productId,
      organizationId: "org_default",
      name: productId,
      category: "General",
      priceCents: 0,
    },
  });

  await client.stockMovement.upsert({
    where: { id: String(payload.movementId) },
    update: {},
    create: {
      id: String(payload.movementId),
      branchId,
      productId,
      saleId: payload.saleId ? String(payload.saleId) : null,
      type: String(payload.type ?? "adjustment"),
      quantityDelta: Number(payload.quantityDelta ?? 0),
      reason: String(payload.reason ?? "Synced stock movement"),
      staffId,
      terminalId,
      createdAt: new Date(Number(payload.createdAt ?? Date.now())),
    },
  });
}

async function persistAuditLogPayload(
  client: PrismaWriter,
  payload: Record<string, any>
) {
  await client.auditLog.upsert({
    where: { id: String(payload.auditId) },
    update: {},
    create: {
      id: String(payload.auditId),
      actorId: String(payload.actorId ?? "system"),
      action: String(payload.action ?? "unknown"),
      entityType: String(payload.entityType ?? "unknown"),
      entityId: String(payload.entityId ?? "unknown"),
      metadata: (payload.metadata ?? {}) as Prisma.InputJsonValue,
      createdAt: new Date(Number(payload.createdAt ?? Date.now())),
    },
  });
}

async function persistCashShiftPayload(
  client: PrismaWriter,
  payload: Record<string, any>
) {
  const branchId = String(payload.branchId ?? "branch_default");
  const terminalId = String(payload.terminalId ?? "terminal_unknown");
  const cashierId = String(payload.cashierId ?? "staff_unknown");
  const cashierName = String(payload.cashierName ?? cashierId);

  await ensureBusinessGraph(client, {
    branchId,
    terminalId,
    cashierId,
    cashierName,
  });

  await client.cashShift.upsert({
    where: { id: String(payload.shiftId) },
    update: {
      closedAt: payload.closedAt ? new Date(Number(payload.closedAt)) : undefined,
      cashSalesCents: Number(payload.cashSalesCents ?? 0),
      expectedCashCents: Number(payload.expectedCashCents ?? 0),
      countedCashCents:
        payload.countedCashCents == null
          ? undefined
          : Number(payload.countedCashCents),
      varianceCents:
        payload.varianceCents == null ? undefined : Number(payload.varianceCents),
      status: String(payload.status ?? "open"),
      note: payload.note ? String(payload.note) : undefined,
    },
    create: {
      id: String(payload.shiftId),
      branchId,
      terminalId,
      cashierId,
      openedAt: new Date(Number(payload.openedAt ?? Date.now())),
      closedAt: payload.closedAt ? new Date(Number(payload.closedAt)) : null,
      openingFloatCents: Number(payload.openingFloatCents ?? 0),
      cashSalesCents: Number(payload.cashSalesCents ?? 0),
      expectedCashCents: Number(payload.expectedCashCents ?? 0),
      countedCashCents:
        payload.countedCashCents == null ? null : Number(payload.countedCashCents),
      varianceCents:
        payload.varianceCents == null ? null : Number(payload.varianceCents),
      status: String(payload.status ?? "open"),
      note: payload.note ? String(payload.note) : null,
    },
  });
}

async function persistCustomerPayload(client: PrismaWriter, payload: Record<string, any>) {
  await client.organization.upsert({
    where: { id: "org_default" },
    update: {},
    create: { id: "org_default", name: "BrAbel Retail" },
  });
  await client.customer.upsert({
    where: { id: String(payload.customerId) },
    update: {
      name: String(payload.name ?? "Unnamed customer"),
      phone: payload.phone ? String(payload.phone) : undefined,
      email: payload.email ? String(payload.email) : undefined,
      loyaltyPoints: Number(payload.loyaltyPoints ?? 0),
      totalSpendCents: toCents(Number(payload.totalSpend ?? 0)),
    },
    create: {
      id: String(payload.customerId),
      organizationId: "org_default",
      name: String(payload.name ?? "Unnamed customer"),
      phone: payload.phone ? String(payload.phone) : null,
      email: payload.email ? String(payload.email) : null,
      loyaltyPoints: Number(payload.loyaltyPoints ?? 0),
      totalSpendCents: toCents(Number(payload.totalSpend ?? 0)),
      createdAt: new Date(Number(payload.createdAt ?? Date.now())),
    },
  });
}

async function persistSupplierPayload(client: PrismaWriter, payload: Record<string, any>) {
  await client.organization.upsert({
    where: { id: "org_default" },
    update: {},
    create: { id: "org_default", name: "BrAbel Retail" },
  });
  await client.supplier.upsert({
    where: { id: String(payload.supplierId) },
    update: {
      name: String(payload.name ?? "Unnamed supplier"),
      phone: payload.phone ? String(payload.phone) : undefined,
      email: payload.email ? String(payload.email) : undefined,
      contactPerson: payload.contactPerson ? String(payload.contactPerson) : undefined,
    },
    create: {
      id: String(payload.supplierId),
      organizationId: "org_default",
      name: String(payload.name ?? "Unnamed supplier"),
      phone: payload.phone ? String(payload.phone) : null,
      email: payload.email ? String(payload.email) : null,
      contactPerson: payload.contactPerson ? String(payload.contactPerson) : null,
      createdAt: new Date(Number(payload.createdAt ?? Date.now())),
    },
  });
}

async function persistExpensePayload(client: PrismaWriter, payload: Record<string, any>) {
  const branchId = String(payload.branchId ?? "branch_default");
  await ensureBusinessGraph(client, {
    branchId,
    terminalId: "terminal_backoffice",
    cashierId: String(payload.staffId ?? "staff_unknown"),
    cashierName: String(payload.staffId ?? "staff_unknown"),
  });
  await client.expense.upsert({
    where: { id: String(payload.expenseId) },
    update: {},
    create: {
      id: String(payload.expenseId),
      branchId,
      category: String(payload.category ?? "Operations"),
      amountCents: Number(payload.amountCents ?? 0),
      note: String(payload.note ?? ""),
      staffId: String(payload.staffId ?? "staff_unknown"),
      createdAt: new Date(Number(payload.createdAt ?? Date.now())),
    },
  });
}

async function persistBranchTransferPayload(client: PrismaWriter, payload: Record<string, any>) {
  const fromBranchId = String(payload.fromBranchId ?? "branch_default");
  const toBranchId = String(payload.toBranchId ?? "branch_secondary_001");
  await ensureBusinessGraph(client, {
    branchId: fromBranchId,
    terminalId: "terminal_transfer",
    cashierId: String(payload.requestedBy ?? "staff_unknown"),
    cashierName: String(payload.requestedBy ?? "staff_unknown"),
  });
  await client.branch.upsert({
    where: { id: toBranchId },
    update: {},
    create: {
      id: toBranchId,
      organizationId: "org_default",
      name: "Secondary Branch",
      city: "Accra",
    },
  });
  await client.product.upsert({
    where: { id: String(payload.productId) },
    update: {},
    create: {
      id: String(payload.productId),
      organizationId: "org_default",
      name: String(payload.productId),
      category: "General",
      priceCents: 0,
    },
  });
  await client.branchTransfer.upsert({
    where: { id: String(payload.transferId) },
    update: { status: String(payload.status ?? "pending") },
    create: {
      id: String(payload.transferId),
      productId: String(payload.productId),
      fromBranchId,
      toBranchId,
      quantity: Number(payload.quantity ?? 0),
      status: String(payload.status ?? "pending"),
      requestedBy: String(payload.requestedBy ?? "staff_unknown"),
      createdAt: new Date(Number(payload.createdAt ?? Date.now())),
    },
  });
}

async function persistManagerApprovalPayload(client: PrismaWriter, payload: Record<string, any>) {
  await client.managerApproval.upsert({
    where: { id: String(payload.approvalId) },
    update: {
      approvedBy: payload.approvedBy ? String(payload.approvedBy) : undefined,
      status: String(payload.status ?? "pending"),
      reason: payload.reason ? String(payload.reason) : undefined,
      resolvedAt: payload.resolvedAt ? new Date(Number(payload.resolvedAt)) : undefined,
    },
    create: {
      id: String(payload.approvalId),
      action: String(payload.action ?? "unknown"),
      entityType: String(payload.entityType ?? "unknown"),
      entityId: String(payload.entityId ?? "unknown"),
      requestedBy: String(payload.requestedBy ?? "staff_unknown"),
      approvedBy: payload.approvedBy ? String(payload.approvedBy) : null,
      status: String(payload.status ?? "pending"),
      reason: payload.reason ? String(payload.reason) : null,
      createdAt: new Date(Number(payload.createdAt ?? Date.now())),
      resolvedAt: payload.resolvedAt ? new Date(Number(payload.resolvedAt)) : null,
    },
  });
}

async function persistOperationToDatabase(input: SyncOperationInput) {
  const existing = await prisma.syncOperation.findUnique({
    where: { operationId: input.operationId },
  });

  if (existing) {
    return { stored: true, duplicate: true };
  }

  await prisma.$transaction(async (tx) => {
    const payload = asRecord(input.payload);

    if (input.entityType === "sale") {
      await persistSalePayload(tx, payload);
    }

    if (input.entityType === "stock_movement") {
      await persistStockMovementPayload(tx, payload);
    }

    if (input.entityType === "audit_log") {
      await persistAuditLogPayload(tx, payload);
    }

    if (input.entityType === "cash_shift") {
      await persistCashShiftPayload(tx, payload);
    }

    if (input.entityType === "customer") {
      await persistCustomerPayload(tx, payload);
    }

    if (input.entityType === "supplier") {
      await persistSupplierPayload(tx, payload);
    }

    if (input.entityType === "expense") {
      await persistExpensePayload(tx, payload);
    }

    if (input.entityType === "branch_transfer") {
      await persistBranchTransferPayload(tx, payload);
    }

    if (input.entityType === "manager_approval") {
      await persistManagerApprovalPayload(tx, payload);
    }

    await tx.syncOperation.create({
      data: {
        operationId: input.operationId,
        entityType: input.entityType,
        entityId: input.entityId,
        payload: input.payload as Prisma.InputJsonValue,
      },
    });
  });

  return { stored: true, duplicate: false };
}

export async function persistSyncOperation(
  input: SyncOperationInput
): Promise<{ stored: boolean; duplicate: boolean }> {
  if (process.env.DATABASE_URL) {
    return persistOperationToDatabase(input);
  }

  if (memoryStore.has(input.operationId)) {
    return { stored: true, duplicate: true };
  }

  memoryStore.set(input.operationId, {
    ...input,
    receivedAt: new Date().toISOString(),
  });

  return { stored: true, duplicate: false };
}

export function getRepositoryMode(): "memory" | "database" {
  return process.env.DATABASE_URL ? "database" : "memory";
}
