"use client";

import { Check, Crown, CreditCard, Package, ShieldCheck, Zap } from "lucide-react";

const plans = [
  { name: "Solo", price: "Free", limit: "Up to 20 items", tone: "text-white", features: ["Single shop trial", "Barcode sales", "Receipt printing", "Basic inventory"] },
  { name: "Growth", price: "Paid", limit: "Up to 300 items", tone: "text-neon-cyan", features: ["3-level access control", "Cash shifts", "Reports", "Email receipts", "Cloud sync"] },
  { name: "Empire", price: "Premium", limit: "Unlimited scale", tone: "text-metallic-gold", features: ["Multi-branch operations", "Advanced approvals", "Audit controls", "Priority rollout support"] },
];

export default function SubscriptionPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div><h1 className="text-2xl font-black"><span className="gradient-text-cyan">Subscription</span></h1><p className="text-sm text-white/40 mt-0.5">Plan limits, billing readiness, and upgrade controls.</p></div>
      <section className="glass rounded-2xl border border-white/6 p-5">
        <div className="grid md:grid-cols-3 gap-4">
          <div className="glass rounded-xl border border-white/6 p-4"><Package className="w-5 h-5 text-neon-cyan mb-3" /><div className="text-xs text-white/35">Current Plan</div><div className="text-2xl font-black text-neon-cyan">Growth</div></div>
          <div className="glass rounded-xl border border-white/6 p-4"><Zap className="w-5 h-5 text-metallic-gold mb-3" /><div className="text-xs text-white/35">Product Limit</div><div className="text-2xl font-black">300 items</div></div>
          <div className="glass rounded-xl border border-white/6 p-4"><ShieldCheck className="w-5 h-5 text-emerald-400 mb-3" /><div className="text-xs text-white/35">Access Control</div><div className="text-2xl font-black">3 levels</div></div>
        </div>
      </section>
      <div className="grid lg:grid-cols-3 gap-4">
        {plans.map((plan) => (
          <section key={plan.name} className={`glass rounded-2xl border p-5 ${plan.name === "Growth" ? "border-neon-cyan/30" : "border-white/6"}`}>
            <div className="flex items-center justify-between mb-3"><h2 className={`text-xl font-black ${plan.tone}`}>{plan.name}</h2>{plan.name === "Growth" && <Crown className="w-5 h-5 text-metallic-gold" />}</div>
            <div className="text-3xl font-black">{plan.price}</div>
            <div className="text-sm text-white/40 mt-1">{plan.limit}</div>
            <div className="space-y-2 mt-5">
              {plan.features.map((feature) => <div key={feature} className="flex items-center gap-2 text-sm text-white/70"><Check className="w-4 h-4 text-emerald-400" />{feature}</div>)}
            </div>
            <button className={`mt-6 w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-black ${plan.name === "Growth" ? "shimmer-btn text-obsidian" : "bg-white/5 text-white border border-white/8"}`}><CreditCard className="w-4 h-4" />{plan.name === "Growth" ? "Active Plan" : "Switch Plan"}</button>
          </section>
        ))}
      </div>
    </div>
  );
}
