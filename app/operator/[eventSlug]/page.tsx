"use client";

import { useState, useEffect } from "react";
import { usePhotoboothStore } from "@/app/hooks/usePhotoboothStore";
import { useRouter, useParams } from "next/navigation";
import { Sun, Moon, LogOut, Terminal, Activity, MoreVertical, Star, Heart, Sparkles, Camera, Layers } from "lucide-react";
import { supabase } from "@/lib/supabase";
import StartScreen from "@/app/operator/components/StartScreen";
import TemplateDecoration from "@/app/operator/components/TemplateDecoration";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

const THEME_GLOWS = {
  sunset: {
    topLeft: "bg-amber-400/8 dark:bg-amber-500/5",
    bottomRight: "bg-pink-400/8 dark:bg-pink-500/5",
    topRight: "bg-cyan-400/6 dark:bg-cyan-500/3",
    bottomLeft: "bg-purple-400/6 dark:bg-purple-500/3",
  },
  neon: {
    topLeft: "bg-fuchsia-400/8 dark:bg-fuchsia-500/5",
    bottomRight: "bg-cyan-400/8 dark:bg-cyan-500/5",
    topRight: "bg-violet-400/6 dark:bg-violet-500/3",
    bottomLeft: "bg-rose-400/6 dark:bg-rose-500/3",
  },
  luxury: {
    topLeft: "bg-yellow-500/8 dark:bg-yellow-600/5",
    bottomRight: "bg-amber-500/8 dark:bg-amber-600/5",
    topRight: "bg-zinc-400/6 dark:bg-zinc-500/3",
    bottomLeft: "bg-orange-400/6 dark:bg-orange-500/3",
  },
  romantic: {
    topLeft: "bg-rose-400/8 dark:bg-rose-500/5",
    bottomRight: "bg-pink-400/8 dark:bg-pink-500/5",
    topRight: "bg-red-400/6 dark:bg-red-500/3",
    bottomLeft: "bg-rose-300/6 dark:bg-rose-400/3",
  },
  emerald: {
    topLeft: "bg-emerald-400/8 dark:bg-emerald-500/5",
    bottomRight: "bg-teal-400/8 dark:bg-teal-500/5",
    topRight: "bg-cyan-400/6 dark:bg-cyan-500/3",
    bottomLeft: "bg-green-400/6 dark:bg-green-500/3",
  },
};

