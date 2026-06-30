"use client";
import { useEffect, useState } from "react";
import {
  FileDown, BarChart3, FileText, Table2,
  Download, RefreshCw, Shield, AlertTriangle,
} from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth-store";
import api from "@/lib/axios";

interface Stats {
  documents: { total: number; processed: number };
  transactions: { total: number; high_risk: number; average_risk_score: number };
}

export default function ReportsPage() {
  const { hydrate } = useAuthStore();
  const [stats, setStats] = useState<Stats | null>(null);
  const [downloading, setDownloading] = useState<"pdf" | "csv" | null>(null);

  useEffect(() => {
    hydrate();
    api.get("/dashboard/stats").then((r) => setStats(r.data)).catch(console.error);
  }, []);

  const downloadFile = async (type: "pdf" | "csv") => {
    setDownloading(type);
    try {
      const res = await api.get(`/reports/${type}`, { responseType: "blob" });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = `compliance_report_${new Date().toISOString().slice(0,10)}.${type}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download failed", err);
    } finally {
      setDownloading(null);
    }
  };

  const reports = [
    {
      id: "pdf",
      title: "Compliance & Risk PDF Report",
      description: "Full executive compliance report including transaction risk analysis, document summary, high-risk transactions table, and AI insights. Generated in real-time.",
      icon: <FileText className="w-5 h-5" />,
      color: "indigo" as const,
      badge: "PDF",
      badgeColor: "bg-rose-500/10 text-rose-400 border border-rose-500/20",
    },
    {
      id: "csv",
      title: "Transaction Export CSV",
      description: "Comma-separated export of all analyzed transactions including amount, parties, risk level, risk score, AML flags, and timestamps. Compatible with Excel.",
      icon: <Table2 className="w-5 h-5" />,
      color: "emerald" as const,
      badge: "CSV",
      badgeColor: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
    },
  ];

  return (
    <div className="flex flex-col min-h-full">
      <Navbar title="Reports" subtitle="Generate and download compliance reports" />

      <div className="flex-1 p-6 space-y-5">
        {/* Summary strip */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: "Total Documents", value: stats.documents.total, icon: <FileText className="w-4 h-4" />, color: "text-indigo-400" },
              { label: "Processed", value: stats.documents.processed, icon: <Shield className="w-4 h-4" />, color: "text-emerald-400" },
              { label: "Transactions", value: stats.transactions.total, icon: <BarChart3 className="w-4 h-4" />, color: "text-amber-400" },
              { label: "High Risk", value: stats.transactions.high_risk, icon: <AlertTriangle className="w-4 h-4" />, color: "text-rose-400" },
            ].map(({ label, value, icon, color }) => (
              <div key={label} className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4">
                <div className={`mb-2 ${color}`}>{icon}</div>
                <p className="text-xl font-bold text-white">{value}</p>
                <p className="text-xs text-slate-500">{label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Report cards */}
        <div className="grid lg:grid-cols-2 gap-5">
          {reports.map((report) => (
            <Card key={report.id} className="flex flex-col">
              <div className="flex items-start gap-4 mb-4">
                <div className={`p-3 rounded-xl ${
                  report.color === "indigo"
                    ? "bg-indigo-600/10 border border-indigo-600/20 text-indigo-400"
                    : "bg-emerald-600/10 border border-emerald-600/20 text-emerald-400"
                }`}>
                  {report.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-semibold text-white">{report.title}</h3>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${report.badgeColor}`}>
                      {report.badge}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{report.description}</p>
                </div>
              </div>

              <div className="mt-auto pt-4 border-t border-slate-700/50">
                <Button
                  onClick={() => downloadFile(report.id as "pdf" | "csv")}
                  loading={downloading === report.id}
                  variant={report.color === "indigo" ? "primary" : "secondary"}
                  className="w-full"
                >
                  {downloading === report.id
                    ? <RefreshCw className="w-4 h-4 animate-spin" />
                    : <Download className="w-4 h-4" />
                  }
                  Download {report.badge} Report
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {/* How it works */}
        <Card>
          <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-indigo-400" />
            What&apos;s included in each report
          </h2>
          <div className="grid lg:grid-cols-2 gap-6">
            {[
              {
                title: "PDF Report includes:",
                items: [
                  "Executive summary with key metrics",
                  "Document inventory and processing status",
                  "Transaction risk analysis table (top 20)",
                  "High-risk transaction highlights",
                  "Risk score distribution",
                  "Compliance score overview",
                ],
              },
              {
                title: "CSV Export includes:",
                items: [
                  "All analyzed transactions",
                  "Transaction amount, currency, parties",
                  "Risk level (LOW/MEDIUM/HIGH)",
                  "Numeric risk score (0.000–1.000)",
                  "AML flags triggered",
                  "Analysis timestamp",
                ],
              },
            ].map(({ title, items }) => (
              <div key={title}>
                <h3 className="text-xs font-semibold text-slate-300 mb-3">{title}</h3>
                <ul className="space-y-2">
                  {items.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-xs text-slate-400">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
