"use client";

import { useState } from "react";
import { Mail, ReceiptText, Send } from "lucide-react";

const inputClass = "w-full bg-white/5 border border-white/8 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-neon-cyan/30";

export default function MessagesPage() {
  const [to, setTo] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState<"welcome" | "receipt">("welcome");
  const [status, setStatus] = useState("");
  const [sending, setSending] = useState(false);

  const sendTest = async () => {
    setSending(true);
    setStatus("");
    const response = await fetch("/api/messages/test", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ to, name, type }),
    });
    const result = await response.json().catch(() => null);
    setSending(false);
    setStatus(result?.ok ? `Email sent. Message ID: ${result.messageId ?? "accepted"}` : result?.error ?? "Email failed.");
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div><h1 className="text-2xl font-black"><span className="gradient-text-cyan">Messages</span></h1><p className="text-sm text-white/40 mt-0.5">Send and test BrAbel POS transactional emails through Brevo.</p></div>
      <section className="glass rounded-2xl border border-white/6 p-5">
        <div className="flex items-center gap-2 mb-4"><Send className="w-5 h-5 text-neon-cyan" /><h2 className="font-bold">Send Test Email</h2></div>
        <div className="grid md:grid-cols-2 gap-3">
          <input className={inputClass} value={to} onChange={(event) => setTo(event.target.value)} placeholder="Recipient email" />
          <input className={inputClass} value={name} onChange={(event) => setName(event.target.value)} placeholder="Recipient name" />
          <select className={inputClass} value={type} onChange={(event) => setType(event.target.value as "welcome" | "receipt")}>
            <option value="welcome">Welcome message</option>
            <option value="receipt">Receipt message</option>
          </select>
          <button disabled={sending} onClick={sendTest} className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl shimmer-btn text-obsidian text-sm font-black disabled:opacity-60"><Mail className="w-4 h-4" />{sending ? "Sending..." : "Send Email"}</button>
        </div>
        {status && <div className="mt-4 text-sm text-emerald-400">{status}</div>}
      </section>
      <div className="grid md:grid-cols-2 gap-4">
        <section className="glass rounded-2xl border border-white/6 p-5"><Mail className="w-5 h-5 text-neon-cyan mb-3" /><h2 className="font-bold">Welcome Email</h2><p className="text-sm text-white/40 mt-2">Used after signup, workspace activation, and onboarding.</p></section>
        <section className="glass rounded-2xl border border-white/6 p-5"><ReceiptText className="w-5 h-5 text-neon-cyan mb-3" /><h2 className="font-bold">Receipt Email</h2><p className="text-sm text-white/40 mt-2">Used after checkout when the customer wants an email receipt.</p></section>
      </div>
    </div>
  );
}
