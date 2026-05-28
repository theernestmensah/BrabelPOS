"use client";

import { useEffect, useState } from "react";
import { Crown, ShieldCheck, UserPlus, Users } from "lucide-react";
import { db, seedDatabaseIfEmpty, type StaffMember } from "@/lib/db";
import { roleDescriptions, roleLabels, rolePermissions, type AccessRole } from "@/lib/access-control";
import { formatCurrency, generateId } from "@/lib/utils";

const inputClass = "w-full bg-white/5 border border-white/8 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-neon-cyan/30";

export default function StaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [name, setName] = useState("");
  const [role, setRole] = useState<AccessRole>("cashier");

  const reload = async () => {
    await seedDatabaseIfEmpty();
    setStaff(await db.staff.orderBy("totalRevenue").reverse().toArray());
  };

  useEffect(() => { void reload(); }, []);

  const addStaff = async () => {
    if (!name.trim()) return;
    await db.staff.add({
      staffId: `staff_${generateId()}`,
      name: name.trim(),
      role,
      totalSales: 0,
      totalRevenue: 0,
      badge: "⭐",
    });
    setName("");
    setRole("cashier");
    await reload();
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black"><span className="gradient-text-cyan">Staff</span> Control</h1>
        <p className="text-sm text-white/40 mt-0.5">Invite workers, assign roles, and review sales performance.</p>
      </div>

      <section className="glass rounded-2xl border border-white/6 p-5">
        <div className="flex items-center gap-2 mb-4"><UserPlus className="w-5 h-5 text-neon-cyan" /><h2 className="font-bold">Add Staff Member</h2></div>
        <div className="grid md:grid-cols-[1fr_180px_auto] gap-3">
          <input className={inputClass} value={name} onChange={(event) => setName(event.target.value)} placeholder="Staff full name" />
          <select className={inputClass} value={role} onChange={(event) => setRole(event.target.value as AccessRole)}>
            <option value="cashier">Cashier</option>
            <option value="manager">Manager</option>
            <option value="owner">Owner</option>
          </select>
          <button onClick={addStaff} className="px-5 py-2.5 rounded-xl shimmer-btn text-obsidian text-sm font-black">Add Staff</button>
        </div>
      </section>

      <div className="grid lg:grid-cols-3 gap-4">
        {(["owner", "manager", "cashier"] as AccessRole[]).map((accessRole) => (
          <section key={accessRole} className="glass rounded-2xl border border-white/6 p-5">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-neon-cyan" /><h2 className="font-bold">{roleLabels[accessRole]}</h2></div>
              {accessRole === "owner" && <Crown className="w-4 h-4 text-metallic-gold" />}
            </div>
            <p className="text-xs text-white/40 min-h-10">{roleDescriptions[accessRole]}</p>
            <div className="flex flex-wrap gap-1.5 mt-4">
              {rolePermissions[accessRole].map((permission) => (
                <span key={permission} className="px-2 py-0.5 rounded-full bg-white/5 border border-white/8 text-[10px] text-white/45">{permission}</span>
              ))}
            </div>
          </section>
        ))}
      </div>

      <section className="glass rounded-2xl border border-white/6 p-5">
        <div className="flex items-center gap-2 mb-4"><Users className="w-5 h-5 text-neon-cyan" /><h2 className="font-bold">Team Directory</h2></div>
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
          {staff.map((member) => (
            <div key={member.staffId} className="glass rounded-xl border border-white/6 p-4">
              <div className="flex justify-between gap-3"><div className="font-bold">{member.name}</div><span className="text-xs text-neon-cyan font-bold">{String(member.role).toUpperCase()}</span></div>
              <div className="grid grid-cols-2 gap-2 mt-4 text-sm">
                <div><div className="text-xs text-white/35">Sales</div><div className="font-black">{member.totalSales}</div></div>
                <div><div className="text-xs text-white/35">Revenue</div><div className="font-black text-metallic-gold">{formatCurrency(member.totalRevenue)}</div></div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
