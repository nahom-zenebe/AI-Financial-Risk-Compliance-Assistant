"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Shield, Mail, Lock, User, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/store/auth-store";
import api from "@/lib/axios";

const ROLES = [
  { value: "admin", label: "Admin", desc: "Full system access" },
  { value: "compliance_officer", label: "Compliance Officer", desc: "Document & risk access" },
  { value: "auditor", label: "Auditor", desc: "Read-only audit access" },
];

export default function RegisterPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [form, setForm] = useState({ full_name: "", email: "", password: "", role: "compliance_officer" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const update = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/auth/register", form);
      // Auto-login after register
      const loginForm = new URLSearchParams({ username: form.email, password: form.password });
      const res = await api.post("/auth/login", loginForm.toString(), {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });
      setAuth(res.data.user, res.data.access_token);
      router.replace("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.detail ?? "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-white">ComplianceAI</span>
        </div>

        <h1 className="text-2xl font-bold text-white mb-1">Create account</h1>
        <p className="text-slate-400 text-sm mb-8">Start monitoring compliance and risk today</p>

        {error && (
          <div className="mb-5 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Full name"
            placeholder="Jane Smith"
            value={form.full_name}
            onChange={update("full_name")}
            icon={<User className="w-4 h-4" />}
            required
          />
          <Input
            label="Email address"
            type="email"
            placeholder="jane@company.com"
            value={form.email}
            onChange={update("email")}
            icon={<Mail className="w-4 h-4" />}
            required
          />
          <Input
            label="Password"
            type="password"
            placeholder="Min. 8 characters"
            value={form.password}
            onChange={update("password")}
            icon={<Lock className="w-4 h-4" />}
            required
            minLength={6}
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-300">Role</label>
            <div className="grid grid-cols-3 gap-2">
              {ROLES.map(({ value, label, desc }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, role: value }))}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    form.role === value
                      ? "border-indigo-500 bg-indigo-600/15 text-indigo-300"
                      : "border-slate-700 bg-slate-800/40 text-slate-400 hover:border-slate-600"
                  }`}
                >
                  <p className="text-xs font-semibold">{label}</p>
                  <p className="text-[10px] mt-0.5 opacity-70">{desc}</p>
                </button>
              ))}
            </div>
          </div>

          <Button type="submit" loading={loading} className="w-full" size="lg">
            <UserPlus className="w-4 h-4" />
            Create account
          </Button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
