import { generateId } from "@/lib/utils";

export const DEFAULT_CURRENCY = "GHS";
export const DEFAULT_TAX_RATE = 0.125;

export type PaymentMethod = "cash" | "momo" | "card";
export type SyncStatus = "pending" | "synced" | "failed";
export type StockMovementType =
  | "sale"
  | "return"
  | "purchase"
  | "adjustment"
  | "transfer"
  | "damage";

export interface ProductSnapshot {
  productId: string;
  sku?: string;
  barcode?: string;
  name: string;
  category: string;
  price: number;
  stock: number;
}

export interface CartItem {
  productId: string;
  sku?: string;
  barcode?: string;
  name: string;
  price: number;
  quantity: number;
  category: string;
}

export interface SaleTotals {
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  subtotalCents: number;
  discountCents: number;
  taxCents: number;
  totalCents: number;
  currency: string;
  taxRate: number;
}

export interface SaleDraft {
  saleId: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  subtotalCents: number;
  discountCents: number;
  taxCents: number;
  totalCents: number;
  currency: string;
  taxRate: number;
  paymentMethod: PaymentMethod;
  payments?: Array<{
    method: PaymentMethod;
    amount: number;
    amountCents: number;
    reference?: string;
    status: "pending" | "paid" | "failed" | "refunded";
  }>;
  cashierId: string;
  cashierName: string;
  terminalId: string;
  branchId: string;
  shiftId?: string;
  timestamp: number;
  synced_status: SyncStatus;
  syncAttemptCount: number;
}

export function toCents(amount: number): number {
  return Math.round((Number.isFinite(amount) ? amount : 0) * 100);
}

export function fromCents(cents: number): number {
  return Math.round(cents) / 100;
}

export function calculateSaleTotals(
  items: CartItem[],
  taxRate = DEFAULT_TAX_RATE,
  currency = DEFAULT_CURRENCY,
  discount = 0
): SaleTotals {
  const subtotalCents = items.reduce(
    (sum, item) => sum + toCents(item.price) * item.quantity,
    0
  );
  const discountCents = Math.min(toCents(discount), subtotalCents);
  const taxableCents = subtotalCents - discountCents;
  const taxCents = Math.round(taxableCents * taxRate);
  const totalCents = taxableCents + taxCents;

  return {
    subtotal: fromCents(subtotalCents),
    discount: fromCents(discountCents),
    tax: fromCents(taxCents),
    total: fromCents(totalCents),
    subtotalCents,
    discountCents,
    taxCents,
    totalCents,
    currency,
    taxRate,
  };
}

export function validateCartAgainstStock(
  items: CartItem[],
  products: ProductSnapshot[]
): string[] {
  const productById = new Map(products.map((product) => [product.productId, product]));
  const errors: string[] = [];

  for (const item of items) {
    const product = productById.get(item.productId);
    if (!product) {
      errors.push(`${item.name} is no longer in inventory.`);
      continue;
    }
    if (item.quantity <= 0) {
      errors.push(`${item.name} has an invalid quantity.`);
    }
    if (item.quantity > product.stock) {
      errors.push(`${item.name} has only ${product.stock} left in stock.`);
    }
    if (toCents(item.price) !== toCents(product.price)) {
      errors.push(`${item.name} price changed. Refresh the cart before checkout.`);
    }
  }

  return errors;
}

export function buildSaleDraft({
  items,
  paymentMethod,
  cashierId,
  cashierName,
  terminalId,
  branchId,
  shiftId,
  isOnline,
  discount = 0,
  taxRate = DEFAULT_TAX_RATE,
  currency = DEFAULT_CURRENCY,
}: {
  items: CartItem[];
  paymentMethod: PaymentMethod;
  cashierId: string;
  cashierName: string;
  terminalId: string;
  branchId: string;
  shiftId?: string;
  isOnline: boolean;
  discount?: number;
  taxRate?: number;
  currency?: string;
}): SaleDraft {
  return {
    saleId: `sale_${generateId()}`,
    items: items.map((item) => ({ ...item })),
    ...calculateSaleTotals(items, taxRate, currency, discount),
    paymentMethod,
    cashierId,
    cashierName,
    terminalId,
    branchId,
    shiftId,
    timestamp: Date.now(),
    synced_status: isOnline ? "pending" : "pending",
    syncAttemptCount: 0,
  };
}
