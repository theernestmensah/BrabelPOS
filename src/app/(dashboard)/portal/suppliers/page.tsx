"use client";

import { useEffect, useState } from "react";
import { Mail, Phone, Search, Truck, UserRound } from "lucide-react";
import { db, seedDatabaseIfEmpty, type Supplier } from "@/lib/db";
import { enqueueSync } from "@/lib/offline-sync";
import { formatDate, generateId } from "@/lib/utils";

const inputClass = "w-full bg-white/5 border border-white/8 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-neon-cyan/30";

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [query, setQuery] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [contactPerson, setContactPerson] = useState("");

  const reload = async () => {
    await seedDatabaseIfEmpty();
    setSuppliers(await db.suppliers.orderBy("createdAt").reverse().toArray());
  };

  useEffect(() => { void reload(); }, []);

  const saveSupplier = async () => {
    if (!name.trim()) return;
    const supplier: Supplier = {
      supplierId: `supp_${generateId()}`,
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      contactPerson: contactPerson.trim(),
      createdAt: Date.now(),
      synced_status: "pending",
    };
    await db.suppliers.add(supplier);
    await enqueueSync({ entityType: "supplier", entityId: supplier.supplierId, payload: supplier });
    setName(""); setPhone(""); setEmail(""); setContactPerson("");
    await reload();
  };

  const filtered = suppliers.filter((supplier) => `${supplier.name} ${supplier.phone ?? ""} ${supplier.email ?? ""} ${supplier.contactPerson ?? ""}`.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div><h1 className="text-2xl font-black"><span className="gradient-text-cyan">Suppliers</span></h1><p className="text-sm text-white/40 mt-0.5">Supplier contacts for purchasing, restocking, and trade relationships.</p></div>
      <section className="glass rounded-2xl border border-white/6 p-5">
        <div className="flex items-center gap-2 mb-4"><Truck className="w-5 h-5 text-neon-cyan" /><h2 className="font-bold">New Supplier</h2></div>
        <div className="grid md:grid-cols-5 gap-3">
          <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="Supplier name" />
          <input className={inputClass} value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} placeholder="Contact person" />
          <input className={inputClass} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" />
          <input className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
          <button onClick={saveSupplier} className="px-5 py-2.5 rounded-xl shimmer-btn text-obsidian text-sm font-black">Save</button>
        </div>
      </section>
      <section className="glass rounded-2xl border border-white/6 p-5">
        <div className="relative mb-4 md:w-96"><Search className="w-4 h-4 absolute left-3 top-3 text-white/30" /><input className={`${inputClass} pl-9`} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search suppliers" /></div>
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
          {filtered.map((supplier) => (
            <div key={supplier.supplierId} className="glass rounded-xl border border-white/6 p-4">
              <div className="font-bold">{supplier.name}</div>
              <div className="mt-3 space-y-1 text-xs text-white/40">
                <div className="flex items-center gap-2"><UserRound className="w-3 h-3" />{supplier.contactPerson || "No contact person"}</div>
                <div className="flex items-center gap-2"><Phone className="w-3 h-3" />{supplier.phone || "No phone"}</div>
                <div className="flex items-center gap-2"><Mail className="w-3 h-3" />{supplier.email || "No email"}</div>
              </div>
              <div className="text-xs text-white/30 mt-4">Added {formatDate(supplier.createdAt)}</div>
            </div>
          ))}
          {filtered.length === 0 && <div className="text-sm text-white/35">No suppliers found.</div>}
        </div>
      </section>
    </div>
  );
}
