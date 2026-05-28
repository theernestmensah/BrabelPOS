import Dexie, { type Table } from "dexie";
import type { PaymentMethod, StockMovementType, SyncStatus } from "@/lib/domain";

// ── Types ──────────────────────────────────────────────────────────────────
export interface SaleItem {
  productId: string;
  sku?: string;
  barcode?: string;
  name: string;
  price: number;
  quantity: number;
  category: string;
}

export interface Sale {
  id?: number;
  saleId: string;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  subtotalCents?: number;
  discountCents?: number;
  taxCents?: number;
  totalCents?: number;
  currency?: string;
  taxRate?: number;
  paymentMethod: PaymentMethod;
  payments?: SalePayment[];
  cashierId?: string;
  cashierName: string;
  terminalId?: string;
  branchId?: string;
  shiftId?: string;
  timestamp: number;
  synced_status: SyncStatus;
  syncAttemptCount?: number;
  lastSyncError?: string;
  refundedAt?: number;
  refundReason?: string;
}

export interface SalePayment {
  method: PaymentMethod;
  amount: number;
  amountCents: number;
  reference?: string;
  status: "pending" | "paid" | "failed" | "refunded";
}

export interface HeldTicket {
  id?: number;
  ticketId: string;
  label: string;
  items: SaleItem[];
  discount: number;
  discountCents: number;
  createdAt: number;
  updatedAt: number;
  cashierId: string;
  terminalId: string;
}

export interface Product {
  id?: number;
  productId: string;
  sku?: string;
  barcode?: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  imageUrl?: string;
  description?: string;
}

export interface StaffMember {
  id?: number;
  staffId: string;
  name: string;
  role: "owner" | "manager" | "cashier" | string;
  avatar?: string;
  totalSales: number;
  totalRevenue: number;
  badge: "🥇" | "🥈" | "🥉" | "⭐";
}

export type SyncEntityType =
  | "sale"
  | "stock_movement"
  | "audit_log"
  | "cash_shift"
  | "customer"
  | "supplier"
  | "expense"
  | "branch_transfer"
  | "manager_approval";

export interface SyncQueueEntry {
  id?: number;
  operationId: string;
  entityType: SyncEntityType;
  entityId: string;
  payload: unknown;
  status: SyncStatus;
  attemptCount: number;
  createdAt: number;
  updatedAt: number;
  lastError?: string;
}

export interface StockMovement {
  id?: number;
  movementId: string;
  branchId: string;
  productId: string;
  saleId?: string;
  type: StockMovementType;
  quantityDelta: number;
  reason: string;
  staffId: string;
  terminalId: string;
  createdAt: number;
  synced_status: SyncStatus;
}

export interface AuditLog {
  id?: number;
  auditId: string;
  actorId: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata: unknown;
  createdAt: number;
  synced_status: SyncStatus;
}

export interface CashShift {
  id?: number;
  shiftId: string;
  branchId: string;
  terminalId: string;
  cashierId: string;
  cashierName: string;
  openedAt: number;
  closedAt?: number;
  openingFloat: number;
  openingFloatCents: number;
  cashSales: number;
  cashSalesCents: number;
  expectedCash: number;
  expectedCashCents: number;
  countedCash?: number;
  countedCashCents?: number;
  variance?: number;
  varianceCents?: number;
  status: "open" | "closed";
  note?: string;
  synced_status: SyncStatus;
}

export interface BusinessSettings {
  id?: number;
  settingsId: string;
  businessName: string;
  branchId: string;
  branchName: string;
  currency: string;
  taxRate: number;
  lowStockThreshold: number;
}

export interface Customer {
  id?: number;
  customerId: string;
  name: string;
  phone?: string;
  email?: string;
  loyaltyPoints: number;
  totalSpend: number;
  createdAt: number;
  synced_status: SyncStatus;
}

export interface Supplier {
  id?: number;
  supplierId: string;
  name: string;
  phone?: string;
  email?: string;
  contactPerson?: string;
  createdAt: number;
  synced_status: SyncStatus;
}