export default function OperatorEventDashboard() {
  const { config, updateConfig, isLoading } = usePhotoboothStore();
  const router = useRouter();
  const params = useParams();
  const eventSlug = Array.isArray(params?.eventSlug) ? params.eventSlug[0] : params?.eventSlug;

  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [currentOperator, setCurrentOperator] = useState<string | null>(null);

  // Dynamic Font Loader
  useEffect(() => {
    if (typeof window === "undefined" || !config?.fontStyle) return;
    const fontId = "dynamic-operator-font";
    let linkElement = document.getElementById(fontId) as HTMLLinkElement;
    if (!linkElement) {
      linkElement = document.createElement("link");
      linkElement.id = fontId;
      linkElement.rel = "stylesheet";
      document.head.appendChild(linkElement);
    }
    
    const getFontUrl = (f: string) => {
      switch (f) {
        case "outfit": return "https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap";
        case "syne": return "https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&display=swap";
        case "playfair": return "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&display=swap";
        case "cabinet": return "https://api.fontshare.com/v2/css?f[]=cabinet-grotesk@800,700,400,300&display=swap";
        case "inter":
        default:
          return "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap";
      }
    };
    linkElement.href = getFontUrl(config.fontStyle);
  }, [config?.fontStyle]);

  const getFontFamilyName = (f: string) => {
    switch (f) {
      case "outfit": return "'Outfit', sans-serif";
      case "syne": return "'Syne', sans-serif";
      case "playfair": return "'Playfair Display', serif";
      case "cabinet": return "'Cabinet Grotesk', sans-serif";
      case "inter":
      default:
        return "'Inter', sans-serif";
    }
  };

  // Form Fields State
  const [customerName, setCustomerNameState] = useState("");
  const [customerPhone, setCustomerPhoneState] = useState("");
  const [sessionsCount, setSessionsCountState] = useState<number | "">("");
  const [customization, setCustomization] = useState<any>(null);

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

  const setSessionsCount = (val: number | "") => {
    setSessionsCountState(val);
    if (typeof window !== "undefined") sessionStorage.setItem("glow_sessions_count", String(val));
  };

  // Load event-specific configuration locally (without DB pollution)
  useEffect(() => {
    if (isLoading || !eventSlug) return;
    
    let active = true;

    const loadEventConfig = async () => {
      try {
        const { data: event, error } = await supabase
          .from("events")
          .select("*")
          .eq("slug", eventSlug)
          .single();

        if (error || !event) {
          console.warn("No active event found for slug:", eventSlug);
          toast.error("Event tidak ditemukan!");
          router.replace("/operator?step=event-terjadwal");
          return;
        }

        // Cache the verified event slug
        if (typeof window !== "undefined") {
          sessionStorage.setItem("glow_active_event_slug", eventSlug);
        }

        let uiTheme = event.bg_theme || "sunset";
        let uiFont = "inter";
        let welcomeText = "";
        let footerText = "";
        let logoUrl = event.logo_url || "";
        let qrisUrl = event.qris_url || "";
        let showPayment = event.show_payment !== false;
        let showSetup = event.show_setup !== false;
        let mirrorDefault = true;
        let countdownDuration = 3;
        let allowedLayouts = ["strip"];

        if (event.ui_template_id) {
          try {
            const [tempRes, compsRes] = await Promise.all([
              supabase.from("ui_templates").select("*").eq("id", event.ui_template_id).single(),
              supabase.from("ui_components").select("*").eq("ui_template_id", event.ui_template_id)
            ]);
            const template = tempRes.data;
            const tempError = tempRes.error;
            const comps = compsRes.data;

            if (!tempError && template) {
              uiTheme = template.bg_theme || "sunset";
              uiFont = template.font_style || "inter";
              welcomeText = template.welcome_text || "";
              footerText = template.footer_text || "";
              if (template.logo_url) logoUrl = template.logo_url;
              if (template.qris_url) qrisUrl = template.qris_url;
              showPayment = template.show_payment !== false;
              showSetup = template.show_setup !== false;
              mirrorDefault = template.mirror_default !== false;
              countdownDuration = template.countdown_duration ?? 3;
              allowedLayouts = template.allowed_layouts || ["strip"];

              const customizationData: any = {};
              if (comps) {
                comps.forEach(c => {
                  Object.assign(customizationData, c.properties);
                });
              }

              if (Object.keys(customizationData).length > 0) {
                setCustomization(customizationData);
                try {
                  localStorage.setItem(`glowbooth_customization_${template.id}`, JSON.stringify(customizationData));
                } catch (e) {
                  console.error("Failed to sync localStorage:", e);
                }
              } else {
                const stored = localStorage.getItem(`glowbooth_customization_${template.id}`);
                if (stored) {
                  setCustomization(JSON.parse(stored));
                } else {
                  setCustomization(null);
                }
              }
            }
          } catch (err) {
            console.error("Gagal memuat template UI:", err);
          }
        } else {
          setCustomization(null);
        }

        await updateConfig({
          eventName: event.name,
          date: event.date || "",
          location: event.location || "",
          pricePerSession: event.price_per_session ?? 25000,
          logoUrl,
          qrisUrl,
          allowedPresets: event.allowed_presets || [],
          allowedFilters: event.allowed_filters || [],
          allowedStickers: event.allowed_stickers || [],
          bgTheme: uiTheme,
          fontStyle: uiFont,
          welcomeText,
          footerText,
          showPayment,
          showSetup,
          mirrorDefault,
          countdownDuration,
          allowedLayouts,
        }, false);
      } catch (err) {
        console.error("Error fetching event settings:", err);
      }
    };
    
    loadEventConfig();

    return () => {
      active = false;
    };
  }, [eventSlug, updateConfig, isLoading, router]);

  // Subscribe to real-time changes of this specific event
  useEffect(() => {
    if (!eventSlug) return;
    
    const channel = supabase
      .channel(`operator-dashboard-event-sync-${eventSlug}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "events", filter: `slug=eq.${eventSlug}` },
        (payload) => {
          const updatedEvent = payload.new;
          if (updatedEvent) {
            updateConfig({
              eventName: updatedEvent.name,
              date: updatedEvent.date || "",
              location: updatedEvent.location || "",
              pricePerSession: updatedEvent.price_per_session ?? 25000,
              logoUrl: updatedEvent.logo_url || "",
              qrisUrl: updatedEvent.qris_url || "",
              allowedPresets: updatedEvent.allowed_presets || [],
              allowedFilters: updatedEvent.allowed_filters || [],
              allowedStickers: updatedEvent.allowed_stickers || [],
              bgTheme: updatedEvent.bg_theme || "sunset",
              showPayment: updatedEvent.show_payment !== false,
              showSetup: updatedEvent.show_setup !== false,
            }, false);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventSlug, updateConfig]);

  // Append ?step=registrasi to the URL on mount if it's not present
  useEffect(() => {
    if (typeof window === "undefined" || !eventSlug) return;
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get("step") !== "registrasi") {
      searchParams.set("step", "registrasi");
      router.replace(`/operator/${eventSlug}?${searchParams.toString()}`);
    }
  }, [eventSlug, router]);

  // Initialization & Auth Guard (Secure Supabase Auth check)
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    let mounted = true;

    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          const role = session.user?.user_metadata?.role;
          const displayName = session.user?.user_metadata?.display_name || "Operator";

          if (role === "operator") {
            if (mounted) {
              setCurrentOperator(displayName);
              sessionStorage.setItem("glow_operator_auth", "true");
              sessionStorage.setItem("glow_operator_name", displayName);
            }
          } else {
            if (mounted) {
              sessionStorage.removeItem("glow_operator_auth");
              sessionStorage.removeItem("glow_operator_name");
              router.replace("/login");
            }
            return;
          }
        } else {
          if (mounted) {
            sessionStorage.removeItem("glow_operator_auth");
            sessionStorage.removeItem("glow_operator_name");
            router.replace("/login");
          }
          return;
        }
      } catch (err) {
        console.error("Operator auth check failed:", err);
        const operatorAuthFlag = sessionStorage.getItem("glow_operator_auth");
        const displayName = sessionStorage.getItem("glow_operator_name") || "Operator";
        if (operatorAuthFlag === "true" && displayName) {
          if (mounted) {
            setCurrentOperator(displayName);
          }
        } else {
          if (mounted) {
            sessionStorage.removeItem("glow_operator_auth");
            sessionStorage.removeItem("glow_operator_name");
            router.replace("/login");
          }
          return;
        }
      }

      if (!mounted) return;

      // Theme initialization
      const isDark = document.documentElement.classList.contains("dark");
      setTheme(isDark ? "dark" : "light");
      
      // Hydrate form states
      const savedName = sessionStorage.getItem("glow_customer_name");
      if (savedName) setCustomerNameState(savedName);
      
      const savedPhone = sessionStorage.getItem("glow_customer_phone");
      if (savedPhone) setCustomerPhoneState(savedPhone);
      
      const savedSessions = sessionStorage.getItem("glow_sessions_count");
      if (savedSessions) {
        const val = Number(savedSessions);
        setSessionsCountState(val > 0 ? val : "");
      }
    };

    checkAuth();

    return () => {
      mounted = false;
    };
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

  const handleOperatorLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Sign out error:", err);
    }
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

    const firstStep = config.showPayment !== false ? "payment" : "capture";
    router.push(`/operator/${eventSlug}/${generatedSlug}?step=${firstStep}`);
  };

  // Loading State
  if (!currentOperator || isLoading) {
    return (
      <div className="min-h-screen bg-[#121214] flex flex-col items-center justify-center gap-4 text-zinc-400 font-mono text-xs">
        <div className="w-8 h-8 rounded-full border-2 border-zinc-700 border-t-zinc-300 animate-spin" />
        <span>Memverifikasi Sesi Event Operator...</span>
      </div>
    );
  }

  const bgTheme = (config?.bgTheme as keyof typeof THEME_GLOWS) || "sunset";
  const themeGlow = THEME_GLOWS[bgTheme] || THEME_GLOWS.sunset;

  const getPageBgClass = (style?: string) => {
    switch (style) {
      case "neobrutalist":
        return "bg-[#FFF9F2] dark:bg-[#0f172a] text-black dark:text-white";
      case "frameless":
        return "bg-[#FAF6F0] dark:bg-[#181112] text-zinc-850 dark:text-[#e3e3e3]";
      case "glass":
        return "bg-gradient-to-br from-[#0a0d1a] via-[#05060b] to-[#020305] text-zinc-100 dark:text-zinc-100";
      case "classic":
      default:
        return "bg-[#FBFBFA] dark:bg-[#0B0B0C] text-zinc-850 dark:text-[#E3E3E3]";
    }
  };

  return (
    <div className={`min-h-screen ${getPageBgClass(customization?.cardStyle)} flex flex-col selection:bg-zinc-200 dark:selection:bg-zinc-850 transition-colors duration-300 relative overflow-x-hidden overflow-y-auto`} style={{ fontFamily: getFontFamilyName(config?.fontStyle || 'inter') }}>
      
      {/* Dynamic Template-specific visual decorations */}
      <TemplateDecoration cardStyle={customization?.cardStyle} customization={customization} />

      {/* Floating Menu */}
      <div className="fixed top-6 right-6 z-50">
        <DropdownMenu>
          <DropdownMenuTrigger
            className="w-10 h-10 rounded-lg border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-center hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer shadow-sm transition-all focus:outline-none"
            aria-label="Operator Menu"
          >
            <MoreVertical className="w-5 h-5 text-zinc-650 dark:text-zinc-455" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 mt-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850/80 shadow-lg p-1.5 rounded-lg">
            <div className="px-2 py-2 flex flex-col gap-0.5 select-none">
              <span className="text-[9px] text-zinc-405 dark:text-zinc-500 font-bold tracking-wider font-mono block uppercase">OPERATOR AKTIF</span>
              <span className="text-sm font-bold text-zinc-900 dark:text-white truncate">{currentOperator || "Operator"}</span>
              <span className="text-[10px] text-zinc-500 font-mono mt-0.5">{config.eventName || "Photobooth"}</span>
            </div>
            
            <DropdownMenuSeparator />

            {/* Back to select event */}
            <DropdownMenuItem 
              onClick={() => router.push("/operator?step=event-terjadwal")} 
              className="flex items-center gap-2 px-2.5 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded-md cursor-pointer focus:outline-none transition-colors"
            >
              <Layers className="w-4 h-4 text-emerald-500" />
              <span>Ganti Event</span>
            </DropdownMenuItem>

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

            <DropdownMenuSeparator />

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
            customization={customization}
          />
        </div>
      </main>
    </div>
  );
}
