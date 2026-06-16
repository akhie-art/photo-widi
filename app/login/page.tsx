"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Camera, Loader2, ArrowRight, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { usePhotoboothStore } from "@/app/hooks/usePhotoboothStore";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get("redirect") || "";
  const { config } = usePhotoboothStore();

  const [theme, setTheme] = useState<"dark" | "light">("dark");

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

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
    sessionStorage.setItem("glow_theme", newTheme);
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

    setTimeout(async () => {
      try {
        let cleanName = username.trim().toLowerCase();
        const cleanPass = password.trim();

        if (!cleanName || !cleanPass) {
          setError("Username dan Password/PIN tidak boleh kosong.");
          setLoading(false);
          return;
        }

        // Map display names or keywords to seeded usernames
        if (!cleanName.includes("@")) {
          if (cleanName.includes("admin")) {
            cleanName = "admin";
          } else if (cleanName.includes("ani")) {
            cleanName = "ani";
          } else {
            // Fallback: take first word if multiple words are typed
            cleanName = cleanName.split(/\s+/)[0];
          }
        }

        // Format to email if it's just a username
        const email = cleanName.includes("@") ? cleanName : `${cleanName}@glowbooth.com`;

        const { data, error: authErr } = await supabase.auth.signInWithPassword({
          email,
          password: cleanPass,
        });

        if (authErr) {
          console.warn("Auth error:", authErr);
          setError("Username atau Password/PIN tidak valid.");
          setLoading(false);
          return;
        }

        const user = data?.user;
        const role = user?.user_metadata?.role;
        const displayName = user?.user_metadata?.display_name || "User";

        if (role === "admin") {
          sessionStorage.setItem("glow_admin_auth", "true");
          sessionStorage.removeItem("glow_operator_auth");
          router.push(redirectPath || "/admin");
        } else if (role === "operator") {
          sessionStorage.setItem("glow_operator_name", displayName);
          sessionStorage.setItem("glow_operator_auth", "true");
          sessionStorage.removeItem("glow_admin_auth");
          router.push(redirectPath && redirectPath !== "/" ? redirectPath : "/operator");
        } else {
          setError("Akses ditolak: Peran pengguna tidak valid.");
          setLoading(false);
        }
      } catch (err) {
        console.error("Login process error:", err);
        setError("Terjadi kesalahan sistem. Silakan coba lagi.");
        setLoading(false);
      }
    }, 800);
  };

  return (
    <div className="min-h-screen bg-[#FBFBFA] dark:bg-[#0B0B0C] text-zinc-850 dark:text-[#E3E3E3] font-sans flex items-center justify-center p-4 transition-colors duration-300 relative overflow-hidden">
      
      {/* Visual Ambient Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] aspect-square rounded-full bg-amber-400/6 dark:bg-amber-500/3 blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] aspect-square rounded-full bg-pink-400/6 dark:bg-pink-500/3 blur-[120px] pointer-events-none z-0" />

      {/* Main Container Card: 2 Columns */}
      <div className="w-full max-w-[800px] bg-white dark:bg-[#121214] border border-zinc-150/80 dark:border-zinc-900 rounded-[28px] shadow-2xl relative overflow-hidden flex flex-col md:flex-row transition-all duration-300 z-10">
        
        {/* Left Column: Premium Visual Illustration */}
        <div className="hidden md:flex md:w-[42%] bg-zinc-950 text-white p-8 flex-col justify-between relative overflow-hidden select-none">
          {/* Subtle gradient pattern backdrop */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:16px_16px]" />
          <div className="absolute -top-[20%] -left-[10%] w-[80%] aspect-square rounded-full bg-rose-500/5 blur-[80px] pointer-events-none" />
          <div className="absolute -bottom-[20%] -right-[10%] w-[80%] aspect-square rounded-full bg-amber-500/5 blur-[80px] pointer-events-none" />

          {/* Top Brand Tag */}
          <div className="flex items-center gap-2.5 z-10">
            <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white">
              <Camera className="w-4 h-4" />
            </div>
             <span className="font-bold tracking-wider text-[9px] uppercase text-zinc-400">
              {config.eventName || "Glowbooth"}
            </span>
          </div>

          {/* Dynamic Illustration */}
          <div className="my-auto flex flex-col items-center justify-center relative z-10 gap-5">
            <div className="w-20 h-20 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shadow-lg">
              <Camera className="w-8 h-8 text-zinc-400" />
            </div>
            <div className="text-center flex flex-col gap-1.5">
              <h2 className="text-lg font-black leading-none tracking-tight text-white">
                {config.eventName || "Glowbooth"} System
              </h2>
              <p className="text-[9px] text-zinc-500 max-w-[170px] leading-relaxed mx-auto font-medium">
                Sistem manajemen premium untuk mengelola data, perangkat, dan konfigurasi photobooth.
              </p>
            </div>
          </div>

          {/* Bottom Footer Info */}
          <div className="text-[8px] text-zinc-650 font-mono z-10 tracking-wider uppercase">
            &copy; {new Date().getFullYear()} {config.eventName || "GLOWBOOTH"}
          </div>
        </div>

        {/* Right Column: Form Container */}
        <div className="w-full md:w-[58%] p-8 md:p-12 flex flex-col justify-center">
          
          {/* Welcome Text */}
          <div className="flex flex-col gap-2 mb-8 select-none">
            <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white leading-none">
              Selamat Datang
            </h1>
            <p className="text-xs text-zinc-550 dark:text-zinc-400 leading-relaxed font-medium">
              Masuk ke portal keamanan untuk mengelola sistem photobooth.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-3.5 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200/80 dark:border-red-500/20 text-red-600 dark:text-red-400 text-[11px] font-semibold flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 dark:bg-red-400 mt-1.5 shrink-0" />
              <p className="leading-snug">{error}</p>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="flex flex-col gap-4 text-left">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase tracking-wider text-zinc-600 dark:text-zinc-400 font-bold">
                Username
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ketik username Anda..."
                className="w-full px-4.5 py-3.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-650"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase tracking-wider text-zinc-600 dark:text-zinc-400 font-bold">
                PIN / Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan PIN atau Password"
                  className="w-full pl-4.5 pr-12 py-3.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-650"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 top-0 h-full px-4 text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-350 flex items-center justify-center transition-colors focus:outline-none bg-transparent border-none"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 bg-zinc-950 hover:bg-zinc-850 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 disabled:opacity-50 disabled:cursor-not-allowed py-4 rounded-2xl text-xs font-extrabold tracking-wider uppercase transition-all duration-300 flex items-center justify-center gap-2 group border-none shadow-md hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  Masuk
                  <ArrowRight className="w-4.5 h-4.5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>

      </div>

    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FBFBFA] dark:bg-[#0B0B0C] flex flex-col items-center justify-center text-zinc-500 dark:text-zinc-400 gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}