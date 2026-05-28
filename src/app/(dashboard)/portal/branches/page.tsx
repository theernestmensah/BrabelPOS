"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRightLeft, Building2, CheckCircle2, Network } from "lucide-react";
import { db, getBusinessSettings, seedDatabaseIfEmpty, type BranchTransfer, type Product } from "@/lib/db";
import { enqueueSync } from "@/lib/offline-sync";
import { formatDate, generateId } from "@/lib/utils";

const inputClass = "w-full bg-white/5 border border-white/8 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-neon-cyan/30";

export default function BranchesPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [transfers, setTransfers] = useState<BranchTransfer[]>([]);
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("1");

  const reload = async () => {
    await seedDatabaseIfEmpty();
    const [productList, transferList] = await Promise.all([
      db.products.toArray(),
      db.branchTransfers.orderBy("createdAt").reverse().toArray(),
    ]);
    setProducts(productList);
    setTransfers(transferList);
    if (!productId && productList[0]) setProductId(productList[0].productId);
  };

  useEffect(() => { void reload(); }, []);

  const requestTransfer = async () => {
    if (!productId) return;
    const settings = await getBusinessSettings();
    const transfer: BranchTransfer = {
      transferId: `transfer_${generateId()}`,
      productId,
      fromBranchId: settings.branchId,
      toBranchId: "branch_secondary_001",
      quantity: Math.max(1, Math.floor(Number(quantity) || 1)),
      status: "pending",
      requestedBy: "staff_admin",
      createdAt: Date.now(),
      synced_status: "pending",
    };
    await db.branchTransfers.add(transfer);
    await enqueueSync({ entityType: "branch_transfer", entityId: transfer.transferId, payload: transfer });
    await reload();
  };

  const counts = useMemo(() => ({
    pending: transfers.filter((transfer) => transfer.status === "pending").length,
    approved: transfers.filter((transfer) => transfer.status === "approved").length,
    received: transfers.filter((transfer) => transfer.status === "received").length,
  }), [transfers]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div><h1 className="text-2xl font-black"><span className="gradient-text-cyan">Branches</span></h1><p className="text-sm text-white/40 mt-0.5">Multi-branch stock movements, transfer requests, and location readiness.</p></div>
      <div className="grid md:grid-cols-3 gap-4">
        <div className="glass rounded-2xl border border-white/6 p-5"><Network className="w-5 h-5 text-neon-cyan mb-3" /><div className="text-xs text-white/35">Pending Transfers</div><div className="text-3xl font-black">{counts.pending}</div></div>
        <div className="glass rounded-2xl border border-white/6 p-5"><CheckCircle2 className="w-5 h-5 text-emerald-400 mb-3" /><div className="text-xs text-white/35">Approved Transfers</div><div className="text-3xl font-black">{counts.approved}</div></div>
        <div className="glass rounded-2xl border border-white/6 p-5"><Building2 className="w-5 h-5 text-metallic-gold mb-3" /><div className="text-xs text-white/35">Configured Branches</div><div className="text-3xl font-black">2</div></div>
      </div>
      <section className="glass rounded-2xl border border-white/6 p-5">
        <div className="flex items-center gap-2 mb-4"><ArrowRightLeft className="w-5 h-5 text-neon-cyan" /><h2 className="font-bold">Request Branch Transfer</h2></div>
        <div className="grid md:grid-cols-[1fr_120px_auto] gap-3">
          <select className={inputClass} value={productId} onChange={(e) => setProductId(e.target.value)}>{products.map((product) => <option key={product.productId} value={product.productId}>{product.name}</option>)}</select>
          <input className={inputClass} type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
          <button onClick={requestTransfer} className="px-5 py-2.5 rounded-xl shimmer-btn text-obsidian text-sm font-black">Request</button>
        </div>
      </section>
      <section className="glass rounded-2xl border border-white/6 p-5">
        <h2 className="font-bold mb-4">Transfer Ledger</h2>
        <div className="space-y-2">
          {transfers.map((transfer) => <div key={transfer.transferId} className="grid md:grid-cols-[1fr_120px_140px_160px] gap-3 glass rounded-xl px-4 py-3 text-sm"><span>{transfer.productId}</span><span>{transfer.quantity} units</span><span className="text-neon-cyan">{transfer.status}</span><span className="text-white/35">{formatDate(transfer.createdAt)}</span></div>)}
          {transfers.length === 0 && <div className="text-sm text-white/35">No transfers yet.</div>}
        </div>
      </section>
    </div>
  );
}