export interface Expense {
  id?: number;
  expenseId: string;
  branchId: string;
  category: string;
  amount: number;
  amountCents: number;
  note: string;
  staffId: string;
  createdAt: number;
  synced_status: SyncStatus;
}

export interface BranchTransfer {
  id?: number;
  transferId: string;
  productId: string;
  fromBranchId: string;
  toBranchId: string;
  quantity: number;
  status: "pending" | "approved" | "received" | "cancelled";
  requestedBy: string;
  createdAt: number;
  synced_status: SyncStatus;
}

export interface ManagerApproval {
  id?: number;
  approvalId: string;
  action: string;
  entityType: string;
  entityId: string;
  requestedBy: string;
  approvedBy?: string;
  status: "pending" | "approved" | "rejected";
  reason?: string;
  createdAt: number;
  resolvedAt?: number;
  synced_status: SyncStatus;
}

// ── Database class ────────────────────────────────────────────────────────
export class BrAbelPOSDatabase extends Dexie {
  sales!: Table<Sale>;
  products!: Table<Product>;
  staff!: Table<StaffMember>;
  syncQueue!: Table<SyncQueueEntry>;
  stockMovements!: Table<StockMovement>;
  auditLogs!: Table<AuditLog>;
  settings!: Table<BusinessSettings>;
  cashShifts!: Table<CashShift>;
  heldTickets!: Table<HeldTicket>;
  customers!: Table<Customer>;
  suppliers!: Table<Supplier>;
  expenses!: Table<Expense>;
  branchTransfers!: Table<BranchTransfer>;
  managerApprovals!: Table<ManagerApproval>;

  constructor() {
    super("BrAbelPOS");

    this.version(1).stores({
      sales: "++id, saleId, timestamp, synced_status, cashierName",
      products: "++id, productId, category, name",
      staff: "++id, staffId, totalRevenue",
    });

    this.version(2).stores({
      sales:
        "++id, saleId, timestamp, synced_status, cashierName, cashierId, terminalId, branchId",
      products: "++id, productId, category, name",
      staff: "++id, staffId, totalRevenue",
      syncQueue:
        "++id, operationId, entityType, entityId, status, createdAt, updatedAt",
      stockMovements:
        "++id, movementId, branchId, productId, saleId, type, staffId, terminalId, createdAt, synced_status",
      auditLogs:
        "++id, auditId, actorId, action, entityType, entityId, createdAt, synced_status",
      settings: "++id, settingsId, branchId",
    });

    this.version(3).stores({
      sales:
        "++id, saleId, timestamp, synced_status, cashierName, cashierId, terminalId, branchId",
      products: "++id, productId, sku, barcode, category, name",
      staff: "++id, staffId, totalRevenue",
      syncQueue:
        "++id, operationId, entityType, entityId, status, createdAt, updatedAt",
      stockMovements:
        "++id, movementId, branchId, productId, saleId, type, staffId, terminalId, createdAt, synced_status",
      auditLogs:
        "++id, auditId, actorId, action, entityType, entityId, createdAt, synced_status",
      settings: "++id, settingsId, branchId",
    });

    this.version(4).stores({
      sales:
        "++id, saleId, timestamp, synced_status, cashierName, cashierId, terminalId, branchId, shiftId",
      products: "++id, productId, sku, barcode, category, name",
      staff: "++id, staffId, totalRevenue",
      syncQueue:
        "++id, operationId, entityType, entityId, status, createdAt, updatedAt",
      stockMovements:
        "++id, movementId, branchId, productId, saleId, type, staffId, terminalId, createdAt, synced_status",
      auditLogs:
        "++id, auditId, actorId, action, entityType, entityId, createdAt, synced_status",
      settings: "++id, settingsId, branchId",
      cashShifts:
        "++id, shiftId, branchId, terminalId, cashierId, openedAt, closedAt, status, synced_status",
    });

    this.version(5).stores({
      sales:
        "++id, saleId, timestamp, synced_status, cashierName, cashierId, terminalId, branchId, shiftId, refundedAt",
      products: "++id, productId, sku, barcode, category, name",
      staff: "++id, staffId, totalRevenue",
      syncQueue:
        "++id, operationId, entityType, entityId, status, createdAt, updatedAt",
      stockMovements:
        "++id, movementId, branchId, productId, saleId, type, staffId, terminalId, createdAt, synced_status",
      auditLogs:
        "++id, auditId, actorId, action, entityType, entityId, createdAt, synced_status",
      settings: "++id, settingsId, branchId",
      cashShifts:
        "++id, shiftId, branchId, terminalId, cashierId, openedAt, closedAt, status, synced_status",
      heldTickets:
        "++id, ticketId, cashierId, terminalId, createdAt, updatedAt",
    });

    this.version(6).stores({
      sales:
        "++id, saleId, timestamp, synced_status, cashierName, cashierId, terminalId, branchId, shiftId, refundedAt",
      products: "++id, productId, sku, barcode, category, name",
      staff: "++id, staffId, totalRevenue",
      syncQueue:
        "++id, operationId, entityType, entityId, status, createdAt, updatedAt",
      stockMovements:
        "++id, movementId, branchId, productId, saleId, type, staffId, terminalId, createdAt, synced_status",
      auditLogs:
        "++id, auditId, actorId, action, entityType, entityId, createdAt, synced_status",
      settings: "++id, settingsId, branchId",
      cashShifts:
        "++id, shiftId, branchId, terminalId, cashierId, openedAt, closedAt, status, synced_status",
      heldTickets:
        "++id, ticketId, cashierId, terminalId, createdAt, updatedAt",
      customers: "++id, customerId, name, phone, createdAt, synced_status",
      suppliers: "++id, supplierId, name, phone, createdAt, synced_status",
      expenses:
        "++id, expenseId, branchId, category, staffId, createdAt, synced_status",
      branchTransfers:
        "++id, transferId, productId, fromBranchId, toBranchId, status, createdAt, synced_status",
      managerApprovals:
        "++id, approvalId, action, entityType, entityId, requestedBy, status, createdAt, synced_status",
    });
  }
}

