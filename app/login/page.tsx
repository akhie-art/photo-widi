"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { User, Lock, Shield, Key, ChevronRight, Sun, Moon, Sparkles, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get("redirect") || "";

  const [role, setRole] = useState<"operator" | "admin">("operator");
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  // Operator Fields
  const [operatorName, setOperatorName] = useState("");
  const [operatorPin, setOperatorPin] = useState("");

  // Admin Fields
  const [adminUser, setAdminUser] = useState("");
  const [adminPass, setAdminPass] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Sync theme
  useEffect(() => {
    if (typeof window === "undefined") return;
    const isDark = document.documentElement.classList.contains("dark");
    setTheme(isDark ? "dark" : "light");
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("glow_theme", newTheme);
    const root = document.documentElement;
    if (newTheme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Simulate network delay for premium feel
    setTimeout(async () => {
      try {
        if (role === "operator") {
          const cleanName = operatorName.trim().toLowerCase();
          if (!cleanName) {
            setError("Nama Operator tidak boleh kosong!");
            setLoading(false);
            return;
          }

          // Try querying Supabase
          let operatorData = null;
          try {
            const { data, error: dbErr } = await supabase
              .from("booth_users")
              .select("*")
              .eq("role", "operator")
              .eq("username", cleanName)
              .eq("pin_or_password", operatorPin)
              .maybeSingle();
            
            if (!dbErr && data) {
              operatorData = data;
            }
          } catch (dbEx) {
            console.warn("Supabase query failed, falling back to local credentials:", dbEx);
          }

          // Fallback logic if Supabase didn't find the user (e.g. database not seeded yet)
          if (!operatorData) {
            if (cleanName === "budi" && operatorPin === "1234") {
              operatorData = { display_name: "Budi Santoso" };
            } else if (cleanName === "siti" && operatorPin === "5678") {
              operatorData = { display_name: "Siti Rahma" };
            } else if (cleanName === "ani" && operatorPin === "1111") {
              operatorData = { display_name: "Ani Wijaya" };
            }
          }

          if (operatorData) {
            sessionStorage.setItem("glow_operator_name", operatorData.display_name);
            sessionStorage.setItem("glow_operator_auth", "true");
            sessionStorage.removeItem("glow_admin_auth");
            router.push(redirectPath && redirectPath !== "/" ? redirectPath : "/operator");
          } else {
            setError("Username Operator atau PIN salah! (Petunjuk: budi/1234, siti/5678, ani/1111)");
            setLoading(false);
          }
        } else {
          // Admin Authentication
          const cleanAdminUser = adminUser.trim().toLowerCase();
          
          // Try querying Supabase
          let adminData = null;
          try {
            const { data, error: dbErr } = await supabase
              .from("booth_users")
              .select("*")
              .eq("role", "admin")
              .eq("username", cleanAdminUser)
              .eq("pin_or_password", adminPass)
              .maybeSingle();
            
            if (!dbErr && data) {
              adminData = data;
            }
          } catch (dbEx) {
            console.warn("Supabase query failed, falling back to local admin credentials:", dbEx);
          }

          // Fallback logic
          if (!adminData) {
            if (cleanAdminUser === "admin" && adminPass === "admin123") {
              adminData = { display_name: "Super Admin" };
            }
          }

          if (adminData) {
            localStorage.setItem("glow_admin_auth", "true");
            sessionStorage.removeItem("glow_operator_auth");
            router.push(redirectPath || "/admin");
          } else {
            setError("Username atau Password Admin salah! (Petunjuk: admin/admin123)");
            setLoading(false);
          }
        }
      } catch (err) {
        console.error("Login process error:", err);
        setError("Sistem mengalami gangguan teknis. Silakan coba kembali.");
        setLoading(false);
      }
    }, 1000);
  };

  return (
    <div className="flex-1 bg-[#fbfbfb] dark:bg-[#0b0b0c] text-zinc-850 dark:text-[#e3e3e3] font-sans flex flex-col justify-between overflow-x-hidden min-h-screen relative transition-colors duration-300">
      {/* Visual Ambient Background Glows */}
      <div className="absolute top-0 left-[-15%] w-[45%] aspect-square rounded-full bg-blue-500/5 blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-[10%] right-[-15%] w-[45%] aspect-square rounded-full bg-indigo-500/5 blur-[120px] pointer-events-none z-0" />

      {/* Header */}
      <header className="w-full border-b border-zinc-200/80 dark:border-zinc-900/60 bg-[#fbfbfb]/80 dark:bg-[#0b0b0c]/60 backdrop-blur-md sticky top-0 z-50 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black tracking-tighter text-sm shadow-md shadow-blue-500/20">
              GB
            </div>
            <span className="font-bold tracking-wider text-sm bg-gradient-to-r from-zinc-800 to-zinc-500 dark:from-white dark:to-zinc-400 bg-clip-text text-transparent font-mono">
              GLOWBOOTH
            </span>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="w-9 h-9 rounded-xl hover:bg-zinc-150 dark:hover:bg-zinc-900 text-zinc-500 dark:text-zinc-400 hover:text-zinc-850 dark:hover:text-zinc-100 transition-colors cursor-pointer border border-zinc-200/20 dark:border-zinc-800/20 shadow-sm"
          >
            {theme === "dark" ? (
              <Sun className="w-4.5 h-4.5 text-amber-500 animate-scale-up" />
            ) : (
              <Moon className="w-4.5 h-4.5 text-indigo-500 animate-scale-up" />
            )}
          </Button>
        </div>
      </header>

      {/* Main Login Card Wrapper */}
      <main className="flex-1 flex items-center justify-center px-6 py-12 z-10 relative">
        <div className="max-w-md w-full bg-white/70 dark:bg-zinc-900/40 backdrop-blur-xl border border-zinc-200/80 dark:border-zinc-850 rounded-3xl p-8 flex flex-col gap-6 shadow-2xl relative overflow-hidden group transition-all duration-350">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-blue-500/0 via-blue-500/35 to-blue-500/0" />

          {/* Logo Badge */}
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-650 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 self-center group-hover:scale-105 transition-transform duration-300">
            <Shield className="w-6.5 h-6.5" strokeWidth={1.5} />
          </div>

          {/* Titles */}
          <div className="text-center">
            <h2 className="text-2xl font-black text-zinc-900 dark:text-[#e3e3e3] tracking-tight">
              Portal Keamanan
            </h2>
            <p className="text-zinc-550 dark:text-zinc-400 text-xs mt-1.5 leading-relaxed">
              Silakan masuk untuk mengoperasikan sistem photobooth atau mengelola event.
            </p>
          </div>

          {/* Custom Roles Tab Switcher */}
          <div className="grid grid-cols-2 p-1.5 bg-zinc-100/80 dark:bg-zinc-950/60 rounded-2xl border border-zinc-200/50 dark:border-zinc-900/40">
            <button
              type="button"
              onClick={() => {
                setRole("operator");
                setError(null);
              }}
              className={`py-2 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer ${
                role === "operator"
                  ? "bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              Operator Portal
            </button>
            <button
              type="button"
              onClick={() => {
                setRole("admin");
                setError(null);
              }}
              className={`py-2 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer ${
                role === "admin"
                  ? "bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Admin System
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 dark:bg-red-950/20 border border-red-200/55 dark:border-red-900/30 text-red-650 dark:text-red-400 px-4 py-3 rounded-2xl text-[11px] font-sans flex items-start gap-2.5 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            {role === "operator" ? (
              <>
                {/* Operator Fields */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-zinc-600 dark:text-zinc-400 font-medium font-sans flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" strokeWidth={1.5} />
                    <span>Username Operator</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={operatorName}
                    onChange={(e) => setOperatorName(e.target.value)}
                    placeholder="Masukkan username (e.g. budi)"
                    className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/80 text-zinc-850 dark:text-zinc-200 focus:outline-none focus:border-blue-500 text-xs p-3.5 rounded-xl w-full transition-all focus:ring-1 focus:ring-blue-500/30"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-zinc-600 dark:text-zinc-400 font-medium font-sans flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" strokeWidth={1.5} />
                    <span>PIN Pengaman</span>
                  </label>
                  <input
                    type="password"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={4}
                    required
                    value={operatorPin}
                    onChange={(e) => setOperatorPin(e.target.value)}
                    placeholder="PIN 4 Digit (e.g. 1234)"
                    className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/80 text-zinc-850 dark:text-zinc-200 focus:outline-none focus:border-blue-500 text-xs p-3.5 rounded-xl w-full tracking-widest text-center transition-all focus:ring-1 focus:ring-blue-500/30"
                  />
                </div>
              </>
            ) : (
              <>
                {/* Admin Fields */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-zinc-600 dark:text-zinc-400 font-medium font-sans flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" strokeWidth={1.5} />
                    <span>Username Admin</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={adminUser}
                    onChange={(e) => setAdminUser(e.target.value)}
                    placeholder="Ketik username (admin)"
                    className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/80 text-zinc-850 dark:text-zinc-200 focus:outline-none focus:border-blue-500 text-xs p-3.5 rounded-xl w-full transition-all focus:ring-1 focus:ring-blue-500/30"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-zinc-600 dark:text-zinc-400 font-medium font-sans flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" strokeWidth={1.5} />
                    <span>Password Admin</span>
                  </label>
                  <input
                    type="password"
                    required
                    value={adminPass}
                    onChange={(e) => setAdminPass(e.target.value)}
                    placeholder="Ketik password (admin123)"
                    className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/80 text-zinc-850 dark:text-zinc-200 focus:outline-none focus:border-blue-500 text-xs p-3.5 rounded-xl w-full transition-all focus:ring-1 focus:ring-blue-500/30"
                  />
                </div>
              </>
            )}

            <Button
              type="submit"
              disabled={loading}
              className={`w-full text-white font-semibold py-3.5 rounded-xl transition-all text-xs tracking-wider uppercase flex items-center justify-center gap-1.5 border-none cursor-pointer mt-2 ${
                loading
                  ? "bg-zinc-300 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 cursor-not-allowed opacity-50"
                  : "bg-gradient-to-r from-blue-600 to-indigo-650 hover:from-blue-500 hover:to-indigo-550 shadow-lg shadow-blue-900/20 hover:scale-[1.01] active:scale-[0.99]"
              }`}
            >
              <span>{loading ? "Menghubungkan..." : "Masuk Sistem"}</span>
              {!loading && <ChevronRight className="w-4 h-4" strokeWidth={1.5} />}
            </Button>
          </form>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-zinc-200/60 dark:border-zinc-900/40 py-8 text-center text-[10px] text-zinc-500 dark:text-zinc-600 bg-zinc-100/40 dark:bg-black/40 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono">
          <span>&copy; {new Date().getFullYear()} GLOWBOOTH. All rights reserved.</span>
          <span>Security Portal & Access Management</span>
        </div>
      </footer>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0b0b0c] flex flex-col items-center justify-center gap-4 text-zinc-400 font-mono text-xs">
          <div className="w-8 h-8 rounded-full border-2 border-blue-500/20 border-t-blue-500 animate-spin" />
          <span>Memuat Portal Keamanan...</span>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
