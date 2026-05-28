"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  Wifi,
  WifiOff,
  CreditCard,
  Smartphone,
  Banknote,
  Search,
  X,
  Receipt,
  Package,
  Barcode,
  Printer,
  PauseCircle,
  RotateCcw,
  Percent,
} from "lucide-react";
import {
  db,
  getBusinessSettings,
  seedDatabaseIfEmpty,
  saveSale,
  type Product,
  type SaleItem,
  type HeldTicket,
  type SalePayment,
} from "@/lib/db";
import {
  buildSaleDraft,
  calculateSaleTotals,
  validateCartAgainstStock,
  type PaymentMethod,
} from "@/lib/domain";
import {
  createAuditLog,
  enqueueSync,
  getTerminalId,
  recordStockMovementsForSale,
  syncPendingOperations,
} from "@/lib/offline-sync";
import { getOpenShift, openShift, recordCashSaleForShift } from "@/lib/cash-shifts";
import type { CashShift } from "@/lib/db";
import { formatCurrency, generateId } from "@/lib/utils";

// ── Toast ────────────────────────────────────────────────────────────────
interface ToastMessage {
  id: string;
  type: "success" | "error" | "info";
  title: string;
  message: string;
  isOnline: boolean;
}

function Toast({
  toast,
  onDismiss,
}: {
  toast: ToastMessage;
  onDismiss: (id: string) => void;
}) {
  useEffect(() => {
    const t = setTimeout(() => onDismiss(toast.id), 4000);
    return () => clearTimeout(t);
  }, [toast.id, onDismiss]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      className="flex items-start gap-3 p-4 rounded-xl glass-cyan border border-neon-cyan/20 shadow-2xl glow-cyan max-w-sm"
    >
      <CheckCircle2 className="w-5 h-5 text-neon-cyan shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm text-white">{toast.title}</div>
        <div className="text-xs text-white/60 mt-0.5">{toast.message}</div>
      </div>
      <div className="flex items-center gap-1">
        {toast.isOnline ? (
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-semibold">
            <Wifi className="w-2.5 h-2.5" />
            Online
          </div>
        ) : (
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 text-[10px] font-semibold">
            <WifiOff className="w-2.5 h-2.5" />
            Offline
          </div>
        )}
        <button
          onClick={() => onDismiss(toast.id)}
          className="p-1 rounded-lg text-white/30 hover:text-white transition-smooth"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    </motion.div>
  );
}

// ── Product Card ─────────────────────────────────────────────────────────
function ProductCard({
  product,
  onAdd,
}: {
  product: Product;
  onAdd: (product: Product) => void;
}) {
  const categoryColors: Record<string, string> = {
    "Luxury Eyewear": "text-neon-cyan border-neon-cyan/20 bg-neon-cyan/5",
    Fragrances: "text-metallic-gold border-metallic-gold/20 bg-metallic-gold/5",
  };
  const colorClass =
    categoryColors[product.category] ??
    "text-white/50 border-white/10 bg-white/5";

  return (
    <motion.button
      onClick={() => onAdd(product)}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.97 }}
      disabled={product.stock === 0}
      className={`group relative w-full text-left glass rounded-xl p-4 border border-white/6 transition-smooth hover:border-neon-cyan/20 disabled:opacity-40 disabled:cursor-not-allowed`}
    >
      {/* Category badge */}
      <span
        className={`inline-flex text-[10px] font-semibold px-2 py-0.5 rounded-full border mb-2 ${colorClass}`}
      >
        {product.category}
      </span>

      <h3 className="text-sm font-semibold text-white/90 leading-snug mb-1">
        {product.name}
      </h3>
      {product.description && (
        <p className="text-[11px] text-white/40 leading-snug mb-2 line-clamp-2">
          {product.description}
        </p>
      )}
      <div className="text-[10px] text-white/25 mb-2 font-mono">
        {product.sku ?? product.barcode ?? product.productId}
      </div>

      <div className="flex items-center justify-between mt-auto">
        <span className="text-base font-black text-metallic-gold">
          {formatCurrency(product.price)}
        </span>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-white/30">
            {product.stock} left
          </span>
          <div className="w-6 h-6 rounded-lg bg-neon-cyan/10 text-neon-cyan flex items-center justify-center opacity-0 group-hover:opacity-100 transition-smooth">
            <Plus className="w-3 h-3" />
          </div>
        </div>
      </div>

      {product.stock === 0 && (
        <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-obsidian/70 text-xs font-bold text-white/50">
          OUT OF STOCK
        </div>
      )}
    </motion.button>
  );
}

