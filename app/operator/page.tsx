"use client";

import { useState, useEffect } from "react";
import { usePhotoboothStore } from "@/app/hooks/usePhotoboothStore";
import { useRouter } from "next/navigation";
import { Sun, Moon, LogOut, Terminal, Activity, MoreVertical, Star, Heart, Sparkles, Camera } from "lucide-react";
import { supabase } from "@/lib/supabase";
import StartScreen from "@/app/operator/components/StartScreen";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export default function OperatorDashboard() {
  const { config } = usePhotoboothStore();
  const router = useRouter();

  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [currentOperator, setCurrentOperator] = useState<string | null>(null);

  // Form Fields State
  const [customerName, setCustomerNameState] = useState("");
  const [customerPhone, setCustomerPhoneState] = useState("");
  const [sessionsCount, setSessionsCountState] = useState(1);

  // Hardware State
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraIdState] = useState<string>("");

  // Session Storage Handlers
  const setSelectedCameraId = (id: string) => {
    setSelectedCameraIdState(id);
    if (typeof window !== "undefined") sessionStorage.setItem("glow_selected_camera_id", id);
  };

  const setCustomerName = (val: string) => {
    setCustomerNameState(val);
    if (typeof window !== "undefined") sessionStorage.setItem("glow_customer_name", val);
  };

  const setCustomerPhone = (val: string) => {
    setCustomerPhoneState(val);
    if (typeof window !== "undefined") sessionStorage.setItem("glow_customer_phone", val);
  };

  const setSessionsCount = (val: number) => {
    setSessionsCountState(val);
    if (typeof window !== "undefined") sessionStorage.setItem("glow_sessions_count", String(val));
  };

  // Initialization & Auth Guard (Secure Supabase Auth check)
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    const checkAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const role = user?.user_metadata?.role;
        const displayName = user?.user_metadata?.display_name || "Operator";

        if (user && role === "operator") {
          setCurrentOperator(displayName);
          sessionStorage.setItem("glow_operator_auth", "true");
          sessionStorage.setItem("glow_operator_name", displayName);
        } else {
          sessionStorage.removeItem("glow_operator_auth");
          sessionStorage.removeItem("glow_operator_name");
          router.replace("/login");
          return;
        }
      } catch (err) {
        console.error("Operator auth check failed:", err);
        router.replace("/login");
        return;
      }

      // Theme initialization
      const isDark = document.documentElement.classList.contains("dark");
      setTheme(isDark ? "dark" : "light");
      
      // Hydrate form states
      const savedName = sessionStorage.getItem("glow_customer_name");
      if (savedName) setCustomerNameState(savedName);
      
      const savedPhone = sessionStorage.getItem("glow_customer_phone");
      if (savedPhone) setCustomerPhoneState(savedPhone);
      
      const savedSessions = sessionStorage.getItem("glow_sessions_count");
      if (savedSessions) setSessionsCountState(Number(savedSessions));
    };

    checkAuth();
  }, [router]);

  // Hardware Initialization
  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices) return;

    const getCameras = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter((device) => device.kind === "videoinput");
        setCameras(videoDevices);
        
        if (videoDevices.length > 0) {
          const savedCamera = sessionStorage.getItem("glow_selected_camera_id");
          if (savedCamera && videoDevices.some(d => d.deviceId === savedCamera)) {
            setSelectedCameraIdState(savedCamera);
          } else {
            setSelectedCameraIdState(videoDevices[0].deviceId);
            sessionStorage.setItem("glow_selected_camera_id", videoDevices[0].deviceId);
          }
        }
      } catch (err) {
        console.error("Error accessing camera list:", err);
      }
    };

    getCameras();
  }, []);

  // Action Handlers
  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    sessionStorage.setItem("glow_theme", newTheme);
    
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const handleOperatorLogout = () => {
    sessionStorage.removeItem("glow_operator_auth");
    sessionStorage.removeItem("glow_operator_name");
    setCurrentOperator(null);
    router.replace("/login");
  };

  const handleRegisterStart = () => {
    if (!customerName.trim() || !customerPhone.trim()) {
      toast.error("Nama dan Nomor HP tidak boleh kosong!");
      return;
    }

    const slugify = (text: string) => {
      return text.toString().toLowerCase().trim()
        .replace(/\s+/g, "-")
        .replace(/[^\w\-]+/g, "")
        .replace(/\-\-+/g, "-");
    };

    const nameSlug = slugify(customerName);
    const cleanPhone = customerPhone.replace(/\D/g, "");
    const last4Digits = cleanPhone.slice(-4) || "0000";
    
    const now = new Date();
    const day = String(now.getDate()).padStart(2, "0");
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const year = now.getFullYear();
    
    const generatedSlug = `${nameSlug}-${last4Digits}-${day}${month}${year}`;

    // Finalize session storage before redirect
    sessionStorage.setItem("glow_customer_name", customerName);
    sessionStorage.setItem("glow_customer_phone", customerPhone);
    sessionStorage.setItem("glow_sessions_count", String(sessionsCount));
    sessionStorage.removeItem("glow_captured_photos");

    router.push(`/operator/${generatedSlug}?step=payment`);
  };

  // Loading State
  if (!currentOperator) {
    return (
      <div className="min-h-screen bg-[#121214] flex flex-col items-center justify-center gap-4 text-zinc-400 font-mono text-xs">
        <div className="w-8 h-8 rounded-full border-2 border-zinc-700 border-t-zinc-300 animate-spin" />
        <span>Memverifikasi Sesi Operator...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FBFBFA] dark:bg-[#0B0B0C] text-zinc-850 dark:text-[#E3E3E3] font-sans flex flex-col selection:bg-zinc-200 dark:selection:bg-zinc-850 transition-colors duration-300 relative overflow-hidden">
      
      {/* Visual Ambient Background Glows - Happy & Cheerful Colors */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] aspect-square rounded-full bg-amber-400/8 dark:bg-amber-500/5 blur-[120px] pointer-events-none z-0 animate-pulse" style={{ animationDuration: '8s' }} />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] aspect-square rounded-full bg-pink-400/8 dark:bg-pink-500/5 blur-[120px] pointer-events-none z-0 animate-pulse" style={{ animationDuration: '10s' }} />
      <div className="absolute top-[20%] right-[-15%] w-[45%] aspect-square rounded-full bg-cyan-400/6 dark:bg-cyan-500/3 blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-[20%] left-[-15%] w-[45%] aspect-square rounded-full bg-purple-400/6 dark:bg-purple-500/3 blur-[120px] pointer-events-none z-0" />

      {/* Floating Photobooth/Polaroid Illustrations & Playful Sparkles */}
      <div className="absolute left-[5%] top-[20%] w-24 h-56 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 shadow-xl rotate-[-12deg] p-2 flex flex-col gap-1.5 pointer-events-none select-none opacity-20 dark:opacity-10 hidden xl:flex z-0">
        <div className="bg-zinc-50 dark:bg-zinc-950 aspect-[4/3] rounded-md flex items-center justify-center">
          <Star className="w-4 h-4 text-amber-400 fill-amber-300 dark:fill-transparent" />
        </div>
        <div className="bg-zinc-50 dark:bg-zinc-950 aspect-[4/3] rounded-md flex items-center justify-center">
          <Camera className="w-4 h-4 text-blue-400" />
        </div>
        <div className="bg-zinc-50 dark:bg-zinc-950 aspect-[4/3] rounded-md flex items-center justify-center">
          <Heart className="w-4 h-4 text-pink-400 fill-pink-300 dark:fill-transparent" />
        </div>
        <div className="mt-auto text-center text-[6px] font-mono tracking-widest text-zinc-450 dark:text-zinc-500 uppercase font-bold">MEMORIES</div>
      </div>

      <div className="absolute right-[5%] top-[25%] w-28 h-32 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 shadow-xl rotate-[15deg] p-2 flex flex-col pointer-events-none select-none opacity-20 dark:opacity-10 hidden xl:flex z-0">
        <div className="bg-zinc-50 dark:bg-zinc-950 w-full aspect-square rounded-md flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-purple-400" />
        </div>
        <div className="mt-auto text-center text-[8px] font-serif italic text-zinc-400 dark:text-zinc-500">smile!</div>
      </div>

      {/* Playful Floating Confetti & Sparkles */}
      <div className="absolute left-[15%] top-[12%] pointer-events-none select-none opacity-25 dark:opacity-10 animate-bounce z-0" style={{ animationDuration: '4s' }}>
        <Sparkles className="w-6 h-6 text-yellow-400 fill-yellow-100 dark:fill-transparent" />
      </div>
      <div className="absolute left-[4%] top-[55%] pointer-events-none select-none opacity-15 dark:opacity-5 animate-pulse z-0" style={{ animationDuration: '3s' }}>
        <Heart className="w-8 h-8 text-pink-400 fill-pink-400" />
      </div>
      <div className="absolute left-[18%] top-[75%] pointer-events-none select-none opacity-20 dark:opacity-10 z-0">
        <Camera className="w-7 h-7 text-blue-400" />
      </div>

      <div className="absolute right-[16%] top-[15%] pointer-events-none select-none opacity-25 dark:opacity-10 animate-pulse z-0" style={{ animationDuration: '5s' }}>
        <Sparkles className="w-5 h-5 text-pink-400 fill-pink-100 dark:fill-transparent" />
      </div>
      <div className="absolute right-[4%] top-[60%] pointer-events-none select-none opacity-20 dark:opacity-8 animate-bounce z-0" style={{ animationDuration: '3.5s' }}>
        <Star className="w-8 h-8 text-yellow-400 fill-yellow-400" />
      </div>
      <div className="absolute right-[18%] top-[78%] pointer-events-none select-none opacity-15 dark:opacity-8 z-0">
        <Sparkles className="w-6 h-6 text-purple-400 fill-purple-100 dark:fill-transparent" />
      </div>

      {/* Floating Three-Dot Menu */}
      <div className="fixed top-6 right-6 z-50">
        <DropdownMenu>
          <DropdownMenuTrigger
            className="w-10 h-10 rounded-lg border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-center hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer shadow-sm transition-all focus:outline-none"
            aria-label="Operator Menu"
          >
            <MoreVertical className="w-5 h-5 text-zinc-650 dark:text-zinc-455" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 mt-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850/80 shadow-lg p-1.5 rounded-lg">
            {/* Account Information */}
            <div className="px-2 py-2 flex flex-col gap-0.5 select-none">
              <span className="text-[9px] text-zinc-405 dark:text-zinc-500 font-bold tracking-wider font-mono block uppercase">OPERATOR AKTIF</span>
              <span className="text-sm font-bold text-zinc-900 dark:text-white truncate">{currentOperator || "Operator"}</span>
              <span className="text-[10px] text-zinc-500 font-mono mt-0.5">{config.eventName || "Photobooth"}</span>
            </div>
            
            <DropdownMenuSeparator />

            {/* Toggle Mode */}
            <DropdownMenuItem 
              onClick={toggleTheme} 
              className="flex items-center gap-2 px-2.5 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded-md cursor-pointer focus:outline-none transition-colors"
            >
              {theme === "dark" ? (
                <>
                  <Sun className="w-4 h-4 text-amber-500" />
                  <span>Mode Terang</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-indigo-500" />
                  <span>Mode Gelap</span>
                </>
              )}
            </DropdownMenuItem>

            {/* Logout */}
            <DropdownMenuItem 
              onClick={handleOperatorLogout} 
              className="flex items-center gap-2 px-2.5 py-2 text-xs font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/25 rounded-md cursor-pointer focus:outline-none transition-colors"
            >
              <LogOut className="w-4 h-4 text-red-500" />
              <span>Keluar Operator</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* ── MAIN WORKSPACE ── */}
      <main className="flex-1 flex items-center justify-center p-6 sm:p-12 z-10">
        <div className="w-full max-w-[480px] animate-fade-in duration-500 flex justify-center">
          <StartScreen
            config={config}
            cameras={cameras}
            selectedCameraId={selectedCameraId}
            setSelectedCameraId={setSelectedCameraId}
            onStart={handleRegisterStart}
            customerName={customerName}
            setCustomerName={setCustomerName}
            customerPhone={customerPhone}
            setCustomerPhone={setCustomerPhone}
            sessionsCount={sessionsCount}
            setSessionsCount={setSessionsCount}
          />
        </div>
      </main>
    </div>
  );
}