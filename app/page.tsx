"use client";

import { useState, useEffect } from "react";
import { usePhotoboothStore, PhotoStrip } from "@/app/hooks/usePhotoboothStore";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { 
  Sun, 
  Moon, 
  Sparkles, 
  Terminal, 
  Camera, 
  Image as ImageIcon,
  CheckCircle2,
  Heart,
  ImagePlay,
  X,
  Maximize2,
  Smile
} from "lucide-react";

const Instagram = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const Twitter = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
  </svg>
);
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  const { config, photos } = usePhotoboothStore();
  const router = useRouter();

  const [theme, setTheme] = useState<"dark" | "light">("light");
  const [currentOperator, setCurrentOperator] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoStrip | null>(null);

  // --- PARALLAX STATE (MOUSE & SCROLL) ---
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [scrollY, setScrollY] = useState(0);

  // Operator Authorization Check
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

  // Sync theme status on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const isDark = document.documentElement.classList.contains("dark");
    setTheme(isDark ? "dark" : "light");
  }, []);

  // Scroll Listener for Sinking Hero & Upward Cards
  useEffect(() => {
    if (typeof window === "undefined") return;
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setScrollY(window.scrollY);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleOperatorLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Sign out error:", err);
    }
    sessionStorage.removeItem("glow_operator_auth");
    sessionStorage.removeItem("glow_operator_name");
    setCurrentOperator(null);
  };

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

  // Handler for Mouse Parallax Effect
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (typeof window === "undefined") return;
    const x = (e.clientX / window.innerWidth - 0.5) * 2;
    const y = (e.clientY / window.innerHeight - 0.5) * 2;
    setMousePos({ x, y });
  };

  return (
    <>
      {/* Custom Keyframes for Floating Illustration Animation */}
      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(var(--rotation, 0deg)); }
          50% { transform: translateY(-15px) rotate(var(--rotation, 0deg)); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float 6s ease-in-out 3s infinite;
        }
      `}</style>

      {/* Main wrapper attached with mouse move event for parallax */}
      <div 
        onMouseMove={handleMouseMove}
        className="flex-1 bg-[#FFFDFB] dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans flex flex-col justify-between overflow-x-hidden min-h-screen relative transition-colors duration-500 selection:bg-rose-200 selection:text-rose-900"
      >
        
        {/* Soft Pastel Ambient Glows & Grid (Fixed Background) */}
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          <div className="absolute -top-[10%] -left-[5%] w-[60%] md:w-[45%] aspect-square rounded-full bg-rose-100/60 dark:bg-rose-900/10 blur-[140px]" />
          <div className="absolute top-[10%] -right-[5%] w-[50%] aspect-square rounded-full bg-amber-100/50 dark:bg-amber-900/10 blur-[140px]" />
          {/* Subtle Grid Background */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:32px_32px]" />
        </div>

        <div className="flex-1 flex flex-col z-10 relative">
          {/* Header */}
          <header className="w-full bg-transparent sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between backdrop-blur-sm">
              <div className="flex items-center gap-3 cursor-pointer group" onClick={() => router.push("/")}>
                {config.logoUrl ? (
                  <div className="w-9 h-9 rounded-xl overflow-hidden bg-white dark:bg-zinc-950 flex items-center justify-center border border-slate-200/60 dark:border-slate-800 shrink-0 shadow-sm group-hover:shadow-md transition-all">
                    <img src={config.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                  </div>
                ) : (
                  <div className="w-9 h-9 rounded-xl bg-slate-900 dark:bg-white flex items-center justify-center text-white dark:text-slate-900 font-extrabold tracking-tighter text-xs shadow-md group-hover:scale-105 transition-transform">
                    GB
                  </div>
                )}
                <span className="font-bold tracking-tight text-[15px] text-slate-800 dark:text-slate-100">
                  {config.eventName ? config.eventName : "GLOWBOOTH"}
                </span>
              </div>
              
              <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                {currentOperator ? (
                  <div className="hidden sm:flex items-center gap-3 border border-emerald-200/50 dark:border-emerald-900/30 px-3 py-1.5 rounded-full text-xs shadow-sm bg-emerald-50/50 dark:bg-emerald-900/10 text-emerald-700 dark:text-emerald-400">
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span>Operator: <strong className="font-semibold">{currentOperator}</strong></span>
                    <div className="w-px h-3 bg-emerald-200 dark:bg-emerald-800 mx-1" />
                    <button
                      onClick={handleOperatorLogout}
                      className="hover:text-red-500 dark:hover:text-red-400 font-medium transition-colors cursor-pointer"
                    >
                      Keluar
                    </button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push("/login")}
                    className="hidden sm:flex h-9 rounded-xl text-xs font-bold border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer shadow-sm"
                  >
                    Masuk Sistem
                  </Button>
                )}
                
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleTheme}
                  className="h-9 w-9 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-amber-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  {theme === "dark" ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
                </Button>
              </div>
            </div>
          </header>

          {/* Hero Section (SINKING PARALLAX WRAPPER) */}
          <div 
            className="max-w-7xl mx-auto px-6 py-12 md:py-20 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center w-full relative z-10 transition-opacity duration-100"
            style={{ 
              transform: `translateY(${scrollY * 0.35}px)`, 
              opacity: Math.max(0, 1 - scrollY / 700) 
            }}
          >
            {/* Left Content Column */}
            <div className="lg:col-span-6 flex flex-col gap-5 text-left order-2 lg:order-1 relative z-20">
              
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-rose-100/60 dark:border-slate-800 text-[11px] font-bold text-rose-500 dark:text-rose-400 w-fit shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Virtual Photobooth Experience
              </div>

              <h1 className="text-5xl md:text-[64px] lg:text-[72px] font-extrabold tracking-tight text-slate-800 dark:text-white leading-[1.05] mt-2">
                Abadikan Momen <br />
                <span className="bg-gradient-to-r from-rose-400 via-orange-400 to-amber-400 bg-clip-text text-transparent">Penuh Senyuman.</span>
              </h1>

              <p className="text-slate-600 dark:text-slate-400 text-[15px] md:text-base leading-relaxed max-w-lg font-medium mt-2">
                Sesi foto studio instan di <strong className="text-slate-800 dark:text-slate-200">{config.eventName || "Widi Photobooth"}</strong>. Pilih layout favoritmu, terapkan filter manis, dan bawa pulang kenangannya langsung ke genggamanmu!
              </p>

              {/* Feature Checklist */}
              <ul className="space-y-3 mt-4 text-[13px] font-semibold text-slate-600 dark:text-slate-300">
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="w-4.5 h-4.5 text-rose-400 stroke-[2.5]" />
                  <span>Resolusi tinggi super jernih tanpa batas</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="w-4.5 h-4.5 text-amber-400 stroke-[2.5]" />
                  <span>Akses puluhan warna & filter pastel estetik</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="w-4.5 h-4.5 text-sky-400 stroke-[2.5]" />
                  <span>Langsung simpan via scan QR Code pintar</span>
                </li>
              </ul>
            </div>

            {/* Right Illustration Column (Parallax 3D Composition) */}
            <div className="lg:col-span-6 w-full h-[450px] md:h-[550px] relative flex items-center justify-center order-1 lg:order-2">
              
              <div className="relative w-full max-w-sm h-full flex items-center justify-center">
                
                {/* Parallax Layer 1: Left Background Strip */}
                <div 
                  className="absolute top-[12%] left-[5%] md:-left-[5%] z-20 transition-transform duration-[400ms] ease-out"
                  style={{ transform: `translate3d(${mousePos.x * -25}px, ${mousePos.y * -25}px, 0)` }}
                >
                  <div 
                    className="w-28 h-40 md:w-32 md:h-48 bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl p-3 rounded-2xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] border border-white dark:border-slate-700 animate-float"
                    style={{ '--rotation': '-15deg' } as React.CSSProperties}
                  >
                    <div className="w-full h-[47%] bg-[#FFE4E1] dark:bg-slate-700 rounded-xl mb-2" />
                    <div className="w-full h-[47%] bg-[#FFFACD] dark:bg-slate-700 rounded-xl" />
                  </div>
                </div>

                {/* Parallax Layer 2: Right Foreground Strip */}
                <div 
                  className="absolute bottom-[15%] right-[5%] md:-right-[5%] z-40 transition-transform duration-[300ms] ease-out"
                  style={{ transform: `translate3d(${mousePos.x * 40}px, ${mousePos.y * 40}px, 0)` }}
                >
                  <div 
                    className="w-32 h-44 md:w-36 md:h-52 bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl p-3 rounded-2xl shadow-[0_30px_50px_-15px_rgba(0,0,0,0.15)] border border-white dark:border-slate-700 animate-float-delayed"
                    style={{ '--rotation': '18deg' } as React.CSSProperties}
                  >
                    <div className="w-full h-full bg-[#E0F7FA] dark:bg-slate-700 rounded-xl flex items-center justify-center border border-[#B2EBF2] dark:border-slate-600">
                      <ImagePlay className="w-8 h-8 text-sky-400/50" />
                    </div>
                  </div>
                </div>

                {/* Parallax Layer 3: Main Central Camera (Squircle) */}
                <div 
                  className="relative z-30 transition-transform duration-[200ms] ease-out"
                  style={{ 
                    // Adds a dynamic 3D tilt based on mouse position
                    transform: `perspective(1000px) rotateX(${mousePos.y * -8}deg) rotateY(${mousePos.x * 8}deg) translate3d(${mousePos.x * 10}px, ${mousePos.y * 10}px, 0)` 
                  }}
                >
                  <div className="w-56 h-56 md:w-64 md:h-64 bg-[#FFFDFB] dark:bg-slate-800 rounded-[2.5rem] md:rounded-[3rem] shadow-[0_35px_60px_-15px_rgba(251,113,133,0.15)] dark:shadow-[0_35px_60px_-15px_rgba(0,0,0,0.4)] flex items-center justify-center border-4 border-white dark:border-slate-700/50 relative overflow-hidden">
                    
                    {/* Inner subtle glow */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent dark:from-white/5 pointer-events-none" />

                    {/* REC Indicator */}
                    <div className="absolute top-5 right-5 flex items-center gap-1.5 bg-slate-50 dark:bg-slate-700 px-3 py-1 rounded-full shadow-sm border border-slate-100 dark:border-slate-600">
                      <div className="w-2 h-2 rounded-full bg-slate-400 animate-pulse" />
                      <span className="text-[9px] font-extrabold text-slate-600 dark:text-slate-300 tracking-wider">REC</span>
                    </div>

                    {/* Camera Lens Object */}
                    <div className="relative w-28 h-28 md:w-32 md:h-32 rounded-full bg-gradient-to-tr from-rose-400 via-orange-400 to-amber-300 flex items-center justify-center shadow-inner">
                      {/* Lens Reflection */}
                      <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white/30 to-transparent pointer-events-none" />
                      
                      <div className="w-[70px] h-[70px] md:w-20 md:h-20 rounded-full bg-white/10 flex items-center justify-center border-[3px] border-white/40 backdrop-blur-md shadow-lg">
                        <Camera className="w-8 h-8 md:w-9 md:h-9 text-white drop-shadow-md" strokeWidth={2.5} />
                      </div>
                    </div>

                    {/* Flash indicator / Sensor */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-8 h-1.5 bg-slate-200 dark:bg-slate-600 rounded-full" />
                  </div>
                </div>

                {/* Floating Decorative Elements (Fastest Parallax) */}
                <div 
                  className="absolute top-[5%] right-[10%] z-50 transition-transform duration-[150ms] ease-out pointer-events-none"
                  style={{ transform: `translate3d(${mousePos.x * 60}px, ${mousePos.y * 60}px, 0)` }}
                >
                  <Sparkles className="w-7 h-7 text-amber-400 animate-pulse" strokeWidth={2.5} />
                </div>
                
                <div 
                  className="absolute bottom-[25%] left-[0%] z-50 transition-transform duration-[200ms] ease-out pointer-events-none"
                  style={{ transform: `translate3d(${mousePos.x * -50}px, ${mousePos.y * -50}px, 0)` }}
                >
                  <Heart className="w-5 h-5 text-rose-400 opacity-80" strokeWidth={2.5} />
                </div>
              </div>
            </div>
          </div>

          {/* --- FLOATING UPWARD CARDS PARALLAX TRANSITION --- */}
          <div className="relative w-full max-w-5xl mx-auto z-30 hidden md:flex justify-center items-end gap-12 h-0 pointer-events-none">
            
            {/* Card Kiri (Naik sedang) */}
            <div 
              className="w-40 h-56 bg-white dark:bg-slate-900 p-2.5 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 absolute -top-16 left-16 transition-transform duration-75"
              style={{ transform: `translateY(${scrollY * -0.2}px) rotate(-8deg)` }}
            >
              <div className="w-full h-[75%] bg-rose-100 dark:bg-slate-800 rounded-xl flex items-center justify-center overflow-hidden">
                <Smile className="w-10 h-10 text-rose-300 dark:text-slate-600" strokeWidth={1.5} />
              </div>
              <div className="mt-3 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">BESTIES</div>
            </div>

            {/* Card Tengah (Naik Paling Cepat) */}
            <div 
              className="w-56 h-72 bg-white dark:bg-slate-900 p-3 rounded-[1.5rem] shadow-[0_30px_60px_rgba(0,0,0,0.1)] dark:shadow-[0_30px_60px_rgba(0,0,0,0.5)] border border-slate-100 dark:border-slate-800 absolute -top-40 left-1/2 transition-transform duration-75"
              style={{ transform: `translateX(-50%) translateY(${scrollY * -0.35}px) rotate(3deg)` }}
            >
              <div className="w-full h-[82%] bg-amber-50 dark:bg-slate-800 rounded-2xl border border-amber-100 dark:border-slate-700 flex flex-col gap-2 p-2">
                 <div className="flex-1 bg-amber-200/50 dark:bg-slate-700 rounded-lg" />
                 <div className="flex-1 bg-amber-300/50 dark:bg-slate-700 rounded-lg" />
                 <div className="flex-1 bg-amber-400/50 dark:bg-slate-700 rounded-lg flex items-center justify-center">
                    <Heart className="w-6 h-6 text-white dark:text-slate-500 fill-white dark:fill-slate-500" />
                 </div>
              </div>
              <div className="mt-3 text-center text-[11px] font-bold text-slate-400 uppercase tracking-widest">MEMORIES</div>
            </div>

            {/* Card Kanan (Naik Lambat) */}
            <div 
              className="w-40 h-56 bg-white dark:bg-slate-900 p-2.5 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 absolute -top-8 right-16 transition-transform duration-75"
              style={{ transform: `translateY(${scrollY * -0.12}px) rotate(12deg)` }}
            >
              <div className="w-full h-[75%] bg-sky-100 dark:bg-slate-800 rounded-xl flex items-center justify-center overflow-hidden">
                <Camera className="w-10 h-10 text-sky-300 dark:text-slate-600" strokeWidth={1.5} />
              </div>
              <div className="mt-3 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">SMILE</div>
            </div>

          </div>
          {/* --------------------------------------------------- */}

        </div>

        {/* Features / Workflow Section */}
        <section className="w-full py-24 pt-32 bg-white/95 dark:bg-slate-900/95 border-t border-rose-50 dark:border-slate-800/50 relative z-20 backdrop-blur-xl shadow-[0_-20px_40px_rgba(0,0,0,0.02)]">
          <div className="max-w-7xl mx-auto px-6">
            <div className="mb-16 text-center md:text-left">
              <span className="text-xs font-bold text-rose-400 uppercase tracking-widest block mb-2">Cara Kerja</span>
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-800 dark:text-white">Empat Langkah Seru.</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { step: "01", color: "rose", title: "Daftar Dulu", desc: "Sebutkan nama dan pilih jumlah sesimu ke kakak operator." },
                { step: "02", color: "amber", title: "Siapkan Pose", desc: "Selesaikan pembayaran praktis via QRIS, lalu bersiaplah." },
                { step: "03", color: "sky", title: "Say Cheese!", desc: "Pilih bingkai lucu, pakai filter favorit, dan mulai bergaya." },
                { step: "04", color: "fuchsia", title: "Simpan & Share", desc: "Tulis namamu di foto dan unduh langsung ke HP kamu!" }
              ].map((item, idx) => (
                <div key={item.step} className="flex flex-col gap-5 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg bg-${item.color}-100 text-${item.color}-500 dark:bg-slate-800 dark:text-${item.color}-400`}>
                    {idx + 1}
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-slate-800 dark:text-slate-100">{item.title}</h4>
                    <p className="text-sm font-medium text-slate-500 mt-2 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Minimalist Gallery Section */}
        <section className="w-full py-24 bg-[#FFFBF7] dark:bg-slate-950 relative z-20">
          <div className="max-w-7xl mx-auto px-6">
            <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                 <span className="text-xs font-bold text-sky-400 uppercase tracking-widest block mb-2">Papan Cerita</span>
                <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-800 dark:text-white">Galeri Hari Ini.</h2>
              </div>
              <div className="inline-flex items-center gap-2 bg-white dark:bg-slate-900 px-4 py-2 rounded-full border border-slate-100 dark:border-slate-800 text-sm text-slate-600 font-bold shadow-sm w-fit">
                <ImageIcon className="w-4 h-4 text-sky-400" />
                {photos.length} Momen Tersimpan
              </div>
            </div>

            {photos.length === 0 ? (
              <div className="py-24 border-2 border-dashed border-rose-200 dark:border-slate-800 rounded-3xl flex flex-col items-center justify-center gap-4 bg-white/50 dark:bg-slate-900/20">
                <div className="w-16 h-16 rounded-full bg-rose-50 dark:bg-slate-800/50 flex items-center justify-center">
                  <Heart className="w-8 h-8 text-rose-300" />
                </div>
                <div className="text-center">
                  <p className="text-base font-bold text-slate-700 dark:text-slate-200">Belum ada foto nih!</p>
                  <p className="text-sm font-medium text-slate-500 mt-1">Ayo jadi yang pertama memajang senyummu di sini.</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {photos.slice(0, 10).map((photo: PhotoStrip, idx: number) => (
                  <div 
                    key={photo.id} 
                    onClick={() => setSelectedPhoto(photo)}
                    className={`group flex flex-col p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:shadow-rose-100/40 dark:hover:shadow-none transition-all duration-500 hover:-translate-y-2 cursor-pointer ${idx % 2 === 0 ? 'hover:rotate-1' : 'hover:-rotate-1'}`}
                  >
                    <div className="w-full relative rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center pt-[130%]">
                      {photo.dataUrl ? (
                        <>
                          <img
                            src={photo.dataUrl}
                            alt={photo.customerName || "Photostrip"}
                            className="absolute top-0 left-0 w-full h-full object-contain p-2 transition-transform duration-700 group-hover:scale-105"
                          />
                          {/* Hover Overlay Button */}
                          <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/10 transition-colors duration-300 flex items-center justify-center backdrop-blur-[1px]">
                            <div className="translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                              <div className="h-10 w-10 bg-white/95 text-slate-700 rounded-full flex items-center justify-center shadow-lg border border-slate-100">
                                <Maximize2 className="w-4 h-4" />
                              </div>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-6 h-6 rounded-full border-2 border-rose-500/20 border-t-rose-500 animate-spin" />
                        </div>
                      )}
                    </div>
                    <div className="pt-3 px-1 text-center">
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">{photo.customerName || "Si Manis"}</p>
                      <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 mt-0.5">{photo.timestamp}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* --- MODERN FAT FOOTER --- */}
        <footer className="w-full bg-white dark:bg-slate-950 border-t border-rose-100/60 dark:border-slate-800/60 relative z-20 overflow-hidden">
          {/* Top Edge Gradient Divider */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-rose-300 dark:via-rose-700/50 to-transparent opacity-50" />
          
          <div className="max-w-7xl mx-auto px-6 pt-16 pb-8">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-6 mb-12">
              
              {/* Brand & Description Column */}
              <div className="md:col-span-5 flex flex-col gap-5">
                <div className="flex items-center gap-3">
                  {config.logoUrl ? (
                    <div className="w-10 h-10 rounded-xl overflow-hidden bg-white dark:bg-zinc-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center shadow-sm">
                      <img src={config.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-400 to-orange-400 flex items-center justify-center text-white font-extrabold tracking-tighter text-sm shadow-md shadow-rose-200 dark:shadow-none">
                      GB
                    </div>
                  )}
                  <span className="font-extrabold tracking-tight text-xl text-slate-800 dark:text-slate-100">
                    {config.eventName || "GLOWBOOTH"}
                  </span>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed max-w-[90%] md:max-w-sm">
                  Sistem photobooth virtual interaktif. Mengabadikan setiap momen dan senyuman dengan pengalaman digital yang modern & mulus.
                </p>
              </div>

              {/* Links & Socials Column */}
              <div className="md:col-span-7 flex flex-wrap gap-12 md:justify-end">
                <div className="flex flex-col gap-4">
                  <h4 className="font-bold text-slate-800 dark:text-slate-100 text-[15px]">Layanan</h4>
                  <a href="#" className="text-sm font-medium text-slate-500 hover:text-rose-500 transition-colors">Photobooth Event</a>
                  <a href="#" className="text-sm font-medium text-slate-500 hover:text-rose-500 transition-colors">Wedding Booth</a>
                  <a href="#" className="text-sm font-medium text-slate-500 hover:text-rose-500 transition-colors">Corporate Setup</a>
                </div>
                
                <div className="flex flex-col gap-4">
                  <h4 className="font-bold text-slate-800 dark:text-slate-100 text-[15px]">Sosial Media</h4>
                  <a href="#" className="text-sm font-medium text-slate-500 hover:text-rose-500 transition-colors flex items-center gap-2">
                    <Instagram className="w-4 h-4"/> Instagram
                  </a>
                  <a href="#" className="text-sm font-medium text-slate-500 hover:text-rose-500 transition-colors flex items-center gap-2">
                    <Twitter className="w-4 h-4"/> Twitter
                  </a>
                </div>
              </div>
            </div>

            {/* Bottom Bar (Copyright & Server Status) */}
            <div className="pt-8 border-t border-slate-100 dark:border-slate-800/80 flex flex-col md:flex-row items-center justify-between gap-6">
              <p className="text-slate-400 dark:text-slate-500 text-[13px] font-medium flex items-center gap-1.5 text-center md:text-left">
                &copy; {new Date().getFullYear()} {config.eventName || "GLOWBOOTH"}. Dibuat dengan <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400/20" /> di Indonesia.
              </p>
              
              {/* Server Status Badge */}
              <div className="flex items-center gap-2.5 px-3.5 py-1.5 bg-slate-50 dark:bg-slate-900/50 rounded-full border border-slate-200 dark:border-slate-800 shadow-sm cursor-default">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-[11px] font-extrabold text-slate-600 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5" />
                  Sistem Berjalan Lokal
                </span>
              </div>
            </div>
          </div>
        </footer>

      </div>

      {/* Minimalist Premium Photo Strip Preview Modal */}
      {selectedPhoto && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-zinc-900/90 backdrop-blur-sm transition-opacity duration-300"
          onClick={() => setSelectedPhoto(null)}
        >
          <div 
            className="relative group animate-in fade-in zoom-in-95 duration-300 flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute -top-3 -right-3 md:-top-4 md:-right-4 p-1.5 md:p-2 bg-zinc-800 hover:bg-zinc-700 text-white/90 rounded-full shadow-lg transition-all cursor-pointer z-10 border border-white/10"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Photo Strip Image */}
            <img
              src={selectedPhoto.dataUrl}
              alt={selectedPhoto.customerName || "Photostrip"}
              className="max-h-[85vh] max-w-[90vw] object-contain rounded-xl md:rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.4)] ring-1 ring-white/10"
            />
          </div>
        </div>
      )}
    </>
  );
}