export const db = new BrAbelPOSDatabase();

// ── Seed helpers ──────────────────────────────────────────────────────────
export async function seedDatabaseIfEmpty(): Promise<void> {
  const products: Omit<Product, "id">[] = [
    {
      productId: "p-001",
      sku: "BR-EYE-001",
      barcode: "616000000001",
      name: "Cartier Gold Frame Eyewear",
      category: "Luxury Eyewear",
      price: 2400,
      stock: 12,
      description: "18k gold plated premium frame, UV400 lenses",
    },
    {
      productId: "p-002",
      sku: "BR-EYE-002",
      barcode: "616000000002",
      name: "Versace Titanium Shades",
      category: "Luxury Eyewear",
      price: 1800,
      stock: 8,
      description: "Featherlight titanium frame with gradient lenses",
    },
    {
      productId: "p-003",
      sku: "BR-EYE-003",
      barcode: "616000000003",
      name: "Tom Ford Pilot Sunglasses",
      category: "Luxury Eyewear",
      price: 1550,
      stock: 15,
      description: "Classic aviator design with brand signature",
    },
    {
      productId: "p-004",
      sku: "BR-EYE-004",
      barcode: "616000000004",
      name: "Chanel Pearl Frames",
      category: "Luxury Eyewear",
      price: 2200,
      stock: 6,
      description: "Iconic CC logo detail with pearl embellishment",
    },
    {
      productId: "p-005",
      sku: "BR-FRG-005",
      barcode: "616000000005",
      name: "Creed Aventus Parfum 100ml",
      category: "Fragrances",
      price: 980,
      stock: 20,
      description: "Signature blend of blackcurrant and ambergris",
    },
    {
      productId: "p-006",
      sku: "BR-FRG-006",
      barcode: "616000000006",
      name: "Tom Ford Oud Wood EDP",
      category: "Fragrances",
      price: 850,
      stock: 18,
      description: "Rare oud wood with sandalwood and cardamom",
    },
    {
      productId: "p-007",
      sku: "BR-FRG-007",
      barcode: "616000000007",
      name: "Maison Margiela Replica 50ml",
      category: "Fragrances",
      price: 720,
      stock: 25,
      description: "Lazy Sunday Morning — soft musk & white flowers",
    },
    {
      productId: "p-008",
      sku: "BR-FRG-008",
      barcode: "616000000008",
      name: "Amouage Interlude EDP",
      category: "Fragrances",
      price: 1100,
      stock: 10,
      description: "Oriental spice with oud and frankincense",
    },
    {
      productId: "p-009",
      sku: "BR-FRG-009",
      barcode: "616000000009",
      name: "Bvlgari Man Terrae EDP",
      category: "Fragrances",
      price: 640,
      stock: 30,
      description: "Earthy woods with amber and cistus",
    },
    {
      productId: "p-010",
      sku: "BR-EYE-010",
      barcode: "616000000010",
      name: "Oliver Peoples Eyeglasses",
      category: "Luxury Eyewear",
      price: 1350,
      stock: 9,
      description: "Handcrafted acetate frames from LA",
    },
  ];

  const count = await db.products.count();
  if (count > 0) {
    await Promise.all(
      products.map((product) =>
        db.products.where("productId").equals(product.productId).modify((existing) => {
          existing.sku = existing.sku ?? product.sku;
          existing.barcode = existing.barcode ?? product.barcode;
        })
      )
    );
    return;
  }

  await db.products.bulkAdd(products);

  const staff: Omit<StaffMember, "id">[] = [
    {
      staffId: "s-001",
      name: "Abena Mensah",
      role: "owner",
      totalSales: 42,
      totalRevenue: 58400,
      badge: "🥇",
    },
    {
      staffId: "s-002",
      name: "Kwame Asante",
      role: "manager",
      totalSales: 35,
      totalRevenue: 44200,
      badge: "🥈",
    },
    {
      staffId: "s-003",
      name: "Efua Boateng",
      role: "cashier",
      totalSales: 28,
      totalRevenue: 31700,
      badge: "🥉",
    },
    {
      staffId: "s-004",
      name: "Kofi Agyeman",
      role: "cashier",
      totalSales: 22,
      totalRevenue: 27900,
      badge: "⭐",
    },
  ];

  await db.staff.bulkAdd(staff);

  await db.settings.add({
    settingsId: "default",
    businessName: "BrAbel Luxury Retail",
    branchId: "branch_accra_001",
    branchName: "Accra Flagship",
    currency: "GHS",
    taxRate: 0.125,
    lowStockThreshold: 8,
  });
}