// ── Cart Item ────────────────────────────────────────────────────────────
function CartItem({
  item,
  onIncrement,
  onDecrement,
  onRemove,
}: {
  item: SaleItem;
  onIncrement: (id: string) => void;
  onDecrement: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex items-center gap-3 py-3 border-b border-white/5 last:border-0"
    >
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-white/90 truncate">{item.name}</div>
        <div className="text-xs text-metallic-gold font-bold mt-0.5">
          {formatCurrency(item.price)} ea.
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={() => onDecrement(item.productId)}
          className="w-7 h-7 rounded-lg glass border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:border-red-500/30 transition-smooth"
        >
          <Minus className="w-3 h-3" />
        </button>
        <span className="w-8 text-center text-sm font-bold text-white">
          {item.quantity}
        </span>
        <button
          onClick={() => onIncrement(item.productId)}
          className="w-7 h-7 rounded-lg glass border border-white/10 flex items-center justify-center text-white/60 hover:text-neon-cyan hover:border-neon-cyan/30 transition-smooth"
        >
          <Plus className="w-3 h-3" />
        </button>
      </div>

      <div className="text-sm font-bold text-white/80 w-20 text-right shrink-0">
        {formatCurrency(item.price * item.quantity)}
      </div>

      <button
        onClick={() => onRemove(item.productId)}
        className="w-7 h-7 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-500/10 flex items-center justify-center transition-smooth shrink-0"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </motion.div>
  );
}

