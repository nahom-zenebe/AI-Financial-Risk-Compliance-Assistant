import { clsx } from "clsx";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
}

export function Card({ children, className, glow }: CardProps) {
  return (
    <div
      className={clsx(
        "bg-slate-800/60 border border-slate-700/50 rounded-xl p-5 backdrop-blur-sm",
        glow && "shadow-lg shadow-indigo-900/20 border-indigo-700/20",
        className
      )}
    >
      {children}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  color?: "indigo" | "emerald" | "amber" | "rose";
}

const colorMap = {
  indigo: { bg: "bg-indigo-500/10", text: "text-indigo-400", border: "border-indigo-500/20" },
  emerald: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20" },
  amber: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20" },
  rose: { bg: "bg-rose-500/10", text: "text-rose-400", border: "border-rose-500/20" },
};

export function StatCard({ label, value, icon, trend, color = "indigo" }: StatCardProps) {
  const c = colorMap[color];
  return (
    <Card className={clsx("border", c.border)}>
      <div className="flex items-start justify-between mb-3">
        <div className={clsx("p-2 rounded-lg", c.bg, c.text)}>{icon}</div>
        {trend && <span className="text-xs text-slate-500">{trend}</span>}
      </div>
      <p className="text-2xl font-bold text-white mb-0.5">{value}</p>
      <p className="text-sm text-slate-400">{label}</p>
    </Card>
  );
}