// ── Query helpers ─────────────────────────────────────────────────────────
export async function getTodayRevenue(): Promise<number> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const todaySales = await db.sales
    .where("timestamp")
    .aboveOrEqual(startOfDay.getTime())
    .toArray();

  return todaySales.reduce((sum, sale) => sum + sale.total, 0);
}

export async function getPendingSyncCount(): Promise<number> {
  return db.sales.where("synced_status").equals("pending").count();
}

export async function getTopSellingItem(): Promise<string> {
  const allSales = await db.sales.toArray();
  const itemCount: Record<string, { name: string; qty: number }> = {};

  allSales.forEach((sale) => {
    sale.items.forEach((item) => {
      if (!itemCount[item.productId]) {
        itemCount[item.productId] = { name: item.name, qty: 0 };
      }
      itemCount[item.productId].qty += item.quantity;
    });
  });

  const sorted = Object.values(itemCount).sort((a, b) => b.qty - a.qty);
  return sorted[0]?.name ?? "No sales yet";
}

export async function saveSale(sale: Omit<Sale, "id">): Promise<number> {
  return db.sales.add(sale);
}

export async function getBusinessSettings(): Promise<BusinessSettings> {
  await seedDatabaseIfEmpty();
  const settings = await db.settings.where("settingsId").equals("default").first();
  if (settings) return settings;

  const fallback: Omit<BusinessSettings, "id"> = {
    settingsId: "default",
    businessName: "BrAbel Luxury Retail",
    branchId: "branch_accra_001",
    branchName: "Accra Flagship",
    currency: "GHS",
    taxRate: 0.125,
    lowStockThreshold: 8,
  };
  await db.settings.add(fallback);
  return fallback;
}
