"use client";

import { useEffect, useMemo, useState } from "react";
import { HandCoins, Plus, ReceiptText } from "lucide-react";
import { db, getBusinessSettings, seedDatabaseIfEmpty, type Expense } from "@/lib/db";
import { toCents } from "@/lib/domain";
import { createAuditLog, enqueueSync } from "@/lib/offline-sync";
import { formatCurrency, formatDate, generateId } from "@/lib/utils";

const inputClass = "w-full bg-white/5 border border-white/8 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-neon-cyan/30";

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [category, setCategory] = useState("Operations");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  const reload = async () => {
    await seedDatabaseIfEmpty();
    setExpenses(await db.expenses.orderBy("createdAt").reverse().toArray());
  };

  useEffect(() => { void reload(); }, []);

  const saveExpense = async () => {
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) return;
    const settings = await getBusinessSettings();
    const expense: Expense = {
      expenseId: `exp_${generateId()}`,
      branchId: settings.branchId,
      category: category.trim() || "Operations",
      amount: value,
      amountCents: toCents(value),
      note: note.trim(),
      staffId: "staff_admin",
      createdAt: Date.now(),
      synced_status: "pending",
    };
    await db.expenses.add(expense);
    await enqueueSync({ entityType: "expense", entityId: expense.expenseId, payload: expense });
    await createAuditLog({ actorId: "staff_admin", action: "expense.create", entityType: "expense", entityId: expense.expenseId, metadata: expense });
    setAmount(""); setNote("");
    await reload();
  };

  const totals = useMemo(() => {
    const byCategory = expenses.reduce<Record<string, number>>((acc, expense) => {
      acc[expense.category] = (acc[expense.category] ?? 0) + expense.amount;
      return acc;
    }, {});
    return { total: expenses.reduce((sum, expense) => sum + expense.amount, 0), byCategory };
  }, [expenses]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div><h1 className="text-2xl font-black"><span className="gradient-text-cyan">Expenses</span></h1><p className="text-sm text-white/40 mt-0.5">Track cash outflows, operations costs, and margin pressure.</p></div>
      <div className="grid lg:grid-cols-[1fr_320px] gap-4">
        <section className="glass rounded-2xl border border-white/6 p-5">
          <div className="flex items-center gap-2 mb-4"><Plus className="w-5 h-5 text-neon-cyan" /><h2 className="font-bold">Record Expense</h2></div>
          <div className="grid md:grid-cols-[180px_160px_1fr_auto] gap-3">
            <input className={inputClass} value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Category" />
            <input className={inputClass} type="number" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount" />
            <input className={inputClass} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note" />
            <button onClick={saveExpense} className="px-5 py-2.5 rounded-xl shimmer-btn text-obsidian text-sm font-black">Save</button>
          </div>
        </section>
        <section className="glass rounded-2xl border border-white/6 p-5">
          <div className="flex items-center gap-2"><HandCoins className="w-5 h-5 text-neon-cyan" /><h2 className="font-bold">Total Expenses</h2></div>
          <div className="text-3xl font-black text-metallic-gold mt-4">{formatCurrency(totals.total)}</div>
        </section>
      </div>
      <div className="grid lg:grid-cols-[320px_1fr] gap-4">
        <section className="glass rounded-2xl border border-white/6 p-5">
          <h2 className="font-bold mb-4">By Category</h2>
          <div className="space-y-2">
            {Object.entries(totals.byCategory).map(([key, value]) => <div key={key} className="flex justify-between text-sm glass rounded-xl px-3 py-2"><span>{key}</span><span className="text-metallic-gold font-bold">{formatCurrency(value)}</span></div>)}
          </div>
        </section>
        <section className="glass rounded-2xl border border-white/6 p-5">
          <div className="flex items-center gap-2 mb-4"><ReceiptText className="w-5 h-5 text-neon-cyan" /><h2 className="font-bold">Expense Ledger</h2></div>
          <div className="space-y-2 max-h-[520px] overflow-auto">
            {expenses.map((expense) => <div key={expense.expenseId} className="grid md:grid-cols-[160px_1fr_140px_160px] gap-3 glass rounded-xl px-4 py-3 text-sm"><span className="font-bold">{expense.category}</span><span className="text-white/45">{expense.note || "No note"}</span><span className="text-metallic-gold font-black">{formatCurrency(expense.amount)}</span><span className="text-white/35">{formatDate(expense.createdAt)}</span></div>)}
          </div>
        </section>
      </div>
    </div>
  );
}
