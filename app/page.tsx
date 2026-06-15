"use client";

import { useState, useEffect } from "react";
import { usePhotoboothStore, PhotoStrip } from "@/app/hooks/usePhotoboothStore";
import { useRouter } from "next/navigation";
import { Sun, Moon, Sparkles, Terminal, Camera, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  const { config, photos } = usePhotoboothStore();
  const router = useRouter();

  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [currentOperator, setCurrentOperator] = useState<string | null>(null);

  // Operator Authorization Check (No redirect, public access allowed)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const operatorAuth = sessionStorage.getItem("glow_operator_auth");
    const operatorName = sessionStorage.getItem("glow_operator_name");
    if (operatorAuth === "true" && operatorName) {
      setCurrentOperator(operatorName);
    } else {
      setCurrentOperator(null);
    }
  }, []);

  const handleOperatorLogout = () => {
    sessionStorage.removeItem("glow_operator_auth");
    sessionStorage.removeItem("glow_operator_name");
    setCurrentOperator(null);
  };

  // Sync theme status on mount
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

  return (
    <div className="flex-1 bg-[#fbfbfb] dark:bg-[#0b0b0c] text-zinc-850 dark:text-[#e3e3e3] font-sans flex flex-col justify-between overflow-x-hidden min-h-screen relative transition-colors duration-300">
      {/* Visual Ambient Background Glows */}
      <div className="absolute top-0 left-[-15%] w-[45%] aspect-square rounded-full bg-blue-500/5 blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-[10%] right-[-15%] w-[45%] aspect-square rounded-full bg-indigo-500/5 blur-[120px] pointer-events-none z-0" />

      <div className="flex-1 flex flex-col z-10 relative">
        {/* Header */}
        <header className="w-full border-b border-zinc-200/80 dark:border-zinc-900/60 bg-[#fbfbfb]/80 dark:bg-[#0b0b0c]/60 backdrop-blur-md sticky top-0 z-50 transition-colors duration-300">
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black tracking-tighter text-sm shadow-md shadow-blue-500/20">
                GB
              </div>
              <span className="font-bold tracking-wider text-sm bg-gradient-to-r from-zinc-800 to-zinc-500 dark:from-white dark:to-zinc-400 bg-clip-text text-transparent font-mono">GLOWBOOTH</span>
            </div>
            
            <div className="flex items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400">
              {currentOperator ? (
                <div className="inline-flex items-center gap-2 bg-zinc-100 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800/85 px-3 py-1 rounded-xl text-[10px] text-zinc-650 dark:text-zinc-350 shadow-sm transition-all">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Operator: <strong className="text-zinc-850 dark:text-zinc-100">{currentOperator}</strong>
                  <span className="mx-1 text-zinc-300 dark:text-zinc-800 font-light">|</span>
                  <button
                    type="button"
                    onClick={handleOperatorLogout}
                    className="text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 cursor-pointer font-semibold transition-colors focus:outline-none"
                  >
                    Keluar
                  </button>
                </div>
              ) : (
                <Button
                  onClick={() => router.push("/login?redirect=/")}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-4.5 py-1.5 rounded-xl text-[10px] shadow-sm transition-all border-none cursor-pointer tracking-wider uppercase"
                >
                  Masuk Sistem
                </Button>
              )}

              <span className="hidden sm:inline-flex items-center gap-1.5 h-4 text-xs font-mono">
                Total Sesi: <strong className="text-blue-600 dark:text-blue-400 font-mono ml-1">{photos.length}</strong>
              </span>
              
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
          </div>
        </header>

        {/* Hero Section */}
        <div className="max-w-7xl mx-auto px-6 py-12 md:py-20 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center w-full flex-1">
          <div className="lg:col-span-7 flex flex-col gap-6 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/30 text-[10px] text-blue-600 dark:text-blue-400 font-semibold uppercase tracking-wider w-fit">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              Virtual Photobooth Experience
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-zinc-900 dark:text-[#e3e3e3] tracking-tight leading-[1.05] bg-gradient-to-br from-zinc-900 via-zinc-850 to-zinc-500 dark:from-white dark:via-white dark:to-zinc-650 bg-clip-text text-transparent">
              Abadikan <span className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">Momen Terbaik</span> Anda Bersama Kami.
            </h1>

            <p className="text-zinc-655 dark:text-zinc-400 text-xs sm:text-sm md:text-base leading-relaxed max-w-xl">
              Selamat datang di <strong className="text-zinc-850 dark:text-zinc-200">{config.eventName}</strong>! Ambil foto estetik dengan pilihan filter premium dan bingkai eksklusif langsung menggunakan kamera Anda. Cukup registrasi, lakukan pembayaran, dan unduh hasilnya secara instan!
            </p>

            {/* Event Meta Details Card */}
            <div className="grid grid-cols-3 gap-4 bg-zinc-100/40 dark:bg-zinc-950/40 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-900 w-full max-w-xl mt-2 shadow-inner transition-colors duration-300">
              <div>
                <span className="text-[10px] text-zinc-400 dark:text-zinc-555 font-mono uppercase tracking-wider block font-semibold">TANGGAL</span>
                <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-300 mt-1 block">{config.date || "15 Juni 2026"}</span>
              </div>
              <div className="border-l border-zinc-200 dark:border-zinc-900/80 pl-4">
                <span className="text-[10px] text-zinc-400 dark:text-zinc-555 font-mono uppercase tracking-wider block font-semibold">WAKTU</span>
                <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-300 mt-1 block">{config.time || "18:00"} WIB</span>
              </div>
              <div className="border-l border-zinc-200 dark:border-zinc-900/80 pl-4">
                <span className="text-[10px] text-zinc-400 dark:text-zinc-555 font-mono uppercase tracking-wider block font-semibold">LOKASI</span>
                <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-300 mt-1 block truncate">{config.location || "Radiant Hall"}</span>
              </div>
            </div>
          </div>

          {/* Interactive Promo / Action Card */}
          <div className="lg:col-span-5 flex justify-center w-full">
            <div className="max-w-md w-full bg-white/70 dark:bg-zinc-900/40 backdrop-blur-xl border border-zinc-200/80 dark:border-zinc-850 rounded-3xl p-8 text-center flex flex-col items-center gap-6 shadow-2xl relative overflow-hidden group transition-all duration-300">
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-blue-500/0 via-blue-500/35 to-blue-500/0" />
              
              <div className="w-14 h-14 rounded-full bg-blue-50 dark:bg-blue-950 border border-blue-100 dark:border-blue-900/30 flex items-center justify-center text-blue-500 shadow-inner group-hover:scale-105 transition-transform duration-300">
                <Camera className="w-6.5 h-6.5 text-blue-500" strokeWidth={1.5} />
              </div>

              <div>
                <h2 className="text-xl font-bold text-zinc-900 dark:text-[#e3e3e3] tracking-tight">
                  Studio Foto Aktif
                </h2>
                <p className="text-zinc-550 dark:text-zinc-400 text-xs mt-1.5 leading-relaxed">
                  Sesi foto dipandu langsung oleh operator booth di lokasi. Silakan mendaftar ke operator untuk memulai foto.
                </p>
              </div>

              {currentOperator ? (
                <div className="w-full bg-zinc-50/50 dark:bg-zinc-950/40 p-5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/60 flex flex-col gap-4 items-center">
                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-450 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 px-4 py-2 rounded-xl w-full justify-center">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Operator Aktif: {currentOperator}</span>
                  </div>
                  <Button
                    onClick={() => router.push("/operator")}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-650 hover:from-blue-500 hover:to-indigo-550 text-white font-semibold py-3.5 rounded-xl transition-all text-xs tracking-wider uppercase cursor-pointer shadow-lg shadow-blue-900/20"
                  >
                    Buka Panel Operator
                  </Button>
                </div>
              ) : (
                <div className="w-full flex flex-col gap-3">
                  <Button
                    onClick={() => router.push("/login?redirect=/operator")}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-650 hover:from-blue-500 hover:to-indigo-550 text-white font-semibold py-3.5 rounded-xl transition-all text-xs tracking-wider uppercase cursor-pointer shadow-lg shadow-blue-900/20"
                  >
                    Masuk sebagai Operator
                  </Button>
                  <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono">
                    *Butuh hak akses operator untuk mendaftarkan pengunjung.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Steps Section */}
        <section className="w-full border-t border-zinc-200/80 dark:border-zinc-900/40 py-16 bg-zinc-50/50 dark:bg-[#09090a]/50 transition-colors duration-300">
          <div className="max-w-7xl mx-auto px-6 text-center flex flex-col gap-10">
            <div>
              <span className="text-[10px] text-blue-655 dark:text-blue-500 font-mono uppercase tracking-wider font-bold">CARA KERJA</span>
              <h2 className="text-2xl sm:text-3xl font-bold text-zinc-800 dark:text-zinc-200 mt-2 tracking-tight">4 Langkah Praktis Foto Strip Anda</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white dark:bg-zinc-950/30 border border-zinc-200/80 dark:border-zinc-900/60 p-6 rounded-2xl text-left flex flex-col gap-3 group hover:border-zinc-300 dark:hover:border-zinc-800 transition-all shadow-xl">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30 flex items-center justify-center font-mono font-bold text-sm shadow-inner group-hover:scale-105 transition-transform duration-300">
                  01
                </div>
                <div>
                  <h4 className="text-sm font-bold text-zinc-855 dark:text-zinc-200">Registrasi Sesi</h4>
                  <p className="text-[11px] text-zinc-605 dark:text-zinc-550 mt-1.5 leading-relaxed font-sans">Masukkan nama, nomor WhatsApp, dan jumlah sesi foto strip yang Anda inginkan.</p>
                </div>
              </div>

              <div className="bg-white dark:bg-zinc-950/30 border border-zinc-200/80 dark:border-zinc-900/60 p-6 rounded-2xl text-left flex flex-col gap-3 group hover:border-zinc-300 dark:hover:border-zinc-800 transition-all shadow-xl">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/30 flex items-center justify-center font-mono font-bold text-sm shadow-inner group-hover:scale-105 transition-transform duration-300">
                  02
                </div>
                <div>
                  <h4 className="text-sm font-bold text-zinc-855 dark:text-zinc-200">Selesaikan Pembayaran</h4>
                  <p className="text-[11px] text-zinc-605 dark:text-zinc-555 mt-1.5 leading-relaxed font-sans">Pilih bayar otomatis scan QRIS atau bayar tunai ke operator booth di tempat.</p>
                </div>
              </div>

              <div className="bg-white dark:bg-zinc-950/30 border border-zinc-200/80 dark:border-zinc-900/60 p-6 rounded-2xl text-left flex flex-col gap-3 group hover:border-zinc-300 dark:hover:border-zinc-800 transition-all shadow-xl">
                <div className="w-10 h-10 rounded-xl bg-purple-55 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-900/30 flex items-center justify-center font-mono font-bold text-sm shadow-inner group-hover:scale-105 transition-transform duration-300">
                  03
                </div>
                <div>
                  <h4 className="text-sm font-bold text-zinc-855 dark:text-zinc-200">Pose & Jepret Kamera</h4>
                  <p className="text-[11px] text-zinc-605 dark:text-zinc-555 mt-1.5 leading-relaxed font-sans">Pilih layout strip/grid, aktifkan filter neon, vintage, atau retro, lalu mulailah berpose.</p>
                </div>
              </div>

              <div className="bg-white dark:bg-zinc-950/30 border border-zinc-200/80 dark:border-zinc-900/60 p-6 rounded-2xl text-left flex flex-col gap-3 group hover:border-zinc-300 dark:hover:border-zinc-800 transition-all shadow-xl">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-650 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30 flex items-center justify-center font-mono font-bold text-sm shadow-inner group-hover:scale-105 transition-transform duration-300">
                  04
                </div>
                <div>
                  <h4 className="text-sm font-bold text-zinc-855 dark:text-zinc-200">Kustomisasi & Unduh</h4>
                  <p className="text-[11px] text-zinc-605 dark:text-zinc-555 mt-1.5 leading-relaxed font-sans">Ubah teks bingkai footer, ganti tema warna/overlay bingkai, dan unduh foto strip Anda.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Live Gallery Section */}
        <section className="w-full border-t border-zinc-200/80 dark:border-zinc-900/40 py-16 bg-white dark:bg-[#0b0b0c] transition-colors duration-300">
          <div className="max-w-7xl mx-auto px-6 text-center flex flex-col gap-10">
            <div>
              <span className="text-[10px] text-indigo-500 dark:text-indigo-400 font-mono uppercase tracking-wider font-bold">GALERI LIVE EVENT</span>
              <h2 className="text-2xl sm:text-3xl font-bold text-zinc-800 dark:text-zinc-200 mt-2 tracking-tight">Keseruan dari Pengunjung Lain</h2>
            </div>

            {photos.length === 0 ? (
              <div className="py-12 border border-dashed border-zinc-200 dark:border-zinc-900 rounded-2xl flex flex-col items-center justify-center gap-3 bg-zinc-50 dark:bg-zinc-950/10">
                <p className="text-xs text-zinc-500 font-mono">Belum ada foto yang diambil di event ini.</p>
                <p className="text-[10px] text-zinc-400 dark:text-zinc-650 max-w-[240px] leading-relaxed">Jadilah yang pertama untuk mengambil foto strip dan memajangnya di sini!</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {photos.slice(0, 10).map((photo: PhotoStrip) => (
                  <div key={photo.id} className="group flex flex-col bg-zinc-50/50 dark:bg-zinc-950/30 border border-zinc-200 dark:border-zinc-900/60 p-3 rounded-2xl relative overflow-hidden transition-all duration-300 hover:border-zinc-305 dark:hover:border-zinc-800 hover:scale-[1.02] shadow-xl">
                    <div className="aspect-[2/3.5] rounded-xl overflow-hidden bg-zinc-900 relative">
                      <img
                        src={photo.dataUrl}
                        alt={photo.customerName || "Photostrip"}
                        className="w-full h-full object-cover rounded-xl"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3 text-left">
                        <span className="text-[10px] font-bold text-zinc-200 truncate">{photo.customerName || "Anonymous"}</span>
                        <span className="text-[8px] text-zinc-400 mt-0.5 font-mono">{photo.timestamp}</span>
                      </div>
                    </div>
                    <div className="mt-2.5 text-left truncate px-1">
                      <p className="text-[10px] font-bold text-zinc-800 dark:text-[#e3e3e3] truncate">{photo.customerName || "Anonymous"}</p>
                      <p className="text-[8px] text-zinc-550 dark:text-zinc-500 font-mono mt-0.5">{photo.sessionsCount || 1} Sesi Foto</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Footer */}
        <footer className="w-full border-t border-zinc-200/60 dark:border-zinc-900/40 py-8 text-center text-[10px] text-zinc-500 dark:text-zinc-600 bg-zinc-100/40 dark:bg-black/40 transition-colors duration-300">
          <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono">
            <span>&copy; {new Date().getFullYear()} GLOWBOOTH. All rights reserved.</span>
            <span>Powered by Advanced Supabase Client Integration</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
