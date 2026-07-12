"use client";

/* eslint-disable react-hooks/set-state-in-effect */

import { useState, useEffect, useRef } from "react";
import { usePhotoboothStore, PresetTemplate, PlacedSticker, StickerAsset } from "../../../hooks/usePhotoboothStore";
import { supabase } from "@/lib/supabase";
import { renderPhotoStrip } from "../../../utils/canvasRenderer";
import { playBeep, playShutterSound } from "../../../utils/audio";
import { useRouter, useParams } from "next/navigation";
import { Sun, Moon, Sparkles, Heart, Star, Camera } from "lucide-react";
import { toast } from "sonner";

import CaptureScreen from "../../components/CaptureScreen";
import PaymentScreen from "../../components/PaymentScreen";
import ShareScreen from "../../components/ShareScreen";
import TemplateDecoration from "../../components/TemplateDecoration";

const FILTERS = [
  { id: "00000000-0000-0000-0000-000000000001", name: "Original", css: "none" },
  { id: "00000000-0000-0000-0000-000000000002", name: "Retro B&W", css: "grayscale(1) contrast(1.3) brightness(1.05)" },
  { id: "00000000-0000-0000-0000-000000000003", name: "Warm Film", css: "sepia(0.4) contrast(1.1) saturate(1.1) brightness(0.95)" },
  { id: "00000000-0000-0000-0000-000000000004", name: "Neon Glow", css: "hue-rotate(240deg) saturate(1.8) brightness(1.1)" },
  { id: "00000000-0000-0000-0000-000000000005", name: "Sepia Dream", css: "sepia(0.8) hue-rotate(-20deg) saturate(1.3)" },
  { id: "00000000-0000-0000-0000-000000000006", name: "Cyberpunk", css: "hue-rotate(295deg) saturate(1.7) contrast(1.15)" },
  { id: "00000000-0000-0000-0000-000000000007", name: "Pop Art", css: "saturate(2.3) contrast(1.25)" },
  { id: "00000000-0000-0000-0000-000000000008", name: "Classic Noir", css: "grayscale(1) contrast(1.9) brightness(0.9)" },
];

const LAYOUTS = [
  { id: "strip", name: "Classic Strip (4x1)", description: "4 foto berurutan ke bawah", count: 4 },
  { id: "grid", name: "Grid (2x2)", description: "4 foto dalam format kotak", count: 4 },
  { id: "polaroid", name: "Polaroid (1x1)", description: "1 foto tunggal estetik", count: 1 },
];

const POSE_SUGGESTIONS = [
  "Pose 1: Tunjukkan Senyuman Terbaik Anda",
  "Pose 2: Gaya Peace atau Jempol",
  "Pose 3: Gaya Keren / Wajah Serius",
  "Pose 4: Berikan Pose Kreatif atau Unik",
];

function getPresetLayout(preset: PresetTemplate | undefined): "strip" | "grid" | "polaroid" {
  if (!preset) return "strip";
  const name = (preset.name || "").toLowerCase();
  if (name.includes("grid")) return "grid";
  if (name.includes("polaroid")) return "polaroid";
  if (preset.customSlots) {
    if (preset.customSlots.length === 1) return "polaroid";
    const firstXPct = preset.customSlots[0]?.xPct ?? 0;
    const isGrid = preset.customSlots.some(s => Math.abs((s.xPct ?? 0) - firstXPct) > 5);
    if (isGrid) return "grid";
  }
  return "strip";
}

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

