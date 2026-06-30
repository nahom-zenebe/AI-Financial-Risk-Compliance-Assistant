"use client";
import { useEffect, useState } from "react";
import {
  FileText, AlertTriangle, ShieldCheck, Activity,
  TrendingUp, Clock, ChevronRight, ArrowUpRight,
} from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Card, StatCard } from "@/components/ui/card";
import { RiskBadge, StatusBadge } from "@/components/ui/badge";
import { useAuthStore } from "@/store/auth-store";
import api from "@/lib/axios";

interface Stats {
  documents: { total: number; processed: number; pending: number };
  transactions: { total: number; high_risk: number; medium_risk: number; low_risk: number; average_risk_score: number };
  knowledge_base: { total_chunks: number };
  recent_uploads: any[];
  recent_high_risk_transactions: any[];
}

export default function DashboardPage() {
  const { user, hydrate } = useAuthStore();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { hydrate(); }, []);

  useEffect(() => {
    api.get("/dashboard/stats")
      .then((r) => setStats(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const complianceScore = stats
    ? Math.round(100 - (stats.transactions.high_risk / Math.max(stats.transactions.total, 1)) * 100)
    : 0;

  return (
    <div className="flex flex-col min-h-full">
      <Navbar title="Dashboard" subtitle={`Welcome back, ${user?.full_name?.split(" ")[0] ?? "User"}`} />

      <div className="flex-1 p-6 space-y-6">
        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Documents" value={loading ? "—" : stats?.documents.total ?? 0}
            icon={<FileText className="w-4 h-4" />} color="indigo"
            trend={`${stats?.documents.processed ?? 0} processed`} />
          <StatCard label="High-Risk Transactions" value={loading ? "—" : stats?.transactions.high_risk ?? 0}
            icon={<AlertTriangle className="w-4 h-4" />} color="rose"
            trend={`of ${stats?.transactions.total ?? 0} total`} />
          <StatCard label="Compliance Score" value={loading ? "—" : `${complianceScore}%`}
            icon={<ShieldCheck className="w-4 h-4" />} color="emerald" />
          <StatCard label="KB Chunks" value={loading ? "—" : stats?.knowledge_base.total_chunks ?? 0}
            icon={<Activity className="w-4 h-4" />} color="amber" trend="Vector store" />
        </div>

        {/* Risk distribution */}
        {stats && stats.transactions.total > 0 && (
          <Card>
            <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-400" />
              Transaction Risk Distribution
            </h2>
            <div className="space-y-3">
              {[
                { label: "High Risk", count: stats.transactions.high_risk, total: stats.transactions.total, color: "bg-rose-500" },
                { label: "Medium Risk", count: stats.transactions.medium_risk, total: stats.transactions.total, color: "bg-amber-500" },
                { label: "Low Risk", count: stats.transactions.low_risk, total: stats.transactions.total, color: "bg-emerald-500" },
              ].map(({ label, count, total, color }) => {
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                return (
                  <div key={label}>
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                      <span>{label}</span>
                      <span>{count} ({pct}%)</span>
                    </div>
                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-slate-500 mt-3">
              Avg risk score: <span className="text-slate-300 font-medium">{stats.transactions.average_risk_score.toFixed(3)}</span>
            </p>
          </Card>
        )}

        <div className="grid lg:grid-cols-2 gap-4">
          {/* Recent uploads */}
          <Card>
            <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-400" />
              Recent Uploads
            </h2>
            {!stats?.recent_uploads?.length ? (
              <div className="text-center py-8">
                <FileText className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-sm text-slate-500">No documents uploaded yet</p>
                <a href="/dashboard/documents" className="text-xs text-indigo-400 hover:underline mt-1 inline-block">
                  Upload your first document →
                </a>
              </div>
            ) : (
              <div className="space-y-2">
                {stats.recent_uploads.map((doc) => (
                  <div key={doc.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-700/30 transition-colors">
                    <div className="w-8 h-8 bg-indigo-600/10 border border-indigo-600/20 rounded-lg flex items-center justify-center">
                      <FileText className="w-3.5 h-3.5 text-indigo-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{doc.filename}</p>
                      <p className="text-xs text-slate-500">{doc.category} · {new Date(doc.created_at).toLocaleDateString()}</p>
                    </div>
                    <StatusBadge status={doc.status} />
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* High-risk transactions */}
          <Card>
            <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              High-Risk Transactions
            </h2>
            {!stats?.recent_high_risk_transactions?.length ? (
              <div className="text-center py-8">
                <ShieldCheck className="w-8 h-8 text-emerald-600/40 mx-auto mb-2" />
                <p className="text-sm text-slate-500">No high-risk transactions</p>
                <p className="text-xs text-slate-600 mt-1">All clear ✓</p>
              </div>
            ) : (
              <div className="space-y-2">
                {stats.recent_high_risk_transactions.map((tx) => (
                  <div key={tx.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-700/30 transition-colors">
                    <div className="w-8 h-8 bg-rose-500/10 border border-rose-500/20 rounded-lg flex items-center justify-center">
                      <ArrowUpRight className="w-3.5 h-3.5 text-rose-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white">{tx.currency} {tx.amount?.toLocaleString()}</p>
                      <p className="text-xs text-slate-500 truncate">{tx.sender} → {tx.country}</p>
                    </div>
                    <span className="text-xs font-mono text-rose-400">{tx.risk_score?.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
