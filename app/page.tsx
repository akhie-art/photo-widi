"use client";

import { useState, useEffect } from "react";
import { usePhotoboothStore, PhotoStrip } from "@/app/hooks/usePhotoboothStore";
import { useRouter } from "next/navigation";
import { 
  Sun, 
  Moon, 
  Sparkles, 
  Terminal, 
  Camera, 
  ArrowRight, 
  Image as ImageIcon,
  CheckCircle2,
  Heart,
  ImagePlay,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  const { config, photos } = usePhotoboothStore();
  const router = useRouter();

  const [theme, setTheme] = useState<"dark" | "light">("light");
  const [currentOperator, setCurrentOperator] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoStrip | null>(null);

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
    sessionStorage.setItem("glow_theme", newTheme);
    const root = document.documentElement;
    if (newTheme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  };

  return (
    <>
      {/* Custom Keyframes for Floating Illustration Animation */}
      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(var(--rotation, 0deg)); }
          50% { transform: translateY(-20px) rotate(var(--rotation, 0deg)); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float 6s ease-in-out 3s infinite;
        }
      `}</style>

      <div className="flex-1 bg-[#FFFBF7] dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans flex flex-col justify-between overflow-x-hidden min-h-screen relative transition-colors duration-500">
        
        {/* Soft Pastel Ambient Glows */}
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          <div className="absolute -top-[20%] -left-[10%] w-[50%] md:w-[40%] aspect-square rounded-full bg-rose-200/40 dark:bg-rose-900/20 blur-[120px]" />
          <div className="absolute top-[20%] -right-[10%] w-[45%] aspect-square rounded-full bg-amber-200/30 dark:bg-amber-900/10 blur-[120px]" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px]" />
        </div>

        <div className="flex-1 flex flex-col z-10 relative">
          {/* Header */}
          <header className="w-full border-b border-rose-100/50 dark:border-slate-800/80 bg-[#FFFBF7]/60 dark:bg-slate-950/60 backdrop-blur-xl sticky top-0 z-50 transition-colors duration-300">
            <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
              <div className="flex items-center gap-3 cursor-pointer group" onClick={() => router.push("/")}>
                {config.logoUrl ? (
                  <div className="w-8 h-8 rounded-xl overflow-hidden bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center border border-rose-100/30 dark:border-slate-800 shrink-0">
                    <img src={config.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-400 to-orange-300 flex items-center justify-center text-white font-bold tracking-tighter text-xs shadow-md shadow-rose-200 dark:shadow-none group-hover:scale-105 transition-transform">
                    GB
                  </div>
                )}
                <span className="font-bold tracking-tight text-sm text-slate-800 dark:text-slate-100">
                  {config.eventName ? config.eventName.toUpperCase() : "GLOWBOOTH"}
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
                      className="hover:text-red-500 dark:hover:text-red-400 font-medium transition-colors"
                    >
                      Keluar
                    </button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push("/login")}
                    className="hidden sm:flex h-9 rounded-xl text-xs font-semibold border-rose-200/60 dark:border-slate-800 text-rose-500 dark:text-slate-300 hover:bg-rose-50 dark:hover:bg-slate-800"
                  >
                    Masuk Sistem
                  </Button>
                )}
                
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleTheme}
                  className="h-9 w-9 rounded-xl text-slate-500 hover:text-amber-500 dark:hover:text-amber-300 hover:bg-amber-50 dark:hover:bg-slate-800 transition-colors"
                >
                  {theme === "dark" ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
                </Button>
              </div>
            </div>
          </header>

          {/* Hero Section */}
          <div className="max-w-7xl mx-auto px-6 py-16 md:py-24 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center w-full relative z-10">
            
            {/* Left Content Column */}
            <div className="lg:col-span-6 flex flex-col gap-6 text-left order-2 lg:order-1">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-rose-100 dark:border-slate-800 text-xs font-semibold text-rose-500 dark:text-rose-400 w-fit shadow-sm">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Virtual Photobooth Experience
              </div>

              <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-800 dark:text-white leading-[1.1]">
                Abadikan Momen <br />
                <span className="bg-gradient-to-r from-rose-400 via-orange-400 to-amber-400 bg-clip-text text-transparent">Penuh Senyuman.</span>
              </h1>

              <p className="text-slate-600 dark:text-slate-400 text-base md:text-lg leading-relaxed max-w-xl font-medium">
                Sesi foto studio instan di <strong className="text-slate-800 dark:text-slate-200">{config.eventName}</strong>. Pilih layout favoritmu, terapkan filter manis, dan bawa pulang kenangannya langsung ke genggamanmu!
              </p>

              {/* Feature Checklist */}
              <ul className="space-y-3 mt-2 text-sm font-medium text-slate-600 dark:text-slate-300">
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-rose-400" />
                  <span>Resolusi tinggi super jernih tanpa batas</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-amber-400" />
                  <span>Akses puluhan warna & filter pastel estetik</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-sky-400" />
                  <span>Langsung simpan via scan QR Code pintar</span>
                </li>
              </ul>
            </div>

            {/* Right Illustration Column (CSS Composition) */}
            <div className="lg:col-span-6 w-full h-[400px] md:h-[500px] relative flex items-center justify-center order-1 lg:order-2">
              
              {/* Backglow Circle */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 md:w-80 md:h-80 bg-gradient-to-tr from-rose-300/60 to-amber-200/60 rounded-full blur-[60px] animate-pulse" />

              <div className="relative w-full max-w-sm h-full flex items-center justify-center perspective-[1000px]">
                
                {/* Floating Element 1: Left Photo Strip */}
                <div 
                  className="absolute top-[10%] left-0 md:-left-[10%] w-24 h-32 md:w-28 md:h-40 bg-white dark:bg-slate-800 p-2 md:p-3 rounded-xl shadow-2xl z-20 border border-slate-100 dark:border-slate-700 animate-float"
                  style={{ '--rotation': '-12deg' } as React.CSSProperties}
                >
                  <div className="w-full h-[45%] bg-rose-100 dark:bg-slate-700 rounded-lg mb-2" />
                  <div className="w-full h-[45%] bg-amber-100 dark:bg-slate-700 rounded-lg" />
                </div>

                {/* Floating Element 2: Right Photo Strip */}
                <div 
                  className="absolute bottom-[10%] right-0 md:-right-[10%] w-28 h-36 md:w-32 md:h-44 bg-white dark:bg-slate-800 p-2 md:p-3 rounded-xl shadow-2xl z-30 border border-slate-100 dark:border-slate-700 animate-float-delayed"
                  style={{ '--rotation': '15deg' } as React.CSSProperties}
                >
                  <div className="w-full h-full bg-sky-100 dark:bg-slate-700 rounded-lg flex items-center justify-center">
                    <ImagePlay className="w-8 h-8 text-sky-400/50" />
                  </div>
                </div>

                {/* Central Object: 3D Camera / Booth Icon */}
                <div className="relative z-20 w-48 h-48 md:w-56 md:h-56 bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border-2 border-white dark:border-slate-600 rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(251,113,133,0.3)] dark:shadow-none flex items-center justify-center transform transition-transform hover:scale-105 duration-500">
                  
                  {/* Status indicator */}
                  <div className="absolute top-5 right-5 flex items-center gap-1.5 bg-white/80 dark:bg-slate-700 px-2.5 py-1 rounded-full shadow-sm">
                    <div className={`w-2 h-2 rounded-full ${currentOperator ? 'bg-emerald-400' : 'bg-slate-400'} animate-pulse`} />
                    <span className="text-[9px] font-bold text-slate-600 dark:text-slate-300">REC</span>
                  </div>

                  {/* Camera Lens */}
                  <div className="w-24 h-24 md:w-28 md:h-28 rounded-full bg-gradient-to-br from-rose-400 via-orange-300 to-amber-300 flex items-center justify-center shadow-inner">
                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-slate-900/10 flex items-center justify-center border-4 border-white/30 backdrop-blur-sm">
                      <Camera className="w-8 h-8 md:w-10 md:h-10 text-white" />
                    </div>
                  </div>

                  {/* Aesthetic Lines */}
                  <div className="absolute bottom-5 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-slate-200 dark:bg-slate-600 rounded-full" />
                </div>

                {/* Decorative Accents */}
                <Sparkles className="absolute top-[5%] right-[15%] w-8 h-8 text-amber-400 animate-bounce" />
                <Heart className="absolute bottom-[20%] left-[5%] w-6 h-6 text-rose-400 animate-pulse" />
              </div>
            </div>
            
          </div>
        </div>

        {/* Features / Workflow Section */}
        <section className="w-full py-24 bg-white/50 dark:bg-slate-900/30 border-t border-rose-50 dark:border-slate-800/50 relative z-10 backdrop-blur-sm">
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
        <section className="w-full py-24 bg-[#FFFBF7] dark:bg-slate-950 relative z-10">
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
                {photos.slice(0, 10).map((photo: PhotoStrip) => (
                  <div key={photo.id} className="group flex flex-col gap-3 p-2.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:shadow-rose-100/50 dark:hover:shadow-none transition-all duration-300">
                    <div className="aspect-[2/3.5] rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 relative flex items-center justify-center">
                      {photo.dataUrl ? (
                        <>
                          <img
                            src={photo.dataUrl}
                            alt={photo.customerName || "Photostrip"}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-slate-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]">
                            <Button 
                              onClick={() => setSelectedPhoto(photo)}
                              className="h-9 bg-white text-slate-800 hover:bg-rose-50 hover:text-rose-500 text-xs font-bold rounded-full shadow-lg cursor-pointer"
                            >
                              Lihat Jelas
                            </Button>
                          </div>
                        </>
                      ) : (
                        <div className="w-6 h-6 rounded-full border-2 border-rose-500/20 border-t-rose-500 animate-spin" />
                      )}
                    </div>
                    <div className="px-1 text-center">
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">{photo.customerName || "Si Manis"}</p>
                      <p className="text-[11px] font-medium text-slate-500 mt-0.5">{photo.timestamp}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Footer */}
        <footer className="w-full border-t border-rose-100/50 dark:border-slate-800/80 py-8 bg-white/40 dark:bg-slate-950 text-slate-500 relative z-10 font-medium">
          <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-[13px]">
            <p>&copy; {new Date().getFullYear()} {config.eventName ? config.eventName.toUpperCase() : "GLOWBOOTH"} Ecosystem. Made with <Heart className="w-3.5 h-3.5 inline text-rose-400" />.</p>
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-sky-400" />
              <span>Sistem Infrastruktur Berjalan Lokal</span>
            </div>
          </div>
        </footer>
      </div>

      {/* Premium Photo Strip Preview Modal */}
      {selectedPhoto && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm transition-opacity duration-300"
          onClick={() => setSelectedPhoto(null)}
        >
          <div 
            className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl relative flex flex-col items-center gap-4 animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-4 right-4 p-2 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-full text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer border-none bg-transparent"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Title */}
            <div className="text-center w-full mt-2 select-none">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 truncate px-8">
                {selectedPhoto.customerName || "Tamu"}
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 font-mono mt-1">
                {selectedPhoto.timestamp}
              </p>
            </div>

            {/* Photo Strip Image */}
            <div className="relative rounded-2xl border border-slate-100 dark:border-zinc-800 shadow-md overflow-hidden bg-slate-50 dark:bg-zinc-950 max-h-[50vh] aspect-[500/1202.5] w-[160px] flex items-center justify-center">
              <img
                src={selectedPhoto.dataUrl}
                alt={selectedPhoto.customerName || "Photostrip"}
                className="w-full h-full object-contain"
              />
            </div>

          </div>
        </div>
      )}
    </>
  );
}