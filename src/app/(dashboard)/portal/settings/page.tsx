"use client";

import { motion } from "framer-motion";
import {
  Settings,
  User,
  Bell,
  Shield,
  Globe,
  Palette,
  Check,
  Banknote,
  Lock,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { closeShift, getOpenShift } from "@/lib/cash-shifts";
import { getTerminalId, syncPendingOperations } from "@/lib/offline-sync";
import { formatCurrency } from "@/lib/utils";
import type { CashShift } from "@/lib/db";
import {
  roleDescriptions,
  roleLabels,
  rolePermissions,
  type AccessRole,
} from "@/lib/access-control";

function SettingsSection({
  title,
  icon: Icon,
  children,
  delay = 0,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="glass rounded-2xl border border-white/6 overflow-hidden"
    >
      <div className="flex items-center gap-3 px-5 py-4 border-b border-white/5">
        <Icon className="w-5 h-5 text-neon-cyan" />
        <h2 className="font-bold text-base">{title}</h2>
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </motion.div>
  );
}

function Toggle({ label, sub, defaultOn = false }: { label: string; sub?: string; defaultOn?: boolean }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <div className="flex items-center justify-between">
      <div>
        <div className="text-sm text-white/80">{label}</div>
        {sub && <div className="text-xs text-white/30">{sub}</div>}
      </div>
      <button
        onClick={() => setOn(!on)}
        className={`relative w-11 h-6 rounded-full transition-smooth ${
          on ? "bg-neon-cyan/80" : "bg-white/10"
        }`}
      >
        <div
          className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-smooth ${
            on ? "left-5" : "left-0.5"
          }`}
        />
      </button>
    </div>
  );
}

export default function SettingsPage() {
  const [saved, setSaved] = useState(false);
  const [openShift, setOpenShift] = useState<CashShift | undefined>();
  const [countedCash, setCountedCash] = useState("");
  const [closeNote, setCloseNote] = useState("");
  const [closeMessage, setCloseMessage] = useState("");

  useEffect(() => {
    void getOpenShift({
      terminalId: getTerminalId(),
      cashierId: "staff_admin",
    }).then((shift) => {
      setOpenShift(shift);
      if (shift) setCountedCash(String(shift.expectedCash));
    });
  }, []);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleCloseShift = async () => {
    if (!openShift) return;
    const amount = Number(countedCash);
    const closed = await closeShift({
      shiftId: openShift.shiftId,
      countedCash: Number.isFinite(amount) ? amount : 0,
      note: closeNote,
    });
    setOpenShift(undefined);
    setCloseMessage(
      `Shift closed. Variance: ${formatCurrency(closed.variance ?? 0)}`
    );
    void syncPendingOperations();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-black">
          <span className="gradient-text-cyan">Portal</span> Settings
        </h1>
        <p className="text-white/40 text-sm mt-0.5">Manage your BrAbelPOS configuration</p>
      </motion.div>

      <SettingsSection title="Business Profile" icon={User} delay={0.1}>
        <div className="space-y-3">
          {[
            { label: "Business Name", placeholder: "BrAbel Luxury Retail" },
            { label: "Location / Branch", placeholder: "Accra, Greater Accra" },
            { label: "Cashier Name", placeholder: "Admin" },
            { label: "GRA TIN Number", placeholder: "C000123456789" },
          ].map(({ label, placeholder }) => (
            <div key={label}>
              <label className="text-xs text-white/40 mb-1 block">{label}</label>
              <input
                type="text"
                placeholder={placeholder}
                className="w-full bg-white/5 border border-white/8 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-neon-cyan/30 transition-smooth"
              />
            </div>
          ))}
        </div>
      </SettingsSection>

      <SettingsSection title="Notifications" icon={Bell} delay={0.15}>
        <Toggle label="Low stock alerts" sub="Notify when items fall below 10 units" defaultOn={true} />
        <Toggle label="Daily revenue summary" sub="End-of-day report via email" defaultOn={true} />
        <Toggle label="Sync failure alerts" sub="Alert when offline sales fail to sync" />
      </SettingsSection>

      <SettingsSection title="Sync & Connectivity" icon={Globe} delay={0.2}>
        <Toggle label="Auto-sync when online" sub="Instantly push offline sales to cloud" defaultOn={true} />
        <Toggle label="Background sync" sub="Sync even when the app is minimised" defaultOn={true} />
        <Toggle label="Conflict resolution" sub="Auto-resolve multi-branch data conflicts" />
      </SettingsSection>

      <SettingsSection title="Security" icon={Shield} delay={0.25}>
        <Toggle label="PIN lock terminal" sub="Require PIN after 5 minutes of inactivity" />
        <Toggle label="Receipt encryption" sub="Encrypt stored sale receipts" defaultOn={true} />
        <Toggle label="Audit logging" sub="Log all staff actions for compliance" defaultOn={true} />
      </SettingsSection>

      <SettingsSection title="Access Control" icon={Users} delay={0.26}>
        <div className="grid gap-3">
          {(["owner", "manager", "cashier"] as AccessRole[]).map((role) => (
            <div
              key={role}
              className="glass rounded-xl border border-white/6 p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="font-bold text-white/90">
                    {roleLabels[role]}
                  </div>
                  <div className="text-xs text-white/40 mt-0.5">
                    {roleDescriptions[role]}
                  </div>
                </div>
                <div className="text-xs text-neon-cyan font-bold">
                  {rolePermissions[role].length} permissions
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {rolePermissions[role].map((permission) => (
                  <span
                    key={permission}
                    className="px-2 py-0.5 rounded-full bg-white/5 border border-white/8 text-[10px] text-white/45"
                  >
                    {permission}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </SettingsSection>

      <SettingsSection title="Cash Drawer Shift" icon={Banknote} delay={0.28}>
        {openShift ? (
          <div className="space-y-4">
            <div className="grid sm:grid-cols-3 gap-3">
              <div className="glass rounded-xl p-3">
                <div className="text-xs text-white/35">Opening Float</div>
                <div className="text-lg font-black text-white">
                  {formatCurrency(openShift.openingFloat)}
                </div>
              </div>
              <div className="glass rounded-xl p-3">
                <div className="text-xs text-white/35">Cash Sales</div>
                <div className="text-lg font-black text-emerald-400">
                  {formatCurrency(openShift.cashSales)}
                </div>
              </div>
              <div className="glass rounded-xl p-3">
                <div className="text-xs text-white/35">Expected Cash</div>
                <div className="text-lg font-black text-metallic-gold">
                  {formatCurrency(openShift.expectedCash)}
                </div>
              </div>
            </div>
            <div>
              <label className="text-xs text-white/40 mb-1 block">
                Counted Cash
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={countedCash}
                onChange={(e) => setCountedCash(e.target.value)}
                className="w-full bg-white/5 border border-white/8 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-neon-cyan/30 transition-smooth"
              />
            </div>
            <div>
              <label className="text-xs text-white/40 mb-1 block">
                Close Note
              </label>
              <input
                type="text"
                value={closeNote}
                onChange={(e) => setCloseNote(e.target.value)}
                placeholder="Optional manager note"
                className="w-full bg-white/5 border border-white/8 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-neon-cyan/30 transition-smooth"
              />
            </div>
            <button
              onClick={handleCloseShift}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-red-500/15 border border-red-500/25 text-red-300 text-sm font-bold hover:bg-red-500/20 transition-smooth"
            >
              <Lock className="w-4 h-4" />
              Close Shift
            </button>
          </div>
        ) : (
          <div className="text-sm text-white/45">
            No open shift on this terminal. Open one from the POS terminal.
          </div>
        )}
        {closeMessage && (
          <div className="text-xs text-emerald-400">{closeMessage}</div>
        )}
      </SettingsSection>

      <SettingsSection title="Appearance" icon={Palette} delay={0.3}>
        <div>
          <label className="text-xs text-white/40 mb-2 block">Currency</label>
          <select className="w-full bg-white/5 border border-white/8 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-neon-cyan/30 transition-smooth">
            <option value="GHS">Ghana Cedi (GHS ₵)</option>
            <option value="USD">US Dollar (USD $)</option>
            <option value="NGN">Nigerian Naira (NGN ₦)</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-white/40 mb-2 block">VAT Rate</label>
          <select className="w-full bg-white/5 border border-white/8 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-neon-cyan/30 transition-smooth">
            <option value="12.5">12.5% (Ghana standard)</option>
            <option value="0">0% (VAT exempt)</option>
            <option value="15">15%</option>
          </select>
        </div>
      </SettingsSection>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35 }}
        className="flex justify-end"
      >
        <button
          onClick={handleSave}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-smooth hover:scale-105 ${
            saved
              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
              : "shimmer-btn text-obsidian"
          }`}
        >
          {saved ? (
            <>
              <Check className="w-4 h-4" />
              Saved!
            </>
          ) : (
            <>
              <Settings className="w-4 h-4" />
              Save Settings
            </>
          )}
        </button>
      </motion.div>
    </div>
  );
}
