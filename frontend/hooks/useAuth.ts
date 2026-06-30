"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";

export function useAuth(redirectIfUnauthenticated = true) {
  const { user, token, hydrate } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    hydrate();
  }, []);

  useEffect(() => {
    if (redirectIfUnauthenticated && !token && typeof window !== "undefined") {
      const stored = localStorage.getItem("access_token");
      if (!stored) router.replace("/login");
    }
  }, [token, redirectIfUnauthenticated, router]);

  return { user, token, isAuthenticated: !!token };
}
