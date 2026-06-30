"use client";
import { Bell, Search } from "lucide-react";
import { useAuthStore } from "@/store/auth-store";

interface NavbarProps { title: string; subtitle?: string }

export function Navbar({ title, subtitle }: NavbarProps) {
  const { user } = useAuthStore();
  const initials = user?.full_name
    ? user.full_name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
    : user?.email?.slice(0, 2).toUpperCase() ?? "??";

  return (
    <header className="h-14 bg-slate-900/80 backdrop-blur border-b border-slate-800 flex items-center px-6 gap-4 sticky top-0 z-10">
      <div className="flex-1">
        <h1 className="text-base font-semibold text-white">{title}</h1>
        {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        <button className="p-2 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors">
          <Bell className="w-4 h-4" />
        </button>
        <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold text-white">
          {initials}
        </div>
      </div>
    </header>
  );
}
