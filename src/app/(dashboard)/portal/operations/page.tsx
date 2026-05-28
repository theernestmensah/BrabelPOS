"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRightLeft,
  CheckCircle2,
  HandCoins,
  ShieldCheck,
  Truck,
  Users,
} from "lucide-react";
import {
  db,
  getBusinessSettings,
  seedDatabaseIfEmpty,
  type BranchTransfer,
  type Customer,
  type Expense,
  type ManagerApproval,
  type Product,
  type Supplier,
} from "@/lib/db";
import { toCents } from "@/lib/domain";
import { createAuditLog, enqueueSync, syncPendingOperations } from "@/lib/offline-sync";
import { formatCurrency, generateId } from "@/lib/utils";

function Panel({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl border border-white/6 overflow-hidden"
    >
      <div className="flex items-center gap-2 px-5 py-4 border-b border-white/5">
        <Icon className="w-5 h-5 text-neon-cyan" />
        <h2 className="font-bold text-base">{title}</h2>
      </div>
      <div className="p-5 space-y-3">{children}</div>
    </motion.div>
  );
}

const inputClass =
  "w-full bg-white/5 border border-white/8 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-neon-cyan/30";

export default function OperationsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [transfers, setTransfers] = useState<BranchTransfer[]>([]);
  const [approvals, setApprovals] = useState<ManagerApproval[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [supplierName, setSupplierName] = useState("");
  const [supplierPhone, setSupplierPhone] = useState("");
  const [expenseCategory, setExpenseCategory] = useState("Operations");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseNote, setExpenseNote] = useState("");
  const [transferProductId, setTransferProductId] = useState("");
  const [transferQty, setTransferQty] = useState("1");
  const [message, setMessage] = useState("");

  const reload = async () => {
    await seedDatabaseIfEmpty();
    const [productList, customerList, supplierList, expenseList, transferList, approvalList] =
      await Promise.all([
        db.products.toArray(),
        db.customers.orderBy("createdAt").reverse().toArray(),
        db.suppliers.orderBy("createdAt").reverse().toArray(),
        db.expenses.orderBy("createdAt").reverse().toArray(),
        db.branchTransfers.orderBy("createdAt").reverse().toArray(),
        db.managerApprovals.orderBy("createdAt").reverse().toArray(),
      ]);
    setProducts(productList);
    setCustomers(customerList);
    setSuppliers(supplierList);
    setExpenses(expenseList);
    setTransfers(transferList);
    setApprovals(approvalList);
    if (!transferProductId && productList[0]) setTransferProductId(productList[0].productId);
  };

  useEffect(() => {
    void reload();
  }, []);

  const saveCustomer = async () => {
    if (!customerName.trim()) return;
    const customer: Customer = {
      customerId: `cust_${generateId()}`,
      name: customerName.trim(),
      phone: customerPhone.trim(),
      loyaltyPoints: 0,
      totalSpend: 0,
      createdAt: Date.now(),
      synced_status: "pending",
    };
    await db.customers.add(customer);
    await enqueueSync({ entityType: "customer", entityId: customer.customerId, payload: customer });
    setCustomerName("");
    setCustomerPhone("");
    setMessage("Customer saved.");
    await reload();
  };

  const saveSupplier = async () => {
    if (!supplierName.trim()) return;
    const supplier: Supplier = {
      supplierId: `supp_${generateId()}`,
      name: supplierName.trim(),
      phone: supplierPhone.trim(),
      createdAt: Date.now(),
      synced_status: "pending",
    };
    await db.suppliers.add(supplier);
    await enqueueSync({ entityType: "supplier", entityId: supplier.supplierId, payload: supplier });
    setSupplierName("");
    setSupplierPhone("");
    setMessage("Supplier saved.");
    await reload();
  };

  const saveExpense = async () => {
    const settings = await getBusinessSettings();
    const amount = Number(expenseAmount) || 0;
    if (amount <= 0) return;
    const expense: Expense = {
      expenseId: `exp_${generateId()}`,
      branchId: settings.branchId,
      category: expenseCategory,
      amount,
      amountCents: toCents(amount),
      note: expenseNote,
      staffId: "staff_admin",
      createdAt: Date.now(),
      synced_status: "pending",
    };
    await db.expenses.add(expense);
    await enqueueSync({ entityType: "expense", entityId: expense.expenseId, payload: expense });
    await createAuditLog({
      actorId: "staff_admin",
      action: "expense.create",
      entityType: "expense",
      entityId: expense.expenseId,
      metadata: { amountCents: expense.amountCents, category: expense.category },
    });
    setExpenseAmount("");
    setExpenseNote("");
    setMessage("Expense recorded.");
    await reload();
  };

  const requestTransfer = async () => {
    const settings = await getBusinessSettings();
    const qty = Math.max(1, Math.floor(Number(transferQty) || 1));
    const transfer: BranchTransfer = {
      transferId: `transfer_${generateId()}`,
      productId: transferProductId,
      fromBranchId: settings.branchId,
      toBranchId: "branch_secondary_001",
      quantity: qty,
      status: "pending",
      requestedBy: "staff_admin",
      createdAt: Date.now(),
      synced_status: "pending",
    };
    const approval: ManagerApproval = {
      approvalId: `approval_${generateId()}`,
      action: "branch_transfer.request",
      entityType: "branch_transfer",
      entityId: transfer.transferId,
      requestedBy: "staff_admin",
      status: "pending",
      reason: `${qty} unit transfer request`,
      createdAt: Date.now(),
      synced_status: "pending",
    };
    await db.branchTransfers.add(transfer);
    await db.managerApprovals.add(approval);
    await enqueueSync({ entityType: "branch_transfer", entityId: transfer.transferId, payload: transfer });
    await enqueueSync({ entityType: "manager_approval", entityId: approval.approvalId, payload: approval });
    setMessage("Transfer request sent for manager approval.");
    await reload();
  };

  const resolveApproval = async (approval: ManagerApproval, status: "approved" | "rejected") => {
    const updated = {
      ...approval,
      status,
      approvedBy: "manager_admin",
      resolvedAt: Date.now(),
      synced_status: "pending" as const,
    };
    await db.managerApprovals.where("approvalId").equals(approval.approvalId).modify(updated);
    if (approval.entityType === "branch_transfer") {
      await db.branchTransfers.where("transferId").equals(approval.entityId).modify({
        status: status === "approved" ? "approved" : "cancelled",
        synced_status: "pending",
      });
    }
    await enqueueSync({ entityType: "manager_approval", entityId: updated.approvalId, payload: updated });
    setMessage(`Approval ${status}.`);
    await reload();
    void syncPendingOperations();
  };

  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black">
          <span className="gradient-text-cyan">Operations</span> Command
        </h1>
        <p className="text-white/40 text-sm mt-0.5">
          Customers, suppliers, expenses, transfers, and manager approvals.
        </p>
      </div>

      {message && (
        <div className="glass rounded-xl border border-emerald-500/20 text-emerald-400 text-sm px-4 py-3">
          {message}
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-4">
        <Panel title="Customers" icon={Users}>
          <div className="grid sm:grid-cols-2 gap-2">
            <input className={inputClass} value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Customer name" />
            <input className={inputClass} value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="Phone" />
          </div>
          <button onClick={saveCustomer} className="px-4 py-2 rounded-xl shimmer-btn text-obsidian text-sm font-black">Save Customer</button>
          <div className="space-y-2 max-h-48 overflow-auto">
            {customers.map((customer) => (
              <div key={customer.customerId} className="flex justify-between text-sm glass rounded-xl px-3 py-2">
                <span>{customer.name}</span>
                <span className="text-white/35">{customer.phone}</span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Suppliers" icon={Truck}>
          <div className="grid sm:grid-cols-2 gap-2">
            <input className={inputClass} value={supplierName} onChange={(e) => setSupplierName(e.target.value)} placeholder="Supplier name" />
            <input className={inputClass} value={supplierPhone} onChange={(e) => setSupplierPhone(e.target.value)} placeholder="Phone" />
          </div>
          <button onClick={saveSupplier} className="px-4 py-2 rounded-xl shimmer-btn text-obsidian text-sm font-black">Save Supplier</button>
          <div className="space-y-2 max-h-48 overflow-auto">
            {suppliers.map((supplier) => (
              <div key={supplier.supplierId} className="flex justify-between text-sm glass rounded-xl px-3 py-2">
                <span>{supplier.name}</span>
                <span className="text-white/35">{supplier.phone}</span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Expenses" icon={HandCoins}>
          <div className="grid sm:grid-cols-3 gap-2">
            <input className={inputClass} value={expenseCategory} onChange={(e) => setExpenseCategory(e.target.value)} placeholder="Category" />
            <input className={inputClass} type="number" min="0" value={expenseAmount} onChange={(e) => setExpenseAmount(e.target.value)} placeholder="Amount" />
            <input className={inputClass} value={expenseNote} onChange={(e) => setExpenseNote(e.target.value)} placeholder="Note" />
          </div>
          <button onClick={saveExpense} className="px-4 py-2 rounded-xl shimmer-btn text-obsidian text-sm font-black">Record Expense</button>
          <div className="text-sm text-white/45">Total recorded: <strong className="text-metallic-gold">{formatCurrency(totalExpenses)}</strong></div>
        </Panel>

        <Panel title="Branch Transfers" icon={ArrowRightLeft}>
          <div className="grid sm:grid-cols-[1fr_100px] gap-2">
            <select className={inputClass} value={transferProductId} onChange={(e) => setTransferProductId(e.target.value)}>
              {products.map((product) => (
                <option key={product.productId} value={product.productId}>{product.name}</option>
              ))}
            </select>
            <input className={inputClass} type="number" min="1" value={transferQty} onChange={(e) => setTransferQty(e.target.value)} />
          </div>
          <button onClick={requestTransfer} className="px-4 py-2 rounded-xl shimmer-btn text-obsidian text-sm font-black">Request Transfer</button>
          <div className="space-y-2 max-h-48 overflow-auto">
            {transfers.map((transfer) => (
              <div key={transfer.transferId} className="flex justify-between text-sm glass rounded-xl px-3 py-2">
                <span>{transfer.quantity} x {transfer.productId}</span>
                <span className="text-white/35">{transfer.status}</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Panel title="Manager Approvals" icon={ShieldCheck}>
        <div className="space-y-2">
          {approvals.map((approval) => (
            <div key={approval.approvalId} className="flex flex-col md:flex-row md:items-center justify-between gap-3 glass rounded-xl px-3 py-3">
              <div>
                <div className="text-sm font-semibold">{approval.action}</div>
                <div className="text-xs text-white/35">{approval.entityType} · {approval.status}</div>
              </div>
              {approval.status === "pending" ? (
                <div className="flex gap-2">
                  <button onClick={() => resolveApproval(approval, "approved")} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 text-xs font-bold">
                    <CheckCircle2 className="w-3 h-3" /> Approve
                  </button>
                  <button onClick={() => resolveApproval(approval, "rejected")} className="px-3 py-1.5 rounded-lg bg-red-500/15 text-red-300 text-xs font-bold">Reject</button>
                </div>
              ) : (
                <span className="text-xs text-white/35">{approval.status}</span>
              )}
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
