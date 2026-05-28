"use client";

import { useEffect, useState } from "react";
import { Mail, Phone, Search, UserPlus, Users } from "lucide-react";
import { db, seedDatabaseIfEmpty, type Customer } from "@/lib/db";
import { enqueueSync } from "@/lib/offline-sync";
import { formatCurrency, formatDate, generateId } from "@/lib/utils";

const inputClass = "w-full bg-white/5 border border-white/8 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-neon-cyan/30";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [query, setQuery] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const reload = async () => {
    await seedDatabaseIfEmpty();
    setCustomers(await db.customers.orderBy("createdAt").reverse().toArray());
  };

  useEffect(() => { void reload(); }, []);

  const saveCustomer = async () => {
    if (!name.trim()) return;
    const customer: Customer = {
      customerId: `cust_${generateId()}`,
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      loyaltyPoints: 0,
      totalSpend: 0,
      createdAt: Date.now(),
      synced_status: "pending",
    };
    await db.customers.add(customer);
    await enqueueSync({ entityType: "customer", entityId: customer.customerId, payload: customer });
    setName(""); setPhone(""); setEmail("");
    await reload();
  };

  const filtered = customers.filter((customer) => `${customer.name} ${customer.phone ?? ""} ${customer.email ?? ""}`.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div><h1 className="text-2xl font-black"><span className="gradient-text-cyan">Customers</span></h1><p className="text-sm text-white/40 mt-0.5">Customer profiles, loyalty, contact details, and spend history.</p></div>
      <section className="glass rounded-2xl border border-white/6 p-5">
        <div className="flex items-center gap-2 mb-4"><UserPlus className="w-5 h-5 text-neon-cyan" /><h2 className="font-bold">New Customer</h2></div>
        <div className="grid md:grid-cols-[1fr_180px_1fr_auto] gap-3">
          <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="Customer name" />
          <input className={inputClass} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" />
          <input className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
          <button onClick={saveCustomer} className="px-5 py-2.5 rounded-xl shimmer-btn text-obsidian text-sm font-black">Save</button>
        </div>
      </section>
      <section className="glass rounded-2xl border border-white/6 p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2"><Users className="w-5 h-5 text-neon-cyan" /><h2 className="font-bold">Customer List</h2></div>
          <div className="relative md:w-80"><Search className="w-4 h-4 absolute left-3 top-3 text-white/30" /><input className={`${inputClass} pl-9`} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search customers" /></div>
        </div>
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
          {filtered.map((customer) => (
            <div key={customer.customerId} className="glass rounded-xl border border-white/6 p-4">
              <div className="font-bold">{customer.name}</div>
              <div className="mt-3 space-y-1 text-xs text-white/40">
                <div className="flex items-center gap-2"><Phone className="w-3 h-3" />{customer.phone || "No phone"}</div>
                <div className="flex items-center gap-2"><Mail className="w-3 h-3" />{customer.email || "No email"}</div>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-4 text-sm">
                <div><div className="text-xs text-white/35">Spend</div><div className="font-black">{formatCurrency(customer.totalSpend)}</div></div>
                <div><div className="text-xs text-white/35">Joined</div><div className="font-black text-[11px]">{formatDate(customer.createdAt)}</div></div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && <div className="text-sm text-white/35">No customers found.</div>}
        </div>
      </section>
    </div>
  );
}
