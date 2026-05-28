"use client";

import { useEffect, useState } from "react";
import { ClipboardList, Search, ShieldCheck } from "lucide-react";
import { db, seedDatabaseIfEmpty, type AuditLog } from "@/lib/db";
import { formatDate } from "@/lib/utils";

const inputClass = "w-full bg-white/5 border border-white/8 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-neon-cyan/30";

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    void (async () => {
      await seedDatabaseIfEmpty();
      setLogs(await db.auditLogs.orderBy("createdAt").reverse().toArray());
    })();
  }, []);

  const filtered = logs.filter((log) => `${log.actorId} ${log.action} ${log.entityType} ${log.entityId}`.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div><h1 className="text-2xl font-black"><span className="gradient-text-cyan">Audit</span> Logs</h1><p className="text-sm text-white/40 mt-0.5">Trace staff actions, approvals, stock changes, refunds, expenses, and sync-sensitive events.</p></div>
      <section className="glass rounded-2xl border border-white/6 p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2"><ClipboardList className="w-5 h-5 text-neon-cyan" /><h2 className="font-bold">Event Trail</h2></div>
          <div className="relative md:w-96"><Search className="w-4 h-4 absolute left-3 top-3 text-white/30" /><input className={`${inputClass} pl-9`} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search logs" /></div>
        </div>
        <div className="space-y-2">
          {filtered.map((log) => (
            <div key={log.auditId} className="grid md:grid-cols-[180px_180px_1fr_160px] gap-3 glass rounded-xl px-4 py-3 text-sm">
              <span className="font-bold text-neon-cyan">{log.action}</span>
              <span className="text-white/55">{log.actorId}</span>
              <span className="text-white/40">{log.entityType} / {log.entityId}</span>
              <span className="text-white/35">{formatDate(log.createdAt)}</span>
            </div>
          ))}
          {filtered.length === 0 && <div className="glass rounded-xl px-4 py-8 text-center text-sm text-white/35"><ShieldCheck className="w-8 h-8 text-neon-cyan mx-auto mb-2" />No audit events yet.</div>}
        </div>
      </section>
    </div>
  );
}
