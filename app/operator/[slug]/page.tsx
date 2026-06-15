"use client";

import { useState, useEffect, useRef } from "react";
import { usePhotoboothStore, FrameTemplate, PlacedSticker } from "../../hooks/usePhotoboothStore";
import { renderPhotoStrip } from "../../utils/canvasRenderer";
import { playBeep, playShutterSound } from "../../utils/audio";
import { useRouter, useParams } from "next/navigation";
import { Sun, Moon } from "lucide-react";


import CaptureScreen from "../components/CaptureScreen";
import PreviewScreen from "../components/PreviewScreen";
import PaymentScreen from "../components/PaymentScreen";
import SessionSetupScreen from "../components/SessionSetupScreen";

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

  const [step, setStep] = useState<"start" | "payment" | "setup" | "capture" | "preview">("payment");
  const [theme, setTheme] = useState<"dark" | "light">("dark");

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
  const [placedStickers, setPlacedStickers] = useState<PlacedSticker[]>([]);

  // Customer registration state
  const [customerName, setCustomerNameState] = useState("");
  const [customerPhone, setCustomerPhoneState] = useState("");
  const [sessionsCount, setSessionsCountState] = useState(1);
  const [currentSessionNum, setCurrentSessionNum] = useState(1);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const skipNextStopRef = useRef(false);

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
        sessionStorage.setItem("glow_captured_photos", JSON.stringify(next));
      }
      return next;
    });
  };

  const changeStep = (newStep: "start" | "payment" | "setup" | "capture" | "preview") => {
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
    if (savedPresetId && config && config.presetTemplates) {
      const preset = config.presetTemplates.find(p => p.id === savedPresetId);
      if (preset) {
        const layoutKey = preset.layoutId.replace("layout_", "") as "strip" | "grid" | "polaroid";
        if (["strip", "grid", "polaroid"].includes(layoutKey)) {
          setActiveLayout(layoutKey);
        }
        setActiveFrameId(preset.frameId ?? preset.id);
        
        // Find custom or standard filter
        const customFilter = config.customFilters?.find(f => f.id === preset.filterId);
        if (customFilter) {
          const filterObj = FILTERS.find(f => f.id === customFilter.id) || {
            id: customFilter.id,
            name: customFilter.name,
            css: customFilter.css
          };
          setActiveFilter(filterObj);
        } else {
          const filterObj = FILTERS.find(f => f.id === preset.filterId) || FILTERS[0];
          setActiveFilter(filterObj);
        }
      }
    }
  }, [config]);

  // Sync step state with URL parameter on mount & handle browser back/forward buttons
  useEffect(() => {
    if (typeof window === "undefined") return;

    const syncStepFromUrl = () => {
      const params = new URLSearchParams(window.location.search);
      const urlStep = params.get("step") as "start" | "payment" | "setup" | "capture" | "preview" | null;
      
      if (slug) {
        const name = sessionStorage.getItem("glow_customer_name") || "";
        const phone = sessionStorage.getItem("glow_customer_phone") || "";
        const photosStr = sessionStorage.getItem("glow_captured_photos") || "[]";
        let photos = [];
        try { photos = JSON.parse(photosStr); } catch {}

        if (!name || !phone) {
          router.replace("/operator");
        } else if (urlStep === "preview" && photos.length === 0) {
          changeStep("setup");
        } else if (urlStep === "start") {
          router.replace("/operator");
        } else if (urlStep && ["payment", "setup", "capture", "preview"].includes(urlStep)) {
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
  const activeFiltersList = [
    ...FILTERS,
    ...(config.customFilters || []).map(cf => ({ id: cf.id, name: cf.name, css: cf.css }))
  ].filter((f, idx, self) => self.findIndex(x => x.id === f.id) === idx)
   .filter((f) => config.allowedFilters ? config.allowedFilters.includes(f.id) : true);

  // Layout lists based on admin global rules & custom layouts
  const activeLayoutsList = [
    ...LAYOUTS,
    ...(config.customLayouts || []).map(cl => {
      const key = cl.id.replace("layout_", "");
      return { id: key, name: cl.name, description: cl.description, count: cl.count };
    })
  ].filter((l, idx, self) => self.findIndex(x => x.id === l.id) === idx)
   .filter((l) => config.allowedLayouts ? config.allowedLayouts.includes(l.id) : true);

  const savedPresetId = typeof window !== "undefined" ? sessionStorage.getItem("glow_selected_preset_id") : null;
  const activePreset = config.presetTemplates?.find(p => p.id === savedPresetId);
  const isLayoutLocked = activePreset?.forceLayout ?? false;

  // Identify currently active preset template
  const selectedFrameTemplate = config.presetTemplates?.find((p) => p.id === activeFrameId) || config.presetTemplates?.find((p) => p.id === config.activePresetTemplateId) || config.presetTemplates?.[0] || {
    id: "default",
    name: "Default Neon",
    frameStyle: config.frameStyle || "neon",
    frameText: config.frameText || "MEMORIES",
  };

  // Sync customizable frame elements
  useEffect(() => {
    if (config) {
      setIsMirrored(config.mirrorDefault ?? true);
      
      // Auto-initialize activeFrameId (prefer saved session preset first, fallback to active template)
      if (!activeFrameId && config.presetTemplates && config.presetTemplates.length > 0) {
        const savedPresetId = typeof window !== "undefined" ? sessionStorage.getItem("glow_selected_preset_id") : null;
        const initialPresetId = 
          config.presetTemplates.find(p => p.id === savedPresetId)?.id || 
          config.presetTemplates.find(p => p.id === config.activePresetTemplateId)?.id || 
          config.presetTemplates[0].id;
        
        if (initialPresetId) {
          setActiveFrameId(initialPresetId);
          const activeTemplate = config.presetTemplates.find((p) => p.id === initialPresetId);
          if (activeTemplate) {
            setCustomText(activeTemplate.frameText);
          }
        }
      }

      // Auto fallback active options if current options are disabled by admin
      if (config.allowedLayouts && !config.allowedLayouts.includes(activeLayout) && config.allowedLayouts.length > 0) {
        setActiveLayout(config.allowedLayouts[0] as any);
      }
      if (config.allowedFilters && !config.allowedFilters.includes(activeFilter.id) && config.allowedFilters.length > 0) {
        const fallbackFilter = FILTERS.find((f) => f.id === config.allowedFilters[0]) || FILTERS[0];
        setActiveFilter(fallbackFilter);
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
        setCustomText(activeTemplate.frameText);
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
  }, [step, selectedCameraId]);

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
      alert("Gagal mengakses kamera. Mohon izinkan akses kamera di browser Anda.");
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

  const startCaptureSequence = async () => {
    if (isCapturing) return;

    const layoutObj = LAYOUTS.find((l) => l.id === activeLayout) || LAYOUTS[0];
    const totalPhotos = selectedFrameTemplate?.customSlots?.length ?? layoutObj.count;
    
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
    const totalPhotos = selectedFrameTemplate?.customSlots?.length ?? layoutObj.count;
    
    const poseGuide = isRetake 
      ? `Ulangi Foto Slot ${slotIndex + 1}`
      : (totalPhotos === 1 ? "Tunjukkan Senyuman Terbaik Anda" : POSE_SUGGESTIONS[slotIndex % POSE_SUGGESTIONS.length]);
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

    if (!isRetake && slotIndex + 1 === totalPhotos) {
      await delay(1000);
      changeStep("preview");
    }
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
      const dataUrl = canvas.toDataURL("image/png");

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

  useEffect(() => {
    if (step === "preview" && capturedPhotos.length > 0) {
      generateFinalStrip();
    }
  }, [step, capturedPhotos, activeLayout, config, customText, activeFrameId]);

  const generateFinalStrip = async () => {
    setIsRendering(true);
    try {
      const activeConfig = {
        ...config,
        activeFrameId: activeFrameId, // Pass customer selected template frame id
        frameStyle: selectedFrameTemplate.frameStyle,
        frameText: customText || selectedFrameTemplate.frameText,
      };
      const result = await renderPhotoStrip({
        photos: capturedPhotos,
        layout: activeLayout,
        config: activeConfig,
      });
      setCompiledStripUrl(result);
    } catch (e) {
      console.error("Compile photostrip error:", e);
    } finally {
      setIsRendering(false);
    }
  };

  const handleDownload = async () => {
    if (!compiledStripUrl) return;
    setIsRendering(true);
    try {
      const activeConfig = {
        ...config,
        activeFrameId: activeFrameId,
        frameStyle: selectedFrameTemplate.frameStyle,
        frameText: customText || selectedFrameTemplate.frameText,
      };
      
      // Compile composite strip including interactive stickers
      const compositeUrl = await renderPhotoStrip({
        photos: capturedPhotos,
        layout: activeLayout,
        config: activeConfig,
        placedStickers: placedStickers,
      });

      const link = document.createElement("a");
      link.download = `${config.eventName.replace(/\s+/g, "_")}_session_${currentSessionNum}.png`;
      link.href = compositeUrl;
      link.click();
      
      // Save composite to gallery
      const operatorName = typeof window !== "undefined" ? sessionStorage.getItem("glow_operator_name") || undefined : undefined;
      await addPhoto(compositeUrl, { customerName, customerPhone, sessionsCount: 1, operatorName });
      
      if (currentSessionNum < sessionsCount) {
        setCurrentSessionNum(prev => prev + 1);
        setCapturedPhotos([]);
        setPlacedStickers([]);
        setCompiledStripUrl(null);
        changeStep("setup");
      } else {
        clearSessionData();
        router.push("/operator");
      }
    } catch (e) {
      console.error("Composite render error:", e);
      alert("Gagal merakit foto strip.");
    } finally {
      setIsRendering(false);
    }
  };

  const handleFrameSelect = (preset: any) => {
    setActiveFrameId(preset.id);
    setCustomText(preset.frameText || preset.name || "");
    if (preset.layoutId) {
      const layoutKey = preset.layoutId.replace("layout_", "") as "strip" | "grid" | "polaroid";
      if (["strip", "grid", "polaroid"].includes(layoutKey)) {
        setActiveLayout(layoutKey);
      }
    }
  };

  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  return (
    <div className="flex-1 bg-[#fbfbfb] dark:bg-[#0b0b0c] text-zinc-850 dark:text-[#e3e3e3] font-sans flex flex-col justify-between overflow-x-hidden min-h-screen relative transition-colors duration-300">
      {/* Visual Ambient Background Glows */}
      <div className="absolute top-0 left-[-15%] w-[45%] aspect-square rounded-full bg-blue-500/5 blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-[10%] right-[-15%] w-[45%] aspect-square rounded-full bg-indigo-500/5 blur-[120px] pointer-events-none z-0" />

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
          selectedPresetId={activeFrameId}
          selectedFilterId={activeFilter.id}
          selectedLayoutId={activeLayout}
          onSelectPreset={(preset) => handleFrameSelect(preset)}
          onSelectFilter={(filter) => setActiveFilter(filter)}
          onSelectLayout={(layoutId) => setActiveLayout(layoutId as "strip" | "grid" | "polaroid")}
          availableFilters={activeFiltersList}
          availableLayouts={activeLayoutsList}
          onContinue={() => changeStep("capture")}
        />
      )}

      {/* All other steps: centered padded layout */}
      {step !== "setup" && (
        <div className="flex-1 flex flex-col items-center justify-center w-full z-10 relative">
          <main className="flex-1 flex flex-col items-center justify-center w-full relative">

            {slug && step === "payment" && (
              <>
                {/* Top bar with theme toggle for payment step */}
                <div className="mb-4 w-full max-w-md flex justify-end">
                  <button
                    type="button"
                    onClick={toggleTheme}
                    className="w-8 h-8 rounded-xl bg-white/80 dark:bg-zinc-900/60 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-800/60 flex items-center justify-center transition-all cursor-pointer shadow-sm"
                    title={theme === "dark" ? "Mode Terang" : "Mode Gelap"}
                  >
                    {theme === "dark" ? (
                      <Sun className="w-3.5 h-3.5 text-amber-500" />
                    ) : (
                      <Moon className="w-3.5 h-3.5 text-indigo-500" />
                    )}
                  </button>
                </div>
                <PaymentScreen
                  customerName={customerName}
                  customerPhone={customerPhone}
                  sessionsCount={sessionsCount}
                  onPaymentSuccess={() => changeStep("setup")}
                  onCancel={() => {
                    router.push("/operator");
                  }}
                  eventName={config.eventName}
                />
              </>
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
                layoutsCount={selectedFrameTemplate?.customSlots?.length ?? LAYOUTS.find((l) => l.id === activeLayout)?.count ?? 4}
                config={config}
                activeFrameId={activeFrameId}
                countdownDuration={countdownDuration}
                setCountdownDuration={setCountdownDuration}
                onRetakeSlot={retakeSingleSlot}
                onComplete={() => changeStep("preview")}
                currentCaptureNum={currentCaptureNum}
                customerName={customerName}
                customerPhone={customerPhone}
                currentSessionNum={currentSessionNum}
                sessionsCount={sessionsCount}
              />
            )}

            {slug && step === "preview" && (
              <PreviewScreen
                compiledStripUrl={compiledStripUrl}
                isRendering={isRendering}
                customText={customText}
                setCustomText={setCustomText}
                activeFrameId={activeFrameId}
                handleFrameSelect={handleFrameSelect}
                config={config}
                activeLayout={activeLayout}
                selectedFrameTemplate={selectedFrameTemplate}
                handleDownload={handleDownload}
                onRetake={() => {
                  changeStep("capture");
                  setCapturedPhotos([]);
                }}
                onReset={() => {
                  clearSessionData();
                  changeStep("start");
                }}
                placedStickers={placedStickers}
                setPlacedStickers={setPlacedStickers}
                customerName={customerName}
                customerPhone={customerPhone}
                currentSessionNum={currentSessionNum}
                sessionsCount={sessionsCount}
              />
            )}
          </main>
        </div>
      )}
    </div>
  );
}