export default function CustomerBoothSession() {
  const { config, addPhoto, updateConfig, isLoading } = usePhotoboothStore();
  const router = useRouter();
  const params = useParams();
  const eventSlug = Array.isArray(params?.eventSlug) ? params.eventSlug[0] : params?.eventSlug;
  const sessionSlug = Array.isArray(params?.sessionSlug) ? params.sessionSlug[0] : params?.sessionSlug;

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

  const [customization, setCustomization] = useState<any>(null);

  // Load event-specific configuration if eventSlug is present
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
          return;
        }

        // Cache the verified event slug
        if (typeof window !== "undefined") {
          sessionStorage.setItem("glow_active_event_slug", eventSlug);
        }

        if (active) {
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
        }
      } catch (err) {
        console.error("Error fetching event settings:", err);
      }
    };
    
    loadEventConfig();

    return () => {
      active = false;
    };
  }, [eventSlug, updateConfig, isLoading]);

  // Subscribe to real-time changes of this specific event
  useEffect(() => {
    if (!eventSlug) return;
    
    const channel = supabase
      .channel(`operator-session-event-sync-${eventSlug}`)
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

  const [step, setStep] = useState<"start" | "payment" | "capture" | "share">("payment");
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [authorized, setAuthorized] = useState(false);

  const [activeLayout, setActiveLayout] = useState<"strip" | "grid" | "polaroid">("strip");
  const [activeFilter, setActiveFilter] = useState(FILTERS[0]);
  const [activeFrameId, setActiveFrameId] = useState<string>("");

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isMirrored, setIsMirrored] = useState(true);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("glow_selected_camera_id") || "";
    }
    return "";
  });
  const [countdownDuration, setCountdownDuration] = useState<number>(3);
  const hasInitializedDuration = useRef(false);

  // Capture State
  const [capturedPhotos, setCapturedPhotosState] = useState<string[]>([]);
  const [currentCaptureNum, setCurrentCaptureNum] = useState(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [flashActive, setFlashActive] = useState(false);
  const [poseAlert, setPoseAlert] = useState<string | null>(null);

  // Result state
  const [compiledStripUrl, setCompiledStripUrl] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState(false);
  const [customText, setCustomText] = useState("");
  const [lastSavedPhotoId, setLastSavedPhotoId] = useState<string | null>(null);

  // Sticker state
  const [placedStickers, setPlacedStickers] = useState<PlacedSticker[]>([]);

  const handleAddSticker = (sticker: StickerAsset) => {
    const id = `ps_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const xPct = 30 + Math.random() * 40;
    const yPct = 20 + Math.random() * 60;
    setPlacedStickers((prev) => [
      ...prev,
      { id, stickerId: sticker.id, xPct, yPct, scalePct: 20, rotation: Math.round((Math.random() - 0.5) * 30) },
    ]);
    toast("Stiker ditambahkan", { duration: 1200, icon: "✨" });
  };

  const handleRemoveSticker = (id: string) => {
    setPlacedStickers((prev) => prev.filter((ps) => ps.id !== id));
  };

  const handleUpdateSticker = (id: string, updates: Partial<PlacedSticker>) => {
    setPlacedStickers((prev) =>
      prev.map((sticker) =>
        sticker.id === id ? { ...sticker, ...updates } : sticker
      )
    );
  };

  // Customer registration state
  const [customerName, setCustomerNameState] = useState("");
  const [customerPhone, setCustomerPhoneState] = useState("");
  const [sessionsCount, setSessionsCountState] = useState(1);
  const [currentSessionNum, setCurrentSessionNum] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<"qris" | "cash" | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const skipNextStopRef = useRef(false);

  // Initialization & Auth Guard (Secure Supabase Auth check)
  useEffect(() => {
    if (typeof window === "undefined") return;

    let mounted = true;

    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const role = session.user?.user_metadata?.role;
          if (role === "operator") {
            if (mounted) setAuthorized(true);
          } else {
            if (mounted) router.replace("/login");
          }
        } else {
          if (mounted) router.replace("/login");
        }
      } catch (err) {
        console.error("Session page auth check failed:", err);
        const operatorAuthFlag = sessionStorage.getItem("glow_operator_auth");
        if (operatorAuthFlag === "true") {
          if (mounted) setAuthorized(true);
        } else {
          if (mounted) router.replace("/login");
        }
      }
    };
    checkAuth();

    if (mounted) {
      const isDark = document.documentElement.classList.contains("dark");
      setTheme(isDark ? "dark" : "light");
    }

    return () => {
      mounted = false;
    };
  }, [router]);

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

  // sessionStorage Setters & Getters
  const setCustomerName = (val: string) => {
    setCustomerNameState(val);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("glow_customer_name", val);
    }
  };

  const setCustomerPhone = (val: string) => {
    setCustomerPhoneState(val);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("glow_customer_phone", val);
    }
  };

  const setSessionsCount = (val: number) => {
    setSessionsCountState(val);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("glow_sessions_count", String(val));
    }
  };

  const setCapturedPhotos = (val: string[] | ((prev: string[]) => string[])) => {
    setCapturedPhotosState((prev) => {
      const next = typeof val === "function" ? val(prev) : val;
      if (typeof window !== "undefined") {
        try {
          sessionStorage.setItem("glow_captured_photos", JSON.stringify(next));
        } catch (err) {
          console.warn("[Storage] Failed to save glow_captured_photos to sessionStorage:", err);
        }
      }
      return next;
    });
  };

  const changeStep = (newStep: "start" | "payment" | "capture" | "share") => {
    if (newStep === "start") {
      router.push(`/operator/${eventSlug}?step=registrasi`);
      return;
    }
    setStep(newStep);
    if (typeof window !== "undefined" && eventSlug && sessionSlug) {
      const url = new URL(window.location.href);
      url.searchParams.set("step", newStep);
      window.history.pushState({}, "", url.toString());
    }
  };

  const clearSessionData = () => {
    setCustomerNameState("");
    setCustomerPhoneState("");
    setSessionsCountState(1);
    setCapturedPhotosState([]);
    setPlacedStickers([]);
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("glow_customer_name");
      sessionStorage.removeItem("glow_customer_phone");
      sessionStorage.removeItem("glow_sessions_count");
      sessionStorage.removeItem("glow_captured_photos");
    }
  };

  // Hydrate states from sessionStorage on mount / config load
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    const savedName = sessionStorage.getItem("glow_customer_name");
    if (savedName) setCustomerNameState(savedName);
    
    const savedPhone = sessionStorage.getItem("glow_customer_phone");
    if (savedPhone) setCustomerPhoneState(savedPhone);
    
    const savedSessions = sessionStorage.getItem("glow_sessions_count");
    if (savedSessions) setSessionsCountState(Number(savedSessions));
    
    const savedPhotos = sessionStorage.getItem("glow_captured_photos");
    if (savedPhotos) {
      try {
        setCapturedPhotosState(JSON.parse(savedPhotos));
      } catch {}
    }

    const savedPresetId = sessionStorage.getItem("glow_selected_preset_id");
    if (savedPresetId && config) {
      const preset = config.presetTemplates?.find(p => p.id === savedPresetId);
      if (preset) {
        setActiveFrameId(preset.id);
      }
    }
  }, [config]);

  // Synchronize activeLayout when activeFrameId or config changes
  useEffect(() => {
    if (config && activeFrameId) {
      const preset = config.presetTemplates?.find((p) => p.id === activeFrameId);
      if (preset) {
        setActiveLayout(getPresetLayout(preset));
      }
    }
  }, [config, activeFrameId]);

  // Sync step state with URL parameter on mount & handle browser back/forward buttons
  useEffect(() => {
    if (typeof window === "undefined" || isLoading) return;

    const syncStepFromUrl = () => {
      const params = new URLSearchParams(window.location.search);
      const urlStep = params.get("step") as "start" | "payment" | "capture" | "share" | null;
      
      if (eventSlug && sessionSlug) {
        const name = sessionStorage.getItem("glow_customer_name") || "";
        const phone = sessionStorage.getItem("glow_customer_phone") || "";
        const photosStr = sessionStorage.getItem("glow_captured_photos") || "[]";
        let photos = [];
        try { photos = JSON.parse(photosStr); } catch {}

        if (!name || !phone) {
          router.replace(`/operator/${eventSlug}?step=registrasi`);
          return;
        } 
        
        let resolvedStep: string = urlStep || "payment";
        
        if (resolvedStep === "payment" && config.showPayment === false) {
          resolvedStep = "capture";
        }
        if (resolvedStep === "setup") {
          resolvedStep = "capture";
        }
        
        if (resolvedStep === "share" && photos.length === 0) {
          resolvedStep = "capture";
        }

        const allowedSteps = ["payment", "capture", "share"];
        if (allowedSteps.includes(resolvedStep)) {
          setStep(resolvedStep as any);
        } else {
          const defaultStep = config.showPayment !== false ? "payment" : "capture";
          changeStep(defaultStep);
        }
      } else {
        router.replace("/operator?step=event-terjadwal");
      }
    };

    syncStepFromUrl();

    window.addEventListener("popstate", syncStepFromUrl);
    return () => window.removeEventListener("popstate", syncStepFromUrl);
  }, [eventSlug, sessionSlug, isLoading, config.showPayment, config.showSetup]);

  // Filter lists based on admin global rules & custom filters
  const activeFiltersList = (config.customFilters || [])
    .filter((f) => {
      if (!config.allowedFilters || config.allowedFilters.length === 0 || (config.allowedFilters.length === 1 && config.allowedFilters[0] === "00000000-0000-0000-0000-000000000001")) {
        return true;
      }
      return config.allowedFilters.includes(f.id);
    });

  // Layout lists based on admin global rules & custom layouts
  const activeLayoutsList = LAYOUTS.filter((l) => {
    if (!config.allowedLayouts || config.allowedLayouts.length === 0 || (config.allowedLayouts.length === 1 && config.allowedLayouts[0] === "strip")) {
      return true;
    }
    return config.allowedLayouts.includes(l.id);
  });

  // Identify currently active preset template
  const selectedFrameTemplate =
    config.presetTemplates?.find((p) => p.id === activeFrameId) ||
    config.presetTemplates?.find((p) => p.id === config.activePresetTemplateId) ||
    config.presetTemplates?.[0] || {
      id: "default",
      name: "Default Neon",
      frameStyle: config.frameStyle || "neon",
      frameText: config.frameText || "MEMORIES",
    };

  // Sync customizable frame elements
  useEffect(() => {
    if (config) {
      setIsMirrored(config.mirrorDefault ?? true);
      
      // Auto-initialize activeFrameId
      const initialPresetId = config.activePresetTemplateId || (config.presetTemplates && config.presetTemplates[0]?.id) || "";
      if (initialPresetId && !activeFrameId) {
        setActiveFrameId(initialPresetId);
        const activeTemplate = config.presetTemplates?.find((p) => p.id === initialPresetId);
        if (activeTemplate) {
          setCustomText(config.frameText || activeTemplate.name || "");
        }
      }

      // Auto fallback active options if current options are disabled by admin
      const hasLayoutRestrictions = config.allowedLayouts && config.allowedLayouts.length > 0 && !(config.allowedLayouts.length === 1 && config.allowedLayouts[0] === "strip");
      if (hasLayoutRestrictions && !config.allowedLayouts.includes(activeLayout)) {
        setActiveLayout(config.allowedLayouts[0] as "strip" | "grid" | "polaroid");
      }
      const hasFilterRestrictions = config.allowedFilters && config.allowedFilters.length > 0 && !(config.allowedFilters.length === 1 && config.allowedFilters[0] === "00000000-0000-0000-0000-000000000001");
      if (hasFilterRestrictions && !config.allowedFilters.includes(activeFilter.id)) {
        const fallbackFilter = config.customFilters?.find((f) => f.id === config.allowedFilters[0]) || FILTERS.find((f) => f.id === config.allowedFilters[0]) || FILTERS[0];
        setActiveFilter(fallbackFilter);
      }
      const allowedPresets = config.allowedPresets;
      const hasPresetRestrictions = allowedPresets && allowedPresets.length > 0;
      if (hasPresetRestrictions && !allowedPresets.includes(activeFrameId)) {
        const fallbackPresetId = allowedPresets[0];
        setActiveFrameId(fallbackPresetId);
        const fallbackTemplate = config.presetTemplates?.find((p) => p.id === fallbackPresetId);
        if (fallbackTemplate) {
          setCustomText(config.frameText || fallbackTemplate.name || "");
        }
      }
    }
  }, [config, activeLayout, activeFilter, activeFrameId]);

  // Sync initial countdownDuration once from config when loaded
  useEffect(() => {
    if (config && config.countdownDuration && !hasInitializedDuration.current) {
      setCountdownDuration(config.countdownDuration);
      hasInitializedDuration.current = true;
    }
  }, [config]);

  // Synchronize activeFrameId with the admin's selection on the Start Screen
  useEffect(() => {
    if (step === "start" && config.activePresetTemplateId) {
      setActiveFrameId(config.activePresetTemplateId);
      const activeTemplate = config.presetTemplates?.find((p) => p.id === config.activePresetTemplateId);
      if (activeTemplate) {
        setCustomText(config.frameText || activeTemplate.name || "");
      }
    }
  }, [config.activePresetTemplateId, step]);

  // Load cameras list
  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices) return;

    const getCameras = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter((device) => device.kind === "videoinput");
        setCameras(videoDevices);
        if (videoDevices.length > 0) {
          setSelectedCameraId(videoDevices[0].deviceId);
        }
      } catch (err) {
        console.error("Error accessing camera list:", err);
      }
    };

    getCameras();
  }, []);

  const startCamera = async () => {
    stopCamera();

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      toast.error(
        "Kamera tidak dapat diakses karena koneksi tidak aman (non-HTTPS). Gunakan koneksi HTTPS atau akses melalui localhost."
      );
      return;
    }

    const constraints = {
      video: {
        deviceId: selectedCameraId ? { ideal: selectedCameraId } : undefined,
        width: { ideal: 640 },
        height: { ideal: 480 },
      },
      audio: false,
    };

    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch((e) => {
          if (e.name !== "AbortError") {
            console.error("Video play failed:", e);
          }
        });
      }

      if (typeof navigator !== "undefined" && navigator.mediaDevices) {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter((device) => device.kind === "videoinput");
        setCameras(videoDevices);
        if (videoDevices.length > 0) {
          const firstId = videoDevices[0].deviceId;
          const activeTrack = stream.getVideoTracks()[0];
          const activeDeviceId = activeTrack?.getSettings()?.deviceId || firstId;
          
          if (!selectedCameraId) {
            skipNextStopRef.current = true;
            setSelectedCameraId(activeDeviceId);
            sessionStorage.setItem("glow_selected_camera_id", activeDeviceId);
          }
        }
      }
    } catch (err) {
      console.error("Webcam open failed:", err);
      toast.error("Gagal mengakses kamera. Mohon izinkan akses kamera di browser Anda.");
      router.push(`/operator/${eventSlug}?step=registrasi`);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  // Handle webcam streaming when starting/stopping capture session
  useEffect(() => {
    if (step === "capture") {
      const activeTrack = streamRef.current?.getVideoTracks()[0];
      const activeDeviceId = activeTrack?.getSettings()?.deviceId;
      
      if (streamRef.current && streamRef.current.active && activeDeviceId && selectedCameraId && activeDeviceId === selectedCameraId) {
        return;
      }
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      if (skipNextStopRef.current) {
        skipNextStopRef.current = false;
      } else {
        stopCamera();
      }
    };
  }, [step, selectedCameraId]);

  const startCaptureSequence = async () => {
    if (isCapturing) return;

    const layoutObj = LAYOUTS.find((l) => l.id === activeLayout) || LAYOUTS[0];
    const totalPhotos = (selectedFrameTemplate?.customSlots && selectedFrameTemplate.customSlots.length > 1)
      ? selectedFrameTemplate.customSlots.length
      : layoutObj.count;
    
    let activeSlotIndex = -1;
    for (let i = 0; i < totalPhotos; i++) {
      if (!capturedPhotos[i]) {
        activeSlotIndex = i;
        break;
      }
    }

    if (activeSlotIndex === -1) {
      setCapturedPhotos([]);
      captureSingleSlot(0, false);
      return;
    }

    captureSingleSlot(activeSlotIndex, false);
  };

  const captureSingleSlot = async (slotIndex: number, isRetake: boolean = false) => {
    if (isCapturing) return;

    setIsCapturing(true);
    setCurrentCaptureNum(slotIndex + 1);

    const duration = countdownDuration;
    const layoutObj = LAYOUTS.find((l) => l.id === activeLayout) || LAYOUTS[0];
    const totalPhotos = (selectedFrameTemplate?.customSlots && selectedFrameTemplate.customSlots.length > 1)
      ? selectedFrameTemplate.customSlots.length
      : layoutObj.count;
    
    const poseGuide = totalPhotos === 1 ? "Tunjukkan Senyuman Terbaik Anda" : POSE_SUGGESTIONS[slotIndex % POSE_SUGGESTIONS.length];
    setPoseAlert(poseGuide);

    await delay(1500);

    for (let sec = duration; sec > 0; sec--) {
      setCountdown(sec);
      if (soundEnabled) playBeep(700, 0.08);
      await delay(1000);
    }

    setCountdown(0);
    if (soundEnabled) playShutterSound();
    
    setFlashActive(true);
    captureSingleFrame(slotIndex);
    await delay(150);
    setFlashActive(false);

    setCountdown(null);
    setPoseAlert(null);
    setIsCapturing(false);
  };

  const captureSingleFrame = (slotIndex?: number) => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");

    if (ctx) {
      if (isMirrored) {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }

      ctx.filter = activeFilter.css;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.85);

      setCapturedPhotos((prev) => {
        const next = [...prev];
        if (typeof slotIndex === "number") {
          next[slotIndex] = dataUrl;
        } else {
          next.push(dataUrl);
        }
        return next;
      });
    }
  };

  const retakeSingleSlot = async (slotIndex: number) => {
    setCapturedPhotos((prev) => {
      const next = [...prev];
      next[slotIndex] = "";
      return next;
    });
    captureSingleSlot(slotIndex, true);
  };

  const handleCaptureComplete = async () => {
    setIsRendering(true);
    try {
      const activeConfig = {
        ...config,
        activePresetTemplateId: activeFrameId,
        frameText: customText || config.frameText,
      };
      
      const compositeUrl = await renderPhotoStrip({
        photos: capturedPhotos,
        layout: activeLayout,
        config: activeConfig,
        placedStickers,
      });

      setCompiledStripUrl(compositeUrl);

      const operatorName = typeof window !== "undefined" ? sessionStorage.getItem("glow_operator_name") || undefined : undefined;
      const photoId = await addPhoto(compositeUrl, {
        customerName,
        customerPhone,
        sessionsCount: 1,
        operatorName,
        capturedPhotos,
        paymentMethod: paymentMethod || undefined,
        amount: config.pricePerSession ?? 25000,
      });
      
      setLastSavedPhotoId(photoId || null);
      changeStep("share");
    } catch (e) {
      console.error("Composite render / save error:", e);
      toast.error("Gagal memproses dan menyimpan foto strip.");
    } finally {
      setIsRendering(false);
    }
  };

  const handlePrint = async () => {
    if (!compiledStripUrl) return;
    setIsRendering(true);
    
    const paperSize = selectedFrameTemplate?.paperSize || (activeLayout === "strip" ? "2R" : "4R");
    const pageSizeCss = paperSize === "2R" ? "2in 6in" : "4in 6in";
      
    // Browser native window.print() dialog (using hidden iframe to avoid new tab/window preview)
    try {
      const iframe = document.createElement("iframe");
      iframe.style.position = "fixed";
      iframe.style.right = "0";
      iframe.style.bottom = "0";
      iframe.style.width = "0";
      iframe.style.height = "0";
      iframe.style.border = "0";
      document.body.appendChild(iframe);

      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (iframeDoc) {
        iframeDoc.write(`
          <html>
            <head>
              <title></title>
              <style>
                @page {
                  margin: 0;
                  size: ${pageSizeCss};
                }
                @media print {
                  @page {
                    margin: 0;
                    size: ${pageSizeCss};
                  }
                  html, body {
                    margin: 0 !important;
                    padding: 0 !important;
                    height: 100%;
                    width: 100%;
                  }
                  body {
                    background-color: white;
                  }
                  img {
                    max-width: 100%;
                    max-height: 100vh;
                    display: block;
                    margin: 0 auto;
                  }
                }
                body {
                  margin: 0;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  background-color: white;
                  height: 100vh;
                }
                img {
                  max-width: 100%;
                  max-height: 100vh;
                  object-fit: contain;
                }
              </style>
            </head>
            <body>
              <img id="print-image" src="${compiledStripUrl}" />
              <script>
                const img = document.getElementById('print-image');
                function triggerPrint() {
                  setTimeout(function() {
                    window.focus();
                    window.print();
                  }, 250);
                }
                if (img.complete) {
                  triggerPrint();
                } else {
                  img.onload = function() {
                    triggerPrint();
                  };
                }
              </script>
            </body>
          </html>
        `);
        iframeDoc.close();

        iframe.contentWindow?.addEventListener("afterprint", () => {
          document.body.removeChild(iframe);
        });
        toast.success("Membuka dialog pencetakan...");
      } else {
        toast.error("Gagal menyiapkan media cetak bawaan browser.");
      }
    } catch (e) {
      console.error("Print error:", e);
      toast.error("Gagal mencetak foto.");
    } finally {
      setIsRendering(false);
    }
  };

  const handlePrintManual = () => {
    if (!compiledStripUrl) return;
    try {
      const paperSize = selectedFrameTemplate?.paperSize || (activeLayout === "strip" ? "2R" : "4R");
      const pageSizeCss = paperSize === "2R" ? "2in 6in" : "4in 6in";

      const iframe = document.createElement("iframe");
      iframe.style.position = "fixed";
      iframe.style.right = "0";
      iframe.style.bottom = "0";
      iframe.style.width = "0";
      iframe.style.height = "0";
      iframe.style.border = "0";
      document.body.appendChild(iframe);

      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (iframeDoc) {
        iframeDoc.write(`
          <html>
            <head>
              <title></title>
              <style>
                @page {
                  margin: 0;
                  size: ${pageSizeCss};
                }
                @media print {
                  @page {
                    margin: 0;
                    size: ${pageSizeCss};
                  }
                  html, body {
                    margin: 0 !important;
                    padding: 0 !important;
                    height: 100%;
                    width: 100%;
                  }
                  body {
                    background-color: white;
                  }
                  img {
                    max-width: 100%;
                    max-height: 100vh;
                    display: block;
                    margin: 0 auto;
                  }
                }
                body {
                  margin: 0;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  background-color: white;
                  height: 100vh;
                }
                img {
                  max-width: 100%;
                  max-height: 100vh;
                  object-fit: contain;
                }
              </style>
            </head>
            <body>
              <img id="print-image" src="${compiledStripUrl}" />
              <script>
                const img = document.getElementById('print-image');
                function triggerPrint() {
                  setTimeout(function() {
                    window.focus();
                    window.print();
                  }, 250);
                }
                if (img.complete) {
                  triggerPrint();
                } else {
                  img.onload = function() {
                    triggerPrint();
                  };
                }
              </script>
            </body>
          </html>
        `);
        iframeDoc.close();

        iframe.contentWindow?.addEventListener("afterprint", () => {
          document.body.removeChild(iframe);
        });
        toast.success("Membuka dialog pencetakan manual...");
      } else {
        toast.error("Gagal menyiapkan media cetak bawaan browser.");
      }
    } catch (e) {
      console.error("Manual Print error:", e);
      toast.error("Gagal membuka dialog printer.");
    }
  };

  const handleShareComplete = async () => {
    setIsRendering(true);
    try {
      if (currentSessionNum < sessionsCount) {
        setCurrentSessionNum(prev => prev + 1);
        setCapturedPhotos([]);
        setCompiledStripUrl(null);
        setLastSavedPhotoId(null);
        changeStep("capture");
      } else {
        clearSessionData();
        router.push(`/operator/${eventSlug}?step=registrasi`);
      }
    } catch (e) {
      console.error("Advance session error:", e);
      toast.error("Gagal mengalihkan sesi.");
    } finally {
      setIsRendering(false);
    }
  };

  const handleFrameSelect = (preset: PresetTemplate) => {
    if (activeFrameId === preset.id) {
      setActiveFrameId("");
      setCustomText("");
      setActiveLayout("strip");
      if (typeof window !== "undefined") {
        sessionStorage.setItem("glow_selected_preset_id", "none");
      }
    } else {
      setActiveFrameId(preset.id);
      setCustomText(config.frameText || preset.name || "");
      if (typeof window !== "undefined") {
        sessionStorage.setItem("glow_selected_preset_id", preset.id);
      }
      setActiveLayout(getPresetLayout(preset));
    }
  };

  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  if (!authorized || isLoading) {
    return (
      <div className="min-h-screen bg-[#121214] flex flex-col items-center justify-center gap-4 text-zinc-400 font-mono text-xs">
        <div className="w-8 h-8 rounded-full border-2 border-zinc-700 border-t-zinc-300 animate-spin" />
        <span>Memverifikasi Sesi Pemotretan...</span>
      </div>
    );
  }

  const isScrollLocked = ["payment", "capture", "share"].includes(step);

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
    <div className={`flex-1 ${getPageBgClass(customization?.cardStyle)} flex flex-col justify-between relative transition-colors duration-300 ${
      isScrollLocked ? "h-screen overflow-hidden" : "min-h-screen overflow-x-hidden"
    }`} style={{ fontFamily: getFontFamilyName(config?.fontStyle || 'inter') }}>
      
      {/* Dynamic Template-specific visual decorations */}
      <TemplateDecoration 
        cardStyle={customization?.cardStyle} 
        customization={customization} 
        hideSidePanels={step === "capture" || step === "share" || step === "payment"}
      />

      {/* Visual Flash Effect Overlay */}
      {flashActive && (
        <div className="fixed inset-0 bg-white z-[9999] animate-pulse duration-75 pointer-events-none" />
      )}



      {/* Share screen */}
      {eventSlug && sessionSlug && step === "share" && (
        <ShareScreen
          config={config}
          compiledStripUrl={compiledStripUrl}
          capturedPhotos={capturedPhotos}
          customerName={customerName}
          customerPhone={customerPhone}
          currentSessionNum={currentSessionNum}
          sessionsCount={sessionsCount}
          photoId={lastSavedPhotoId}
          onComplete={handleShareComplete}
          handlePrint={handlePrint}
          handlePrintManual={handlePrintManual}
          customization={customization}
        />
      )}

      {/* Capture screen */}
      {eventSlug && sessionSlug && step === "capture" && (
        <CaptureScreen
          videoRef={videoRef}
          isCapturing={isCapturing}
          capturedPhotos={capturedPhotos}
          activeLayout={activeLayout}
          activeFilter={activeFilter}
          activeFiltersList={activeFiltersList}
          activeLayoutsList={activeLayoutsList}
          countdown={countdown}
          poseAlert={poseAlert}
          isMirrored={isMirrored}
          setIsMirrored={setIsMirrored}
          startCaptureSequence={startCaptureSequence}
          onCancel={() => {
            router.push(`/operator/${eventSlug}?step=registrasi`);
          }}
          layoutsCount={(selectedFrameTemplate?.customSlots && selectedFrameTemplate.customSlots.length > 1)
            ? selectedFrameTemplate.customSlots.length
            : (LAYOUTS.find((l) => l.id === activeLayout)?.count ?? 4)}
          config={config}
          activeFrameId={activeFrameId}
          countdownDuration={countdownDuration}
          setCountdownDuration={setCountdownDuration}
          onRetakeSlot={retakeSingleSlot}
          onComplete={handleCaptureComplete}
          currentCaptureNum={currentCaptureNum}
          customerName={customerName}
          customerPhone={customerPhone}
          currentSessionNum={currentSessionNum}
          sessionsCount={sessionsCount}
          onSelectPreset={handleFrameSelect}
          onSelectFilter={setActiveFilter}
          placedStickers={placedStickers}
          onAddSticker={handleAddSticker}
          onRemoveSticker={handleRemoveSticker}
          onUpdateSticker={handleUpdateSticker}
          customization={customization}
        />
      )}

      {/* Payment screen and other centered steps */}
      {step !== "capture" && step !== "share" && (
        <div className={`flex-1 flex flex-col items-center justify-center w-full z-10 relative ${
          isScrollLocked ? "h-full py-2 overflow-hidden" : "py-10 px-4"
        }`}>
          <main className={`flex-1 flex flex-col items-center justify-center w-full relative ${
            isScrollLocked ? "h-full overflow-hidden" : ""
          }`}>
            {eventSlug && sessionSlug && step === "payment" && (
              <PaymentScreen
                customerName={customerName}
                customerPhone={customerPhone}
                sessionsCount={sessionsCount}
                onPaymentSuccess={(method) => {
                  setPaymentMethod(method);
                  changeStep("capture");
                }}
                onCancel={() => {
                  router.push(`/operator/${eventSlug}?step=registrasi`);
                }}
                eventName={config.eventName}
                pricePerSession={config.pricePerSession}
                qrisUrl={config.qrisUrl}
                customization={customization}
              />
            )}
          </main>
        </div>
      )}

      {/* Visual rendering overlay */}
      {isRendering && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[9999] flex flex-col items-center justify-center gap-6 text-white select-none">
          <style>{`
            @keyframes cameraShutter {
              0%, 100% { transform: scale(1); }
              20% { transform: scale(0.9); }
              30% { transform: scale(1.05); }
            }
            @keyframes cameraFlash {
              0%, 15% { opacity: 0; transform: scale(0.5); }
              20% { opacity: 0.8; transform: scale(2.5); }
              40% { opacity: 0; transform: scale(3); }
              100% { opacity: 0; }
            }
            @keyframes photoPrint {
              0%, 25% {
                transform: translateY(-20px) scale(0.5);
                opacity: 0;
              }
              40% {
                transform: translateY(10px) scale(0.9);
                opacity: 1;
              }
              85% {
                transform: translateY(35px) scale(1);
                opacity: 1;
              }
              100% {
                transform: translateY(50px) scale(0.95);
                opacity: 0;
              }
            }
            @keyframes lensSpin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
            .animate-camera {
              animation: cameraShutter 3s ease-in-out infinite;
            }
            .animate-flash {
              animation: cameraFlash 3s ease-in-out infinite;
            }
            .animate-print {
              animation: photoPrint 3s cubic-bezier(0.18, 0.89, 0.32, 1.28) infinite;
            }
            .animate-lens {
              animation: lensSpin 6s linear infinite;
            }
          `}</style>

          <div className="relative flex flex-col items-center justify-center">
            <div className="absolute w-24 h-24 rounded-full bg-blue-400/25 blur-xl animate-flash pointer-events-none z-0" />
            <div className="relative w-28 h-32 flex flex-col items-center justify-start z-10 select-none">
              <div className="relative w-20 h-14 bg-zinc-800 dark:bg-zinc-900 border-2 border-zinc-700 dark:border-zinc-800 rounded-2xl flex items-center justify-center shadow-xl animate-camera z-20">
                <div className="absolute top-2 right-3 w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                <div className="absolute -top-1 left-4 w-4 h-1.5 bg-zinc-700 dark:bg-zinc-850 rounded-t-sm" />
                <div className="absolute top-2 left-3 w-3 h-2 bg-zinc-750 dark:bg-zinc-950 rounded border border-zinc-700/50" />
                <div className="w-9 h-9 rounded-full bg-zinc-900 dark:bg-zinc-950 border-2 border-zinc-700 dark:border-zinc-800 flex items-center justify-center relative overflow-hidden shadow-inner">
                  <div className="w-6 h-6 rounded-full border border-dashed border-blue-500/40 animate-lens" />
                  <div className="absolute w-2 h-2 rounded-full bg-white/20 top-1.5 left-1.5 blur-[0.5px]" />
                </div>
              </div>
              
              <div className="absolute top-10 w-12 h-16 bg-white dark:bg-zinc-100 border border-zinc-300 dark:border-zinc-200 rounded p-1 shadow-md animate-print z-10 flex flex-col gap-0.5 justify-between">
                <div className="w-full h-[22%] bg-zinc-200 dark:bg-zinc-300 rounded-sm overflow-hidden flex items-center justify-center">
                  <Sparkles className="w-1.5 h-1.5 text-zinc-400" />
                </div>
                <div className="w-full h-[22%] bg-zinc-200 dark:bg-zinc-300 rounded-sm overflow-hidden flex items-center justify-center">
                  <Heart className="w-1.5 h-1.5 text-zinc-400 animate-pulse" />
                </div>
                <div className="w-full h-[22%] bg-zinc-200 dark:bg-zinc-300 rounded-sm overflow-hidden flex items-center justify-center">
                  <Star className="w-1.5 h-1.5 text-zinc-400" />
                </div>
                <div className="w-full h-[15%] flex justify-center items-center">
                  <div className="w-6 h-0.5 bg-zinc-300 rounded-full" />
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center gap-1 text-center mt-2">
            <span className="text-sm font-bold tracking-wide">Sedang Memproses &amp; Menyimpan Foto...</span>
            <span className="text-xs text-zinc-400 dark:text-zinc-550 font-mono">Mohon tunggu sebentar</span>
          </div>
        </div>
      )}
    </div>
  );
}
