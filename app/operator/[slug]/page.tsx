"use client";

/* eslint-disable react-hooks/set-state-in-effect */

import { useState, useEffect, useRef } from "react";
import { usePhotoboothStore, PresetTemplate, PlacedSticker, StickerAsset } from "../../hooks/usePhotoboothStore";
import { supabase } from "@/lib/supabase";
import { renderPhotoStrip } from "../../utils/canvasRenderer";
import { playBeep, playShutterSound } from "../../utils/audio";
import { useRouter, useParams } from "next/navigation";
import { Sun, Moon, Sparkles, Heart, Star, Camera } from "lucide-react";
import { toast } from "sonner";


import CaptureScreen from "../components/CaptureScreen";
import PaymentScreen from "../components/PaymentScreen";
import SessionSetupScreen from "../components/SessionSetupScreen";
import ShareScreen from "../components/ShareScreen";

const FILTERS = [
  { id: "original", name: "Original", css: "none" },
  { id: "bw", name: "Retro B&W", css: "grayscale(1) contrast(1.3) brightness(1.05)" },
  { id: "vintage", name: "Warm Film", css: "sepia(0.4) contrast(1.1) saturate(1.1) brightness(0.95)" },
  { id: "neon", name: "Neon Glow", css: "hue-rotate(240deg) saturate(1.8) brightness(1.1)" },
  { id: "sepia", name: "Sepia Dream", css: "sepia(0.8) hue-rotate(-20deg) saturate(1.3)" },
  { id: "cyber", name: "Cyberpunk", css: "hue-rotate(295deg) saturate(1.7) contrast(1.15)" },
  { id: "pop", name: "Pop Art", css: "saturate(2.3) contrast(1.25)" },
  { id: "noir", name: "Classic Noir", css: "grayscale(1) contrast(1.9) brightness(0.9)" },
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

export default function CustomerBoothSession() {
  const { config, addPhoto } = usePhotoboothStore();
  const router = useRouter();
  const params = useParams();
  const slug = Array.isArray(params?.slug) ? params.slug[0] : params?.slug;

  const [step, setStep] = useState<"start" | "payment" | "setup" | "capture" | "share">("payment");
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

  // Sticker state (lifted from CaptureScreen so canvasRenderer can use it)
  const [placedStickers, setPlacedStickers] = useState<PlacedSticker[]>([]);

  const handleAddSticker = (sticker: StickerAsset) => {
    const id = `ps_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const xPct = 30 + Math.random() * 40;
    const yPct = 20 + Math.random() * 60;
    setPlacedStickers((prev) => [
      ...prev,
      { id, stickerId: sticker.id, xPct, yPct, scalePct: 100, rotation: Math.round((Math.random() - 0.5) * 30) },
    ]);
    toast(`Stiker "${sticker.name}" ditambahkan`, { duration: 1200, icon: "✨" });
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

  const changeStep = (newStep: "start" | "payment" | "setup" | "capture" | "share") => {
    if (newStep === "start") {
      router.push("/operator");
      return;
    }
    setStep(newStep);
    if (typeof window !== "undefined" && slug) {
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
    setPlacedStickers([]); // reset stiker saat sesi baru
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

  // Sync step state with URL parameter on mount & handle browser back/forward buttons
  useEffect(() => {
    if (typeof window === "undefined") return;

    const syncStepFromUrl = () => {
      const params = new URLSearchParams(window.location.search);
      const urlStep = params.get("step") as "start" | "payment" | "setup" | "capture" | "share" | null;
      
      if (slug) {
        const name = sessionStorage.getItem("glow_customer_name") || "";
        const phone = sessionStorage.getItem("glow_customer_phone") || "";
        const photosStr = sessionStorage.getItem("glow_captured_photos") || "[]";
        let photos = [];
        try { photos = JSON.parse(photosStr); } catch {}

        if (!name || !phone) {
          router.replace("/operator");
        } else if (urlStep === "share" && photos.length === 0) {
          changeStep("capture");
        } else if (urlStep === "start") {
          router.replace("/operator");
        } else if (urlStep && ["payment", "capture", "share"].includes(urlStep)) {
          setStep(urlStep);
        } else {
          changeStep("payment");
        }
      } else {
        router.replace("/operator");
      }
    };

    syncStepFromUrl();

    window.addEventListener("popstate", syncStepFromUrl);
    return () => window.removeEventListener("popstate", syncStepFromUrl);
  }, [slug]);

  // Filter lists based on admin global rules & custom filters
  const activeFiltersList = (config.customFilters || [])
    .filter((f) => {
      if (!config.allowedFilters || config.allowedFilters.length === 0 || (config.allowedFilters.length === 1 && config.allowedFilters[0] === "original")) {
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
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsMirrored(config.mirrorDefault ?? true);
      
      // Auto-initialize activeFrameId
      const initialPresetId = config.activePresetTemplateId || (config.presetTemplates && config.presetTemplates[0]?.id) || "";
      if (initialPresetId && !activeFrameId) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setActiveFrameId(initialPresetId);
        const activeTemplate = config.presetTemplates?.find((p) => p.id === initialPresetId);
        if (activeTemplate) {
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setCustomText(config.frameText || activeTemplate.name || "");
        }
      }

      // Auto fallback active options if current options are disabled by admin
      const hasLayoutRestrictions = config.allowedLayouts && config.allowedLayouts.length > 0 && !(config.allowedLayouts.length === 1 && config.allowedLayouts[0] === "strip");
      if (hasLayoutRestrictions && !config.allowedLayouts.includes(activeLayout)) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setActiveLayout(config.allowedLayouts[0] as "strip" | "grid" | "polaroid");
      }
      const hasFilterRestrictions = config.allowedFilters && config.allowedFilters.length > 0 && !(config.allowedFilters.length === 1 && config.allowedFilters[0] === "original");
      if (hasFilterRestrictions && !config.allowedFilters.includes(activeFilter.id)) {
        const fallbackFilter = config.customFilters?.find((f) => f.id === config.allowedFilters[0]) || FILTERS.find((f) => f.id === config.allowedFilters[0]) || FILTERS[0];
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setActiveFilter(fallbackFilter);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveFrameId(config.activePresetTemplateId);
      const activeTemplate = config.presetTemplates?.find((p) => p.id === config.activePresetTemplateId);
      if (activeTemplate) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
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

      // Re-enumerate cameras after permission granted to retrieve labels & accurate device IDs
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
      router.push("/operator");
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
      // Avoid restarting the camera if the stream is already active for the selected camera
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, selectedCameraId]);

  const startCaptureSequence = async () => {
    if (isCapturing) return;

    const layoutObj = LAYOUTS.find((l) => l.id === activeLayout) || LAYOUTS[0];
    const totalPhotos = (selectedFrameTemplate?.customSlots && selectedFrameTemplate.customSlots.length > 1)
      ? selectedFrameTemplate.customSlots.length
      : layoutObj.count;
    
    // Find first empty slot (where photo is empty/falsy)
    let activeSlotIndex = -1;
    for (let i = 0; i < totalPhotos; i++) {
      if (!capturedPhotos[i]) {
        activeSlotIndex = i;
        break;
      }
    }

    if (activeSlotIndex === -1) {
      // Clear all and restart from slot 1
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
    try {
      // Open print window
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Print Photo Strip</title>
              <style>
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
                @page {
                  margin: 0;
                  size: auto;
                }
                @media print {
                  body {
                    background-color: white;
                  }
                  img {
                    max-width: 100%;
                    max-height: 100vh;
                  }
                }
              </style>
            </head>
            <body>
              <img src="${compiledStripUrl}" onload="window.print(); window.close();" />
            </body>
          </html>
        `);
        printWindow.document.close();
        toast.success("Membuka dialog pencetakan...");
      } else {
        toast.error("Gagal membuka jendela pencetakan. Harap izinkan pop-up.");
      }
    } catch (e) {
      console.error("Print error:", e);
      toast.error("Gagal mencetak foto.");
    } finally {
      setIsRendering(false);
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
        router.push("/operator");
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
      // Batal pilih template preset
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
      // Auto-set activeLayout based on preset ID or customSlots count
      if (preset.id.includes("grid")) {
        setActiveLayout("grid");
      } else if (preset.id.includes("polaroid") || preset.customSlots) {
        setActiveLayout("polaroid");
      } else {
        setActiveLayout("strip");
      }
    }
  };

  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  if (!authorized) {
    return (
      <div className="min-h-screen bg-[#121214] flex flex-col items-center justify-center gap-4 text-zinc-400 font-mono text-xs">
        <div className="w-8 h-8 rounded-full border-2 border-zinc-700 border-t-zinc-300 animate-spin" />
        <span>Memverifikasi Sesi Pemotretan...</span>
      </div>
    );
  }

  const isScrollLocked = ["payment", "capture", "share"].includes(step);

  return (
    <div className={`flex-1 bg-[#fbfbfb] dark:bg-[#0b0b0c] text-zinc-800 dark:text-[#e3e3e3] font-sans flex flex-col justify-between relative transition-colors duration-300 ${
      isScrollLocked ? "h-screen overflow-hidden" : "min-h-screen overflow-x-hidden"
    }`}>
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

      {/* Visual Flash Effect Overlay */}
      {flashActive && (
        <div className="fixed inset-0 bg-white z-[9999] animate-pulse duration-75 pointer-events-none" />
      )}

      {/* Setup: full-page, no centering or padding */}
      {slug && step === "setup" && (
        <SessionSetupScreen
          config={config}
          sessionNum={currentSessionNum}
          totalSessions={sessionsCount}
          customerName={customerName}
          customerPhone={customerPhone}
          eventName={config.eventName}
          theme={theme}
          toggleTheme={toggleTheme}
          selectedPresetId={config.presetTemplates?.some(p => p.id === activeFrameId) ? activeFrameId : ""}
          selectedFilterId={activeFilter.id}
          onSelectPreset={(preset) => {
            if (activeFrameId === preset.id) {
              if (typeof window !== "undefined") {
                sessionStorage.setItem("glow_selected_preset_id", "none");
              }
              setActiveFrameId("");
              setCustomText("");
              setActiveLayout("strip");
            } else {
              if (typeof window !== "undefined") {
                sessionStorage.setItem("glow_selected_preset_id", preset.id);
              }
              handleFrameSelect(preset);
            }
          }}
          onSelectFilter={(filter) => {
            if (activeFilter.id === filter.id) {
              const originalFilter = config.customFilters?.find(f => f.id === "original") || FILTERS.find(f => f.id === "original") || FILTERS[0];
              setActiveFilter(originalFilter);
            } else {
              setActiveFilter(filter);
            }
          }}
          availableFilters={activeFiltersList}
          onContinue={() => changeStep("capture")}
        />
      )}

      {slug && step === "share" && (
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
        />
      )}

      {slug && step === "capture" && (
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
            router.push("/operator");
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
        />
      )}

      {/* All other steps: centered padded layout */}
      {step !== "setup" && step !== "capture" && step !== "share" && (
        <div className={`flex-1 flex flex-col items-center justify-center w-full z-10 relative ${
          isScrollLocked ? "h-full py-2 overflow-hidden" : "py-10 px-4"
        }`}>
          <main className={`flex-1 flex flex-col items-center justify-center w-full relative ${
            isScrollLocked ? "h-full overflow-hidden" : ""
          }`}>

            {slug && step === "payment" && (
              <>
                <PaymentScreen
                  customerName={customerName}
                  customerPhone={customerPhone}
                  sessionsCount={sessionsCount}
                  onPaymentSuccess={(method) => {
                    setPaymentMethod(method);
                    changeStep("capture");
                  }}
                  onCancel={() => {
                    router.push("/operator");
                  }}
                  eventName={config.eventName}
                  pricePerSession={config.pricePerSession}
                  qrisUrl={config.qrisUrl}
                />
              </>
            )}

          </main>
        </div>
      )}

      {isRendering && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[9999] flex flex-col items-center justify-center gap-4 text-white">
          <div className="w-12 h-12 rounded-full border-4 border-emerald-500/30 border-t-emerald-500 animate-spin" />
          <div className="flex flex-col items-center gap-1 text-center">
            <span className="text-sm font-bold tracking-wide">Sedang Memproses &amp; Menyimpan Foto...</span>
            <span className="text-xs text-zinc-400 dark:text-zinc-550 font-mono">Mohon tunggu sebentar</span>
          </div>
        </div>
      )}
    </div>
  );
}