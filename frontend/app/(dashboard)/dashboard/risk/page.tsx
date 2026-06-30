"use client";
import { useEffect, useState } from "react";
import {
  AlertTriangle, Shield, TrendingUp, Send,
  DollarSign, Globe, User, ArrowRight, CheckCircle,
  RefreshCw, History,
} from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RiskBadge } from "@/components/ui/badge";
import { useAuthStore } from "@/store/auth-store";
import api from "@/lib/axios";
import { clsx } from "clsx";

interface RiskResult {
  transaction_id: number;
  risk_level: string;
  risk_score: number;
  explanation: string;
  flags: string[];
  recommendations: string[];
}

interface TxRecord {
  id: number;
  amount: number;
  currency: string;
  sender: string;
  receiver: string;
  country: string;
  risk_level: string;
  risk_score: number;
  created_at: string;
}

const RISK_COLORS = {
  HIGH:   { bg: "bg-rose-500/10", border: "border-rose-500/30", text: "text-rose-400", bar: "bg-rose-500" },
  MEDIUM: { bg: "bg-amber-500/10", border: "border-amber-500/30", text: "text-amber-400", bar: "bg-amber-500" },
  LOW:    { bg: "bg-emerald-500/10", border: "border-emerald-500/30", text: "text-emerald-400", bar: "bg-emerald-500" },
};

