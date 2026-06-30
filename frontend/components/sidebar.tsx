"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, FileText, MessageSquare, AlertTriangle,
  BarChart3, LogOut, Shield, ChevronRight,
} from "lucide-react";
import { clsx } from "clsx";
import { useAuthStore } from "@/store/auth-store";

const navItems = [
  { href: "/dashboard",          label: "Dashboard",  icon: LayoutDashboard },
  { href: "/dashboard/documents",label: "Documents",  icon: FileText },
  { href: "/dashboard/chat",     label: "AI Chat",    icon: MessageSquare },
  { href: "/dashboard/risk",     label: "Risk Analysis", icon: AlertTriangle },
  { href: "/dashboard/reports",  label: "Reports",    icon: BarChart3 },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  return (
    <aside className="w-60 shrink-0 bg-slate-900 border-r border-slate-800 flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-white leading-none">ComplianceAI</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Risk Platform</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link key={href} href={href}
              className={clsx(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group",
                active
                  ? "bg-indigo-600/15 text-indigo-400 border border-indigo-500/20"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              )}>
              <Icon className={clsx("w-4 h-4 shrink-0", active ? "text-indigo-400" : "text-slate-500 group-hover:text-slate-300")} />
              <span className="flex-1">{label}</span>
              {active && <ChevronRight className="w-3 h-3 opacity-60" />}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="px-3 py-4 border-t border-slate-800 space-y-1">
        <div className="px-3 py-2">
          <p className="text-xs font-medium text-white truncate">{user?.full_name ?? user?.email}</p>
          <p className="text-[10px] text-slate-500 capitalize">{user?.role?.replace("_", " ")}</p>
        </div>
        <button onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all">
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
