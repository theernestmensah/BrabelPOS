"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Package,
  Search,
  AlertTriangle,
  TrendingDown,
  Plus,
  ClipboardPlus,
} from "lucide-react";
import {
  db,
  getBusinessSettings,
  seedDatabaseIfEmpty,
  type Product,
  type StockMovement,
} from "@/lib/db";
import type { StockMovementType } from "@/lib/domain";
import {
  createAuditLog,
  enqueueSync,
  getTerminalId,
  syncPendingOperations,
} from "@/lib/offline-sync";
import { formatCurrency, generateId } from "@/lib/utils";

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [movementType, setMovementType] = useState<StockMovementType>("purchase");
  const [quantity, setQuantity] = useState("1");
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");

  const reloadProducts = async () => {
    const prods = await db.products.toArray();
    setProducts(prods);
    if (!selectedProductId && prods[0]) setSelectedProductId(prods[0].productId);
  };

  useEffect(() => {
    async function load() {
      await seedDatabaseIfEmpty();
      await reloadProducts();
    }
    load();
  }, []);

  const applyStockMovement = async () => {
    const product = products.find((p) => p.productId === selectedProductId);
    const qty = Math.max(0, Math.floor(Number(quantity)));
    if (!product || qty <= 0) return;

    const settings = await getBusinessSettings();
    const terminalId = getTerminalId();
    const positive = movementType === "purchase" || movementType === "return";
    const quantityDelta = positive ? qty : -qty;
    const nextStock = product.stock + quantityDelta;

    if (nextStock < 0) {
      setMessage("Stock action blocked. Quantity would fall below zero.");
      return;
    }

    const movement: StockMovement = {
      movementId: `move_${generateId()}`,
      branchId: settings.branchId,
      productId: product.productId,
      type: movementType,
      quantityDelta,
      reason: reason || `${movementType} adjustment`,
      staffId: "staff_admin",
      terminalId,
      createdAt: Date.now(),
      synced_status: "pending",
    };

    await db.transaction(
      "rw",
      [db.products, db.stockMovements, db.auditLogs, db.syncQueue],
      async () => {
        await db.products
          .where("productId")
          .equals(product.productId)
          .modify((row) => {
            row.stock = nextStock;
          });
        await db.stockMovements.add(movement);
        await enqueueSync({
          entityType: "stock_movement",
          entityId: movement.movementId,
          payload: movement,
        });
        await createAuditLog({
          actorId: "staff_admin",
          action: `inventory.${movementType}`,
          entityType: "product",
          entityId: product.productId,
          metadata: {
            quantityDelta,
            previousStock: product.stock,
            nextStock,
            reason,
          },
        });
      }
    );

    await reloadProducts();
    setReason("");
    setMessage(`${product.name} stock updated to ${nextStock}.`);
    void syncPendingOperations();
  };

  const filtered = products.filter((p) =>
    search === "" ||
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  const lowStock = products.filter((p) => p.stock <= 8);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-black">
          <span className="gradient-text-cyan">Inventory</span> Manager
        </h1>
        <p className="text-white/40 text-sm mt-0.5">
          {products.length} products across {new Set(products.map((p) => p.category)).size} categories
        </p>
      </motion.div>

      {/* Low stock alert */}
      {lowStock.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-start gap-3 p-4 rounded-xl glass border border-orange-500/20 bg-orange-500/5"
        >
          <AlertTriangle className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-orange-300 text-sm">Low Stock Alert</div>
            <div className="text-xs text-white/50 mt-0.5">
              {lowStock.map((p) => p.name).join(", ")} — reorder recommended.
            </div>
          </div>
        </motion.div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
        <input
          type="text"
          placeholder="Search inventory..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white/5 border border-white/8 rounded-xl pl-9 pr-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-neon-cyan/30 transition-smooth"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl border border-white/6 p-5"
      >
        <div className="flex items-center gap-2 mb-4">
          <ClipboardPlus className="w-5 h-5 text-neon-cyan" />
          <h2 className="font-bold text-base">Stock Action</h2>
        </div>
        <div className="grid md:grid-cols-[1.5fr_1fr_1fr_2fr_auto] gap-3 items-end">
          <div>
            <label className="text-xs text-white/40 mb-1 block">Product</label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full bg-white/5 border border-white/8 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-neon-cyan/30"
            >
              {products.map((product) => (
                <option key={product.productId} value={product.productId}>
                  {product.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-white/40 mb-1 block">Action</label>
            <select
              value={movementType}
              onChange={(e) => setMovementType(e.target.value as StockMovementType)}
              className="w-full bg-white/5 border border-white/8 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-neon-cyan/30"
            >
              <option value="purchase">Purchase</option>
              <option value="return">Return</option>
              <option value="adjustment">Adjustment Out</option>
              <option value="damage">Damage</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-white/40 mb-1 block">Qty</label>
            <input
              type="number"
              min="1"
              step="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full bg-white/5 border border-white/8 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-neon-cyan/30"
            />
          </div>
          <div>
            <label className="text-xs text-white/40 mb-1 block">Reason</label>
            <input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Supplier delivery, count correction, damaged item..."
              className="w-full bg-white/5 border border-white/8 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-neon-cyan/30"
            />
          </div>
          <button
            onClick={applyStockMovement}
            className="px-5 py-2.5 rounded-xl shimmer-btn text-obsidian text-sm font-black"
          >
            Apply
          </button>
        </div>
        {message && <div className="text-xs text-emerald-400 mt-3">{message}</div>}
      </motion.div>

      {/* Product table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass rounded-2xl border border-white/6 overflow-hidden"
      >
        <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-5 py-3 border-b border-white/5 text-xs text-white/30 font-semibold tracking-wide uppercase">
          <span>Product</span>
          <span className="text-right">Price</span>
          <span className="text-right">Stock</span>
          <span className="text-right">Status</span>
        </div>

        {filtered.map((product, i) => (
          <motion.div
            key={product.productId}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="grid grid-cols-[1fr_auto_auto_auto] gap-4 items-center px-5 py-4 border-b border-white/5 last:border-0 hover:bg-white/2 transition-smooth"
          >
            <div>
              <div className="text-sm font-semibold text-white/90">{product.name}</div>
              <div className="text-xs text-white/30 mt-0.5">{product.category}</div>
            </div>
            <div className="text-sm font-bold text-metallic-gold text-right">
              {formatCurrency(product.price)}
            </div>
            <div className="text-sm font-semibold text-right text-white/70">
              {product.stock}
            </div>
            <div className="text-right">
              {product.stock === 0 ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/20">
                  OUT
                </span>
              ) : product.stock <= 8 ? (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-500/10 text-orange-400 border border-orange-500/20">
                  <TrendingDown className="w-2.5 h-2.5" />
                  LOW
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  OK
                </span>
              )}
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Add product CTA */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="flex items-center gap-2 px-5 py-3 rounded-xl glass border border-white/10 text-white/50 text-sm hover:border-neon-cyan/30 hover:text-neon-cyan transition-smooth"
      >
        <Plus className="w-4 h-4" />
        Add New Product
      </motion.button>
    </div>
  );
}