export default function RiskPage() {
  const { hydrate } = useAuthStore();
  const [form, setForm] = useState({ amount: "", currency: "USD", sender: "", receiver: "", country: "", transaction_type: "wire_transfer", description: "" });
  const [result, setResult] = useState<RiskResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<TxRecord[]>([]);
  const [histLoading, setHistLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    hydrate();
    api.get("/risk/transactions?limit=10")
      .then((r) => setHistory(r.data.transactions))
      .finally(() => setHistLoading(false));
  }, []);

  const update = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const payload = { ...form, amount: parseFloat(form.amount) };
      const res = await api.post("/risk/analyze", payload);
      setResult(res.data);
      // refresh history
      const hist = await api.get("/risk/transactions?limit=10");
      setHistory(hist.data.transactions);
    } catch (err: any) {
      setError(err.response?.data?.detail ?? "Analysis failed. Please check inputs.");
    } finally {
      setLoading(false);
    }
  };

  const rc = result ? RISK_COLORS[result.risk_level as keyof typeof RISK_COLORS] ?? RISK_COLORS.LOW : null;

  return (
    <div className="flex flex-col min-h-full">
      <Navbar title="Risk Analysis" subtitle="AML transaction scoring and compliance screening" />

      <div className="flex-1 p-6 space-y-5">
        <div className="grid lg:grid-cols-2 gap-5">
          {/* Analysis form */}
          <Card>
            <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <Shield className="w-4 h-4 text-indigo-400" />
              Transaction Details
            </h2>
            {error && (
              <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-xs text-rose-400">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Input label="Amount" type="number" placeholder="10000" value={form.amount}
                  onChange={update("amount")} icon={<DollarSign className="w-4 h-4" />} required min="0" step="0.01" />
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-slate-300">Currency</label>
                  <select value={form.currency} onChange={update("currency")}
                    className="bg-slate-800/60 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/50">
                    {["USD","EUR","GBP","JPY","CHF","AED","CNY"].map((c) => (
                      <option key={c} value={c} className="bg-slate-800">{c}</option>
                    ))}
                  </select>
                </div>
              </div>
              <Input label="Sender" placeholder="Alice Corporation" value={form.sender}
                onChange={update("sender")} icon={<User className="w-4 h-4" />} required />
              <Input label="Receiver" placeholder="Bob Limited" value={form.receiver}
                onChange={update("receiver")} icon={<User className="w-4 h-4" />} required />
              <Input label="Country" placeholder="Germany" value={form.country}
                onChange={update("country")} icon={<Globe className="w-4 h-4" />} required />
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-300">Transaction Type</label>
                <select value={form.transaction_type} onChange={update("transaction_type")}
                  className="bg-slate-800/60 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/50">
                  {["wire_transfer","cash","check","crypto","ach","swift"].map((t) => (
                    <option key={t} value={t} className="bg-slate-800">{t.replace("_"," ").toUpperCase()}</option>
                  ))}
                </select>
              </div>
              <Button type="submit" loading={loading} className="w-full">
                <Send className="w-4 h-4" />
                Analyze Transaction
              </Button>
            </form>
          </Card>

          {/* Result panel */}
          <div className="space-y-4">
            {result && rc ? (
              <>
                <Card className={clsx("border", rc.border, rc.bg)}>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-semibold text-white">Risk Assessment</h2>
                    <RiskBadge level={result.risk_level} />
                  </div>
                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                      <span>Risk Score</span>
                      <span className={clsx("font-mono font-bold", rc.text)}>
                        {result.risk_score.toFixed(3)}
                      </span>
                    </div>
                    <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                      <div className={clsx("h-full rounded-full transition-all duration-700", rc.bar)}
                        style={{ width: `${result.risk_score * 100}%` }} />
                    </div>
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed">{result.explanation}</p>
                </Card>

                {result.flags.length > 0 && (
                  <Card>
                    <h3 className="text-xs font-semibold text-rose-400 mb-3 flex items-center gap-2">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Risk Flags Triggered
                    </h3>
                    <div className="space-y-1.5">
                      {result.flags.map((flag, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-slate-300 bg-rose-500/5 border border-rose-500/10 rounded-lg p-2">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                          {flag.replace(/_/g, " ")}
                        </div>
                      ))}
                    </div>
                  </Card>
                )}

                <Card>
                  <h3 className="text-xs font-semibold text-emerald-400 mb-3 flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Recommended Actions
                  </h3>
                  <div className="space-y-1.5">
                    {result.recommendations.map((r, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-slate-300">
                        <ArrowRight className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                        {r}
                      </div>
                    ))}
                  </div>
                </Card>
              </>
            ) : (
              <Card className="h-64 flex flex-col items-center justify-center text-center">
                <TrendingUp className="w-10 h-10 text-slate-700 mb-3" />
                <p className="text-sm text-slate-500">Fill in transaction details</p>
                <p className="text-xs text-slate-600 mt-1">and click Analyze to see risk assessment</p>
              </Card>
            )}
          </div>
        </div>

        {/* Transaction history */}
        <Card>
          <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <History className="w-4 h-4 text-indigo-400" />
            Recent Transactions
          </h2>
          {histLoading ? (
            <div className="space-y-2">
              {[1,2,3].map((i) => <div key={i} className="h-10 bg-slate-700/30 rounded animate-pulse" />)}
            </div>
          ) : history.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8">No transactions analyzed yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-slate-500 border-b border-slate-700/50">
                    <th className="text-left py-2 pr-4 font-medium">Amount</th>
                    <th className="text-left py-2 pr-4 font-medium">Sender → Receiver</th>
                    <th className="text-left py-2 pr-4 font-medium">Country</th>
                    <th className="text-left py-2 pr-4 font-medium">Risk Level</th>
                    <th className="text-left py-2 pr-4 font-medium">Score</th>
                    <th className="text-left py-2 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/30">
                  {history.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-700/20 transition-colors">
                      <td className="py-2.5 pr-4 text-white font-medium">
                        {tx.currency} {tx.amount?.toLocaleString()}
                      </td>
                      <td className="py-2.5 pr-4 text-slate-400 text-xs">
                        <span className="text-slate-300">{tx.sender}</span>
                        <span className="text-slate-600 mx-1">→</span>
                        {tx.receiver}
                      </td>
                      <td className="py-2.5 pr-4 text-slate-400 text-xs">{tx.country}</td>
                      <td className="py-2.5 pr-4"><RiskBadge level={tx.risk_level ?? "LOW"} /></td>
                      <td className="py-2.5 pr-4 font-mono text-xs text-slate-300">
                        {tx.risk_score?.toFixed(3)}
                      </td>
                      <td className="py-2.5 text-slate-500 text-xs">
                        {new Date(tx.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
