"use client";

import { useEffect, useMemo, useState } from "react";
import { BarChart3, Banknote, Package, ReceiptText, RotateCcw, TrendingUp } from "lucide-react";
import { db, seedDatabaseIfEmpty, type Expense, type Product, type Sale } from "@/lib/db";
import { formatCurrency, formatDate } from "@/lib/utils";

function Stat({ label, value, icon: Icon, tone = "text-white" }: { label: string; value: string; icon: React.ElementType; tone?: string }) {
  return (
    <div className="glass rounded-2xl border border-white/6 p-5">
      <div className="flex items-center justify-between">
        <div className="text-xs text-white/35">{label}</div>
        <Icon className="w-5 h-5 text-neon-cyan" />
      </div>
      <div className={`mt-3 text-2xl font-black ${tone}`}>{value}</div>
    </div>
  );
}

export default function ReportsPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  useEffect(() => {
    void (async () => {
      await seedDatabaseIfEmpty();
      const [saleList, productList, expenseList] = await Promise.all([
        db.sales.orderBy("timestamp").reverse().toArray(),
        db.products.toArray(),
        db.expenses.orderBy("createdAt").reverse().toArray(),
      ]);
      setSales(saleList);
      setProducts(productList);
      setExpenses(expenseList);
    })();
  }, []);

  const metrics = useMemo(() => {
    const revenue = sales.reduce((sum, sale) => sum + sale.total, 0);
    const refunds = sales.filter((sale) => sale.refundedAt).length;
    const expenseTotal = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const units = sales.flatMap((sale) => sale.items).reduce((sum, item) => sum + item.quantity, 0);
    const lowStock = products.filter((product) => product.stock <= 8);
    const itemMap = new Map<string, { name: string; qty: number; revenue: number }>();
    sales.forEach((sale) =>
      sale.items.forEach((item) => {
        const existing = itemMap.get(item.productId) ?? { name: item.name, qty: 0, revenue: 0 };
        existing.qty += item.quantity;
        existing.revenue += item.price * item.quantity;
        itemMap.set(item.productId, existing);
      })
    );
    const topItems = Array.from(itemMap.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
    return { revenue, refunds, expenseTotal, units, lowStock, topItems, profit: revenue * 0.42 - expenseTotal };
  }, [sales, products, expenses]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black"><span className="gradient-text-cyan">Reports</span> Center</h1>
        <p className="text-sm text-white/40 mt-0.5">Revenue, stock, refunds, expenses, and product performance.</p>
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Stat label="Gross Revenue" value={formatCurrency(metrics.revenue)} icon={TrendingUp} tone="text-emerald-400" />
        <Stat label="Estimated Margin" value={formatCurrency(metrics.profit)} icon={Banknote} tone="text-metallic-gold" />
        <Stat label="Units Sold" value={String(metrics.units)} icon={Package} />
        <Stat label="Refunded Sales" value={String(metrics.refunds)} icon={RotateCcw} tone="text-red-300" />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <section className="glass rounded-2xl border border-white/6 p-5">
          <div className="flex items-center gap-2 mb-4"><BarChart3 className="w-5 h-5 text-neon-cyan" /><h2 className="font-bold">Top Items</h2></div>
          <div className="space-y-3">
            {metrics.topItems.map((item) => (
              <div key={item.name} className="flex items-center justify-between glass rounded-xl px-4 py-3">
                <div><div className="text-sm font-semibold">{item.name}</div><div className="text-xs text-white/35">{item.qty} units</div></div>
                <div className="text-sm font-black text-metallic-gold">{formatCurrency(item.revenue)}</div>
              </div>
            ))}
            {metrics.topItems.length === 0 && <div className="text-sm text-white/35">No sales yet.</div>}
          </div>
        </section>

        <section className="glass rounded-2xl border border-white/6 p-5">
          <div className="flex items-center gap-2 mb-4"><ReceiptText className="w-5 h-5 text-neon-cyan" /><h2 className="font-bold">Recent Sales</h2></div>
          <div className="space-y-3 max-h-96 overflow-auto">
            {sales.slice(0, 8).map((sale) => (
              <div key={sale.saleId} className="flex items-center justify-between glass rounded-xl px-4 py-3">
                <div><div className="text-sm font-semibold">{sale.saleId}</div><div className="text-xs text-white/35">{formatDate(sale.timestamp)}</div></div>
                <div className="text-right"><div className="text-sm font-black">{formatCurrency(sale.total)}</div><div className="text-xs text-white/35">{sale.paymentMethod}</div></div>
              </div>
            ))}
            {sales.length === 0 && <div className="text-sm text-white/35">No sales yet.</div>}
          </div>
        </section>
      </div>

      <section className="glass rounded-2xl border border-white/6 p-5">
        <h2 className="font-bold mb-4">Low Stock Watchlist</h2>
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
          {metrics.lowStock.map((product) => (
            <div key={product.productId} className="glass rounded-xl px-4 py-3">
              <div className="text-sm font-semibold">{product.name}</div>
              <div className="text-xs text-red-300 mt-1">{product.stock} remaining</div>
            </div>
          ))}
          {metrics.lowStock.length === 0 && <div className="text-sm text-white/35">Stock health is good.</div>}
        </div>
      </section>
    </div>
  );
}