function escapeReceiptText(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function printReceipt(
  receiptWindow: Window | null,
  sale: ReturnType<typeof buildSaleDraft>,
  businessName: string,
  branchName: string
) {
  if (!receiptWindow) return;

  const rows = sale.items
    .map(
      (item) => `
        <tr>
          <td>
            <strong>${escapeReceiptText(item.name)}</strong><br />
            <span>${escapeReceiptText(item.productId)}</span>
          </td>
          <td>${item.quantity}</td>
          <td>${formatCurrency(item.price, sale.currency)}</td>
          <td>${formatCurrency(item.price * item.quantity, sale.currency)}</td>
        </tr>`
    )
    .join("");
  const paymentRows = (sale.payments ?? [
    {
      method: sale.paymentMethod,
      amount: sale.total,
      amountCents: Math.round(sale.total * 100),
      status: "paid",
    },
  ])
    .map(
      (payment) =>
        `<div><span>${escapeReceiptText(payment.method.toUpperCase())}</span><span>${formatCurrency(payment.amount, sale.currency)}</span></div>`
    )
    .join("");

  receiptWindow.document.open();
  receiptWindow.document.write(`
    <!doctype html>
    <html>
      <head>
        <title>Receipt ${escapeReceiptText(sale.saleId)}</title>
        <style>
          * { box-sizing: border-box; }
          body {
            width: 80mm;
            margin: 0;
            padding: 12px;
            color: #111;
            font-family: "Courier New", monospace;
            font-size: 12px;
          }
          h1, p { margin: 0; text-align: center; }
          h1 { font-size: 17px; }
          .muted { color: #555; font-size: 10px; }
          .divider { border-top: 1px dashed #111; margin: 10px 0; }
          table { width: 100%; border-collapse: collapse; }
          th, td { padding: 4px 0; text-align: right; vertical-align: top; }
          th:first-child, td:first-child { text-align: left; }
          td span { color: #666; font-size: 10px; }
          .totals div { display: flex; justify-content: space-between; margin: 3px 0; }
          .total { font-size: 15px; font-weight: 700; }
          @media print {
            body { width: 80mm; }
            @page { margin: 0; size: 80mm auto; }
          }
        </style>
      </head>
      <body>
        <h1>${escapeReceiptText(businessName)}</h1>
        <p>${escapeReceiptText(branchName)}</p>
        <p class="muted">Terminal: ${escapeReceiptText(sale.terminalId)}</p>
        <p class="muted">Cashier: ${escapeReceiptText(sale.cashierName)}</p>
        <p class="muted">${new Date(sale.timestamp).toLocaleString("en-GH")}</p>
        <div class="divider"></div>
        <p class="muted">Receipt: ${escapeReceiptText(sale.saleId)}</p>
        <div class="divider"></div>
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>Qty</th>
              <th>Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <div class="divider"></div>
        <div class="totals">
          <div><span>Subtotal</span><span>${formatCurrency(sale.subtotal, sale.currency)}</span></div>
          <div><span>Discount</span><span>-${formatCurrency(sale.discount, sale.currency)}</span></div>
          <div><span>VAT</span><span>${formatCurrency(sale.tax, sale.currency)}</span></div>
          <div class="total"><span>Total</span><span>${formatCurrency(sale.total, sale.currency)}</span></div>
          ${paymentRows}
        </div>
        <div class="divider"></div>
        <p>Thank you for shopping with us.</p>
        <script>
          window.onload = () => {
            window.focus();
            window.print();
          };
        </script>
      </body>
    </html>
  `);
  receiptWindow.document.close();
}

// ── Main POS Page ─────────────────────────────────────────────────────────
export default function POSPage() {
  const scannerInputRef = useRef<HTMLInputElement | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [search, setSearch] = useState("");
  const [scanCode, setScanCode] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [terminalId, setTerminalId] = useState("terminal_loading");
  const [branchId, setBranchId] = useState("branch_accra_001");
  const [businessName, setBusinessName] = useState("BrAbel Luxury Retail");
  const [branchName, setBranchName] = useState("Accra Flagship");
  const [taxRate, setTaxRate] = useState(0.125);
  const [currency, setCurrency] = useState("GHS");
  const [openCashShift, setOpenCashShift] = useState<CashShift | undefined>();
  const [openingFloat, setOpeningFloat] = useState("500");
  const [discountInput, setDiscountInput] = useState("0");
  const [heldTickets, setHeldTickets] = useState<HeldTicket[]>([]);
  const [cashAmount, setCashAmount] = useState("");
  const [momoAmount, setMomoAmount] = useState("");
  const [cardAmount, setCardAmount] = useState("");
  const [refundSaleId, setRefundSaleId] = useState("");
  const [refundReason, setRefundReason] = useState("");

  // Online detection
  useEffect(() => {
    const update = () => setIsOnline(navigator.onLine);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    update();
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  useEffect(() => {
    setTerminalId(getTerminalId());
  }, []);

  useEffect(() => {
    if (isOnline) {
      void syncPendingOperations();
    }
  }, [isOnline]);

  useEffect(() => {
    if (terminalId === "terminal_loading") return;
    void getOpenShift({ terminalId, cashierId: "staff_admin" }).then(
      setOpenCashShift
    );
  }, [terminalId]);

  // Load products
  useEffect(() => {
    async function load() {
      await seedDatabaseIfEmpty();
      const [prods, settings] = await Promise.all([
        db.products.toArray(),
        getBusinessSettings(),
      ]);
      setProducts(prods);
      setBranchId(settings.branchId);
      setBusinessName(settings.businessName);
      setBranchName(settings.branchName);
      setTaxRate(settings.taxRate);
      setCurrency(settings.currency);
    }
    load();
  }, []);

  const reloadHeldTickets = useCallback(async () => {
    setHeldTickets(
      await db.heldTickets
        .where("terminalId")
        .equals(terminalId)
        .reverse()
        .sortBy("updatedAt")
    );
  }, [terminalId]);

  useEffect(() => {
    if (terminalId !== "terminal_loading") void reloadHeldTickets();
  }, [reloadHeldTickets, terminalId]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToCart = useCallback((product: Product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === product.productId);
      if (existing) {
        if (existing.quantity >= product.stock) return prev;
        return prev.map((i) =>
          i.productId === product.productId
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [
        ...prev,
        {
          productId: product.productId,
          sku: product.sku,
          barcode: product.barcode,
          name: product.name,
          price: product.price,
          quantity: 1,
          category: product.category,
        },
      ];
    });
  }, []);

  const incrementItem = useCallback((productId: string) => {
    setCart((prev) =>
      prev.map((i) => {
        const product = products.find((p) => p.productId === productId);
        if (i.productId !== productId) return i;
        if (product && i.quantity >= product.stock) return i;
        return { ...i, quantity: i.quantity + 1 };
      })
    );
  }, [products]);

  const decrementItem = useCallback((productId: string) => {
    setCart((prev) => {
      const item = prev.find((i) => i.productId === productId);
      if (!item) return prev;
      if (item.quantity <= 1) return prev.filter((i) => i.productId !== productId);
      return prev.map((i) =>
        i.productId === productId ? { ...i, quantity: i.quantity - 1 } : i
      );
    });
  }, []);

  const removeItem = useCallback((productId: string) => {
    setCart((prev) => prev.filter((i) => i.productId !== productId));
  }, []);

  const handleBarcodeScan = useCallback(() => {
    const code = scanCode.trim();
    if (!code) return;

    const product = products.find(
      (p) =>
        p.barcode === code ||
        p.sku?.toLowerCase() === code.toLowerCase() ||
        p.productId.toLowerCase() === code.toLowerCase()
    );

    if (!product) {
      setToasts((prev) => [
        ...prev,
        {
          id: generateId(),
          type: "error",
          title: "Barcode not found",
          message: `No product matches ${code}.`,
          isOnline,
        },
      ]);
      setScanCode("");
      scannerInputRef.current?.focus();
      return;
    }

    if (product.stock <= 0) {
      setToasts((prev) => [
        ...prev,
        {
          id: generateId(),
          type: "error",
          title: "Out of stock",
          message: `${product.name} cannot be added.`,
          isOnline,
        },
      ]);
      setScanCode("");
      scannerInputRef.current?.focus();
      return;
    }

    addToCart(product);
    setScanCode("");
    scannerInputRef.current?.focus();
  }, [addToCart, isOnline, products, scanCode]);

  const handleOpenShift = useCallback(async () => {
    const amount = Number(openingFloat);
    const shift = await openShift({
      branchId,
      terminalId,
      cashierId: "staff_admin",
      cashierName: "Admin",
      openingFloat: Number.isFinite(amount) ? amount : 0,
    });
    setOpenCashShift(shift);
    setToasts((prev) => [
      ...prev,
      {
        id: generateId(),
        type: "success",
        title: "Cash drawer opened",
        message: `Opening float ${formatCurrency(shift.openingFloat, currency)} recorded.`,
        isOnline,
      },
    ]);
  }, [branchId, currency, isOnline, openingFloat, terminalId]);

  const discount = Math.max(0, Number(discountInput) || 0);
  const { subtotal, tax, total } = calculateSaleTotals(
    cart,
    taxRate,
    currency,
    discount
  );

  const holdTicket = useCallback(async () => {
    if (cart.length === 0) return;
    const now = Date.now();
    const ticket: HeldTicket = {
      ticketId: `hold_${generateId()}`,
      label: `Ticket ${heldTickets.length + 1}`,
      items: cart,
      discount,
      discountCents: Math.round(discount * 100),
      createdAt: now,
      updatedAt: now,
      cashierId: "staff_admin",
      terminalId,
    };
    await db.heldTickets.add(ticket);
    setCart([]);
    setDiscountInput("0");
    await reloadHeldTickets();
  }, [cart, discount, heldTickets.length, reloadHeldTickets, terminalId]);

  const resumeTicket = useCallback(
    async (ticket: HeldTicket) => {
      setCart(ticket.items);
      setDiscountInput(String(ticket.discount));
      await db.heldTickets.where("ticketId").equals(ticket.ticketId).delete();
      await reloadHeldTickets();
    },
    [reloadHeldTickets]
  );

  const buildPayments = useCallback((): SalePayment[] => {
    const split = [
      { method: "cash" as const, amount: Number(cashAmount) || 0 },
      { method: "momo" as const, amount: Number(momoAmount) || 0 },
      { method: "card" as const, amount: Number(cardAmount) || 0 },
    ].filter((payment) => payment.amount > 0);

    const source =
      split.length > 0 ? split : [{ method: paymentMethod, amount: total }];

    return source.map((payment) => ({
      method: payment.method,
      amount: payment.amount,
      amountCents: Math.round(payment.amount * 100),
      status: payment.method === "cash" ? "paid" : "pending",
    }));
  }, [cardAmount, cashAmount, momoAmount, paymentMethod, total]);

  const refundSale = useCallback(async () => {
    const sale = await db.sales.where("saleId").equals(refundSaleId.trim()).first();
    if (!sale || sale.refundedAt) return;
    const settings = await getBusinessSettings();

    await db.transaction(
      "rw",
      [db.sales, db.products, db.stockMovements, db.auditLogs, db.syncQueue],
      async () => {
        const refundedAt = Date.now();
        await db.sales.where("saleId").equals(sale.saleId).modify({
          refundedAt,
          refundReason: refundReason || "Customer refund",
          synced_status: "pending",
        });
        const refundedSale = {
          ...sale,
          refundedAt: Date.now(),
          refundReason: refundReason || "Customer refund",
          synced_status: "pending",
        };

        for (const item of sale.items) {
          await db.products
            .where("productId")
            .equals(item.productId)
            .modify((product) => {
              product.stock += item.quantity;
            });
          const movement = {
            movementId: `move_${generateId()}`,
            branchId: settings.branchId,
            productId: item.productId,
            saleId: sale.saleId,
            type: "return" as const,
            quantityDelta: item.quantity,
            reason: refundReason || "Customer refund",
            staffId: "staff_admin",
            terminalId,
            createdAt: Date.now(),
            synced_status: "pending" as const,
          };
          await db.stockMovements.add(movement);
          await enqueueSync({
            entityType: "stock_movement",
            entityId: movement.movementId,
            payload: movement,
          });
        }

        await createAuditLog({
          actorId: "staff_admin",
          action: "sale.refund",
          entityType: "sale",
          entityId: sale.saleId,
          metadata: { reason: refundReason, total: sale.total },
        });
        await enqueueSync({ entityType: "sale", entityId: sale.saleId, payload: refundedSale });
      }
    );

    setRefundSaleId("");
    setRefundReason("");
    setProducts(await db.products.toArray());
    void syncPendingOperations();
  }, [refundReason, refundSaleId, terminalId]);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    if (!openCashShift) {
      setToasts((prev) => [
        ...prev,
        {
          id: generateId(),
          type: "error",
          title: "Open cash drawer first",
          message: "Start a cashier shift before recording sales.",
          isOnline,
        },
      ]);
      return;
    }
    const receiptWindow = window.open("", "_blank", "width=420,height=720");
    setIsCheckingOut(true);

    try {
      const payments = buildPayments();
      const paidCents = payments.reduce((sum, payment) => sum + payment.amountCents, 0);
      if (paidCents !== Math.round(total * 100)) {
        setToasts((prev) => [
          ...prev,
          {
            id: generateId(),
            type: "error",
            title: "Payment mismatch",
            message: "Split payments must equal the ticket total exactly.",
            isOnline,
          },
        ]);
        receiptWindow?.close();
        return;
      }

      const freshProducts = await db.products.toArray();
      const validationErrors = validateCartAgainstStock(cart, freshProducts);

      if (validationErrors.length > 0) {
        setToasts((prev) => [
          ...prev,
          {
            id: generateId(),
            type: "error",
            title: "Checkout blocked",
            message: validationErrors[0],
            isOnline,
          },
        ]);
        receiptWindow?.close();
        return;
      }

      const sale = buildSaleDraft({
        items: cart,
        paymentMethod,
        cashierId: "staff_admin",
        cashierName: "Admin",
        terminalId,
        branchId,
        shiftId: openCashShift.shiftId,
        discount,
        taxRate,
        currency,
        isOnline,
      });
      sale.payments = payments;
      sale.paymentMethod = payments.length > 1 ? "cash" : payments[0].method;

      await db.transaction(
        "rw",
        [db.sales, db.products, db.stockMovements, db.auditLogs, db.syncQueue, db.cashShifts],
        async () => {
          await saveSale(sale);

          for (const item of sale.items) {
            await db.products
              .where("productId")
              .equals(item.productId)
              .modify((product) => {
                product.stock = Math.max(0, product.stock - item.quantity);
              });
          }

          await recordStockMovementsForSale({
            sale,
            staffId: sale.cashierId ?? "staff_admin",
            terminalId,
          });

          await createAuditLog({
            actorId: sale.cashierId ?? "staff_admin",
            action: "sale.checkout",
            entityType: "sale",
            entityId: sale.saleId,
            metadata: {
              totalCents: sale.totalCents,
              paymentMethod: sale.paymentMethod,
              itemCount: sale.items.length,
              branchId,
              terminalId,
            },
          });

          await enqueueSync({
            entityType: "sale",
            entityId: sale.saleId,
            payload: sale,
          });

          const cashPaid = payments
            .filter((payment) => payment.method === "cash")
            .reduce((sum, payment) => sum + payment.amount, 0);

          if (cashPaid > 0 && sale.shiftId) {
            await recordCashSaleForShift({
              shiftId: sale.shiftId,
              amount: cashPaid,
            });
          }
        }
      );

      setProducts(await db.products.toArray());
      setOpenCashShift(
        await getOpenShift({ terminalId, cashierId: "staff_admin" })
      );
      setCart([]);
      setDiscountInput("0");
      setCashAmount("");
      setMomoAmount("");
      setCardAmount("");

      if (isOnline) {
        void syncPendingOperations();
      }

      printReceipt(receiptWindow, sale, businessName, branchName);

      setToasts((prev) => [
        ...prev,
        {
          id: generateId(),
          type: "success",
          title: "Sale recorded and stock updated",
          message: isOnline
            ? `${formatCurrency(total)} · syncing to cloud...`
            : `${formatCurrency(total)} · will sync when online`,
          isOnline,
        },
      ]);
    } catch {
      receiptWindow?.close();
      setToasts((prev) => [
        ...prev,
        {
          id: generateId(),
          type: "error",
          title: "Checkout failed",
          message: "Could not save sale. Nothing was charged or deducted.",
          isOnline,
        },
      ]);
    } finally {
      setIsCheckingOut(false);
    }
  };

  const categories = ["All", ...new Set(products.map((p) => p.category))];

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      search === "" ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      categoryFilter === "All" || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const paymentMethods = [
    { id: "cash" as const, label: "Cash", icon: Banknote },
    { id: "momo" as const, label: "MoMo", icon: Smartphone },
    { id: "card" as const, label: "Card", icon: CreditCard },
  ];

  return (
    <div className="h-full flex flex-col max-w-[1400px] mx-auto">
      {/* Toast container */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
        <AnimatePresence>
          {toasts.map((toast) => (
            <Toast key={toast.id} toast={toast} onDismiss={dismissToast} />
          ))}
        </AnimatePresence>
      </div>

      {/* Top bar */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div>
          <h1 className="text-xl font-black">
            <span className="gradient-text-cyan">Sale</span> Terminal
          </h1>
          <p className="text-white/30 text-xs mt-0.5">
            Cashier: Admin ·{" "}
            {new Date().toLocaleTimeString("en-GH", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-smooth ${
            isOnline
              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
              : "bg-orange-500/10 text-orange-400 border border-orange-500/20"
          }`}
        >
          {isOnline ? (
            <Wifi className="w-3 h-3" />
          ) : (
            <WifiOff className="w-3 h-3" />
          )}
          {isOnline ? "Online · Sync Active" : "Offline · Local Mode"}
        </div>
      </div>

      {!openCashShift ? (
        <div className="mb-4 shrink-0 glass-gold rounded-2xl border border-metallic-gold/25 p-4 flex flex-col md:flex-row md:items-center gap-3 justify-between">
          <div>
            <div className="font-bold text-metallic-gold text-sm">
              Cash drawer is closed
            </div>
            <div className="text-xs text-white/45 mt-0.5">
              Open a shift before checkout so cash variance can be tracked.
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0"
              step="0.01"
              value={openingFloat}
              onChange={(e) => setOpeningFloat(e.target.value)}
              className="w-32 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-metallic-gold/40"
              aria-label="Opening float"
            />
            <button
              onClick={handleOpenShift}
              className="px-4 py-2 rounded-xl shimmer-btn text-obsidian text-sm font-black"
            >
              Open Shift
            </button>
          </div>
        </div>
      ) : (
        <div className="mb-4 shrink-0 glass rounded-2xl border border-emerald-500/15 p-3 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-white/45">
            Shift{" "}
            <span className="text-white/80 font-mono">
              {openCashShift.shiftId.slice(-8)}
            </span>{" "}
            opened by Admin
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="text-white/40">
              Float{" "}
              <strong className="text-white/80">
                {formatCurrency(openCashShift.openingFloat, currency)}
              </strong>
            </span>
            <span className="text-white/40">
              Cash sales{" "}
              <strong className="text-emerald-400">
                {formatCurrency(openCashShift.cashSales, currency)}
              </strong>
            </span>
            <span className="text-white/40">
              Expected{" "}
              <strong className="text-metallic-gold">
                {formatCurrency(openCashShift.expectedCash, currency)}
              </strong>
            </span>
          </div>
        </div>
      )}

      {/* Main grid */}
      <div className="flex-1 grid lg:grid-cols-[1fr_380px] gap-4 min-h-0">
        {/* LEFT: Product catalog */}
        <div className="flex flex-col min-h-0 glass rounded-2xl border border-white/6 overflow-hidden">
          {/* Search + filter */}
          <div className="p-4 border-b border-white/5 shrink-0">
            <div className="relative mb-3">
              <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-metallic-gold" />
              <input
                ref={scannerInputRef}
                type="text"
                placeholder="Scan barcode or enter SKU..."
                value={scanCode}
                onChange={(e) => setScanCode(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleBarcodeScan();
                  }
                }}
                className="w-full bg-metallic-gold/5 border border-metallic-gold/20 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-metallic-gold/50 focus:bg-metallic-gold/10 transition-smooth font-mono"
                autoComplete="off"
              />
            </div>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white/5 border border-white/8 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-neon-cyan/30 focus:bg-neon-cyan/5 transition-smooth"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-smooth ${
                    categoryFilter === cat
                      ? "bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/25"
                      : "glass border border-white/8 text-white/50 hover:text-white hover:border-white/15"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Products grid */}
          <div className="flex-1 overflow-y-auto p-4">
            {filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-white/20 gap-3">
                <Package className="w-12 h-12" />
                <p className="text-sm">No products found</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
                <AnimatePresence mode="popLayout">
                  {filteredProducts.map((product) => (
                    <ProductCard
                      key={product.productId}
                      product={product}
                      onAdd={addToCart}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Cart / Ticket */}
        <div className="flex flex-col min-h-0 glass-cyan rounded-2xl border border-neon-cyan/15 overflow-hidden">
          {/* Cart header */}
          <div className="p-4 border-b border-neon-cyan/10 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-neon-cyan" />
                <span className="font-bold text-base">Current Ticket</span>
              </div>
              {cart.length > 0 && (
                <button
                  onClick={() => setCart([])}
                  className="text-xs text-white/30 hover:text-red-400 transition-smooth flex items-center gap-1"
                >
                  <X className="w-3 h-3" />
                  Clear
                </button>
              )}
            </div>
            <div className="text-xs text-white/30 mt-1">
              {cart.length} item(s) in cart
            </div>
          </div>

          {/* Cart items */}
          <div className="flex-1 overflow-y-auto px-4">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-white/20 gap-3 py-12">
                <ShoppingCart className="w-12 h-12" />
                <p className="text-sm text-center">
                  Select products from the catalog to add them here
                </p>
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                {cart.map((item) => (
                  <CartItem
                    key={item.productId}
                    item={item}
                    onIncrement={incrementItem}
                    onDecrement={decrementItem}
                    onRemove={removeItem}
                  />
                ))}
              </AnimatePresence>
            )}
          </div>

          {/* Totals & checkout */}
          <div className="p-4 border-t border-neon-cyan/10 shrink-0 space-y-3">
            {heldTickets.length > 0 && (
              <div>
                <p className="text-xs text-white/40 mb-2">Held tickets</p>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {heldTickets.map((ticket) => (
                    <button
                      key={ticket.ticketId}
                      onClick={() => resumeTicket(ticket)}
                      className="shrink-0 px-3 py-1.5 rounded-lg glass border border-white/10 text-xs text-white/70 hover:border-neon-cyan/30"
                    >
                      {ticket.label} · {ticket.items.length}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={holdTicket}
                disabled={cart.length === 0}
                className="flex items-center justify-center gap-2 py-2 rounded-xl glass border border-white/10 text-xs font-semibold text-white/60 hover:text-white disabled:opacity-30"
              >
                <PauseCircle className="w-4 h-4" />
                Hold
              </button>
              <button
                onClick={refundSale}
                className="flex items-center justify-center gap-2 py-2 rounded-xl glass border border-white/10 text-xs font-semibold text-white/60 hover:text-white"
              >
                <RotateCcw className="w-4 h-4" />
                Refund
              </button>
            </div>

            <div className="grid grid-cols-[1fr_1fr] gap-2">
              <div className="relative">
                <Percent className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={discountInput}
                  onChange={(e) => setDiscountInput(e.target.value)}
                  placeholder="Discount"
                  className="w-full bg-white/5 border border-white/8 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-neon-cyan/30"
                />
              </div>
              <input
                value={refundSaleId}
                onChange={(e) => setRefundSaleId(e.target.value)}
                placeholder="Sale ID to refund"
                className="w-full bg-white/5 border border-white/8 rounded-xl px-3 py-2 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-neon-cyan/30"
              />
            </div>
            {refundSaleId && (
              <input
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                placeholder="Refund reason"
                className="w-full bg-white/5 border border-white/8 rounded-xl px-3 py-2 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-neon-cyan/30"
              />
            )}

            {/* Totals */}
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-white/50">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-white/50">
                <span>Discount</span>
                <span>-{formatCurrency(Math.min(discount, subtotal))}</span>
              </div>
              <div className="flex justify-between text-white/50">
                <span>VAT (12.5%)</span>
                <span>{formatCurrency(tax)}</span>
              </div>
              <div className="flex justify-between font-black text-base pt-1.5 border-t border-white/8">
                <span>Total</span>
                <span className="gradient-text-gold">{formatCurrency(total)}</span>
              </div>
            </div>

            {/* Payment method */}
            <div>
              <p className="text-xs text-white/40 mb-2">Payment method</p>
              <div className="grid grid-cols-3 gap-2">
                {paymentMethods.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setPaymentMethod(id)}
                    className={`flex flex-col items-center gap-1 py-2.5 rounded-xl text-xs font-semibold transition-smooth ${
                      paymentMethod === id
                        ? "bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/25"
                        : "glass border border-white/8 text-white/50 hover:text-white"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs text-white/40 mb-2">Split payments</p>
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={cashAmount}
                  onChange={(e) => setCashAmount(e.target.value)}
                  placeholder="Cash"
                  className="bg-white/5 border border-white/8 rounded-xl px-3 py-2 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-neon-cyan/30"
                />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={momoAmount}
                  onChange={(e) => setMomoAmount(e.target.value)}
                  placeholder="MoMo"
                  className="bg-white/5 border border-white/8 rounded-xl px-3 py-2 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-neon-cyan/30"
                />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={cardAmount}
                  onChange={(e) => setCardAmount(e.target.value)}
                  placeholder="Card"
                  className="bg-white/5 border border-white/8 rounded-xl px-3 py-2 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-neon-cyan/30"
                />
              </div>
            </div>

            {/* Checkout button */}
            <motion.button
              onClick={handleCheckout}
              disabled={cart.length === 0 || isCheckingOut || !openCashShift}
              whileHover={cart.length > 0 ? { scale: 1.02 } : {}}
              whileTap={cart.length > 0 ? { scale: 0.98 } : {}}
              className="w-full py-4 rounded-xl font-black text-base shimmer-btn text-obsidian disabled:opacity-40 disabled:cursor-not-allowed transition-smooth"
            >
              <Printer className="inline-block w-4 h-4 mr-2 align-[-2px]" />
              {isCheckingOut
                ? "Processing..."
                : `Checkout · ${formatCurrency(total)}`}
            </motion.button>

            {/* Offline note */}
            {!isOnline && (
              <p className="text-[11px] text-orange-400/70 text-center flex items-center justify-center gap-1">
                <WifiOff className="w-3 h-3" />
                Offline mode — sale will sync automatically
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
