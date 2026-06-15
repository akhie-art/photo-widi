"use client";

import { useState, useEffect } from "react";
import { usePhotoboothStore } from "@/app/hooks/usePhotoboothStore";
import { useRouter } from "next/navigation";
import { Sun, Moon, LogOut, Terminal, Activity } from "lucide-react";
import StartScreen from "@/app/operator/components/StartScreen";

export default function OperatorDashboard() {
  const { config } = usePhotoboothStore();
  const router = useRouter();

  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [currentOperator, setCurrentOperator] = useState<string | null>(null);

  // Form Fields State
  const [customerName, setCustomerNameState] = useState("");
  const [customerPhone, setCustomerPhoneState] = useState("");
  const [sessionsCount, setSessionsCountState] = useState(1);

  // Layout & Hardware State
  const [activeLayout, setActiveLayout] = useState<"strip" | "grid" | "polaroid">("strip");
  const [activeFrameId, setActiveFrameId] = useState<string>("");
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraIdState] = useState<string>("");

  const activeLayoutsList = [
    { id: "strip", name: "Classic Strip (4x1)", description: "4 foto berurutan ke bawah", count: 4 },
    { id: "grid", name: "Grid (2x2)", description: "4 foto dalam format kotak", count: 4 },
    { id: "polaroid", name: "Polaroid (1x1)", description: "1 foto tunggal estetik", count: 1 },
  ].filter((l) => config.allowedLayouts ? config.allowedLayouts.includes(l.id) : true);

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

  const handleFrameSelect = (frame: any) => {
    setActiveFrameId(frame.id);
  };

  // Initialization & Auth Guard
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    // Auth Check
    const operatorAuth = sessionStorage.getItem("glow_operator_auth");
    const operatorName = sessionStorage.getItem("glow_operator_name");
    
    if (operatorAuth === "true" && operatorName) {
      setCurrentOperator(operatorName);
    } else {
      router.replace("/login?redirect=/operator");
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
    localStorage.setItem("glow_theme", newTheme);
    
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
    router.replace("/login?redirect=/operator");
  };

  const handleRegisterStart = () => {
    if (!customerName.trim() || !customerPhone.trim()) {
      alert("Nama dan Nomor HP tidak boleh kosong!");
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
    <div className="min-h-screen bg-[#fbfbfb] dark:bg-[#121214] text-zinc-950 dark:text-zinc-50 font-sans flex flex-col selection:bg-zinc-200 dark:selection:bg-zinc-800 transition-colors duration-300">
      
      {/* ── HEADER ── */}
      <header className="w-full border-b border-zinc-200 dark:border-zinc-800/60 bg-white dark:bg-[#121214] sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-20 flex items-center justify-between">
          
          {/* Left: Brand */}
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-zinc-900 dark:bg-white flex items-center justify-center text-white dark:text-zinc-900 font-bold text-sm shadow-sm">
              GB
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-sm leading-tight tracking-tight">Glowbooth</span>
              <span className="text-[11px] text-zinc-500 font-mono mt-1 flex items-center gap-1.5">
                <Terminal className="w-3 h-3" />
                Operator Panel
              </span>
            </div>
          </div>
          
          {/* Right: Controls */}
          <div className="flex items-center gap-3">
            <span className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 dark:bg-zinc-900 rounded-lg text-[11px] font-mono font-medium text-zinc-600 dark:text-zinc-400">
              <Activity className="w-3.5 h-3.5" />
              {currentOperator}
            </span>

            <span className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg text-[11px] font-mono font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              {config.eventName}
            </span>

            <div className="w-px h-5 bg-zinc-200 dark:bg-zinc-800 mx-1 hidden sm:block" />

            <button
              onClick={toggleTheme}
              className="w-9 h-9 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 flex items-center justify-center transition-colors text-zinc-600 dark:text-zinc-400"
              aria-label="Toggle Theme"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <button
              onClick={handleOperatorLogout}
              className="w-9 h-9 rounded-lg border border-red-200 dark:border-red-900/30 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 flex items-center justify-center transition-colors"
              title="Keluar Operator"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* ── MAIN WORKSPACE ── */}
      <main className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-[480px] animate-fade-in duration-500">
          <StartScreen
            config={config}
            activeLayoutsList={activeLayoutsList}
            activeLayout={activeLayout}
            setActiveLayout={setActiveLayout}
            activeFrameId={activeFrameId}
            handleFrameSelect={handleFrameSelect}
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