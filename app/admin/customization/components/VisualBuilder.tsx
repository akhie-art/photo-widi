"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Camera, ImagePlus, Clock, Save, ArrowLeft, 
  Layout, Settings, Palette, Edit3, QrCode, 
  Component, LayoutTemplate, Sparkles, GripHorizontal, GripVertical, Trash2, Type, Sliders, MousePointer2,
  Smartphone, Tablet, Monitor, Eye, EyeOff, Undo, Redo, ZoomIn, ZoomOut, Layers, Heart, Lock, Grid, Menu
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { UiTemplate, EventConfig } from "../../../hooks/usePhotoboothStore";
import { THEME_GLOWS, getFontFamilyName } from "./theme-constants";

// Import operator components to display in the canvas tabs
import StartScreen from "@/app/operator/components/StartScreen";
import PaymentScreen from "@/app/operator/components/PaymentScreen";
import CaptureScreen from "@/app/operator/components/CaptureScreen";
import ShareScreen from "@/app/operator/components/ShareScreen";
import TemplateDecoration from "@/app/operator/components/TemplateDecoration";

interface VisualBuilderProps {
  initialData?: UiTemplate | null;
  templates?: UiTemplate[];
  onSave: (data: Partial<UiTemplate>) => Promise<string | null>;
  onCancel: () => void;
  isSaving: boolean;
  eventName?: string;
  pricePerSession?: number;
}

interface BuilderSnapshot {
  templateName: string;
  logoUrl: string;
  qrisUrl: string;
  bgTheme: string;
  fontStyle: string;
  welcomeText: string;
  footerText: string;
  formTitle: string;
  visitorFormLabel: string;
  customerNameLabel: string;
  customerPhoneLabel: string;
  sessionsCountLabel: string;
  cameraSelectLabel: string;
  startButtonText: string;
  couplePhotoUrl?: string;
  groomLabel?: string;
  groomSubLabel?: string;
  groomPhotoUrl?: string;
  brideLabel?: string;
  brideSubLabel?: string;
  bridePhotoUrl?: string;
  logoSize: "sm" | "md" | "lg" | "xl";
  welcomeTextSize: "sm" | "md" | "lg" | "xl";
  formCardPadding: "sm" | "md" | "lg";
  startButtonSize: "sm" | "md" | "lg";
  primaryColor: string;
  cardBorderRadius: "none" | "sm" | "md" | "lg" | "xl" | "2xl";
  cardShadow: "none" | "sm" | "md" | "lg" | "xl" | "2xl";
  inputBgStyle: "white" | "tinted" | "transparent";
  buttonStyle: "solid" | "outline" | "gradient";
  cardStyle: "classic" | "glass" | "frameless" | "neobrutalist";
  hideLogo: boolean;
  hideWelcomeText: boolean;
  hideFormRegistrasi: boolean;
  hideStartBtn: boolean;
  hideFooterText: boolean;
  hideCameraFeed?: boolean;
  hideCountdownTimer?: boolean;
  hideCompiledStrip?: boolean;
  hideQrShare?: boolean;
  hidePrintBtn?: boolean;
  welcomeTextAlignment: "left" | "center" | "right";
  customWelcomeTextColor: string;
  customButtonTextColor: string;
  showPayment: boolean;
  countdownDuration: number;
  showCustomCard: boolean;
  customCardTitle: string;
  customCardContent: string;
  logoScale?: number;
  logoRotate?: number;
  logoX?: number;
  logoY?: number;
  couplePhotoScale?: number;
  couplePhotoRotate?: number;
  couplePhotoX?: number;
  couplePhotoY?: number;
  welcomeTextScale?: number;
  welcomeTextRotate?: number;
  welcomeTextX?: number;
  welcomeTextY?: number;
  formScale?: number;
  formRotate?: number;
  formX?: number;
  formY?: number;
  customCardScale?: number;
  customCardRotate?: number;
  customCardX?: number;
  customCardY?: number;
  startBtnScale?: number;
  startBtnRotate?: number;
  startBtnX?: number;
  startBtnY?: number;
  footerScale?: number;
  footerRotate?: number;
  footerX?: number;
  footerY?: number;
  groomScale?: number;
  groomRotate?: number;
  groomX?: number;
  groomY?: number;
  brideScale?: number;
  brideRotate?: number;
  brideX?: number;
  brideY?: number;
}

export default function VisualBuilder({ initialData, templates = [], onSave, onCancel, isSaving, eventName, pricePerSession }: VisualBuilderProps) {
  // Form States
  const [templateName, setTemplateName] = useState(initialData?.name || "");
  const [logoUrl, setLogoUrl] = useState(initialData?.logoUrl || "");
  const [qrisUrl, setQrisUrl] = useState(initialData?.qrisUrl || "");
  const [couplePhotoUrl, setCouplePhotoUrl] = useState(initialData?.customization?.couplePhotoUrl || "");
  const [groomLabel, setGroomLabel] = useState(initialData?.customization?.groomLabel || "Mempelai Pria");
  const [groomSubLabel, setGroomSubLabel] = useState(initialData?.customization?.groomSubLabel || "The Groom");
  const [groomPhotoUrl, setGroomPhotoUrl] = useState(initialData?.customization?.groomPhotoUrl || "");
  const [brideLabel, setBrideLabel] = useState(initialData?.customization?.brideLabel || "Mempelai Wanita");
  const [brideSubLabel, setBrideSubLabel] = useState(initialData?.customization?.brideSubLabel || "The Bride");
  const [bridePhotoUrl, setBridePhotoUrl] = useState(initialData?.customization?.bridePhotoUrl || "");
  const [groomScale, setGroomScale] = useState<number>(initialData?.customization?.groomScale ?? 1);
  const [groomRotate, setGroomRotate] = useState<number>(initialData?.customization?.groomRotate ?? -7);
  const [groomX, setGroomX] = useState<number>(initialData?.customization?.groomX ?? 0);
  const [groomY, setGroomY] = useState<number>(initialData?.customization?.groomY ?? 0);
  const [brideScale, setBrideScale] = useState<number>(initialData?.customization?.brideScale ?? 1);
  const [brideRotate, setBrideRotate] = useState<number>(initialData?.customization?.brideRotate ?? 7);
  const [brideX, setBrideX] = useState<number>(initialData?.customization?.brideX ?? 0);
  const [brideY, setBrideY] = useState<number>(initialData?.customization?.brideY ?? 0);
  const [bgTheme, setBgTheme] = useState(initialData?.bgTheme || "sunset");
  const [fontStyle, setFontStyle] = useState(initialData?.fontStyle || "inter");
  const [welcomeText, setWelcomeText] = useState(initialData?.welcomeText || "Silakan isi data untuk memulai sesi foto Anda.");
  const [footerText, setFooterText] = useState(initialData?.footerText || "© 2026 Glowbooth Studio.");
  
  // Customization States
  const [formTitle, setFormTitle] = useState("Registrasi Pengunjung");
  const [visitorFormLabel, setVisitorFormLabel] = useState("DATA PENGUNJUNG");
  const [customerNameLabel, setCustomerNameLabel] = useState("Nama Panggilan");
  const [customerPhoneLabel, setCustomerPhoneLabel] = useState("Nomor WhatsApp");
  const [sessionsCountLabel, setSessionsCountLabel] = useState("Jumlah Sesi Foto");
  const [cameraSelectLabel, setCameraSelectLabel] = useState("PILIH KAMERA AKTIF");
  const [startButtonText, setStartButtonText] = useState("Mulai Sesi Foto");
  const [logoSize, setLogoSize] = useState<"sm" | "md" | "lg" | "xl">("md");
  const [welcomeTextSize, setWelcomeTextSize] = useState<"sm" | "md" | "lg" | "xl">("md");
  const [formCardPadding, setFormCardPadding] = useState<"sm" | "md" | "lg">("md");
  const [startButtonSize, setStartButtonSize] = useState<"sm" | "md" | "lg">("md");

  // Advanced styling customization states
  const [primaryColor, setPrimaryColor] = useState<string>("");
  const [cardBorderRadius, setCardBorderRadius] = useState<"none" | "sm" | "md" | "lg" | "xl" | "2xl">("2xl");
  const [cardShadow, setCardShadow] = useState<"none" | "sm" | "md" | "lg" | "xl" | "2xl">("2xl");
  const [inputBgStyle, setInputBgStyle] = useState<"white" | "tinted" | "transparent">("white");
  const [buttonStyle, setButtonStyle] = useState<"solid" | "outline" | "gradient">("solid");
  const [cardStyle, setCardStyle] = useState<"classic" | "glass" | "frameless" | "neobrutalist">(
    initialData?.customization?.cardStyle || "classic"
  );
  const [hideLogo, setHideLogo] = useState<boolean>(initialData ? (initialData.customization?.hideLogo ?? false) : true);
  const [hideWelcomeText, setHideWelcomeText] = useState<boolean>(initialData ? (initialData.customization?.hideWelcomeText ?? false) : true);
  const [hideFormRegistrasi, setHideFormRegistrasi] = useState<boolean>(initialData ? (initialData.customization?.hideFormRegistrasi ?? false) : true);
  const [hideStartBtn, setHideStartBtn] = useState<boolean>(initialData ? (initialData.customization?.hideStartBtn ?? false) : true);
  const [hideFooterText, setHideFooterText] = useState<boolean>(initialData ? (initialData.customization?.hideFooterText ?? false) : true);
  const [welcomeTextAlignment, setWelcomeTextAlignment] = useState<"left" | "center" | "right">("center");
  const [customWelcomeTextColor, setCustomWelcomeTextColor] = useState<string>("");
  const [customButtonTextColor, setCustomButtonTextColor] = useState<string>("");
  const [showCustomCard, setShowCustomCard] = useState<boolean>(false);
  const [customCardTitle, setCustomCardTitle] = useState<string>("Info Photobooth");
  const [customCardContent, setCustomCardContent] = useState<string>("Gunakan aksesoris yang tersedia untuk berpose. Hasil foto akan dicetak otomatis dalam waktu 1 menit.");

  // Resize, Rotate & Drag Offset States
  const [logoScale, setLogoScale] = useState<number>(1);
  const [logoRotate, setLogoRotate] = useState<number>(0);
  const [logoX, setLogoX] = useState<number>(0);
  const [logoY, setLogoY] = useState<number>(0);

  const [couplePhotoScale, setCouplePhotoScale] = useState<number>(1);
  const [couplePhotoRotate, setCouplePhotoRotate] = useState<number>(0);
  const [couplePhotoX, setCouplePhotoX] = useState<number>(0);
  const [couplePhotoY, setCouplePhotoY] = useState<number>(0);

  const [welcomeTextScale, setWelcomeTextScale] = useState<number>(1);
  const [welcomeTextRotate, setWelcomeTextRotate] = useState<number>(0);
  const [welcomeTextX, setWelcomeTextX] = useState<number>(0);
  const [welcomeTextY, setWelcomeTextY] = useState<number>(0);

  const [formScale, setFormScale] = useState<number>(1);
  const [formRotate, setFormRotate] = useState<number>(0);
  const [formX, setFormX] = useState<number>(0);
  const [formY, setFormY] = useState<number>(0);

  const [customCardScale, setCustomCardScale] = useState<number>(1);
  const [customCardRotate, setCustomCardRotate] = useState<number>(0);
  const [customCardX, setCustomCardX] = useState<number>(0);
  const [customCardY, setCustomCardY] = useState<number>(0);

  const [startBtnScale, setStartBtnScale] = useState<number>(1);
  const [startBtnRotate, setStartBtnRotate] = useState<number>(0);
  const [startBtnX, setStartBtnX] = useState<number>(0);
  const [startBtnY, setStartBtnY] = useState<number>(0);

  const [footerScale, setFooterScale] = useState<number>(1);
  const [footerRotate, setFooterRotate] = useState<number>(0);
  const [footerX, setFooterX] = useState<number>(0);
  const [footerY, setFooterY] = useState<number>(0);

  const [openSection, setOpenSection] = useState<"brand" | "visual" | "fields" | "camera" | "customCard" | null>("brand");

  // Settings
  const [showPayment, setShowPayment] = useState(initialData ? (initialData.showPayment ?? true) : false);
  const [countdownDuration, setCountdownDuration] = useState(initialData?.countdownDuration ?? 3);

  // Drag and Drop component to canvas states
  const [isDraggingComponent, setIsDraggingComponent] = useState<boolean>(false);
  const [isDragOverCanvas, setIsDragOverCanvas] = useState<boolean>(false);

  const [hideCameraFeed, setHideCameraFeed] = useState<boolean>(initialData ? (initialData.customization?.hideCameraFeed ?? false) : true);
  const [hideCountdownTimer, setHideCountdownTimer] = useState<boolean>(initialData ? (initialData.customization?.hideCountdownTimer ?? false) : true);
  const [hideCompiledStrip, setHideCompiledStrip] = useState<boolean>(initialData ? (initialData.customization?.hideCompiledStrip ?? false) : true);
  const [hideQrShare, setHideQrShare] = useState<boolean>(initialData ? (initialData.customization?.hideQrShare ?? false) : true);
  const [hidePrintBtn, setHidePrintBtn] = useState<boolean>(initialData ? (initialData.customization?.hidePrintBtn ?? false) : true);

  // View States
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [activeSidebarTab, setActiveSidebarTab] = useState<"design" | "templates" | "settings" | "components" | "layers">("design");
  const [previewScreen, setPreviewScreen] = useState<"registrasi" | "payment" | "capture" | "share">("registrasi");
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);
  const [widgetSearchQuery, setWidgetSearchQuery] = useState("");
  const [activeWidgetTab, setActiveWidgetTab] = useState<"content" | "style" | "advanced">("content");
  const [openElementorSection, setOpenElementorSection] = useState<string | null>("basic");
  const [devicePreview, setDevicePreview] = useState<"mobile" | "tablet" | "desktop">("desktop");
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [showGrid, setShowGrid] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("builder_show_grid");
      return saved !== null ? saved === "true" : true;
    }
    return true;
  });
  const [showGuides, setShowGuides] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("builder_show_guides");
      return saved !== null ? saved === "true" : true;
    }
    return true;
  });

  useEffect(() => {
    localStorage.setItem("builder_show_grid", String(showGrid));
  }, [showGrid]);

  useEffect(() => {
    localStorage.setItem("builder_show_guides", String(showGuides));
  }, [showGuides]);

  // Undo/Redo states
  const [history, setHistory] = useState<BuilderSnapshot[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  // Mock states for operator screens rendering inside preview
  const [mockCustomerName, setMockCustomerName] = useState("Widi");
  const [mockCustomerPhone, setMockCustomerPhone] = useState("081234567890");
  const [mockSessionsCount, setMockSessionsCount] = useState<number | "">(1);
  const dummyVideoRef = useRef<HTMLVideoElement>(null);

  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const zoomLevelRef = useRef(zoomLevel);

  useEffect(() => {
    zoomLevelRef.current = zoomLevel;
  }, [zoomLevel]);

  useEffect(() => {
    const container = canvasContainerRef.current;
    const viewport = viewportRef.current;
    if (!container || !viewport) return;

    let wheelTimeout: NodeJS.Timeout;
    let rAFId: number | null = null;

    const applyZoomDOM = (zoom: number) => {
      viewport.style.transform = `scale(${zoom / 100})`;
      // Update state via requestAnimationFrame to keep header text in sync smoothly
      if (rAFId !== null) cancelAnimationFrame(rAFId);
      rAFId = requestAnimationFrame(() => {
        setZoomLevel(zoom);
      });
    };

    // Trackpad pinch-to-zoom (wheel event with ctrlKey)
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
        viewport.style.transition = 'none';
        
        const zoomFactor = 0.45; // lower sensitivity for butter smoothness
        const delta = -e.deltaY * zoomFactor;
        
        const currentZoom = zoomLevelRef.current;
        const newZoom = Math.min(150, Math.max(50, Math.round(currentZoom + delta)));
        applyZoomDOM(newZoom);

        clearTimeout(wheelTimeout);
        wheelTimeout = setTimeout(() => {
          if (viewportRef.current) {
            viewportRef.current.style.transition = 'transform 0.15s ease-in-out';
          }
        }, 150);
      }
    };

    // Touch pinch-to-zoom variables
    let startDistance = -1;
    let startZoom = 100;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        viewport.style.transition = 'none';
        startDistance = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        startZoom = zoomLevelRef.current;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && startDistance > 0) {
        e.preventDefault();
        
        const currentDistance = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        
        const ratio = currentDistance / startDistance;
        const newZoom = Math.min(150, Math.max(50, Math.round(startZoom * ratio)));
        applyZoomDOM(newZoom);
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) {
        startDistance = -1;
        viewport.style.transition = 'transform 0.15s ease-in-out';
      }
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    container.addEventListener("touchstart", handleTouchStart, { passive: true });
    container.addEventListener("touchmove", handleTouchMove, { passive: false });
    container.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener("wheel", handleWheel);
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
      clearTimeout(wheelTimeout);
      if (rAFId !== null) cancelAnimationFrame(rAFId);
    };
  }, []);

  // Load Customization from LocalStorage or initialData
  useEffect(() => {
    if (initialData) {
      const parsed = initialData.customization;
      if (parsed) {
        if (parsed.couplePhotoUrl !== undefined) setCouplePhotoUrl(parsed.couplePhotoUrl);
        if (parsed.groomLabel !== undefined) setGroomLabel(parsed.groomLabel);
        if (parsed.groomSubLabel !== undefined) setGroomSubLabel(parsed.groomSubLabel);
        if (parsed.groomPhotoUrl !== undefined) setGroomPhotoUrl(parsed.groomPhotoUrl);
        if (parsed.brideLabel !== undefined) setBrideLabel(parsed.brideLabel);
        if (parsed.brideSubLabel !== undefined) setBrideSubLabel(parsed.brideSubLabel);
        if (parsed.bridePhotoUrl !== undefined) setBridePhotoUrl(parsed.bridePhotoUrl);
        if (parsed.formTitle !== undefined) setFormTitle(parsed.formTitle);
        if (parsed.visitorFormLabel !== undefined) setVisitorFormLabel(parsed.visitorFormLabel);
        if (parsed.customerNameLabel !== undefined) setCustomerNameLabel(parsed.customerNameLabel);
        if (parsed.customerPhoneLabel !== undefined) setCustomerPhoneLabel(parsed.customerPhoneLabel);
        if (parsed.sessionsCountLabel !== undefined) setSessionsCountLabel(parsed.sessionsCountLabel);
        if (parsed.cameraSelectLabel !== undefined) setCameraSelectLabel(parsed.cameraSelectLabel);
        if (parsed.startButtonText !== undefined) setStartButtonText(parsed.startButtonText);
        if (parsed.logoSize !== undefined) setLogoSize(parsed.logoSize);
        if (parsed.welcomeTextSize !== undefined) setWelcomeTextSize(parsed.welcomeTextSize);
        if (parsed.formCardPadding !== undefined) setFormCardPadding(parsed.formCardPadding);
        if (parsed.startButtonSize !== undefined) setStartButtonSize(parsed.startButtonSize);
        
        if (parsed.primaryColor !== undefined) setPrimaryColor(parsed.primaryColor);
        if (parsed.cardBorderRadius !== undefined) setCardBorderRadius(parsed.cardBorderRadius);
        if (parsed.cardShadow !== undefined) setCardShadow(parsed.cardShadow);
        if (parsed.inputBgStyle !== undefined) setInputBgStyle(parsed.inputBgStyle);
        if (parsed.buttonStyle !== undefined) setButtonStyle(parsed.buttonStyle);
        if (parsed.cardStyle !== undefined) setCardStyle(parsed.cardStyle);
        if (parsed.hideLogo !== undefined) setHideLogo(parsed.hideLogo);
        if (parsed.hideWelcomeText !== undefined) setHideWelcomeText(parsed.hideWelcomeText);
        if (parsed.hideFormRegistrasi !== undefined) setHideFormRegistrasi(parsed.hideFormRegistrasi);
        if (parsed.hideStartBtn !== undefined) setHideStartBtn(parsed.hideStartBtn);
        if (parsed.hideFooterText !== undefined) setHideFooterText(parsed.hideFooterText);
        if (parsed.hideCameraFeed !== undefined) setHideCameraFeed(parsed.hideCameraFeed);
        if (parsed.hideCountdownTimer !== undefined) setHideCountdownTimer(parsed.hideCountdownTimer);
        if (parsed.hideCompiledStrip !== undefined) setHideCompiledStrip(parsed.hideCompiledStrip);
        if (parsed.hideQrShare !== undefined) setHideQrShare(parsed.hideQrShare);
        if (parsed.hidePrintBtn !== undefined) setHidePrintBtn(parsed.hidePrintBtn);
        if (parsed.welcomeTextAlignment !== undefined) setWelcomeTextAlignment(parsed.welcomeTextAlignment);
        if (parsed.customWelcomeTextColor !== undefined) setCustomWelcomeTextColor(parsed.customWelcomeTextColor);
        if (parsed.customButtonTextColor !== undefined) setCustomButtonTextColor(parsed.customButtonTextColor);
        if (parsed.showCustomCard !== undefined) setShowCustomCard(parsed.showCustomCard);
        if (parsed.customCardTitle !== undefined) setCustomCardTitle(parsed.customCardTitle);
        if (parsed.customCardContent !== undefined) setCustomCardContent(parsed.customCardContent);
        if (parsed.logoScale !== undefined) setLogoScale(Number(parsed.logoScale));
        if (parsed.logoRotate !== undefined) setLogoRotate(Number(parsed.logoRotate));
        if (parsed.logoX !== undefined) setLogoX(Number(parsed.logoX));
        if (parsed.logoY !== undefined) setLogoY(Number(parsed.logoY));
        if (parsed.couplePhotoScale !== undefined) setCouplePhotoScale(Number(parsed.couplePhotoScale));
        if (parsed.couplePhotoRotate !== undefined) setCouplePhotoRotate(Number(parsed.couplePhotoRotate));
        if (parsed.couplePhotoX !== undefined) setCouplePhotoX(Number(parsed.couplePhotoX));
        if (parsed.couplePhotoY !== undefined) setCouplePhotoY(Number(parsed.couplePhotoY));
        if (parsed.welcomeTextScale !== undefined) setWelcomeTextScale(Number(parsed.welcomeTextScale));
        if (parsed.welcomeTextRotate !== undefined) setWelcomeTextRotate(Number(parsed.welcomeTextRotate));
        if (parsed.welcomeTextX !== undefined) setWelcomeTextX(Number(parsed.welcomeTextX));
        if (parsed.welcomeTextY !== undefined) setWelcomeTextY(Number(parsed.welcomeTextY));
        if (parsed.formScale !== undefined) setFormScale(Number(parsed.formScale));
        if (parsed.formRotate !== undefined) setFormRotate(Number(parsed.formRotate));
        if (parsed.formX !== undefined) setFormX(Number(parsed.formX));
        if (parsed.formY !== undefined) setFormY(Number(parsed.formY));
        if (parsed.customCardScale !== undefined) setCustomCardScale(Number(parsed.customCardScale));
        if (parsed.customCardRotate !== undefined) setCustomCardRotate(Number(parsed.customCardRotate));
        if (parsed.customCardX !== undefined) setCustomCardX(Number(parsed.customCardX));
        if (parsed.customCardY !== undefined) setCustomCardY(Number(parsed.customCardY));
        if (parsed.startBtnScale !== undefined) setStartBtnScale(Number(parsed.startBtnScale));
        if (parsed.startBtnRotate !== undefined) setStartBtnRotate(Number(parsed.startBtnRotate));
        if (parsed.startBtnX !== undefined) setStartBtnX(Number(parsed.startBtnX));
        if (parsed.startBtnY !== undefined) setStartBtnY(Number(parsed.startBtnY));
        if (parsed.footerScale !== undefined) setFooterScale(Number(parsed.footerScale));
        if (parsed.footerRotate !== undefined) setFooterRotate(Number(parsed.footerRotate));
        if (parsed.footerX !== undefined) setFooterX(Number(parsed.footerX));
        if (parsed.footerY !== undefined) setFooterY(Number(parsed.footerY));
        if (parsed.groomScale !== undefined) setGroomScale(Number(parsed.groomScale));
        if (parsed.groomRotate !== undefined) setGroomRotate(Number(parsed.groomRotate));
        if (parsed.groomX !== undefined) setGroomX(Number(parsed.groomX));
        if (parsed.groomY !== undefined) setGroomY(Number(parsed.groomY));
        if (parsed.brideScale !== undefined) setBrideScale(Number(parsed.brideScale));
        if (parsed.brideRotate !== undefined) setBrideRotate(Number(parsed.brideRotate));
        if (parsed.brideX !== undefined) setBrideX(Number(parsed.brideX));
        if (parsed.brideY !== undefined) setBrideY(Number(parsed.brideY));
      } else if (initialData.id) {
        // Fallback to localStorage for compatibility
        try {
          const stored = localStorage.getItem(`glowbooth_customization_${initialData.id}`);
          if (stored) {
            const parsedLocal = JSON.parse(stored);
            if (parsedLocal.groomLabel !== undefined) setGroomLabel(parsedLocal.groomLabel);
            if (parsedLocal.groomSubLabel !== undefined) setGroomSubLabel(parsedLocal.groomSubLabel);
            if (parsedLocal.groomPhotoUrl !== undefined) setGroomPhotoUrl(parsedLocal.groomPhotoUrl);
            if (parsedLocal.brideLabel !== undefined) setBrideLabel(parsedLocal.brideLabel);
            if (parsedLocal.brideSubLabel !== undefined) setBrideSubLabel(parsedLocal.brideSubLabel);
            if (parsedLocal.bridePhotoUrl !== undefined) setBridePhotoUrl(parsedLocal.bridePhotoUrl);
            if (parsedLocal.formTitle !== undefined) setFormTitle(parsedLocal.formTitle);
            if (parsedLocal.visitorFormLabel !== undefined) setVisitorFormLabel(parsedLocal.visitorFormLabel);
            if (parsedLocal.customerNameLabel !== undefined) setCustomerNameLabel(parsedLocal.customerNameLabel);
            if (parsedLocal.customerPhoneLabel !== undefined) setCustomerPhoneLabel(parsedLocal.customerPhoneLabel);
            if (parsedLocal.sessionsCountLabel !== undefined) setSessionsCountLabel(parsedLocal.sessionsCountLabel);
            if (parsedLocal.cameraSelectLabel !== undefined) setCameraSelectLabel(parsedLocal.cameraSelectLabel);
            if (parsedLocal.startButtonText !== undefined) setStartButtonText(parsedLocal.startButtonText);
            if (parsedLocal.logoSize !== undefined) setLogoSize(parsedLocal.logoSize);
            if (parsedLocal.welcomeTextSize !== undefined) setWelcomeTextSize(parsedLocal.welcomeTextSize);
            if (parsedLocal.formCardPadding !== undefined) setFormCardPadding(parsedLocal.formCardPadding);
            if (parsedLocal.startButtonSize !== undefined) setStartButtonSize(parsedLocal.startButtonSize);
            
            if (parsedLocal.primaryColor !== undefined) setPrimaryColor(parsedLocal.primaryColor);
            if (parsedLocal.cardBorderRadius !== undefined) setCardBorderRadius(parsedLocal.cardBorderRadius);
            if (parsedLocal.cardShadow !== undefined) setCardShadow(parsedLocal.cardShadow);
            if (parsedLocal.inputBgStyle !== undefined) setInputBgStyle(parsedLocal.inputBgStyle);
            if (parsedLocal.buttonStyle !== undefined) setButtonStyle(parsedLocal.buttonStyle);
            if (parsedLocal.cardStyle !== undefined) setCardStyle(parsedLocal.cardStyle);
            if (parsedLocal.hideLogo !== undefined) setHideLogo(parsedLocal.hideLogo);
            if (parsedLocal.hideWelcomeText !== undefined) setHideWelcomeText(parsedLocal.hideWelcomeText);
            if (parsedLocal.hideFormRegistrasi !== undefined) setHideFormRegistrasi(parsedLocal.hideFormRegistrasi);
            if (parsedLocal.hideStartBtn !== undefined) setHideStartBtn(parsedLocal.hideStartBtn);
            if (parsedLocal.hideFooterText !== undefined) setHideFooterText(parsedLocal.hideFooterText);
            if (parsedLocal.hideCameraFeed !== undefined) setHideCameraFeed(parsedLocal.hideCameraFeed);
            if (parsedLocal.hideCountdownTimer !== undefined) setHideCountdownTimer(parsedLocal.hideCountdownTimer);
            if (parsedLocal.hideCompiledStrip !== undefined) setHideCompiledStrip(parsedLocal.hideCompiledStrip);
            if (parsedLocal.hideQrShare !== undefined) setHideQrShare(parsedLocal.hideQrShare);
            if (parsedLocal.hidePrintBtn !== undefined) setHidePrintBtn(parsedLocal.hidePrintBtn);
            if (parsedLocal.welcomeTextAlignment !== undefined) setWelcomeTextAlignment(parsedLocal.welcomeTextAlignment);
            if (parsedLocal.customWelcomeTextColor !== undefined) setCustomWelcomeTextColor(parsedLocal.customWelcomeTextColor);
            if (parsedLocal.customButtonTextColor !== undefined) setCustomButtonTextColor(parsedLocal.customButtonTextColor);
            if (parsedLocal.showCustomCard !== undefined) setShowCustomCard(parsedLocal.showCustomCard);
            if (parsedLocal.customCardTitle !== undefined) setCustomCardTitle(parsedLocal.customCardTitle);
            if (parsedLocal.customCardContent !== undefined) setCustomCardContent(parsedLocal.customCardContent);
            if (parsedLocal.logoScale !== undefined) setLogoScale(Number(parsedLocal.logoScale));
            if (parsedLocal.logoRotate !== undefined) setLogoRotate(Number(parsedLocal.logoRotate));
            if (parsedLocal.logoX !== undefined) setLogoX(Number(parsedLocal.logoX));
            if (parsedLocal.logoY !== undefined) setLogoY(Number(parsedLocal.logoY));
            if (parsedLocal.couplePhotoScale !== undefined) setCouplePhotoScale(Number(parsedLocal.couplePhotoScale));
            if (parsedLocal.couplePhotoRotate !== undefined) setCouplePhotoRotate(Number(parsedLocal.couplePhotoRotate));
            if (parsedLocal.couplePhotoX !== undefined) setCouplePhotoX(Number(parsedLocal.couplePhotoX));
            if (parsedLocal.couplePhotoY !== undefined) setCouplePhotoY(Number(parsedLocal.couplePhotoY));
            if (parsedLocal.welcomeTextScale !== undefined) setWelcomeTextScale(Number(parsedLocal.welcomeTextScale));
            if (parsedLocal.welcomeTextRotate !== undefined) setWelcomeTextRotate(Number(parsedLocal.welcomeTextRotate));
            if (parsedLocal.welcomeTextX !== undefined) setWelcomeTextX(Number(parsedLocal.welcomeTextX));
            if (parsedLocal.welcomeTextY !== undefined) setWelcomeTextY(Number(parsedLocal.welcomeTextY));
            if (parsedLocal.formScale !== undefined) setFormScale(Number(parsedLocal.formScale));
            if (parsedLocal.formRotate !== undefined) setFormRotate(Number(parsedLocal.formRotate));
            if (parsedLocal.formX !== undefined) setFormX(Number(parsedLocal.formX));
            if (parsedLocal.formY !== undefined) setFormY(Number(parsedLocal.formY));
            if (parsedLocal.customCardScale !== undefined) setCustomCardScale(Number(parsedLocal.customCardScale));
            if (parsedLocal.customCardRotate !== undefined) setCustomCardRotate(Number(parsedLocal.customCardRotate));
            if (parsedLocal.customCardX !== undefined) setCustomCardX(Number(parsedLocal.customCardX));
            if (parsedLocal.customCardY !== undefined) setCustomCardY(Number(parsedLocal.customCardY));
            if (parsedLocal.startBtnScale !== undefined) setStartBtnScale(Number(parsedLocal.startBtnScale));
            if (parsedLocal.startBtnRotate !== undefined) setStartBtnRotate(Number(parsedLocal.startBtnRotate));
            if (parsedLocal.startBtnX !== undefined) setStartBtnX(Number(parsedLocal.startBtnX));
            if (parsedLocal.startBtnY !== undefined) setStartBtnY(Number(parsedLocal.startBtnY));
            if (parsedLocal.footerScale !== undefined) setFooterScale(Number(parsedLocal.footerScale));
            if (parsedLocal.footerRotate !== undefined) setFooterRotate(Number(parsedLocal.footerRotate));
            if (parsedLocal.footerX !== undefined) setFooterX(Number(parsedLocal.footerX));
            if (parsedLocal.footerY !== undefined) setFooterY(Number(parsedLocal.footerY));
            if (parsedLocal.groomScale !== undefined) setGroomScale(Number(parsedLocal.groomScale));
            if (parsedLocal.groomRotate !== undefined) setGroomRotate(Number(parsedLocal.groomRotate));
            if (parsedLocal.groomX !== undefined) setGroomX(Number(parsedLocal.groomX));
            if (parsedLocal.groomY !== undefined) setGroomY(Number(parsedLocal.groomY));
            if (parsedLocal.brideScale !== undefined) setBrideScale(Number(parsedLocal.brideScale));
            if (parsedLocal.brideRotate !== undefined) setBrideRotate(Number(parsedLocal.brideRotate));
            if (parsedLocal.brideX !== undefined) setBrideX(Number(parsedLocal.brideX));
            if (parsedLocal.brideY !== undefined) setBrideY(Number(parsedLocal.brideY));
          }
        } catch (err) {
          console.error("Failed to load local customization:", err);
        }
      }

      // Capture initial state as history snapshot
      const initSnapshot: BuilderSnapshot = {
        templateName: initialData.name || "",
        logoUrl: initialData.logoUrl || "",
        qrisUrl: initialData.qrisUrl || "",
        bgTheme: initialData.bgTheme || "sunset",
        fontStyle: initialData.fontStyle || "inter",
        welcomeText: initialData.welcomeText || "",
        footerText: initialData.footerText || "",
        couplePhotoUrl: parsed?.couplePhotoUrl || "",
        groomLabel: parsed?.groomLabel || "Mempelai Pria",
        groomSubLabel: parsed?.groomSubLabel || "The Groom",
        groomPhotoUrl: parsed?.groomPhotoUrl || "",
        brideLabel: parsed?.brideLabel || "Mempelai Wanita",
        brideSubLabel: parsed?.brideSubLabel || "The Bride",
        bridePhotoUrl: parsed?.bridePhotoUrl || "",
        formTitle: parsed?.formTitle || "Registrasi Pengunjung",
        visitorFormLabel: parsed?.visitorFormLabel || "DATA PENGUNJUNG",
        customerNameLabel: parsed?.customerNameLabel || "Nama Panggilan",
        customerPhoneLabel: parsed?.customerPhoneLabel || "Nomor WhatsApp",
        sessionsCountLabel: parsed?.sessionsCountLabel || "Jumlah Sesi Foto",
        cameraSelectLabel: parsed?.cameraSelectLabel || "PILIH KAMERA AKTIF",
        startButtonText: parsed?.startButtonText || "Mulai Sesi Foto",
        logoSize: parsed?.logoSize || "md",
        welcomeTextSize: parsed?.welcomeTextSize || "md",
        formCardPadding: parsed?.formCardPadding || "md",
        startButtonSize: parsed?.startButtonSize || "md",
        primaryColor: parsed?.primaryColor || "",
        cardBorderRadius: parsed?.cardBorderRadius || "2xl",
        cardShadow: parsed?.cardShadow || "2xl",
        inputBgStyle: parsed?.inputBgStyle || "white",
        buttonStyle: parsed?.buttonStyle || "solid",
        cardStyle: parsed?.cardStyle || "classic",
        hideLogo: parsed?.hideLogo || false,
        hideWelcomeText: parsed?.hideWelcomeText || false,
        hideFormRegistrasi: parsed?.hideFormRegistrasi || false,
        hideStartBtn: parsed?.hideStartBtn || false,
        hideFooterText: parsed?.hideFooterText || false,
        hideCameraFeed: parsed?.hideCameraFeed || false,
        hideCountdownTimer: parsed?.hideCountdownTimer || false,
        hideCompiledStrip: parsed?.hideCompiledStrip || false,
        hideQrShare: parsed?.hideQrShare || false,
        hidePrintBtn: parsed?.hidePrintBtn || false,
        welcomeTextAlignment: parsed?.welcomeTextAlignment || "center",
        customWelcomeTextColor: parsed?.customWelcomeTextColor || "",
        customButtonTextColor: parsed?.customButtonTextColor || "",
        showPayment: initialData.showPayment ?? true,
        countdownDuration: initialData.countdownDuration ?? 3,
        showCustomCard: parsed?.showCustomCard || false,
        customCardTitle: parsed?.customCardTitle || "Info Photobooth",
        customCardContent: parsed?.customCardContent || "Gunakan aksesoris yang tersedia untuk berpose. Hasil foto akan dicetak otomatis dalam waktu 1 menit.",
        logoScale: parsed?.logoScale ?? 1,
        logoRotate: parsed?.logoRotate ?? 0,
        logoX: parsed?.logoX ?? 0,
        logoY: parsed?.logoY ?? 0,
        couplePhotoScale: parsed?.couplePhotoScale ?? 1,
        couplePhotoRotate: parsed?.couplePhotoRotate ?? 0,
        couplePhotoX: parsed?.couplePhotoX ?? 0,
        couplePhotoY: parsed?.couplePhotoY ?? 0,
        welcomeTextScale: parsed?.welcomeTextScale ?? 1,
        welcomeTextRotate: parsed?.welcomeTextRotate ?? 0,
        welcomeTextX: parsed?.welcomeTextX ?? 0,
        welcomeTextY: parsed?.welcomeTextY ?? 0,
        formScale: parsed?.formScale ?? 1,
        formRotate: parsed?.formRotate ?? 0,
        formX: parsed?.formX ?? 0,
        formY: parsed?.formY ?? 0,
        customCardScale: parsed?.customCardScale ?? 1,
        customCardRotate: parsed?.customCardRotate ?? 0,
        customCardX: parsed?.customCardX ?? 0,
        customCardY: parsed?.customCardY ?? 0,
        startBtnScale: parsed?.startBtnScale ?? 1,
        startBtnRotate: parsed?.startBtnRotate ?? 0,
        startBtnX: parsed?.startBtnX ?? 0,
        startBtnY: parsed?.startBtnY ?? 0,
        footerScale: parsed?.footerScale ?? 1,
        footerRotate: parsed?.footerRotate ?? 0,
        footerX: parsed?.footerX ?? 0,
        footerY: parsed?.footerY ?? 0,
        groomScale: parsed?.groomScale ?? 1,
        groomRotate: parsed?.groomRotate ?? -7,
        groomX: parsed?.groomX ?? 0,
        groomY: parsed?.groomY ?? 0,
        brideScale: parsed?.brideScale ?? 1,
        brideRotate: parsed?.brideRotate ?? 7,
        brideX: parsed?.brideX ?? 0,
        brideY: parsed?.brideY ?? 0,
      };
      setHistory([initSnapshot]);
      setHistoryIndex(0);
    }
  }, [initialData]);

  // Handle new blank template initialization
  useEffect(() => {
    if (!initialData) {
      const defaultSnapshot: BuilderSnapshot = {
        templateName: "",
        logoUrl: "",
        qrisUrl: "",
        bgTheme: "sunset",
        fontStyle: "inter",
        welcomeText: "Silakan isi data untuk memulai sesi foto Anda.",
        footerText: "© 2026 Glowbooth Studio.",
        couplePhotoUrl: "",
        groomLabel: "Mempelai Pria",
        groomSubLabel: "The Groom",
        groomPhotoUrl: "",
        brideLabel: "Mempelai Wanita",
        brideSubLabel: "The Bride",
        bridePhotoUrl: "",
        formTitle: "Registrasi Pengunjung",
        visitorFormLabel: "DATA PENGUNJUNG",
        customerNameLabel: "Nama Panggilan",
        customerPhoneLabel: "Nomor WhatsApp",
        sessionsCountLabel: "Jumlah Sesi Foto",
        cameraSelectLabel: "PILIH KAMERA AKTIF",
        startButtonText: "Mulai Sesi Foto",
        logoSize: "md",
        welcomeTextSize: "md",
        formCardPadding: "md",
        startButtonSize: "md",
        primaryColor: "",
        cardBorderRadius: "2xl",
        cardShadow: "2xl",
        inputBgStyle: "white",
        buttonStyle: "solid",
        cardStyle: "classic",
        hideLogo: true,
        hideWelcomeText: true,
        hideFormRegistrasi: true,
        hideStartBtn: true,
        hideFooterText: true,
        hideCameraFeed: true,
        hideCountdownTimer: true,
        hideCompiledStrip: true,
        hideQrShare: true,
        hidePrintBtn: true,
        welcomeTextAlignment: "center",
        customWelcomeTextColor: "",
        customButtonTextColor: "",
        showPayment: false,
        countdownDuration: 3,
        showCustomCard: false,
        customCardTitle: "Info Photobooth",
        customCardContent: "Gunakan aksesoris yang tersedia untuk berpose. Hasil foto akan dicetak otomatis dalam waktu 1 menit.",
        logoScale: 1,
        logoRotate: 0,
        couplePhotoScale: 1,
        couplePhotoRotate: 0,
        welcomeTextScale: 1,
        welcomeTextRotate: 0,
        formScale: 1,
        formRotate: 0,
        customCardScale: 1,
        customCardRotate: 0,
        startBtnScale: 1,
        startBtnRotate: 0,
        footerScale: 1,
        footerRotate: 0,
        groomScale: 1,
        groomRotate: -7,
        groomX: 0,
        groomY: 0,
        brideScale: 1,
        brideRotate: 7,
        brideX: 0,
        brideY: 0,
      };
      setHistory([defaultSnapshot]);
      setHistoryIndex(0);
    }
  }, []);

  const isUndoRedoRef = useRef(false);

  // Watch state changes and save snapshot after 800ms of inactivity
  useEffect(() => {
    if (isUndoRedoRef.current) {
      isUndoRedoRef.current = false;
      return;
    }

    const currentSnapshot: BuilderSnapshot = {
      templateName,
      logoUrl,
      qrisUrl,
      bgTheme,
      fontStyle,
      welcomeText,
      footerText,
      couplePhotoUrl,
      groomLabel,
      groomSubLabel,
      groomPhotoUrl,
      brideLabel,
      brideSubLabel,
      bridePhotoUrl,
      formTitle,
      visitorFormLabel,
      customerNameLabel,
      customerPhoneLabel,
      sessionsCountLabel,
      cameraSelectLabel,
      startButtonText,
      logoSize,
      welcomeTextSize,
      formCardPadding,
      startButtonSize,
      primaryColor,
      cardBorderRadius,
      cardShadow,
      inputBgStyle,
      buttonStyle,
      cardStyle,
      hideLogo,
      hideWelcomeText,
      hideFormRegistrasi,
      hideStartBtn,
      hideFooterText,
      welcomeTextAlignment,
      customWelcomeTextColor,
      customButtonTextColor,
      showPayment,
      countdownDuration,
      showCustomCard,
      customCardTitle,
      customCardContent,
      logoScale,
      logoRotate,
      logoX,
      logoY,
      couplePhotoScale,
      couplePhotoRotate,
      couplePhotoX,
      couplePhotoY,
      welcomeTextScale,
      welcomeTextRotate,
      welcomeTextX,
      welcomeTextY,
      formScale,
      formRotate,
      formX,
      formY,
      customCardScale,
      customCardRotate,
      customCardX,
      customCardY,
      startBtnScale,
      startBtnRotate,
      startBtnX,
      startBtnY,
      footerScale,
      footerRotate,
      footerX,
      footerY,
      groomScale,
      groomRotate,
      groomX,
      groomY,
      brideScale,
      brideRotate,
      brideX,
      brideY,
    };

    const timer = setTimeout(() => {
      const latestHistory = history[historyIndex];
      const isDifferent = !latestHistory || JSON.stringify(latestHistory) !== JSON.stringify(currentSnapshot);

      if (isDifferent) {
        const newHistory = history.slice(0, historyIndex + 1);
        setHistory([...newHistory, currentSnapshot]);
        setHistoryIndex(newHistory.length);
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [
    templateName, logoUrl, qrisUrl, bgTheme, fontStyle, welcomeText, footerText,
    formTitle, visitorFormLabel, customerNameLabel, customerPhoneLabel, sessionsCountLabel,
    cameraSelectLabel, startButtonText, logoSize, welcomeTextSize, formCardPadding,
    startButtonSize, primaryColor, cardBorderRadius, cardShadow, inputBgStyle,
    buttonStyle, cardStyle, hideLogo, hideWelcomeText, hideFormRegistrasi, hideStartBtn,
    hideFooterText, welcomeTextAlignment, customWelcomeTextColor, customButtonTextColor,
    showPayment, countdownDuration, showCustomCard, customCardTitle, customCardContent,
    logoScale, logoRotate, logoX, logoY, couplePhotoScale, couplePhotoRotate, couplePhotoX, couplePhotoY,
    welcomeTextScale, welcomeTextRotate, welcomeTextX, welcomeTextY, formScale, formRotate, formX, formY,
    customCardScale, customCardRotate, customCardX, customCardY, startBtnScale, startBtnRotate, startBtnX, startBtnY,
    footerScale, footerRotate, footerX, footerY,
    groomLabel, groomSubLabel, groomPhotoUrl, brideLabel, brideSubLabel, bridePhotoUrl,
    groomScale, groomRotate, groomX, groomY, brideScale, brideRotate, brideX, brideY
  ]);

  const applySnapshot = (snapshot: BuilderSnapshot) => {
    if (!snapshot) return;
    setCouplePhotoUrl(snapshot.couplePhotoUrl || "");
    setGroomLabel(snapshot.groomLabel || "Mempelai Pria");
    setGroomSubLabel(snapshot.groomSubLabel || "The Groom");
    setGroomPhotoUrl(snapshot.groomPhotoUrl || "");
    setBrideLabel(snapshot.brideLabel || "Mempelai Wanita");
    setBrideSubLabel(snapshot.brideSubLabel || "The Bride");
    setBridePhotoUrl(snapshot.bridePhotoUrl || "");
    setTemplateName(snapshot.templateName);
    setLogoUrl(snapshot.logoUrl);
    setQrisUrl(snapshot.qrisUrl);
    setBgTheme(snapshot.bgTheme);
    setFontStyle(snapshot.fontStyle);
    setWelcomeText(snapshot.welcomeText);
    setFooterText(snapshot.footerText);
    setFormTitle(snapshot.formTitle);
    setVisitorFormLabel(snapshot.visitorFormLabel);
    setCustomerNameLabel(snapshot.customerNameLabel);
    setCustomerPhoneLabel(snapshot.customerPhoneLabel);
    setSessionsCountLabel(snapshot.sessionsCountLabel);
    setCameraSelectLabel(snapshot.cameraSelectLabel);
    setStartButtonText(snapshot.startButtonText);
    setLogoSize(snapshot.logoSize);
    setWelcomeTextSize(snapshot.welcomeTextSize);
    setFormCardPadding(snapshot.formCardPadding);
    setStartButtonSize(snapshot.startButtonSize);
    setPrimaryColor(snapshot.primaryColor);
    setCardBorderRadius(snapshot.cardBorderRadius);
    setCardShadow(snapshot.cardShadow);
    setInputBgStyle(snapshot.inputBgStyle);
    setButtonStyle(snapshot.buttonStyle);
    setCardStyle(snapshot.cardStyle || "classic");
    setHideLogo(snapshot.hideLogo);
    setHideWelcomeText(snapshot.hideWelcomeText);
    setHideFormRegistrasi(snapshot.hideFormRegistrasi);
    setHideStartBtn(snapshot.hideStartBtn);
    setHideFooterText(snapshot.hideFooterText);
    setWelcomeTextAlignment(snapshot.welcomeTextAlignment);
    setCustomWelcomeTextColor(snapshot.customWelcomeTextColor);
    setCustomButtonTextColor(snapshot.customButtonTextColor);
    setShowPayment(snapshot.showPayment);
    setCountdownDuration(snapshot.countdownDuration);
    setShowCustomCard(snapshot.showCustomCard);
    setCustomCardTitle(snapshot.customCardTitle);
    setCustomCardContent(snapshot.customCardContent);
    setLogoScale(snapshot.logoScale ?? 1);
    setLogoRotate(snapshot.logoRotate ?? 0);
    setLogoX(snapshot.logoX ?? 0);
    setLogoY(snapshot.logoY ?? 0);
    setCouplePhotoScale(snapshot.couplePhotoScale ?? 1);
    setCouplePhotoRotate(snapshot.couplePhotoRotate ?? 0);
    setCouplePhotoX(snapshot.couplePhotoX ?? 0);
    setCouplePhotoY(snapshot.couplePhotoY ?? 0);
    setWelcomeTextScale(snapshot.welcomeTextScale ?? 1);
    setWelcomeTextRotate(snapshot.welcomeTextRotate ?? 0);
    setWelcomeTextX(snapshot.welcomeTextX ?? 0);
    setWelcomeTextY(snapshot.welcomeTextY ?? 0);
    setFormScale(snapshot.formScale ?? 1);
    setFormRotate(snapshot.formRotate ?? 0);
    setFormX(snapshot.formX ?? 0);
    setFormY(snapshot.formY ?? 0);
    setCustomCardScale(snapshot.customCardScale ?? 1);
    setCustomCardRotate(snapshot.customCardRotate ?? 0);
    setCustomCardX(snapshot.customCardX ?? 0);
    setCustomCardY(snapshot.customCardY ?? 0);
    setStartBtnScale(snapshot.startBtnScale ?? 1);
    setStartBtnRotate(snapshot.startBtnRotate ?? 0);
    setStartBtnX(snapshot.startBtnX ?? 0);
    setStartBtnY(snapshot.startBtnY ?? 0);
    setFooterScale(snapshot.footerScale ?? 1);
    setFooterRotate(snapshot.footerRotate ?? 0);
    setFooterX(snapshot.footerX ?? 0);
    setFooterY(snapshot.footerY ?? 0);
    setGroomScale(snapshot.groomScale ?? 1);
    setGroomRotate(snapshot.groomRotate ?? -7);
    setGroomX(snapshot.groomX ?? 0);
    setGroomY(snapshot.groomY ?? 0);
    setBrideScale(snapshot.brideScale ?? 1);
    setBrideRotate(snapshot.brideRotate ?? 7);
    setBrideX(snapshot.brideX ?? 0);
    setBrideY(snapshot.brideY ?? 0);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      const snapshot = history[prevIndex];
      isUndoRedoRef.current = true;
      applySnapshot(snapshot);
      setHistoryIndex(prevIndex);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      const snapshot = history[nextIndex];
      isUndoRedoRef.current = true;
      applySnapshot(snapshot);
      setHistoryIndex(nextIndex);
    }
  };



  const mockConfig: EventConfig = {
    eventName: eventName || "Widi Photobooth",
    date: "2026-06-18",
    time: "10:00",
    location: "Jakarta",
    frameStyle: "neon",
    frameText: "MEMORIES",
    countdownDuration,
    allowedFilters: [],
    allowedLayouts: ["strip"],
    allowedPresets: [],
    allowedStickers: [],
    mirrorDefault: true,
    customFilters: [],
    customStickers: [],
    presetTemplates: [],
    logoUrl,
    qrisUrl,
    pricePerSession: pricePerSession ?? 25000,
    bgTheme,
    fontStyle,
    welcomeText,
    footerText,
    showPayment,
    showSetup: true,
  };

  const mockCameras = [
    { deviceId: "default", label: "Mock FaceTime Camera", kind: "videoinput", groupId: "" } as MediaDeviceInfo
  ];

  const MOCK_FILTERS = [
    { id: "00000000-0000-0000-0000-000000000001", name: "Original", css: "none" },
    { id: "00000000-0000-0000-0000-000000000002", name: "Retro B&W", css: "grayscale(1) contrast(1.3) brightness(1.05)" },
    { id: "00000000-0000-0000-0000-000000000003", name: "Warm Film", css: "sepia(0.4) contrast(1.1) saturate(1.1) brightness(0.95)" },
    { id: "00000000-0000-0000-0000-000000000004", name: "Neon Glow", css: "hue-rotate(240deg) saturate(1.8) brightness(1.1)" }
  ];

  const MOCK_PHOTOS = [
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=150&auto=format&fit=crop"
  ];

  const applyPreset = (preset: UiTemplate) => {
    setBgTheme(preset.bgTheme || "sunset"); 
    setFontStyle(preset.fontStyle || "inter"); 
    setWelcomeText(preset.welcomeText || ""); 
    setFooterText(preset.footerText || "");
    setShowPayment(preset.showPayment ?? true);
    if (preset.countdownDuration !== undefined) setCountdownDuration(preset.countdownDuration);
    if (preset.logoUrl !== undefined) setLogoUrl(preset.logoUrl);
    if (preset.qrisUrl !== undefined) setQrisUrl(preset.qrisUrl);

    const parsed = preset.customization;
    if (parsed) {
      if (parsed.couplePhotoUrl !== undefined) setCouplePhotoUrl(parsed.couplePhotoUrl);
      if (parsed.groomLabel !== undefined) setGroomLabel(parsed.groomLabel);
      if (parsed.groomSubLabel !== undefined) setGroomSubLabel(parsed.groomSubLabel);
      if (parsed.groomPhotoUrl !== undefined) setGroomPhotoUrl(parsed.groomPhotoUrl);
      if (parsed.brideLabel !== undefined) setBrideLabel(parsed.brideLabel);
      if (parsed.brideSubLabel !== undefined) setBrideSubLabel(parsed.brideSubLabel);
      if (parsed.bridePhotoUrl !== undefined) setBridePhotoUrl(parsed.bridePhotoUrl);
      if (parsed.formTitle !== undefined) setFormTitle(parsed.formTitle);
      if (parsed.visitorFormLabel !== undefined) setVisitorFormLabel(parsed.visitorFormLabel);
      if (parsed.customerNameLabel !== undefined) setCustomerNameLabel(parsed.customerNameLabel);
      if (parsed.customerPhoneLabel !== undefined) setCustomerPhoneLabel(parsed.customerPhoneLabel);
      if (parsed.sessionsCountLabel !== undefined) setSessionsCountLabel(parsed.sessionsCountLabel);
      if (parsed.cameraSelectLabel !== undefined) setCameraSelectLabel(parsed.cameraSelectLabel);
      if (parsed.startButtonText !== undefined) setStartButtonText(parsed.startButtonText);
      if (parsed.logoSize !== undefined) setLogoSize(parsed.logoSize);
      if (parsed.welcomeTextSize !== undefined) setWelcomeTextSize(parsed.welcomeTextSize);
      if (parsed.formCardPadding !== undefined) setFormCardPadding(parsed.formCardPadding);
      if (parsed.startButtonSize !== undefined) setStartButtonSize(parsed.startButtonSize);
      
      if (parsed.primaryColor !== undefined) setPrimaryColor(parsed.primaryColor);
      if (parsed.cardBorderRadius !== undefined) setCardBorderRadius(parsed.cardBorderRadius);
      if (parsed.cardShadow !== undefined) setCardShadow(parsed.cardShadow);
      if (parsed.inputBgStyle !== undefined) setInputBgStyle(parsed.inputBgStyle);
      if (parsed.buttonStyle !== undefined) setButtonStyle(parsed.buttonStyle);
      if (parsed.cardStyle !== undefined) setCardStyle(parsed.cardStyle);
      if (parsed.hideLogo !== undefined) setHideLogo(parsed.hideLogo);
      if (parsed.hideWelcomeText !== undefined) setHideWelcomeText(parsed.hideWelcomeText);
      if (parsed.hideFormRegistrasi !== undefined) setHideFormRegistrasi(parsed.hideFormRegistrasi);
      if (parsed.hideStartBtn !== undefined) setHideStartBtn(parsed.hideStartBtn);
      if (parsed.hideFooterText !== undefined) setHideFooterText(parsed.hideFooterText);
      if (parsed.welcomeTextAlignment !== undefined) setWelcomeTextAlignment(parsed.welcomeTextAlignment);
      if (parsed.customWelcomeTextColor !== undefined) setCustomWelcomeTextColor(parsed.customWelcomeTextColor);
      if (parsed.customButtonTextColor !== undefined) setCustomButtonTextColor(parsed.customButtonTextColor);
      if (parsed.showCustomCard !== undefined) setShowCustomCard(parsed.showCustomCard);
      if (parsed.customCardTitle !== undefined) setCustomCardTitle(parsed.customCardTitle);
      if (parsed.customCardContent !== undefined) setCustomCardContent(parsed.customCardContent);
      if (parsed.logoScale !== undefined) setLogoScale(Number(parsed.logoScale));
      if (parsed.logoRotate !== undefined) setLogoRotate(Number(parsed.logoRotate));
      if (parsed.logoX !== undefined) setLogoX(Number(parsed.logoX));
      if (parsed.logoY !== undefined) setLogoY(Number(parsed.logoY));
      if (parsed.couplePhotoScale !== undefined) setCouplePhotoScale(Number(parsed.couplePhotoScale));
      if (parsed.couplePhotoRotate !== undefined) setCouplePhotoRotate(Number(parsed.couplePhotoRotate));
      if (parsed.couplePhotoX !== undefined) setCouplePhotoX(Number(parsed.couplePhotoX));
      if (parsed.couplePhotoY !== undefined) setCouplePhotoY(Number(parsed.couplePhotoY));
      if (parsed.welcomeTextScale !== undefined) setWelcomeTextScale(Number(parsed.welcomeTextScale));
      if (parsed.welcomeTextRotate !== undefined) setWelcomeTextRotate(Number(parsed.welcomeTextRotate));
      if (parsed.welcomeTextX !== undefined) setWelcomeTextX(Number(parsed.welcomeTextX));
      if (parsed.welcomeTextY !== undefined) setWelcomeTextY(Number(parsed.welcomeTextY));
      if (parsed.formScale !== undefined) setFormScale(Number(parsed.formScale));
      if (parsed.formRotate !== undefined) setFormRotate(Number(parsed.formRotate));
      if (parsed.formX !== undefined) setFormX(Number(parsed.formX));
      if (parsed.formY !== undefined) setFormY(Number(parsed.formY));
      if (parsed.customCardScale !== undefined) setCustomCardScale(Number(parsed.customCardScale));
      if (parsed.customCardRotate !== undefined) setCustomCardRotate(Number(parsed.customCardRotate));
      if (parsed.customCardX !== undefined) setCustomCardX(Number(parsed.customCardX));
      if (parsed.customCardY !== undefined) setCustomCardY(Number(parsed.customCardY));
      if (parsed.startBtnScale !== undefined) setStartBtnScale(Number(parsed.startBtnScale));
      if (parsed.startBtnRotate !== undefined) setStartBtnRotate(Number(parsed.startBtnRotate));
      if (parsed.startBtnX !== undefined) setStartBtnX(Number(parsed.startBtnX));
      if (parsed.startBtnY !== undefined) setStartBtnY(Number(parsed.startBtnY));
      if (parsed.footerScale !== undefined) setFooterScale(Number(parsed.footerScale));
      if (parsed.footerRotate !== undefined) setFooterRotate(Number(parsed.footerRotate));
      if (parsed.footerX !== undefined) setFooterX(Number(parsed.footerX));
      if (parsed.footerY !== undefined) setFooterY(Number(parsed.footerY));
    }
    
    toast.success(`Konfigurasi dari template "${preset.name}" diterapkan!`);
  };

  useEffect(() => {
    if (typeof window === "undefined" || !fontStyle) return;
    const fontId = "preview-google-font";
    let link = document.getElementById(fontId) as HTMLLinkElement;
    if (!link) { link = document.createElement("link"); link.id = fontId; link.rel = "stylesheet"; document.head.appendChild(link); }
    const getFontUrl = (f: string) => {
      switch (f) {
        case "outfit": return "https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap";
        case "syne": return "https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&display=swap";
        case "playfair": return "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&display=swap";
        case "cabinet": return "https://api.fontshare.com/v2/css?f[]=cabinet-grotesk@800,700,400,300&display=swap";
        case "inter": default: return "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap";
      }
    };
    link.href = getFontUrl(fontStyle);
  }, [fontStyle]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setLogoUrl(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleCouplePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setCouplePhotoUrl(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleGroomPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setGroomPhotoUrl(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleBridePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setBridePhotoUrl(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleQrisUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setQrisUrl(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handlePublish = async () => {
    if (!templateName.trim()) { 
      setActiveSidebarTab("settings"); 
      setSelectedComponent(null);
      setTimeout(() => {
        const input = document.querySelector('input[placeholder="Template Name..."]') as HTMLInputElement;
        input?.focus();
      }, 100);
      return toast.error("Nama template wajib diisi."); 
    }
    
    const customizationData = {
      formTitle,
      visitorFormLabel,
      customerNameLabel,
      customerPhoneLabel,
      sessionsCountLabel,
      cameraSelectLabel,
      startButtonText,
      couplePhotoUrl,
      groomLabel,
      groomSubLabel,
      groomPhotoUrl,
      brideLabel,
      brideSubLabel,
      bridePhotoUrl,
      logoSize,
      welcomeTextSize,
      formCardPadding,
      startButtonSize,
      primaryColor,
      cardBorderRadius,
      cardShadow,
      inputBgStyle,
      buttonStyle,
      cardStyle,
      hideLogo,
      hideWelcomeText,
      hideFormRegistrasi,
      hideStartBtn,
      hideFooterText,
      hideCameraFeed,
      hideCountdownTimer,
      hideCompiledStrip,
      hideQrShare,
      hidePrintBtn,
      welcomeTextAlignment,
      customWelcomeTextColor,
      customButtonTextColor,
      showCustomCard,
      customCardTitle,
      customCardContent,
      logoScale,
      logoRotate,
      logoX,
      logoY,
      couplePhotoScale,
      couplePhotoRotate,
      couplePhotoX,
      couplePhotoY,
      welcomeTextScale,
      welcomeTextRotate,
      welcomeTextX,
      welcomeTextY,
      formScale,
      formRotate,
      formX,
      formY,
      customCardScale,
      customCardRotate,
      customCardX,
      customCardY,
      startBtnScale,
      startBtnRotate,
      startBtnX,
      startBtnY,
      footerScale,
      footerRotate,
      footerX,
      footerY,
      groomScale,
      groomRotate,
      groomX,
      groomY,
      brideScale,
      brideRotate,
      brideX,
      brideY,
    };

    const savedId = await onSave({ 
      name: templateName, 
      logoUrl, 
      qrisUrl, 
      bgTheme, 
      fontStyle, 
      welcomeText, 
      footerText, 
      countdownDuration, 
      showPayment,
      customization: customizationData
    });
    
    if (savedId) {
      try {
        localStorage.setItem(`glowbooth_customization_${savedId}`, JSON.stringify(customizationData));
        toast.success("Template & kustomisasi berhasil disimpan!");
      } catch (err) {
        console.error("Failed to save local customization:", err);
      }
    }
  };

  const activeGlow = THEME_GLOWS[bgTheme as keyof typeof THEME_GLOWS] || THEME_GLOWS.sunset;

  const renderSheetThumbnail = (screen: "registrasi" | "payment" | "capture" | "share") => {
    const markerBaseClass = "w-10 h-10 rounded border transition-all flex flex-col items-center justify-center shrink-0 shadow-inner p-0.5 overflow-hidden scale-90";
    if (screen === "registrasi") {
      const g = THEME_GLOWS[bgTheme as keyof typeof THEME_GLOWS] || THEME_GLOWS.sunset;
      return (
        <div className={`${markerBaseClass} bg-zinc-50 dark:bg-zinc-950 relative border-zinc-200 dark:border-zinc-800`}>
          <div className={`absolute top-0 left-0 w-[50%] h-[50%] rounded-full blur-[6px] ${g.topLeft} opacity-70`} />
          <div className={`absolute bottom-0 right-0 w-[50%] h-[50%] rounded-full blur-[6px] ${g.bottomRight} opacity-70`} />
          <div className="w-[85%] bg-white/80 dark:bg-zinc-900/80 backdrop-blur-[1px] border border-zinc-200/50 rounded-sm p-1 flex flex-col gap-1 items-center z-10 scale-[0.9]">
            <div className="w-2 h-2 rounded-full bg-zinc-200" />
            <div className="w-full h-2 rounded-[2px] border border-zinc-200/50 mt-1" />
          </div>
        </div>
      );
    }
    if (screen === "payment") return <div className={`${markerBaseClass} bg-white border-zinc-200 dark:border-zinc-800 p-2`}><QrCode className="w-full h-full text-zinc-350" /></div>;
    if (screen === "capture") return <div className={`${markerBaseClass} bg-zinc-950 border-zinc-800 p-2`}><Camera className="w-full h-full text-zinc-700" /><div className="absolute top-1 right-1 bg-red-500 rounded-full w-2 h-2" /></div>;
    return <div className={`${markerBaseClass} bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 p-2`}><Sparkles className="w-full h-full text-amber-500" /></div>;
  };

  const getUsedComponents = () => {
    switch (previewScreen) {
      case "registrasi":
        return [
          {
            id: "logo",
            name: "Logo Kustom",
            description: logoUrl ? "Gambar logo khusus telah diunggah" : "Menggunakan logo bawaan sistem",
            icon: ImagePlus,
            targetTab: "settings",
            status: logoUrl ? "Aktif" : "Bawaan",
            badgeColor: logoUrl ? "bg-emerald-500/10 text-emerald-500 dark:bg-emerald-500/20" : "bg-amber-500/10 text-amber-500 dark:bg-amber-500/20",
          },
          {
            id: "welcomeText",
            name: "Teks Selamat Datang",
            description: welcomeText || "Silakan isi data untuk memulai sesi foto Anda.",
            icon: Type,
            targetTab: "settings",
            status: "Dapat Diedit",
            badgeColor: "bg-blue-500/10 text-blue-500 dark:bg-blue-500/20",
          },
          {
            id: "formRegistrasi",
            name: "Formulir Registrasi",
            description: `Input: ${mockCustomerName || "(Kosong)"} • ${mockCustomerPhone || "(Kosong)"} • ${mockSessionsCount || "1"} sesi`,
            icon: Edit3,
            targetTab: "settings",
            status: "Formulir",
            badgeColor: "bg-purple-500/10 text-purple-500 dark:bg-purple-500/20",
          },
          {
            id: "startBtn",
            name: "Tombol Mulai",
            description: "Mulai sesi foto & lanjut ke pembayaran",
            icon: MousePointer2,
            targetTab: "settings",
            status: "Interaktif",
            badgeColor: "bg-purple-500/10 text-purple-500 dark:bg-purple-500/20",
          },
          {
            id: "footerText",
            name: "Teks Kaki (Footer)",
            description: footerText || "© 2026 Glowbooth Studio.",
            icon: Type,
            targetTab: "settings",
            status: "Dapat Diedit",
            badgeColor: "bg-blue-500/10 text-blue-500 dark:bg-blue-500/20",
          },
          {
            id: "bgTheme",
            name: "Latar Belakang Tema",
            description: `Tema warna saat ini: ${bgTheme.toUpperCase()}`,
            icon: Palette,
            targetTab: "design",
            status: "Desain",
            badgeColor: "bg-pink-500/10 text-pink-500 dark:bg-pink-500/20",
          },
          {
            id: "fontStyle",
            name: "Gaya Tipografi",
            description: `Font saat ini: ${fontStyle.toUpperCase()}`,
            icon: Sliders,
            targetTab: "design",
            status: "Desain",
            badgeColor: "bg-pink-500/10 text-pink-500 dark:bg-pink-500/20",
          }
        ];
      case "payment":
        return [
          {
            id: "billingSummary",
            name: "Rincian Tagihan",
            description: `Tagihan untuk ${mockCustomerName || "Pengunjung"} (${mockSessionsCount || 1} sesi)`,
            icon: Layout,
            targetTab: "settings",
            status: "Statik",
            badgeColor: "bg-zinc-500/10 text-zinc-500 dark:bg-zinc-500/20",
          },
          {
            id: "qrisUpload",
            name: "QR Code QRIS",
            description: qrisUrl ? "QRIS kustom diaktifkan" : "Menggunakan QRIS generator otomatis",
            icon: QrCode,
            targetTab: "settings",
            status: showPayment ? "Aktif" : "Nonaktif",
            badgeColor: showPayment ? "bg-emerald-500/10 text-emerald-500 dark:bg-emerald-500/20" : "bg-red-500/10 text-red-500 dark:bg-red-500/20",
          },
          {
            id: "paymentOptions",
            name: "Opsi Pembayaran",
            description: "Mendukung QRIS instan dan Tunai/Cash",
            icon: Sliders,
            targetTab: "settings",
            status: "Pilihan",
            badgeColor: "bg-purple-500/10 text-purple-500 dark:bg-purple-500/20",
          }
        ];

      case "capture":
        return [
          {
            id: "cameraFeed",
            name: "Layar Bidik Kamera",
            description: "Live preview feed kamera photobooth",
            icon: Camera,
            targetTab: "settings",
            status: !hideCameraFeed ? "Aktif" : "Nonaktif",
            badgeColor: !hideCameraFeed ? "bg-emerald-500/10 text-emerald-500 dark:bg-emerald-500/20" : "bg-red-500/10 text-red-500 dark:bg-red-500/20",
          },
          {
            id: "countdownTimer",
            name: "Timer Hitung Mundur",
            description: `Durasi countdown: ${countdownDuration} detik`,
            icon: Clock,
            targetTab: "settings",
            status: !hideCountdownTimer ? "Aktif" : "Nonaktif",
            badgeColor: !hideCountdownTimer ? "bg-emerald-500/10 text-emerald-500 dark:bg-emerald-500/20" : "bg-red-500/10 text-red-500 dark:bg-red-500/20",
          }
        ];
      case "share":
        return [
          {
            id: "compiledStrip",
            name: "Hasil Akhir Foto",
            description: "Tampilan layout cetakan strip/grid final",
            icon: ImagePlus,
            targetTab: "settings",
            status: !hideCompiledStrip ? "Aktif" : "Nonaktif",
            badgeColor: !hideCompiledStrip ? "bg-emerald-500/10 text-emerald-500 dark:bg-emerald-500/20" : "bg-red-500/10 text-red-500 dark:bg-red-500/20",
          },
          {
            id: "qrShare",
            name: "QR Code Unduh",
            description: "Scan QR untuk mengunduh softcopy foto",
            icon: QrCode,
            targetTab: "settings",
            status: !hideQrShare ? "Aktif" : "Nonaktif",
            badgeColor: !hideQrShare ? "bg-emerald-500/10 text-emerald-500 dark:bg-emerald-500/20" : "bg-red-500/10 text-red-500 dark:bg-red-500/20",
          },
          {
            id: "printBtn",
            name: "Tombol Cetak Fisik",
            description: "Memicu print foto ke mesin printer cetak",
            icon: MousePointer2,
            targetTab: "settings",
            status: !hidePrintBtn ? "Aktif" : "Nonaktif",
            badgeColor: !hidePrintBtn ? "bg-emerald-500/10 text-emerald-500 dark:bg-emerald-500/20" : "bg-red-500/10 text-red-500 dark:bg-red-500/20",
          }
        ];
      default:
        return [];
    }
  };

  const renderComponentPreview = (id: string) => {
    const activeGlow = THEME_GLOWS[bgTheme as keyof typeof THEME_GLOWS] || THEME_GLOWS.sunset;
    
    switch (id) {
      // REGISTRASI SCREEN
      case "logo":
        return (
          <div className="w-full flex items-center justify-center p-2 bg-zinc-50/50 dark:bg-zinc-950/20 border border-zinc-150 dark:border-zinc-800/80 rounded-lg h-12">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo preview" className="max-h-8 max-w-full object-contain" />
            ) : (
              <div className="flex items-center gap-1.5 text-zinc-400 dark:text-zinc-500">
                <Camera className="w-4 h-4" />
                <span className="text-[9px] font-semibold">Bawaan</span>
              </div>
            )}
          </div>
        );
      case "welcomeText":
        return (
          <div className="w-full p-2 bg-zinc-50/50 dark:bg-zinc-950/20 border border-zinc-150 dark:border-zinc-800/80 rounded-lg text-center select-none" style={{ fontFamily: getFontFamilyName(fontStyle) }}>
            <h4 className="text-[9px] font-bold text-zinc-800 dark:text-zinc-200">{formTitle}</h4>
            <p className="text-[7px] text-zinc-400 line-clamp-1 mt-0.5">{welcomeText || "Isi data kunjungan..."}</p>
          </div>
        );
      case "formRegistrasi":
        return (
          <div className="w-full p-2 bg-zinc-50/50 dark:bg-zinc-950/20 border border-zinc-150 dark:border-zinc-800/80 rounded-lg flex flex-col gap-1.5 text-[7px] text-zinc-500">
            <span className="text-[6px] text-zinc-400 font-bold uppercase tracking-wider block">{visitorFormLabel}</span>
            <div className="flex flex-col gap-0.5">
              <span className="text-[6px] font-medium">{customerNameLabel}</span>
              <div className="h-3 w-full rounded border border-zinc-200 dark:border-zinc-850 bg-white dark:bg-zinc-900/80" />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[6px] font-medium">{customerPhoneLabel}</span>
              <div className="h-3 w-full rounded border border-zinc-200 dark:border-zinc-850 bg-white dark:bg-zinc-900/80" />
            </div>
          </div>
        );
      case "startBtn":
        return (
          <div className="w-full p-1 bg-zinc-50/50 dark:bg-zinc-950/20 border border-zinc-150 dark:border-zinc-800/80 rounded-lg">
            <div className="w-full py-1.5 rounded bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 text-[8px] font-bold uppercase tracking-wider text-center flex items-center justify-center gap-1 select-none">
              <span>{startButtonText}</span>
              <ArrowLeft className="w-2.5 h-2.5 rotate-180" />
            </div>
          </div>
        );
      case "footerText":
        return (
          <div className="w-full p-2 bg-zinc-50/50 dark:bg-zinc-950/20 border border-zinc-150 dark:border-zinc-800/80 rounded-lg text-center">
            <div className="w-1/2 h-0.5 bg-zinc-200 dark:bg-zinc-800 mx-auto mb-1.5" />
            <span className="text-[7px] text-zinc-400 block truncate">{footerText || "© 2026 Glowbooth Studio."}</span>
          </div>
        );
      case "bgTheme":
        return (
          <div className={`w-full h-8 rounded-lg bg-gradient-to-r ${activeGlow.gradient} p-2 flex items-center justify-between`}>
            <span className="text-[8px] font-bold text-white uppercase drop-shadow-sm">{bgTheme}</span>
            <div className="flex gap-1">
              <div className={`w-2 h-2 rounded-full ${activeGlow.topLeft} opacity-70 blur-[1px]`} />
              <div className={`w-2 h-2 rounded-full ${activeGlow.bottomRight} opacity-70 blur-[1px]`} />
            </div>
          </div>
        );
      case "fontStyle":
        return (
          <div className="w-full p-2 bg-zinc-50/50 dark:bg-zinc-950/20 border border-zinc-150 dark:border-zinc-800/80 rounded-lg text-center" style={{ fontFamily: getFontFamilyName(fontStyle) }}>
            <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200 block">Aa Bb Cc</span>
            <span className="text-[7px] text-zinc-400 capitalize">{fontStyle} font</span>
          </div>
        );

      // PAYMENT SCREEN
      case "billingSummary":
        return (
          <div className="w-full p-2 bg-zinc-50/50 dark:bg-zinc-950/20 border border-zinc-150 dark:border-zinc-800/80 rounded-lg text-[7px] flex flex-col gap-1 font-mono">
            <div className="flex justify-between border-b border-dashed border-zinc-250 dark:border-zinc-800 pb-1">
              <span>TAMU:</span>
              <span className="font-bold truncate max-w-[50px]">{mockCustomerName || "WIDI"}</span>
            </div>
            <div className="flex justify-between font-bold text-blue-500">
              <span>TOTAL:</span>
              <span>IDR 25.000</span>
            </div>
          </div>
        );
      case "qrisUpload":
        return (
          <div className="w-full flex justify-center p-1.5 bg-zinc-50/50 dark:bg-zinc-950/20 border border-zinc-150 dark:border-zinc-800/80 rounded-lg">
            <div className="p-1 bg-white rounded border border-zinc-200">
              {qrisUrl ? (
                <img src={qrisUrl} alt="QRIS preview" className="w-7 h-7 object-contain" />
              ) : (
                <QrCode className="w-7 h-7 text-zinc-800" />
              )}
            </div>
          </div>
        );
      case "paymentOptions":
        return (
          <div className="w-full p-1.5 bg-zinc-50/50 dark:bg-zinc-950/20 border border-zinc-150 dark:border-zinc-800/80 rounded-lg flex gap-1 font-sans">
            <div className="flex-1 py-1 rounded bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center gap-1 text-[7px] font-bold">
              <QrCode className="w-2.5 h-2.5 text-blue-500" />
              QRIS
            </div>
            <div className="flex-1 py-1 rounded bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center gap-1 text-[7px] font-bold">
              <div className="w-2 h-2 rounded bg-emerald-500 flex items-center justify-center text-[5px] text-white">Rp</div>
              TUNAI
            </div>
          </div>
        );



      // CAPTURE SCREEN
      case "cameraFeed":
        return (
          <div className="w-full p-1.5 bg-zinc-50/50 dark:bg-zinc-950/20 border border-zinc-150 dark:border-zinc-800/80 rounded-lg">
            <div className="w-full aspect-video bg-zinc-950 rounded border border-zinc-800 flex items-center justify-center relative overflow-hidden">
              <div className="absolute top-1 left-1 flex items-center gap-1">
                <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                <span className="text-[5px] text-white font-mono uppercase">REC</span>
              </div>
              <Camera className="w-4 h-4 text-zinc-700" />
              <div className="absolute inset-2 border border-zinc-800/40 pointer-events-none" />
            </div>
          </div>
        );
      case "countdownTimer":
        return (
          <div className="w-full p-2 bg-zinc-50/50 dark:bg-zinc-950/20 border border-zinc-150 dark:border-zinc-800/80 rounded-lg flex items-center justify-center select-none">
            <div className="w-7 h-7 rounded-full border border-blue-500 flex items-center justify-center bg-blue-50/50 dark:bg-blue-950/20 text-blue-650 dark:text-blue-400 font-bold text-xs">
              {countdownDuration}
            </div>
          </div>
        );

      // SHARE SCREEN
      case "compiledStrip":
        return (
          <div className="w-full flex justify-center p-1.5 bg-zinc-50/50 dark:bg-zinc-950/20 border border-zinc-150 dark:border-zinc-800/80 rounded-lg">
            <div className="w-6 h-9 rounded bg-[#111] p-0.5 border border-zinc-800 flex flex-col gap-0.5">
              <div className="flex-1 bg-zinc-800 rounded-sm" />
              <div className="flex-1 bg-zinc-800 rounded-sm" />
              <div className="flex-1 bg-zinc-800 rounded-sm" />
            </div>
          </div>
        );
      case "qrShare":
        return (
          <div className="w-full flex justify-center p-1.5 bg-zinc-50/50 dark:bg-zinc-950/20 border border-zinc-150 dark:border-zinc-800/80 rounded-lg">
            <div className="p-1 bg-white rounded border border-zinc-200 animate-pulse">
              <QrCode className="w-7 h-7 text-zinc-900" />
            </div>
          </div>
        );
      case "printBtn":
        return (
          <div className="w-full p-1 bg-zinc-50/50 dark:bg-zinc-950/20 border border-zinc-150 dark:border-zinc-800/80 rounded-lg">
            <div className="w-full py-1 rounded bg-amber-500 hover:bg-amber-600 text-white text-[8px] font-bold uppercase text-center select-none">
              CETAK FOTO
            </div>
          </div>
        );
      default:
        return (
          <div className="w-full h-8 rounded-lg bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center text-zinc-400">
            -
          </div>
        );
    }
  };

  const handleEditField = (field: string) => {
    switch (field) {
      case "logo":
      case "welcomeText":
      case "formRegistrasi":
      case "startBtn":
      case "footerText":
      case "qrisUrl":
      case "countdownDuration":
      case "cameraSelect":
      case "customCard":
        setSelectedComponent(field);
        setActiveSidebarTab("settings");
        toast.info(`Mengedit pengaturan komponen: ${field === "logo" ? "Logo Kustom" : field === "welcomeText" ? "Teks Selamat Datang" : field === "formRegistrasi" ? "Formulir Registrasi" : field === "startBtn" ? "Tombol Mulai" : field === "footerText" ? "Teks Kaki" : field === "qrisUrl" ? "QRIS" : field === "customCard" ? "Kartu Informasi Kustom" : "Kamera / Timer"}`);
        break;
      case "bgTheme":
      case "fontStyle":
        setActiveSidebarTab("design");
        toast.info(`Mengalihkan ke tab Desain untuk mengedit ${field === "bgTheme" ? "Tema Latar Belakang" : "Gaya Tipografi"}`);
        break;
      case "preset":
        setActiveSidebarTab("templates");
        toast.info("Mengalihkan ke tab Presets untuk mengedit Template");
        break;
      default:
        break;
    }
  };

  const handleChangeConfig = (key: string, value: string) => {
    if (key === "welcomeText") setWelcomeText(value);
    if (key === "footerText") setFooterText(value);
    if (key === "logoUrl") setLogoUrl(value);
    if (key === "qrisUrl") setQrisUrl(value);
  };

  const handleActivateComponent = (componentId: string) => {
    switch (componentId) {
      case "logo":
        setHideLogo(false);
        setPreviewScreen("registrasi");
        setSelectedComponent("logo");
        setOpenSection("brand");
        setActiveSidebarTab("settings");
        toast.success("Logo Instansi berhasil ditambahkan & diaktifkan!");
        break;
      case "couplePhoto":
        setCouplePhotoUrl("/wedding-couple.png");
        setPreviewScreen("registrasi");
        setSelectedComponent("logo");
        setOpenSection("brand");
        setActiveSidebarTab("settings");
        toast.success("Foto Kedua Mempelai berhasil ditambahkan & diaktifkan!");
        break;
      case "welcomeText":
        setHideWelcomeText(false);
        setPreviewScreen("registrasi");
        setSelectedComponent("welcomeText");
        setOpenSection("brand");
        setActiveSidebarTab("settings");
        toast.success("Teks Selamat Datang berhasil ditambahkan & diaktifkan!");
        break;
      case "formRegistrasi":
        setHideFormRegistrasi(false);
        setPreviewScreen("registrasi");
        setSelectedComponent("formRegistrasi");
        setOpenSection("fields");
        setActiveSidebarTab("settings");
        toast.success("Formulir Registrasi berhasil ditambahkan & diaktifkan!");
        break;
      case "customCard":
        setShowCustomCard(true);
        setPreviewScreen("registrasi");
        setSelectedComponent("customCard");
        setOpenSection("customCard");
        setActiveSidebarTab("settings");
        toast.success("Kartu Informasi Kustom berhasil ditambahkan & diaktifkan!");
        break;
      case "qrisUpload":
        setShowPayment(true);
        setPreviewScreen("payment");
        setSelectedComponent("qrisUpload");
        setOpenSection("camera");
        setActiveSidebarTab("settings");
        toast.success("QRIS & Layar Pembayaran berhasil ditambahkan & diaktifkan!");
        break;
      case "startBtn":
        setHideStartBtn(false);
        setPreviewScreen("registrasi");
        setSelectedComponent("startBtn");
        setOpenSection("camera");
        setActiveSidebarTab("settings");
        toast.success("Tombol Mulai Sesi berhasil ditambahkan & diaktifkan!");
        break;
      case "footerText":
        setHideFooterText(false);
        setPreviewScreen("registrasi");
        setSelectedComponent("footerText");
        setOpenSection("brand");
        setActiveSidebarTab("settings");
        toast.success("Teks Kaki (Footer) berhasil ditambahkan & diaktifkan!");
        break;
      default:
        break;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-zinc-50 dark:bg-[#0A0A0A] animate-in fade-in duration-300 overflow-hidden font-sans">
      {/* HEADER */}
      <header className="h-14 border-b border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-[#0A0A0A] flex items-center justify-between px-4 shrink-0 shadow-sm z-20">
        <div className="flex items-center gap-4">
          <button onClick={onCancel} className="p-2 -ml-2 text-zinc-550 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"><ArrowLeft className="w-4 h-4" /></button>
          <div className="flex items-center gap-2 border-r border-zinc-200 dark:border-zinc-800 pr-4">
            <div className="w-7 h-7 bg-blue-600 rounded-md flex items-center justify-center text-white"><Layout className="w-3.5 h-3.5" /></div>
            <span className="font-semibold text-sm text-zinc-900 dark:text-white">Visual Builder</span>
          </div>

          {/* Undo & Redo Buttons */}
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger render={
                <button
                  type="button"
                  onClick={handleUndo}
                  disabled={historyIndex <= 0}
                  className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
                >
                  <Undo className="w-4 h-4" />
                </button>
              } />
              <TooltipContent side="bottom" className="text-[10px] bg-zinc-900 text-white border-none py-1 px-2 rounded">Undo</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger render={
                <button
                  type="button"
                  onClick={handleRedo}
                  disabled={historyIndex >= history.length - 1}
                  className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
                >
                  <Redo className="w-4 h-4" />
                </button>
              } />
              <TooltipContent side="bottom" className="text-[10px] bg-zinc-900 text-white border-none py-1 px-2 rounded">Redo</TooltipContent>
            </Tooltip>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Zoom controls */}
          <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-900 px-2.5 py-1 rounded-lg border border-zinc-200/50 dark:border-zinc-800 shadow-inner">
            <button
              type="button"
              onClick={() => setZoomLevel(Math.max(50, zoomLevel - 10))}
              disabled={zoomLevel <= 50}
              className="p-0.5 rounded text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-white dark:hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span 
              onClick={() => setZoomLevel(100)}
              className="text-[9px] font-bold font-mono text-zinc-600 dark:text-zinc-400 select-none cursor-pointer w-8 text-center hover:text-blue-500 transition-colors"
              title="Click to Reset Zoom (100%)"
            >
              {zoomLevel}%
            </span>
            <button
              type="button"
              onClick={() => setZoomLevel(Math.min(150, zoomLevel + 10))}
              disabled={zoomLevel >= 150}
              className="p-0.5 rounded text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-white dark:hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Grid & Guides Controls */}
          <div className="flex items-center bg-zinc-100 dark:bg-zinc-900 p-0.5 rounded-lg border border-zinc-200/50 dark:border-zinc-800 shadow-inner">
            <button
              type="button"
              onClick={() => setShowGrid(!showGrid)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase transition-all select-none ${
                showGrid 
                  ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm border border-zinc-200/20" 
                  : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              }`}
              title="Toggle Background Grid Pattern"
            >
              <Grid className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Grid</span>
            </button>
            <button
              type="button"
              onClick={() => setShowGuides(!showGuides)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase transition-all select-none ${
                showGuides 
                  ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm border border-zinc-200/20" 
                  : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              }`}
              title="Toggle Snapping & Alignment Guides"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Guides</span>
            </button>
          </div>

          {/* Device Preview Switcher */}
          <div className="flex items-center bg-zinc-100 dark:bg-zinc-900 p-0.5 rounded-lg border border-zinc-200/50 dark:border-zinc-800 shadow-inner">
            {[
              { id: "mobile", icon: Smartphone, label: "Mobile" },
              { id: "tablet", icon: Tablet, label: "Tablet" },
              { id: "desktop", icon: Monitor, label: "Desktop" }
            ].map((device) => {
              const DeviceIcon = device.icon;
              const isSelected = devicePreview === device.id;
              return (
                <button
                  key={device.id}
                  type="button"
                  onClick={() => setDevicePreview(device.id as any)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-[10px] font-bold uppercase transition-all select-none ${
                    isSelected 
                      ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm border border-zinc-200/20" 
                      : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                  }`}
                >
                  <DeviceIcon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{device.label}</span>
                </button>
              );
            })}
          </div>

          <Button onClick={handlePublish} disabled={isSaving} className="h-8 text-xs font-medium px-6 gap-2 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 rounded-lg shadow-sm">
            {isSaving ? <span className="w-3.5 h-3.5 rounded-full border-2 border-zinc-400 border-t-white animate-spin" /> : <Save className="w-4 h-4" />} Publish
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        
        {/* WP ELEMENTOR-STYLE SIDEBAR */}
        <aside className={`bg-[#292c2f] border-r border-[#1e2023] flex flex-col shrink-0 z-20 shadow-2xl text-zinc-200 select-none transition-all duration-300 ${
          isSidebarCollapsed ? "w-0 overflow-hidden border-r-transparent pointer-events-none" : "w-[360px]"
        }`}>
          
          {/* Elementor Sidebar Header */}
          <div className="h-12 bg-[#2d3135] text-zinc-100 flex items-center justify-between px-3.5 border-b border-[#1e2124] shrink-0">
            <div className="flex items-center gap-2">
              <button 
                type="button" 
                onClick={onCancel} 
                className="p-1 hover:bg-[#3a3f44] rounded text-zinc-400 hover:text-white transition-colors cursor-pointer"
                title="Back to Templates"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-black tracking-widest text-[#E52F6E] uppercase">
                  ELEMENTOR
                </span>
                <span className="text-[8px] font-bold text-zinc-300 bg-zinc-800/80 px-1 py-0.5 rounded tracking-wide border border-zinc-700/30">
                  GLOW
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger render={
                  <button 
                    type="button" 
                    onClick={() => setIsSidebarCollapsed(true)} 
                    className="p-1.5 rounded text-zinc-400 hover:text-white hover:bg-[#3a3f44] transition-colors cursor-pointer"
                    title="Sembunyikan Panel"
                  >
                    <EyeOff className="w-4 h-4" />
                  </button>
                } />
                <TooltipContent side="bottom" className="text-[9px] bg-zinc-900 text-zinc-200 border-none py-1 px-2 rounded">
                  Sembunyikan Panel
                </TooltipContent>
              </Tooltip>
              <button 
                type="button" 
                onClick={() => {
                  setSelectedComponent(null);
                  setActiveSidebarTab("components");
                }}
                className={`p-1.5 rounded transition-colors cursor-pointer ${
                  activeSidebarTab === "components" && !selectedComponent 
                    ? "text-[#E52F6E] bg-zinc-800" 
                    : "text-zinc-400 hover:text-white hover:bg-[#3a3f44]"
                }`}
                title="Widgets Gallery"
              >
                <Grid className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* SIDEBAR MAIN CONTENT AREA */}
          <div className="flex-1 flex flex-col overflow-hidden bg-[#26292c]">
            
            {/* Case 1: Active Component / Widget Editor */}
            {selectedComponent !== null ? (
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Active Widget Sub-header */}
                <div className="px-4 py-2.5 bg-[#202225] border-b border-[#181a1c] flex items-center justify-between text-xs font-bold text-white uppercase tracking-wide">
                  <span className="truncate">
                    EDIT {
                      selectedComponent === "groomCard" ? "GROOM CARD" :
                      selectedComponent === "brideCard" ? "BRIDE CARD" :
                      selectedComponent === "logo" ? "LOGO WIDGET" :
                      selectedComponent === "couplePhoto" ? "COUPLE IMAGE" :
                      selectedComponent === "welcomeText" ? "HEADING TEXT" :
                      selectedComponent === "formRegistrasi" ? "FORM REGISTRY" :
                      selectedComponent === "startBtn" ? "BUTTON ACTION" :
                      selectedComponent === "qrisUpload" || selectedComponent === "payment" ? "PAYMENT QRIS" :
                      selectedComponent === "footerText" ? "FOOTER TEXT" :
                      selectedComponent === "customCard" ? "INFO CARD" :
                      selectedComponent === "cameraFeed" ? "CAMERA FEED" :
                      selectedComponent === "countdownTimer" ? "COUNTDOWN TIMER" :
                      selectedComponent === "compiledStrip" ? "PHOTO STRIP" :
                      selectedComponent === "qrShare" ? "SHARE OPTIONS" :
                      selectedComponent === "printBtn" ? "PRINT CONTROL" :
                      selectedComponent.toUpperCase()
                    }
                  </span>
                  <button 
                    type="button" 
                    onClick={() => setSelectedComponent(null)}
                    className="text-[9px] text-[#E52F6E] hover:underline font-black cursor-pointer"
                  >
                    CLOSE
                  </button>
                </div>

                {/* Content / Style / Advanced Tabs */}
                <div className="flex bg-[#2d3135] border-b border-[#181a1c] shrink-0 text-center text-[10px] font-black uppercase tracking-wider">
                  {(["content", "style", "advanced"] as const).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActiveWidgetTab(tab)}
                      className={`flex-1 py-2.5 border-b-3 transition-colors cursor-pointer ${
                        activeWidgetTab === tab
                          ? "border-[#E52F6E] text-white bg-[#26292c]"
                          : "border-transparent text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                {/* Form Editor Body Scroll */}
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar flex flex-col gap-4 text-zinc-300">
                  
                  {/* TAB CONTENT: CONTENT */}
                  {activeWidgetTab === "content" && (
                    <div className="flex flex-col gap-4 animate-fade-in text-xs">
                      
                      {/* LOGO content */}
                      {selectedComponent === "logo" && (
                        <>
                          <div className="flex flex-col gap-1.5">
                            <Label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Logo Visibility</Label>
                            <label className="flex items-center justify-between p-2.5 bg-[#1e2023] border border-[#2d3135] rounded cursor-pointer hover:bg-[#23262a]">
                              <span className="text-[10px] text-zinc-350">Hide Logo Widget</span>
                              <input type="checkbox" checked={hideLogo} onChange={(e) => setHideLogo(e.target.checked)} className="w-3.5 h-3.5 rounded border-zinc-700 bg-zinc-950 text-[#E52F6E] focus:ring-[#E52F6E]" />
                            </label>
                          </div>
                          {!hideLogo && (
                            <div className="flex flex-col gap-1.5">
                              <Label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Upload Brand Logo</Label>
                              <Input type="file" accept="image/*" onChange={handleLogoUpload} className="h-9 text-[10px] p-1 bg-[#1e2023] border-[#3a3f44] text-white focus:border-[#E52F6E]" />
                            </div>
                          )}
                          <div className="flex flex-col gap-1.5">
                            <Label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Registration Form Title</Label>
                            <Input value={formTitle} onChange={(e) => setFormTitle(e.target.value)} className="h-9 bg-[#1e2023] border-[#3a3f44] text-white focus:border-[#E52F6E]" placeholder="Registrasi..." />
                          </div>
                        </>
                      )}

                      {/* GROOM CARD content */}
                      {selectedComponent === "groomCard" && (
                        <>
                          <div className="flex flex-col gap-1.5">
                            <Label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Nama Mempelai Pria</Label>
                            <Input value={groomLabel} onChange={(e) => setGroomLabel(e.target.value)} className="h-9 bg-[#1e2023] border-[#3a3f44] text-white focus:border-[#E52F6E]" placeholder="Mempelai Pria" />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <Label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Sub-label Mempelai Pria</Label>
                            <Input value={groomSubLabel} onChange={(e) => setGroomSubLabel(e.target.value)} className="h-9 bg-[#1e2023] border-[#3a3f44] text-white focus:border-[#E52F6E]" placeholder="The Groom" />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <Label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Foto Mempelai Pria</Label>
                            <div className="flex gap-2 items-center">
                              <Input type="file" accept="image/*" onChange={handleGroomPhotoUpload} className="h-9 text-[10px] p-1 bg-[#1e2023] border-[#3a3f44] text-white focus:border-[#E52F6E] flex-1" />
                              {groomPhotoUrl && (
                                <button type="button" onClick={() => setGroomPhotoUrl("")} className="p-2 bg-[#ff0055]/20 border border-[#ff0055]/30 rounded text-[#ff0055] hover:bg-[#ff0055]/40 hover:text-white cursor-pointer" title="Delete Photo">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        </>
                      )}

                      {/* BRIDE CARD content */}
                      {selectedComponent === "brideCard" && (
                        <>
                          <div className="flex flex-col gap-1.5">
                            <Label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Nama Mempelai Wanita</Label>
                            <Input value={brideLabel} onChange={(e) => setBrideLabel(e.target.value)} className="h-9 bg-[#1e2023] border-[#3a3f44] text-white focus:border-[#E52F6E]" placeholder="Mempelai Wanita" />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <Label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Sub-label Mempelai Wanita</Label>
                            <Input value={brideSubLabel} onChange={(e) => setBrideSubLabel(e.target.value)} className="h-9 bg-[#1e2023] border-[#3a3f44] text-white focus:border-[#E52F6E]" placeholder="The Bride" />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <Label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Foto Mempelai Wanita</Label>
                            <div className="flex gap-2 items-center">
                              <Input type="file" accept="image/*" onChange={handleBridePhotoUpload} className="h-9 text-[10px] p-1 bg-[#1e2023] border-[#3a3f44] text-white focus:border-[#E52F6E] flex-1" />
                              {bridePhotoUrl && (
                                <button type="button" onClick={() => setBridePhotoUrl("")} className="p-2 bg-[#ff0055]/20 border border-[#ff0055]/30 rounded text-[#ff0055] hover:bg-[#ff0055]/40 hover:text-white cursor-pointer" title="Delete Photo">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        </>
                      )}

                      {/* COUPLE PHOTO content */}
                      {selectedComponent === "couplePhoto" && (
                        <>
                          <div className="flex flex-col gap-1.5">
                            <Label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Wedding Couple Photo</Label>
                            <div className="flex gap-2 items-center">
                              <Input type="file" accept="image/*" onChange={handleCouplePhotoUpload} className="h-9 text-[10px] p-1 bg-[#1e2023] border-[#3a3f44] text-white focus:border-[#E52F6E] flex-1" />
                              {couplePhotoUrl && (
                                <button type="button" onClick={() => setCouplePhotoUrl("")} className="p-2 bg-red-955/40 border border-red-900 rounded text-red-400 hover:bg-red-900/40 hover:text-white cursor-pointer" title="Delete Photo">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        </>
                      )}

                      {/* WELCOME TEXT content */}
                      {selectedComponent === "welcomeText" && (
                        <>
                          <div className="flex flex-col gap-1.5">
                            <Label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Welcome Text Textarea</Label>
                            <textarea value={welcomeText} onChange={(e) => setWelcomeText(e.target.value)} className="w-full bg-[#1e2023] border border-[#3a3f44] text-white focus:border-[#E52F6E] rounded p-2.5 h-24 outline-none resize-none" placeholder="Teks pembuka..." />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <Label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Hide Welcome Text</Label>
                            <label className="flex items-center justify-between p-2.5 bg-[#1e2023] border border-[#2d3135] rounded cursor-pointer">
                              <span className="text-[10px] text-zinc-350">Hide Welcome Message</span>
                              <input type="checkbox" checked={hideWelcomeText} onChange={(e) => setHideWelcomeText(e.target.checked)} className="w-3.5 h-3.5 rounded border-zinc-700 bg-zinc-950 text-[#E52F6E] focus:ring-[#E52F6E]" />
                            </label>
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <Label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Footer Copyright Text</Label>
                            <Input value={footerText} onChange={(e) => setFooterText(e.target.value)} className="h-9 bg-[#1e2023] border-[#3a3f44] text-white focus:border-[#E52F6E]" />
                          </div>
                        </>
                      )}

                      {/* FORM REGISTRASI content */}
                      {selectedComponent === "formRegistrasi" && (
                        <>
                          <div className="flex flex-col gap-1.5">
                            <Label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Visitor Form Section Title</Label>
                            <Input value={visitorFormLabel} onChange={(e) => setVisitorFormLabel(e.target.value)} className="h-9 bg-[#1e2023] border-[#3a3f44] text-white focus:border-[#E52F6E]" />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <Label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Name Input Label</Label>
                            <Input value={customerNameLabel} onChange={(e) => setCustomerNameLabel(e.target.value)} className="h-9 bg-[#1e2023] border-[#3a3f44] text-white focus:border-[#E52F6E]" />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <Label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">WhatsApp Phone Input Label</Label>
                            <Input value={customerPhoneLabel} onChange={(e) => setCustomerPhoneLabel(e.target.value)} className="h-9 bg-[#1e2023] border-[#3a3f44] text-white focus:border-[#E52F6E]" />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <Label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Sessions Count Label</Label>
                            <Input value={sessionsCountLabel} onChange={(e) => setSessionsCountLabel(e.target.value)} className="h-9 bg-[#1e2023] border-[#3a3f44] text-white focus:border-[#E52F6E]" />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <Label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Hide Form Component</Label>
                            <label className="flex items-center justify-between p-2.5 bg-[#1e2023] border border-[#2d3135] rounded cursor-pointer">
                              <span className="text-[10px] text-zinc-350">Disable Registration Form</span>
                              <input type="checkbox" checked={hideFormRegistrasi} onChange={(e) => setHideFormRegistrasi(e.target.checked)} className="w-3.5 h-3.5 rounded border-zinc-700 bg-zinc-950 text-[#E52F6E] focus:ring-[#E52F6E]" />
                            </label>
                          </div>
                        </>
                      )}

                      {/* START BUTTON content */}
                      {selectedComponent === "startBtn" && (
                        <>
                          <div className="flex flex-col gap-1.5">
                            <Label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Start Shutter Button Text</Label>
                            <Input value={startButtonText} onChange={(e) => setStartButtonText(e.target.value)} className="h-9 bg-[#1e2023] border-[#3a3f44] text-white focus:border-[#E52F6E]" />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <Label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Hide Start Button</Label>
                            <label className="flex items-center justify-between p-2.5 bg-[#1e2023] border border-[#2d3135] rounded cursor-pointer">
                              <span className="text-[10px] text-zinc-355">Disable Action Trigger Button</span>
                              <input type="checkbox" checked={hideStartBtn} onChange={(e) => setHideStartBtn(e.target.checked)} className="w-3.5 h-3.5 rounded border-zinc-700 bg-zinc-950 text-[#E52F6E] focus:ring-[#E52F6E]" />
                            </label>
                          </div>
                        </>
                      )}

                      {/* QRIS / PAYMENT content */}
                      {(selectedComponent === "qrisUpload" || selectedComponent === "payment") && (
                        <>
                          <div className="flex flex-col gap-1.5">
                            <Label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">QRIS Checkout Screen Toggle</Label>
                            <label className="flex items-center justify-between p-2.5 bg-[#1e2023] border border-[#2d3135] rounded cursor-pointer">
                              <span className="text-[10px] text-zinc-350">Enable Payment Process</span>
                              <input type="checkbox" checked={showPayment} onChange={(e) => setShowPayment(e.target.checked)} className="w-3.5 h-3.5 rounded border-zinc-700 bg-zinc-955 text-[#E52F6E] focus:ring-[#E52F6E]" />
                            </label>
                          </div>
                          {showPayment && (
                            <div className="flex flex-col gap-1.5">
                              <Label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Upload QRIS barcode</Label>
                              <Input type="file" accept="image/*" onChange={handleQrisUpload} className="h-9 text-[10px] p-1 bg-[#1e2023] border-[#3a3f44] text-white focus:border-[#E52F6E]" />
                            </div>
                          )}
                        </>
                      )}

                      {/* FOOTER TEXT content */}
                      {selectedComponent === "footerText" && (
                        <>
                          <div className="flex flex-col gap-1.5">
                            <Label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Footer Copyright Label Text</Label>
                            <Input value={footerText} onChange={(e) => setFooterText(e.target.value)} className="h-9 bg-[#1e2023] border-[#3a3f44] text-white focus:border-[#E52F6E]" />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <Label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Hide Footer Layout</Label>
                            <label className="flex items-center justify-between p-2.5 bg-[#1e2023] border border-[#2d3135] rounded cursor-pointer">
                              <span className="text-[10px] text-zinc-350">Disable Footer Text</span>
                              <input type="checkbox" checked={hideFooterText} onChange={(e) => setHideFooterText(e.target.checked)} className="w-3.5 h-3.5 rounded border-zinc-700 bg-zinc-950 text-[#E52F6E] focus:ring-[#E52F6E]" />
                            </label>
                          </div>
                        </>
                      )}

                      {/* CUSTOM CARD content */}
                      {selectedComponent === "customCard" && (
                        <>
                          <div className="flex flex-col gap-1.5">
                            <Label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Enable Custom Instruction Card</Label>
                            <label className="flex items-center justify-between p-2.5 bg-[#1e2023] border border-[#2d3135] rounded cursor-pointer">
                              <span className="text-[10px] text-zinc-355">Show Custom Details Box</span>
                              <input type="checkbox" checked={showCustomCard} onChange={(e) => setShowCustomCard(e.target.checked)} className="w-3.5 h-3.5 rounded border-zinc-700 bg-zinc-950 text-[#E52F6E] focus:ring-[#E52F6E]" />
                            </label>
                          </div>
                          {showCustomCard && (
                            <>
                              <div className="flex flex-col gap-1.5">
                                <Label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Card Title Heading</Label>
                                <Input value={customCardTitle} onChange={(e) => setCustomCardTitle(e.target.value)} className="h-9 bg-[#1e2023] border-[#3a3f44] text-white focus:border-[#E52F6E]" placeholder="Info..." />
                              </div>
                              <div className="flex flex-col gap-1.5">
                                <Label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Card Content Description</Label>
                                <textarea value={customCardContent} onChange={(e) => setCustomCardContent(e.target.value)} className="w-full bg-[#1e2023] border border-[#3a3f44] text-white focus:border-[#E52F6E] rounded p-2.5 h-20 outline-none resize-none" placeholder="Petunjuk..." />
                              </div>
                            </>
                          )}
                        </>
                      )}

                      {/* CAMERA FEED content */}
                      {selectedComponent === "cameraFeed" && (
                        <>
                          <div className="flex flex-col gap-1.5">
                            <Label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Hide Camera Feed Widget</Label>
                            <label className="flex items-center justify-between p-2.5 bg-[#1e2023] border border-[#2d3135] rounded cursor-pointer">
                              <span className="text-[10px] text-zinc-350">Disable Live Viewport</span>
                              <input type="checkbox" checked={hideCameraFeed} onChange={(e) => setHideCameraFeed(e.target.checked)} className="w-3.5 h-3.5 rounded border-zinc-700 bg-zinc-955 text-[#E52F6E] focus:ring-[#E52F6E]" />
                            </label>
                          </div>
                        </>
                      )}

                      {/* COUNTDOWN TIMER content */}
                      {selectedComponent === "countdownTimer" && (
                        <>
                          <div className="flex flex-col gap-1.5">
                            <Label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Hide Countdown Timer</Label>
                            <label className="flex items-center justify-between p-2.5 bg-[#1e2023] border border-[#2d3135] rounded cursor-pointer">
                              <span className="text-[10px] text-zinc-350">Disable Timer Overlay</span>
                              <input type="checkbox" checked={hideCountdownTimer} onChange={(e) => setHideCountdownTimer(e.target.checked)} className="w-3.5 h-3.5 rounded border-zinc-700 bg-zinc-955 text-[#E52F6E] focus:ring-[#E52F6E]" />
                            </label>
                          </div>
                        </>
                      )}

                      {/* PHOTO STRIP content */}
                      {selectedComponent === "compiledStrip" && (
                        <>
                          <div className="flex flex-col gap-1.5">
                            <Label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Hide Photo Strip Frame</Label>
                            <label className="flex items-center justify-between p-2.5 bg-[#1e2023] border border-[#2d3135] rounded cursor-pointer">
                              <span className="text-[10px] text-zinc-350">Disable Results Frame</span>
                              <input type="checkbox" checked={hideCompiledStrip} onChange={(e) => setHideCompiledStrip(e.target.checked)} className="w-3.5 h-3.5 rounded border-zinc-700 bg-zinc-955 text-[#E52F6E] focus:ring-[#E52F6E]" />
                            </label>
                          </div>
                        </>
                      )}

                      {/* SHARE OPTIONS content */}
                      {selectedComponent === "qrShare" && (
                        <>
                          <div className="flex flex-col gap-1.5">
                            <Label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Hide QR & Share Panel</Label>
                            <label className="flex items-center justify-between p-2.5 bg-[#1e2023] border border-[#2d3135] rounded cursor-pointer">
                              <span className="text-[10px] text-zinc-350">Disable Share Channels</span>
                              <input type="checkbox" checked={hideQrShare} onChange={(e) => setHideQrShare(e.target.checked)} className="w-3.5 h-3.5 rounded border-zinc-700 bg-zinc-955 text-[#E52F6E] focus:ring-[#E52F6E]" />
                            </label>
                          </div>
                        </>
                      )}

                      {/* PRINT CONTROL content */}
                      {selectedComponent === "printBtn" && (
                        <>
                          <div className="flex flex-col gap-1.5">
                            <Label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Hide Print Controls</Label>
                            <label className="flex items-center justify-between p-2.5 bg-[#1e2023] border border-[#2d3135] rounded cursor-pointer">
                              <span className="text-[10px] text-zinc-350">Disable Print Buttons</span>
                              <input type="checkbox" checked={hidePrintBtn} onChange={(e) => setHidePrintBtn(e.target.checked)} className="w-3.5 h-3.5 rounded border-zinc-700 bg-zinc-955 text-[#E52F6E] focus:ring-[#E52F6E]" />
                            </label>
                          </div>
                        </>
                      )}

                    </div>
                  )}

                  {/* TAB CONTENT: STYLE */}
                  {activeWidgetTab === "style" && (
                    <div className="flex flex-col gap-4 animate-fade-in text-xs">
                      
                      {/* Global event settings selector inside widgets */}
                      {selectedComponent === "logo" && (
                        <>
                          <div className="flex flex-col gap-1.5">
                            <Label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Logo Box Scale</Label>
                            <div className="flex items-center gap-3">
                              <input type="range" min="0.5" max="2" step="0.05" value={logoScale} onChange={(e) => setLogoScale(parseFloat(e.target.value))} className="flex-1 h-1 bg-[#1e2023] accent-[#E52F6E]" />
                              <span className="text-[10px] font-mono w-10 text-right">{logoScale}x</span>
                            </div>
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <Label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Logo Rotation (deg)</Label>
                            <div className="flex items-center gap-3">
                              <input type="range" min="-180" max="180" value={logoRotate} onChange={(e) => setLogoRotate(parseInt(e.target.value))} className="flex-1 h-1 bg-[#1e2023] accent-[#E52F6E]" />
                              <span className="text-[10px] font-mono w-10 text-right">{logoRotate}°</span>
                            </div>
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <Label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Logo Position Offset (X/Y)</Label>
                            <div className="grid grid-cols-2 gap-2">
                              <div className="flex flex-col gap-1">
                                <span className="text-[8px] text-zinc-500">Horizontal (X)</span>
                                <input type="number" value={logoX} onChange={(e) => setLogoX(Number(e.target.value))} className="bg-[#1e2023] border-[#3a3f44] text-white p-1 text-xs rounded" />
                              </div>
                              <div className="flex flex-col gap-1">
                                <span className="text-[8px] text-zinc-500">Vertical (Y)</span>
                                <input type="number" value={logoY} onChange={(e) => setLogoY(Number(e.target.value))} className="bg-[#1e2023] border-[#3a3f44] text-white p-1 text-xs rounded" />
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <Label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Logo Display Size Preset</Label>
                            <select value={logoSize} onChange={(e) => setLogoSize(e.target.value as any)} className="bg-[#1e2023] border-[#3a3f44] text-white rounded p-2.5 outline-none">
                              <option value="sm">Kecil (Small)</option>
                              <option value="md">Sedang (Medium)</option>
                              <option value="lg">Besar (Large)</option>
                              <option value="xl">Sangat Besar (XL)</option>
                            </select>
                          </div>
                        </>
                      )}

                      {/* GROOM CARD style */}
                      {selectedComponent === "groomCard" && (
                        <>
                          <div className="flex flex-col gap-1.5">
                            <Label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Card Scale</Label>
                            <div className="flex items-center gap-3">
                              <input type="range" min="0.4" max="2.5" step="0.05" value={groomScale} onChange={(e) => setGroomScale(parseFloat(e.target.value))} className="flex-1 h-1 bg-[#1e2023] accent-[#E52F6E]" />
                              <span className="text-[10px] font-mono w-10 text-right">{groomScale}x</span>
                            </div>
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <Label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Card Rotation (deg)</Label>
                            <div className="flex items-center gap-3">
                              <input type="range" min="-180" max="180" value={groomRotate} onChange={(e) => setGroomRotate(parseInt(e.target.value))} className="flex-1 h-1 bg-[#1e2023] accent-[#E52F6E]" />
                              <span className="text-[10px] font-mono w-10 text-right">{groomRotate}°</span>
                            </div>
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <Label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Position Offset (X/Y)</Label>
                            <div className="grid grid-cols-2 gap-2">
                              <div className="flex flex-col gap-1">
                                <span className="text-[8px] text-zinc-500">Horizontal (X)</span>
                                <input type="number" value={groomX} onChange={(e) => setGroomX(Number(e.target.value))} className="bg-[#1e2023] border-[#3a3f44] text-white p-1 text-xs rounded" />
                              </div>
                              <div className="flex flex-col gap-1">
                                <span className="text-[8px] text-zinc-500">Vertical (Y)</span>
                                <input type="number" value={groomY} onChange={(e) => setGroomY(Number(e.target.value))} className="bg-[#1e2023] border-[#3a3f44] text-white p-1 text-xs rounded" />
                              </div>
                            </div>
                          </div>
                        </>
                      )}

                      {/* BRIDE CARD style */}
                      {selectedComponent === "brideCard" && (
                        <>
                          <div className="flex flex-col gap-1.5">
                            <Label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Card Scale</Label>
                            <div className="flex items-center gap-3">
                              <input type="range" min="0.4" max="2.5" step="0.05" value={brideScale} onChange={(e) => setBrideScale(parseFloat(e.target.value))} className="flex-1 h-1 bg-[#1e2023] accent-[#E52F6E]" />
                              <span className="text-[10px] font-mono w-10 text-right">{brideScale}x</span>
                            </div>
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <Label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Card Rotation (deg)</Label>
                            <div className="flex items-center gap-3">
                              <input type="range" min="-180" max="180" value={brideRotate} onChange={(e) => setBrideRotate(parseInt(e.target.value))} className="flex-1 h-1 bg-[#1e2023] accent-[#E52F6E]" />
                              <span className="text-[10px] font-mono w-10 text-right">{brideRotate}°</span>
                            </div>
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <Label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Position Offset (X/Y)</Label>
                            <div className="grid grid-cols-2 gap-2">
                              <div className="flex flex-col gap-1">
                                <span className="text-[8px] text-zinc-500">Horizontal (X)</span>
                                <input type="number" value={brideX} onChange={(e) => setBrideX(Number(e.target.value))} className="bg-[#1e2023] border-[#3a3f44] text-white p-1 text-xs rounded" />
                              </div>
                              <div className="flex flex-col gap-1">
                                <span className="text-[8px] text-zinc-500">Vertical (Y)</span>
                                <input type="number" value={brideY} onChange={(e) => setBrideY(Number(e.target.value))} className="bg-[#1e2023] border-[#3a3f44] text-white p-1 text-xs rounded" />
                              </div>
                            </div>
                          </div>
                        </>
                      )}

                      {/* COUPLE IMAGE style */}
                      {selectedComponent === "couplePhoto" && (
                        <>
                          <div className="flex flex-col gap-1.5">
                            <Label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Image Scale</Label>
                            <div className="flex items-center gap-3">
                              <input type="range" min="0.5" max="2" step="0.05" value={couplePhotoScale} onChange={(e) => setCouplePhotoScale(parseFloat(e.target.value))} className="flex-1 h-1 bg-[#1e2023] accent-[#E52F6E]" />
                              <span className="text-[10px] font-mono w-10 text-right">{couplePhotoScale}x</span>
                            </div>
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <Label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Image Rotation (deg)</Label>
                            <div className="flex items-center gap-3">
                              <input type="range" min="-180" max="180" value={couplePhotoRotate} onChange={(e) => setCouplePhotoRotate(parseInt(e.target.value))} className="flex-1 h-1 bg-[#1e2023] accent-[#E52F6E]" />
                              <span className="text-[10px] font-mono w-10 text-right">{couplePhotoRotate}°</span>
                            </div>
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <Label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Position Offset (X/Y)</Label>
                            <div className="grid grid-cols-2 gap-2">
                              <div className="flex flex-col gap-1">
                                <span className="text-[8px] text-zinc-500">Horizontal (X)</span>
                                <input type="number" value={couplePhotoX} onChange={(e) => setCouplePhotoX(Number(e.target.value))} className="bg-[#1e2023] border-[#3a3f44] text-white p-1 text-xs rounded" />
                              </div>
                              <div className="flex flex-col gap-1">
                                <span className="text-[8px] text-zinc-500">Vertical (Y)</span>
                                <input type="number" value={couplePhotoY} onChange={(e) => setCouplePhotoY(Number(e.target.value))} className="bg-[#1e2023] border-[#3a3f44] text-white p-1 text-xs rounded" />
                              </div>
                            </div>
                          </div>
                        </>
                      )}

                      {/* WELCOME TEXT style */}
                      {selectedComponent === "welcomeText" && (
                        <>
                          <div className="flex flex-col gap-1.5">
                            <Label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Heading Text Color</Label>
                            <div className="flex items-center gap-2">
                              <input type="color" value={customWelcomeTextColor || "#e11d48"} onChange={(e) => setCustomWelcomeTextColor(e.target.value)} className="w-8 h-8 rounded border-none bg-transparent cursor-pointer" />
                              <Input value={customWelcomeTextColor} onChange={(e) => setCustomWelcomeTextColor(e.target.value)} className="h-9 bg-[#1e2023] border-[#3a3f44] text-white focus:border-[#E52F6E] flex-1 text-xs font-mono" placeholder="#e11d48" />
                            </div>
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <Label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Text Size Preset</Label>
                            <select value={welcomeTextSize} onChange={(e) => setWelcomeTextSize(e.target.value as any)} className="bg-[#1e2023] border-[#3a3f44] text-white rounded p-2.5 outline-none">
                              <option value="sm">Kecil</option>
                              <option value="md">Sedang</option>
                              <option value="lg">Besar</option>
                              <option value="xl">Sangat Besar</option>
                            </select>
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <Label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Text Alignment</Label>
                            <select value={welcomeTextAlignment} onChange={(e) => setWelcomeTextAlignment(e.target.value as any)} className="bg-[#1e2023] border-[#3a3f44] text-white rounded p-2.5 outline-none">
                              <option value="left">Rata Kiri</option>
                              <option value="center">Rata Tengah</option>
                              <option value="right">Rata Kanan</option>
                            </select>
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <Label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Text Scale</Label>
                            <div className="flex items-center gap-3">
                              <input type="range" min="0.5" max="2" step="0.05" value={welcomeTextScale} onChange={(e) => setWelcomeTextScale(parseFloat(e.target.value))} className="flex-1 h-1 bg-[#1e2023] accent-[#E52F6E]" />
                              <span className="text-[10px] font-mono w-10 text-right">{welcomeTextScale}x</span>
                            </div>
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <Label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Text Rotation / Offset (X/Y)</Label>
                            <div className="grid grid-cols-2 gap-2 mt-1">
                              <div className="flex flex-col gap-1">
                                <span className="text-[8px] text-zinc-500 font-bold">X Position</span>
                                <input type="number" value={welcomeTextX} onChange={(e) => setWelcomeTextX(Number(e.target.value))} className="bg-[#1e2023] border-[#3a3f44] text-white p-1 text-xs rounded" />
                              </div>
                              <div className="flex flex-col gap-1">
                                <span className="text-[8px] text-zinc-500 font-bold">Y Position</span>
                                <input type="number" value={welcomeTextY} onChange={(e) => setWelcomeTextY(Number(e.target.value))} className="bg-[#1e2023] border-[#3a3f44] text-white p-1 text-xs rounded" />
                              </div>
                            </div>
                          </div>
                        </>
                      )}

                      {/* FORM REGISTRASI style */}
                      {selectedComponent === "formRegistrasi" && (
                        <>
                          <div className="flex flex-col gap-1.5">
                            <Label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Template Card Style Design</Label>
                            <select value={cardStyle} onChange={(e) => setCardStyle(e.target.value as any)} className="bg-[#1e2023] border-[#3a3f44] text-white rounded p-2.5 outline-none font-bold text-xs">
                              <option value="classic">Classic Minimalist</option>
                              <option value="glass">Glassmorphism (Frosted Glass)</option>
                              <option value="frameless">Frameless Vintage (No borders)</option>
                              <option value="neobrutalist">Neobrutalism (Thick Outlines)</option>
                            </select>
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <Label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Card Padding spacing</Label>
                            <select value={formCardPadding} onChange={(e) => setFormCardPadding(e.target.value as any)} className="bg-[#1e2023] border-[#3a3f44] text-white rounded p-2.5 outline-none">
                              <option value="sm">Kecil / Rapat (Compact)</option>
                              <option value="md">Standar (Normal)</option>
                              <option value="lg">Besar / Longgar (Spacious)</option>
                            </select>
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <Label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Card Rounded Corners</Label>
                            <select value={cardBorderRadius} onChange={(e) => setCardBorderRadius(e.target.value as any)} className="bg-[#1e2023] border-[#3a3f44] text-white rounded p-2.5 outline-none">
                              <option value="none">Siku Lancip (0px)</option>
                              <option value="sm">Halus Kecil (4px)</option>
                              <option value="md">Sedang (8px)</option>
                              <option value="lg">Membulat Besar (12px)</option>
                              <option value="xl">Sangat Membulat (16px)</option>
                              <option value="2xl">Maksimal (24px)</option>
                            </select>
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <Label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Card Shadow Depth</Label>
                            <select value={cardShadow} onChange={(e) => setCardShadow(e.target.value as any)} className="bg-[#1e2023] border-[#3a3f44] text-white rounded p-2.5 outline-none">
                              <option value="none">Tanpa Bayangan</option>
                              <option value="sm">Tipis (Small)</option>
                              <option value="md">Sedang (Medium)</option>
                              <option value="lg">Jelas (Large)</option>
                              <option value="xl">Sangat Tebal (XL)</option>
                              <option value="2xl">Maksimal (2D/3D)</option>
                            </select>
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <Label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Input Field Theme</Label>
                            <select value={inputBgStyle} onChange={(e) => setInputBgStyle(e.target.value as any)} className="bg-[#1e2023] border-[#3a3f44] text-white rounded p-2.5 outline-none">
                              <option value="white">Putih Solid (White)</option>
                              <option value="tinted">Tinted Grey (Aksen Halus)</option>
                              <option value="transparent">Polos Transparan (Transparent)</option>
                            </select>
                          </div>
                        </>
                      )}

                      {/* START BUTTON style */}
                      {selectedComponent === "startBtn" && (
                        <>
                          <div className="flex flex-col gap-1.5">
                            <Label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Primary Theme Color</Label>
                            <div className="flex items-center gap-2">
                              <input type="color" value={primaryColor || "#3b82f6"} onChange={(e) => setPrimaryColor(e.target.value)} className="w-8 h-8 rounded border-none bg-transparent cursor-pointer" />
                              <Input value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="h-9 bg-[#1e2023] border-[#3a3f44] text-white focus:border-[#E52F6E] flex-1 text-xs font-mono" placeholder="#3b82f6" />
                            </div>
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <Label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Custom Button Text Color</Label>
                            <div className="flex items-center gap-2">
                              <input type="color" value={customButtonTextColor || "#ffffff"} onChange={(e) => setCustomButtonTextColor(e.target.value)} className="w-8 h-8 rounded border-none bg-transparent cursor-pointer" />
                              <Input value={customButtonTextColor} onChange={(e) => setCustomButtonTextColor(e.target.value)} className="h-9 bg-[#1e2023] border-[#3a3f44] text-white focus:border-[#E52F6E] flex-1 text-xs font-mono" placeholder="#ffffff" />
                            </div>
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <Label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Button Preset Style</Label>
                            <select value={buttonStyle} onChange={(e) => setButtonStyle(e.target.value as any)} className="bg-[#1e2023] border-[#3a3f44] text-white rounded p-2.5 outline-none">
                              <option value="solid">Solid Background (Standard)</option>
                              <option value="gradient">Linear Gradient (Modern Glow)</option>
                              <option value="outline">Border Outline (Transparan)</option>
                            </select>
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <Label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Button Size</Label>
                            <select value={startButtonSize} onChange={(e) => setStartButtonSize(e.target.value as any)} className="bg-[#1e2023] border-[#3a3f44] text-white rounded p-2.5 outline-none">
                              <option value="sm">Kecil (Small)</option>
                              <option value="md">Sedang (Medium)</option>
                              <option value="lg">Besar (Large)</option>
                            </select>
                          </div>
                        </>
                      )}

                      {/* QRIS / PAYMENT style */}
                      {(selectedComponent === "qrisUpload" || selectedComponent === "payment") && (
                        <div className="p-3 bg-[#1e2023] border border-[#2d3135] rounded text-center text-xs text-zinc-400">
                          Pengaturan style otomatis diselaraskan dengan warna primer dan cardStyle event.
                        </div>
                      )}

                      {/* CAMERA FEED style */}
                      {selectedComponent === "cameraFeed" && (
                        <div className="p-3 bg-[#1e2023] border border-[#2d3135] rounded text-center text-xs text-zinc-400">
                          Pengaturan style feed kamera diselaraskan dengan frame template dan cardStyle event.
                        </div>
                      )}

                      {/* COUNTDOWN TIMER style */}
                      {selectedComponent === "countdownTimer" && (
                        <div className="p-3 bg-[#1e2023] border border-[#2d3135] rounded text-center text-xs text-zinc-400">
                          Pengaturan style hitung mundur diselaraskan secara otomatis.
                        </div>
                      )}

                      {/* PHOTO STRIP style */}
                      {selectedComponent === "compiledStrip" && (
                        <div className="p-3 bg-[#1e2023] border border-[#2d3135] rounded text-center text-xs text-zinc-400">
                          Pengaturan style layout diselaraskan dengan frame template.
                        </div>
                      )}

                      {/* SHARE OPTIONS style */}
                      {selectedComponent === "qrShare" && (
                        <div className="p-3 bg-[#1e2023] border border-[#2d3135] rounded text-center text-xs text-zinc-400">
                          Pengaturan style QR dan tombol sharing otomatis diselaraskan dengan warna primer dan cardStyle event.
                        </div>
                      )}

                      {/* PRINT CONTROL style */}
                      {selectedComponent === "printBtn" && (
                        <div className="p-3 bg-[#1e2023] border border-[#2d3135] rounded text-center text-xs text-zinc-400">
                          Pengaturan style tombol cetak otomatis diselaraskan dengan warna primer dan cardStyle event.
                        </div>
                      )}

                      {/* FOOTER TEXT style */}
                      {selectedComponent === "footerText" && (
                        <>
                          <div className="flex flex-col gap-1.5">
                            <Label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Scale</Label>
                            <div className="flex items-center gap-3">
                              <input type="range" min="0.5" max="2" step="0.05" value={footerScale} onChange={(e) => setFooterScale(parseFloat(e.target.value))} className="flex-1 h-1 bg-[#1e2023] accent-[#E52F6E]" />
                              <span className="text-[10px] font-mono w-10 text-right">{footerScale}x</span>
                            </div>
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <Label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Offset Position (Y Axis)</Label>
                            <div className="flex items-center gap-3">
                              <input type="range" min="-100" max="100" value={footerY} onChange={(e) => setFooterY(parseInt(e.target.value))} className="flex-1 h-1 bg-[#1e2023] accent-[#E52F6E]" />
                              <span className="text-[10px] font-mono w-10 text-right">{footerY}px</span>
                            </div>
                          </div>
                        </>
                      )}

                    </div>
                  )}

                  {/* TAB CONTENT: ADVANCED */}
                  {activeWidgetTab === "advanced" && (
                    <div className="flex flex-col gap-4 animate-fade-in text-xs">
                      
                      <div className="flex flex-col gap-1.5">
                        <Label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Alignment Snapping Guides</Label>
                        <label className="flex items-center justify-between p-2.5 bg-[#1e2023] border border-[#2d3135] rounded cursor-pointer hover:bg-[#23262a]">
                          <span className="text-[10px] text-zinc-350">Show Alignment Guides</span>
                          <input type="checkbox" checked={showGuides} onChange={(e) => setShowGuides(e.target.checked)} className="w-3.5 h-3.5 rounded border-zinc-700 bg-zinc-950 text-[#E52F6E] focus:ring-[#E52F6E]" />
                        </label>
                      </div>

                      {/* Snapping Grid background */}
                      <div className="flex flex-col gap-1.5">
                        <Label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Layout Helper Grid</Label>
                        <label className="flex items-center justify-between p-2.5 bg-[#1e2023] border border-[#2d3135] rounded cursor-pointer hover:bg-[#23262a]">
                          <span className="text-[10px] text-zinc-355">Show Background Grid Pattern</span>
                          <input type="checkbox" checked={showGrid} onChange={(e) => {
                            setShowGrid(e.target.checked);
                            localStorage.setItem("builder_show_grid", String(e.target.checked));
                          }} className="w-3.5 h-3.5 rounded border-zinc-700 bg-zinc-950 text-[#E52F6E] focus:ring-[#E52F6E]" />
                        </label>
                      </div>

                      {/* Responsive details banner */}
                      <div className="p-3 bg-[#1e2023] border border-[#2d3135] rounded flex flex-col gap-1">
                        <span className="font-bold text-[9px] text-[#E52F6E] uppercase">Responsive Customization</span>
                        <span className="text-[10px] text-zinc-400 leading-normal">
                          Perubahan pada widget logo, tombol, dan form diselaraskan secara penuh di semua ukuran preview (Mobile, Tablet, Desktop).
                        </span>
                      </div>

                    </div>
                  )}

                </div>
              </div>
            ) : (
              
              /* Case 2: Sidebar default galleries depending on activeSidebarTab */
              <div className="flex-1 flex flex-col overflow-hidden">
                
                {/* WIDGETS GALLERY VIEW */}
                {activeSidebarTab === "components" && (
                  <div className="flex-1 flex flex-col overflow-hidden">
                    
                    {/* Elementor Search Widget Box */}
                    <div className="p-3.5 bg-[#202225] border-b border-[#181a1c] shrink-0">
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Search Widget..."
                          value={widgetSearchQuery}
                          onChange={(e) => setWidgetSearchQuery(e.target.value)}
                          className="w-full bg-[#1b1c1f] border border-[#373c42] text-xs text-white placeholder-zinc-550 pl-3 pr-8 py-2 rounded focus:outline-none focus:border-[#E52F6E] focus:ring-1 focus:ring-[#E52F6E] transition-all"
                        />
                        <Sliders className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                      </div>
                    </div>

                    {/* Scrollable Widget Items Grid */}
                    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar flex flex-col gap-4">
                      
                      {/* Widgets Section accordion: BASIC ELEMENTS */}
                      <div className="flex flex-col gap-2">
                        <button 
                          onClick={() => setOpenElementorSection(openElementorSection === "basic" ? null : "basic")}
                          className="w-full flex items-center justify-between text-[10px] font-black uppercase text-zinc-400 tracking-wider pb-1.5 border-b border-[#2d3135] hover:text-white transition-colors"
                        >
                          <span>Basic Widgets</span>
                          <span className="text-[8px]">{openElementorSection === "basic" ? "▼" : "▶"}</span>
                        </button>

                        {openElementorSection === "basic" && (
                          <div className="grid grid-cols-3 gap-2 mt-1">
                            {[
                              { id: "logo", name: "Brand Logo", shortName: "Logo", icon: ImagePlus },
                              { id: "welcomeText", name: "Heading Text", shortName: "Heading", icon: Type },
                              ...(cardStyle !== "frameless" ? [{ id: "couplePhoto", name: "Couple Image", shortName: "Couple Photo", icon: Heart }] : []),
                              { id: "footerText", name: "Footer Text", shortName: "Footer Text", icon: Type }
                            ]
                            .filter(w => w.name.toLowerCase().includes(widgetSearchQuery.toLowerCase()))
                            .map((comp) => {
                              const CompIcon = comp.icon;
                              return (
                                <div
                                  key={comp.id}
                                  draggable
                                  onDragStart={(e) => {
                                    e.dataTransfer.setData("componentId", comp.id);
                                    e.dataTransfer.effectAllowed = "copy";
                                    setIsDraggingComponent(true);
                                  }}
                                  onDragEnd={() => {
                                    setIsDraggingComponent(false);
                                    setIsDragOverCanvas(false);
                                  }}
                                  onClick={() => {
                                    setSelectedComponent(comp.id);
                                    setActiveSidebarTab("settings");
                                    setActiveWidgetTab("content");
                                  }}
                                  className="flex flex-col items-center justify-center p-3 bg-[#1e2023] border border-[#2d3135] hover:border-[#E52F6E] rounded-md transition-all duration-200 cursor-grab active:cursor-grabbing hover:bg-[#24272b] select-none text-center gap-2 group aspect-square"
                                  title="Drag & Drop onto Canvas or click to edit"
                                >
                                  <div className="p-2 bg-[#2d3135] text-zinc-400 rounded group-hover:text-white transition-colors">
                                    <CompIcon className="w-5 h-5" />
                                  </div>
                                  <span className="text-[9px] font-bold text-zinc-350 group-hover:text-white leading-tight truncate w-full">
                                    {comp.shortName}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Widgets Section accordion: CORE COMPONENTS */}
                      <div className="flex flex-col gap-2 mt-2">
                        <button 
                          onClick={() => setOpenElementorSection(openElementorSection === "core" ? null : "core")}
                          className="w-full flex items-center justify-between text-[10px] font-black uppercase text-zinc-400 tracking-wider pb-1.5 border-b border-[#2d3135] hover:text-white transition-colors"
                        >
                          <span>Photobooth Core</span>
                          <span className="text-[8px]">{openElementorSection === "core" ? "▼" : "▶"}</span>
                        </button>

                        {openElementorSection === "core" && (
                          <div className="grid grid-cols-3 gap-2 mt-1">
                            {[
                              { id: "formRegistrasi", name: "Registry Form", shortName: "Form", icon: Component },
                              { id: "startBtn", name: "Start Button", shortName: "Start Button", icon: Camera },
                              { id: "qrisUpload", name: "QRIS Payment", shortName: "QRIS Pay", icon: QrCode },
                              { id: "customCard", name: "Instruction Card", shortName: "Info Card", icon: Layout }
                            ]
                            .filter(w => w.name.toLowerCase().includes(widgetSearchQuery.toLowerCase()))
                            .map((comp) => {
                              const CompIcon = comp.icon;
                              return (
                                <div
                                  key={comp.id}
                                  draggable
                                  onDragStart={(e) => {
                                    e.dataTransfer.setData("componentId", comp.id);
                                    e.dataTransfer.effectAllowed = "copy";
                                    setIsDraggingComponent(true);
                                  }}
                                  onDragEnd={() => {
                                    setIsDraggingComponent(false);
                                    setIsDragOverCanvas(false);
                                  }}
                                  onClick={() => {
                                    setSelectedComponent(comp.id);
                                    setActiveSidebarTab("settings");
                                    setActiveWidgetTab("content");
                                  }}
                                  className="flex flex-col items-center justify-center p-3 bg-[#1e2023] border border-[#2d3135] hover:border-[#E52F6E] rounded-md transition-all duration-200 cursor-grab active:cursor-grabbing hover:bg-[#24272b] select-none text-center gap-2 group aspect-square"
                                  title="Drag & Drop onto Canvas or click to edit"
                                >
                                  <div className="p-2 bg-[#2d3135] text-zinc-400 rounded group-hover:text-white transition-colors">
                                    <CompIcon className="w-5 h-5" />
                                  </div>
                                  <span className="text-[9px] font-bold text-zinc-350 group-hover:text-white leading-tight truncate w-full">
                                    {comp.shortName}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                    </div>
                  </div>
                )}

                {/* GLOBAL DESIGN & PAGE SETTINGS VIEW (Gear Button click) */}
                {activeSidebarTab === "design" && (
                  <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar animate-fade-in p-4 text-xs">
                    <h3 className="text-xs font-black text-white uppercase tracking-wider border-b border-[#2d3135] pb-2 mb-4">
                      Page Settings
                    </h3>
                    
                    <div className="flex flex-col gap-4">
                      <div className="flex flex-col gap-1.5">
                        <Label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Template Event Name</Label>
                        <Input required value={templateName} onChange={(e) => setTemplateName(e.target.value)} placeholder="Nama template..." className="h-9 bg-[#1e2023] border-[#3a3f44] text-white focus:border-[#E52F6E]" />
                      </div>

                      <div className="flex flex-col gap-1.5 mt-2">
                        <Label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Background Ambient Theme</Label>
                        <div className="grid grid-cols-2 gap-2 mt-1">
                          {Object.keys(THEME_GLOWS).map((t) => (
                            <button 
                              key={t} 
                              type="button"
                              onClick={() => setBgTheme(t)} 
                              className={`flex flex-col p-2.5 rounded border text-left transition-all gap-2 cursor-pointer ${
                                bgTheme === t 
                                  ? "border-[#E52F6E] bg-zinc-800" 
                                  : "border-[#3d4247] bg-[#1e2023] hover:bg-[#23262a]"
                              }`}
                            >
                              <div className={`w-full h-2.5 rounded bg-gradient-to-r ${THEME_GLOWS[t as keyof typeof THEME_GLOWS].gradient}`} />
                              <span className="text-[9px] font-bold capitalize text-zinc-350">{t}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5 mt-2">
                        <Label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Global Font Family</Label>
                        <select 
                          value={fontStyle} 
                          onChange={(e) => setFontStyle(e.target.value)} 
                          className="h-9 w-full rounded bg-[#1e2023] border border-[#3a3f44] text-white text-xs px-3 outline-none focus:border-[#E52F6E]"
                        >
                          <option value="inter">Inter (Clean modern sans-serif)</option>
                          <option value="outfit">Outfit (Geometric & colorful)</option>
                          <option value="syne">Syne (Fun bold headlines)</option>
                          <option value="playfair">Playfair Display (Royal calligraphy)</option>
                          <option value="cabinet">Cabinet Grotesk (Premium classic)</option>
                        </select>
                      </div>

                      <div className="p-3 bg-[#1e2023] border border-[#2d3135] rounded flex flex-col gap-1.5 mt-3 text-zinc-400 leading-normal">
                        <span className="font-bold text-[9px] text-[#E52F6E] uppercase">Global Styles Info</span>
                        <p className="text-[9.5px]">
                          Pengaturan Event ini mengatur font tulisan dan gradasi background ambient yang aktif di sepanjang sesi operasional booth.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* TEMPLATES PRESETS VIEW (Clock Button click) */}
                {activeSidebarTab === "templates" && (
                  <div className="flex-1 flex flex-col overflow-hidden animate-fade-in p-4 text-xs">
                    <h3 className="text-xs font-black text-white uppercase tracking-wider border-b border-[#2d3135] pb-2 mb-2">
                      Import Preset Templates
                    </h3>
                    <p className="text-[9.5px] text-zinc-450 leading-relaxed mb-4">
                      Terapkan konfigurasi dari template yang sudah terdaftar di database untuk mengganti layout saat ini secara instan.
                    </p>

                    <div className="flex-1 overflow-y-auto flex flex-col gap-2.5 custom-scrollbar">
                      {!templates || templates.length === 0 ? (
                        <div className="p-4 border border-dashed border-[#3d4247] rounded text-center text-xs text-zinc-550">
                          Tidak ada template preset lainnya.
                        </div>
                      ) : (
                        templates
                          .filter(t => t.id !== initialData?.id)
                          .map((preset) => (
                            <button
                              key={preset.id}
                              type="button"
                              onClick={() => applyPreset(preset)}
                              className="group p-3.5 bg-[#1e2023] border border-[#2d3135] rounded text-left transition-all hover:border-[#E52F6E] hover:bg-[#23262a] w-full flex flex-col gap-1.5 cursor-pointer"
                            >
                              <div className="flex justify-between items-center w-full">
                                <span className="text-xs font-black text-white">{preset.name}</span>
                                <div className={`w-3.5 h-1.5 rounded bg-gradient-to-r ${THEME_GLOWS[preset.bgTheme as keyof typeof THEME_GLOWS]?.gradient || THEME_GLOWS.sunset.gradient}`} />
                              </div>
                              <p className="text-[9.5px] text-zinc-400 line-clamp-1">{preset.welcomeText}</p>
                            </button>
                          ))
                      )}
                    </div>
                  </div>
                )}

                {/* NAVIGATOR / ACTIVE LAYERS VIEW (Hierarchy Button click) */}
                {activeSidebarTab === "layers" && (
                  <div className="flex-1 flex flex-col overflow-hidden animate-fade-in p-4 text-xs">
                    
                    <div className="flex justify-between items-center border-b border-[#2d3135] pb-2 mb-3 shrink-0">
                      <h3 className="text-xs font-black text-white uppercase tracking-wider">
                        Navigator Tree
                      </h3>
                      <span className="text-[8px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded font-mono font-bold tracking-wide">
                        {previewScreen.toUpperCase()} SCREEN
                      </span>
                    </div>

                    {/* Hierarchy screens selector tab */}
                    <div className="grid grid-cols-4 gap-1 p-0.5 bg-[#1e2023] rounded border border-[#2d3135] shrink-0 text-center text-[8px] font-black uppercase tracking-wider mb-4">
                      {(["registrasi", "payment", "capture", "share"] as const).map((scr) => (
                        <button
                          key={scr}
                          type="button"
                          onClick={() => setPreviewScreen(scr)}
                          className={`py-1.5 rounded transition-all cursor-pointer ${
                            previewScreen === scr
                              ? "bg-zinc-800 text-white shadow-sm"
                              : "text-zinc-500 hover:text-zinc-300"
                          }`}
                        >
                          {scr === "registrasi" ? "1. Reg" : scr === "payment" ? "2. Pay" : scr === "capture" ? "3. Cam" : "4. Share"}
                        </button>
                      ))}
                    </div>

                    {/* Active Screen Layers Tree List */}
                    <div className="flex-1 overflow-y-auto flex flex-col gap-1.5 custom-scrollbar">
                      
                      {previewScreen === "registrasi" && (
                        <>
                          {[
                            { id: "logo", name: "Brand Logo Widget", active: !hideLogo },
                            ...(cardStyle !== "frameless" ? [{ id: "couplePhoto", name: "Couple Mempelai Image", active: !!couplePhotoUrl }] : []),
                            { id: "welcomeText", name: "Greeting / Welcome Title", active: !hideWelcomeText },
                            { id: "formRegistrasi", name: "Registration Input Form", active: !hideFormRegistrasi },
                            { id: "customCard", name: "Instruction Detail Card", active: showCustomCard },
                            { id: "startBtn", name: "Start Photo Action Button", active: !hideStartBtn },
                            { id: "footerText", name: "Footer Copyright Banner", active: !hideFooterText }
                          ].map((layer) => (
                            <button
                              key={layer.id}
                              type="button"
                              onClick={() => {
                                setSelectedComponent(layer.id);
                                setActiveSidebarTab("settings");
                                setActiveWidgetTab("content");
                              }}
                              className="w-full flex items-center justify-between p-2.5 bg-[#1e2023] border border-[#2d3135] hover:border-zinc-500 rounded text-left transition-colors cursor-pointer"
                            >
                              <span className="text-[10.5px] font-semibold text-zinc-300">{layer.name}</span>
                              <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${
                                layer.active 
                                  ? "bg-emerald-500/10 text-emerald-500 dark:bg-emerald-500/20 border border-emerald-500/30" 
                                  : "bg-zinc-800 text-zinc-500 border border-zinc-700/20"
                              }`}>
                                {layer.active ? "ACTIVE" : "INACTIVE"}
                              </span>
                            </button>
                          ))}
                        </>
                      )}

                      {previewScreen === "payment" && (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedComponent("qrisUpload");
                              setActiveSidebarTab("settings");
                              setActiveWidgetTab("content");
                            }}
                            className="w-full flex items-center justify-between p-2.5 bg-[#1e2023] border border-[#2d3135] hover:border-zinc-500 rounded text-left transition-colors cursor-pointer"
                          >
                            <span className="text-[10.5px] font-semibold text-zinc-300">QRIS Pay Container</span>
                            <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${
                              showPayment
                                ? "bg-emerald-500/10 text-emerald-500 dark:bg-emerald-500/20 border border-emerald-500/30"
                                : "bg-zinc-800 text-zinc-500 border border-zinc-700/20"
                            }`}>
                              {showPayment ? "ACTIVE" : "INACTIVE"}
                            </span>
                          </button>
                        </>
                      )}

                      {previewScreen === "capture" && (
                        <>
                          {[
                            { id: "cameraFeed", name: "Live Camera Viewport Box", active: !hideCameraFeed },
                            { id: "countdownTimer", name: "Floating Countdown Banner", active: !hideCountdownTimer }
                          ].map((layer) => (
                            <button
                              key={layer.id}
                              type="button"
                              onClick={() => {
                                setSelectedComponent(layer.id);
                                setActiveSidebarTab("settings");
                                setActiveWidgetTab("content");
                              }}
                              className="w-full flex items-center justify-between p-2.5 bg-[#1e2023] border border-[#2d3135] hover:border-zinc-500 rounded text-left transition-colors cursor-pointer"
                            >
                              <span className="text-[10.5px] font-semibold text-zinc-300">{layer.name}</span>
                              <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${
                                layer.active 
                                  ? "bg-emerald-500/10 text-emerald-500 dark:bg-emerald-500/20 border border-emerald-500/30" 
                                  : "bg-zinc-800 text-zinc-500 border border-zinc-700/20"
                              }`}>
                                {layer.active ? "ACTIVE" : "INACTIVE"}
                              </span>
                            </button>
                          ))}
                        </>
                      )}

                      {previewScreen === "share" && (
                        <>
                          {[
                            { id: "compiledStrip", name: "Rendered Photo Strip Frame", active: !hideCompiledStrip },
                            { id: "qrShare", name: "WhatsApp & Email Share Panels", active: !hideQrShare },
                            { id: "printBtn", name: "Print Photo Action Controls", active: !hidePrintBtn }
                          ].map((layer) => (
                            <button
                              key={layer.id}
                              type="button"
                              onClick={() => {
                                setSelectedComponent(layer.id);
                                setActiveSidebarTab("settings");
                                setActiveWidgetTab("content");
                              }}
                              className="w-full flex items-center justify-between p-2.5 bg-[#1e2023] border border-[#2d3135] hover:border-zinc-500 rounded text-left transition-colors cursor-pointer"
                            >
                              <span className="text-[10.5px] font-semibold text-zinc-300">{layer.name}</span>
                              <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${
                                layer.active 
                                  ? "bg-emerald-500/10 text-emerald-500 dark:bg-emerald-500/20 border border-emerald-500/30" 
                                  : "bg-zinc-800 text-zinc-500 border border-zinc-700/20"
                              }`}>
                                {layer.active ? "ACTIVE" : "INACTIVE"}
                              </span>
                            </button>
                          ))}
                        </>
                      )}

                    </div>
                  </div>
                )}

              </div>
            )}

          </div>

          {/* Elementor Sidebar Bottom Action Toolbar */}
          <div className="h-12 bg-[#2d3135] border-t border-[#1e2124] shrink-0 px-3 flex items-center justify-between z-10">
            <div className="flex items-center gap-1.5">
              
              {/* Settings / Gear Button */}
              <Tooltip>
                <TooltipTrigger render={
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedComponent(null);
                      setActiveSidebarTab("design");
                    }}
                    className={`p-1.5 rounded transition-colors cursor-pointer ${
                      activeSidebarTab === "design" && !selectedComponent 
                        ? "text-white bg-zinc-800" 
                        : "text-zinc-400 hover:text-white"
                    }`}
                    title="Page Settings (Global Layout)"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                } />
                <TooltipContent side="top" className="text-[9px] bg-zinc-900 text-zinc-200 border-none py-1 px-2 rounded">
                  Page Settings
                </TooltipContent>
              </Tooltip>

              {/* History / Clock Button */}
              <Tooltip>
                <TooltipTrigger render={
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedComponent(null);
                      setActiveSidebarTab("templates");
                    }}
                    className={`p-1.5 rounded transition-colors cursor-pointer ${
                      activeSidebarTab === "templates" && !selectedComponent 
                        ? "text-white bg-zinc-800" 
                        : "text-zinc-400 hover:text-white"
                    }`}
                    title="Design Presets"
                  >
                    <Clock className="w-4 h-4" />
                  </button>
                } />
                <TooltipContent side="top" className="text-[9px] bg-zinc-900 text-zinc-200 border-none py-1 px-2 rounded">
                  Presets Templates
                </TooltipContent>
              </Tooltip>

              {/* Navigator / Layers Button */}
              <Tooltip>
                <TooltipTrigger render={
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedComponent(null);
                      setActiveSidebarTab("layers");
                    }}
                    className={`p-1.5 rounded transition-colors cursor-pointer ${
                      activeSidebarTab === "layers" && !selectedComponent 
                        ? "text-white bg-zinc-800" 
                        : "text-zinc-400 hover:text-white"
                    }`}
                    title="Navigator Tree"
                  >
                    <Layers className="w-4 h-4" />
                  </button>
                } />
                <TooltipContent side="top" className="text-[9px] bg-zinc-900 text-zinc-200 border-none py-1 px-2 rounded">
                  Navigator
                </TooltipContent>
              </Tooltip>

              {/* Alignment Snapping Guides Toggle */}
              <Tooltip>
                <TooltipTrigger render={
                  <button
                    type="button"
                    onClick={() => setShowGuides(!showGuides)}
                    className={`p-1.5 rounded transition-all cursor-pointer ${
                      showGuides ? "text-[#E52F6E]" : "text-zinc-400 hover:text-white"
                    }`}
                    title="Snapping Guides"
                  >
                    <Sliders className="w-4 h-4" />
                  </button>
                } />
                <TooltipContent side="top" className="text-[9px] bg-zinc-900 text-zinc-200 border-none py-1 px-2 rounded">
                  Snapping Guides
                </TooltipContent>
              </Tooltip>

            </div>

            {/* Signature Elementor Update Button */}
            <button
              type="button"
              onClick={handlePublish}
              disabled={isSaving}
              className="bg-[#39b54a] hover:bg-[#43b85e] text-white text-[10px] font-black uppercase tracking-wider px-5 py-2 rounded font-sans flex items-center gap-1.5 shadow-md active:scale-95 disabled:opacity-50 transition-all cursor-pointer"
            >
              {isSaving ? (
                <span className="w-3 h-3 rounded-full border border-zinc-400 border-t-white animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              Update
            </button>

          </div>

        </aside>


        {/* RIGHT AREA: CLEAN FRAMELESS CANVAS */}
        <main className="flex-1 overflow-hidden bg-zinc-100/50 dark:bg-[#030303] flex flex-col relative">
          
          {/* Floating Expand Sidebar Button when collapsed */}
          {isSidebarCollapsed && (
            <Tooltip>
              <TooltipTrigger render={
                <button
                  type="button"
                  onClick={() => setIsSidebarCollapsed(false)}
                  className="absolute left-4 top-4 z-30 p-2.5 bg-zinc-900/90 dark:bg-zinc-805/90 hover:bg-zinc-800 dark:hover:bg-zinc-700 hover:text-white border border-zinc-700/50 rounded-full shadow-2xl transition-all cursor-pointer hover:scale-105 flex items-center justify-center"
                  title="Tampilkan Panel"
                >
                  <Eye className="w-4 h-4 text-[#E52F6E]" />
                </button>
              } />
              <TooltipContent side="right" className="text-[9px] bg-zinc-900 text-zinc-200 border-none py-1 px-2 rounded">
                Tampilkan Panel
              </TooltipContent>
            </Tooltip>
          )}

          <div 
            ref={canvasContainerRef} 
            className="flex-1 overflow-y-auto p-8 flex custom-scrollbar relative transition-all duration-300"
            style={showGrid ? {
              backgroundImage: 'radial-gradient(circle, rgba(128,128,128,0.15) 1.5px, transparent 1.5px)',
              backgroundSize: '20px 20px',
            } : undefined}
          >
            {/* Viewport Content - DYNAMIC PREVIEW FRAME */}
            <div 
              ref={viewportRef}
              className={
                devicePreview === "mobile"
                  ? "m-auto w-[375px] max-w-full h-[667px] border-[12px] border-zinc-950 dark:border-zinc-900 rounded-[36px] shadow-2xl bg-white dark:bg-[#121214] p-6 pt-10 overflow-y-auto hide-scrollbar relative transition-all duration-300 flex flex-col items-center justify-start gap-4"
                  : devicePreview === "tablet"
                    ? "m-auto w-[768px] max-w-full h-[576px] border-[12px] border-zinc-950 dark:border-zinc-900 rounded-[28px] shadow-2xl bg-white dark:bg-[#121214] p-8 overflow-y-auto hide-scrollbar relative transition-all duration-300 flex flex-col items-center justify-start gap-6"
                    : "m-auto w-full max-w-5xl min-h-[600px] relative flex flex-col items-center p-4 transition-all justify-center border border-transparent duration-300"
              }
              style={{ 
                fontFamily: getFontFamilyName(fontStyle),
                transform: `scale(${zoomLevel / 100})`,
                transformOrigin: "center center",
                transition: "transform 0.15s ease-in-out"
              }}
            >
              {/* Viewport Center Alignment Guides */}
              {showGuides && selectedComponent && (
                <div className="absolute inset-0 pointer-events-none z-10 select-none overflow-hidden rounded-[inherit]">
                  {/* Vertical Center Axis */}
                  <div className="absolute inset-y-0 left-1/2 w-0 border-l border-dashed border-zinc-300/40 dark:border-zinc-700/40" />
                  {/* Horizontal Center Axis */}
                  <div className="absolute inset-x-0 top-1/2 h-0 border-t border-dashed border-zinc-300/40 dark:border-zinc-700/40" />
                </div>
              )}
              {devicePreview === "mobile" && (
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-28 h-4 bg-zinc-950 rounded-full flex items-center justify-center gap-1.5 z-40 pointer-events-none border border-zinc-850 shadow-inner">
                  <div className="w-1.5 h-1.5 rounded-full bg-zinc-800" />
                  <div className="w-10 h-1 bg-zinc-800 rounded-full" />
                </div>
              )}
              {/* Decorative Ambient Background */}
              <div className={`absolute top-[10%] left-[10%] w-[50%] aspect-square rounded-full blur-[100px] pointer-events-none z-0 ${activeGlow.topLeft} opacity-50`} />
              <div className={`absolute bottom-[10%] right-[10%] w-[50%] aspect-square rounded-full blur-[100px] pointer-events-none z-0 ${activeGlow.bottomRight} opacity-50`} />
              
              {/* Live Preview Template Decoration */}
              <TemplateDecoration 
                cardStyle={cardStyle} 
                isBuilder={true}
                selectedComponent={selectedComponent}
                onSelectComponent={setSelectedComponent}
                onUpdateCustomization={(key, value) => {
                  if (key === "groomLabel") setGroomLabel(value);
                  if (key === "groomSubLabel") setGroomSubLabel(value);
                  if (key === "groomPhotoUrl") setGroomPhotoUrl(value);
                  if (key === "brideLabel") setBrideLabel(value);
                  if (key === "brideSubLabel") setBrideSubLabel(value);
                  if (key === "bridePhotoUrl") setBridePhotoUrl(value);
                  if (key === "groomScale") setGroomScale(value);
                  if (key === "groomRotate") setGroomRotate(value);
                  if (key === "groomX") setGroomX(value);
                  if (key === "groomY") setGroomY(value);
                  if (key === "brideScale") setBrideScale(value);
                  if (key === "brideRotate") setBrideRotate(value);
                  if (key === "brideX") setBrideX(value);
                  if (key === "brideY") setBrideY(value);
                }}
                customization={{
                  groomLabel,
                  groomSubLabel,
                  groomPhotoUrl,
                  brideLabel,
                  brideSubLabel,
                  bridePhotoUrl,
                  groomScale,
                  groomRotate,
                  groomX,
                  groomY,
                  brideScale,
                  brideRotate,
                  brideX,
                  brideY
                }}
              />
              
              {/* Drop Zone Overlay */}
              {isDraggingComponent && (
                <div 
                  className={`absolute inset-0 z-50 flex flex-col items-center justify-center rounded-[inherit] transition-all duration-300 ${
                    isDragOverCanvas 
                      ? "bg-blue-500/10 dark:bg-blue-500/20 border-4 border-dashed border-blue-500 backdrop-blur-[3px]" 
                      : "bg-zinc-500/5 dark:bg-zinc-500/10 border-4 border-dashed border-zinc-400/50 dark:border-zinc-700/50 backdrop-blur-[1px]"
                  }`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragOverCanvas(true);
                  }}
                  onDragLeave={() => {
                    setIsDragOverCanvas(false);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragOverCanvas(false);
                    setIsDraggingComponent(false);
                    const componentId = e.dataTransfer.getData("componentId");
                    if (componentId) {
                      handleActivateComponent(componentId);
                    }
                  }}
                >
                  <div className={`p-6 rounded-2xl transition-all duration-300 flex flex-col items-center gap-3 text-center shadow-lg border ${
                    isDragOverCanvas 
                      ? "scale-110 text-blue-600 dark:text-blue-400 bg-white dark:bg-zinc-900 border-blue-500/30" 
                      : "text-zinc-500 dark:text-zinc-400 bg-white/90 dark:bg-zinc-900/90 border-zinc-200 dark:border-zinc-800"
                  }`}>
                    <div className={`p-3 rounded-full ${isDragOverCanvas ? "bg-blue-50 dark:bg-blue-950/50 animate-bounce" : "bg-zinc-100 dark:bg-zinc-800"}`}>
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <div className="flex flex-col gap-1 px-4">
                      <span className="text-xs font-bold uppercase tracking-wider">Lepaskan Komponen di Sini</span>
                      <span className="text-[10px] text-zinc-450 dark:text-zinc-500 leading-normal max-w-[200px]">
                        Lepaskan untuk mengaktifkan dan mengedit konfigurasi komponen
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* --- REGISTRASI SCREEN --- */}
              {previewScreen === "registrasi" && (
                <div className="w-full flex justify-center z-10 pointer-events-none">
                  <div className="pointer-events-auto flex justify-center max-w-[440px] w-full mx-auto">
                    <StartScreen
                    config={mockConfig}
                    cameras={mockCameras}
                    selectedCameraId="default"
                    setSelectedCameraId={() => {}}
                    onStart={() => {}}
                    customerName={mockCustomerName}
                    setCustomerName={setMockCustomerName}
                    customerPhone={mockCustomerPhone}
                    setCustomerPhone={setMockCustomerPhone}
                    sessionsCount={mockSessionsCount}
                    setSessionsCount={setMockSessionsCount}
                    onEditField={handleEditField}
                    onChangeConfig={handleChangeConfig}
                    showGuides={showGuides}
                    customization={{
                      formTitle,
                      visitorFormLabel,
                      customerNameLabel,
                      customerPhoneLabel,
                      sessionsCountLabel,
                      cameraSelectLabel,
                      startButtonText,
                      couplePhotoUrl,
                      logoSize,
                      welcomeTextSize,
                      formCardPadding,
                      startButtonSize,
                      primaryColor,
                      cardBorderRadius,
                      cardShadow,
                      inputBgStyle,
                      buttonStyle,
                      cardStyle,
                      hideLogo,
                      welcomeTextAlignment,
                      customWelcomeTextColor,
                      customButtonTextColor,
                      hideWelcomeText,
                      hideFormRegistrasi,
                      hideStartBtn,
                      hideFooterText,
                      showCustomCard,
                      customCardTitle,
                      customCardContent,
                      logoScale,
                      logoRotate,
                      logoX,
                      logoY,
                      couplePhotoScale,
                      couplePhotoRotate,
                      couplePhotoX,
                      couplePhotoY,
                      welcomeTextScale,
                      welcomeTextRotate,
                      welcomeTextX,
                      welcomeTextY,
                      formScale,
                      formRotate,
                      formX,
                      formY,
                      customCardScale,
                      customCardRotate,
                      customCardX,
                      customCardY,
                      startBtnScale,
                      startBtnRotate,
                      startBtnX,
                      startBtnY,
                      footerScale,
                      footerRotate,
                      footerX,
                      footerY,
                    }}
                    onChangeCustomization={(key, value) => {
                      if (key === "formTitle") setFormTitle(value);
                      if (key === "visitorFormLabel") setVisitorFormLabel(value);
                      if (key === "customerNameLabel") setCustomerNameLabel(value);
                      if (key === "customerPhoneLabel") setCustomerPhoneLabel(value);
                      if (key === "sessionsCountLabel") setSessionsCountLabel(value);
                      if (key === "cameraSelectLabel") setCameraSelectLabel(value);
                      if (key === "startButtonText") setStartButtonText(value);
                      if (key === "logoSize") setLogoSize(value as any);
                      if (key === "welcomeTextSize") setWelcomeTextSize(value as any);
                      if (key === "formCardPadding") setFormCardPadding(value as any);
                      if (key === "startButtonSize") setStartButtonSize(value as any);
                      if (key === "primaryColor") setPrimaryColor(value);
                      if (key === "cardBorderRadius") setCardBorderRadius(value as any);
                      if (key === "cardShadow") setCardShadow(value as any);
                      if (key === "inputBgStyle") setInputBgStyle(value as any);
                      if (key === "buttonStyle") setButtonStyle(value as any);
                      if (key === "cardStyle") setCardStyle(value as any);
                      if (key === "hideLogo") setHideLogo(value === "true" || (value as any) === true);
                      if (key === "hideWelcomeText") setHideWelcomeText(value === "true" || (value as any) === true);
                      if (key === "hideFormRegistrasi") setHideFormRegistrasi(value === "true" || (value as any) === true);
                      if (key === "hideStartBtn") setHideStartBtn(value === "true" || (value as any) === true);
                      if (key === "hideFooterText") setHideFooterText(value === "true" || (value as any) === true);
                      if (key === "hideCameraFeed") setHideCameraFeed(value === "true" || (value as any) === true);
                      if (key === "hideCountdownTimer") setHideCountdownTimer(value === "true" || (value as any) === true);
                      if (key === "hideCompiledStrip") setHideCompiledStrip(value === "true" || (value as any) === true);
                      if (key === "hideQrShare") setHideQrShare(value === "true" || (value as any) === true);
                      if (key === "hidePrintBtn") setHidePrintBtn(value === "true" || (value as any) === true);
                      if (key === "welcomeTextAlignment") setWelcomeTextAlignment(value as any);
                      if (key === "customWelcomeTextColor") setCustomWelcomeTextColor(value);
                      if (key === "customButtonTextColor") setCustomButtonTextColor(value);
                      if (key === "showCustomCard") setShowCustomCard(value === "true" || (value as any) === true);
                      if (key === "customCardTitle") setCustomCardTitle(value);
                      if (key === "customCardContent") setCustomCardContent(value);
                      if (key === "logoScale") setLogoScale(Number(value));
                      if (key === "logoRotate") setLogoRotate(Number(value));
                      if (key === "logoX") setLogoX(Number(value));
                      if (key === "logoY") setLogoY(Number(value));
                      if (key === "couplePhotoScale") setCouplePhotoScale(Number(value));
                      if (key === "couplePhotoRotate") setCouplePhotoRotate(Number(value));
                      if (key === "couplePhotoX") setCouplePhotoX(Number(value));
                      if (key === "couplePhotoY") setCouplePhotoY(Number(value));
                      if (key === "welcomeTextScale") setWelcomeTextScale(Number(value));
                      if (key === "welcomeTextRotate") setWelcomeTextRotate(Number(value));
                      if (key === "welcomeTextX") setWelcomeTextX(Number(value));
                      if (key === "welcomeTextY") setWelcomeTextY(Number(value));
                      if (key === "formScale") setFormScale(Number(value));
                      if (key === "formRotate") setFormRotate(Number(value));
                      if (key === "formX") setFormX(Number(value));
                      if (key === "formY") setFormY(Number(value));
                      if (key === "customCardScale") setCustomCardScale(Number(value));
                      if (key === "customCardRotate") setCustomCardRotate(Number(value));
                      if (key === "customCardX") setCustomCardX(Number(value));
                      if (key === "customCardY") setCustomCardY(Number(value));
                      if (key === "startBtnScale") setStartBtnScale(Number(value));
                      if (key === "startBtnRotate") setStartBtnRotate(Number(value));
                      if (key === "startBtnX") setStartBtnX(Number(value));
                      if (key === "startBtnY") setStartBtnY(Number(value));
                      if (key === "footerScale") setFooterScale(Number(value));
                      if (key === "footerRotate") setFooterRotate(Number(value));
                      if (key === "footerX") setFooterX(Number(value));
                      if (key === "footerY") setFooterY(Number(value));
                    }}
                    selectedComponent={selectedComponent}
                  />
                  </div>
                </div>
              )}

              {/* --- PAYMENT SCREEN --- */}
              {previewScreen === "payment" && (
                <div className="w-full flex justify-center z-10 pointer-events-none">
                  <div className="pointer-events-auto flex justify-center max-w-md w-full mx-auto">
                    <PaymentScreen
                      customerName={mockCustomerName || "Widi"}
                      customerPhone={mockCustomerPhone || "081234567890"}
                      sessionsCount={Number(mockSessionsCount) || 1}
                      onPaymentSuccess={() => {}}
                      onCancel={() => {}}
                      eventName={eventName || "Widi Photobooth"}
                      pricePerSession={pricePerSession}
                      qrisUrl={qrisUrl}
                      onEditField={handleEditField}
                      onChangeConfig={handleChangeConfig}
                      selectedComponent={selectedComponent}
                      customization={{
                        showPayment,
                        cardStyle,
                        cardBorderRadius,
                        cardShadow,
                        primaryColor,
                      }}
                    />
                  </div>
                </div>
              )}

        

              {/* --- CAPTURE SCREEN --- */}
              {previewScreen === "capture" && (
                <div className="w-full scale-[0.65] sm:scale-75 origin-top -mb-[25vh] z-10 pointer-events-none">
                  <div className="pointer-events-auto max-w-5xl w-full flex justify-center mx-auto">
                    <CaptureScreen
                      videoRef={dummyVideoRef}
                      isCapturing={false}
                      capturedPhotos={MOCK_PHOTOS}
                      activeLayout="strip"
                      activeFilter={MOCK_FILTERS[0]}
                      activeFiltersList={MOCK_FILTERS}
                      activeLayoutsList={[{ id: "strip", name: "Photo Strip", count: 4 }]}
                      countdown={null}
                      poseAlert={null}
                      isMirrored={true}
                      setIsMirrored={() => {}}
                      startCaptureSequence={() => {}}
                      onCancel={() => {}}
                      layoutsCount={4}
                      config={mockConfig}
                      activeFrameId=""
                      countdownDuration={countdownDuration}
                      setCountdownDuration={() => {}}
                      currentCaptureNum={1}
                      customerName={mockCustomerName || "Widi"}
                      customerPhone={mockCustomerPhone || "081234567890"}
                      currentSessionNum={1}
                      sessionsCount={Number(mockSessionsCount) || 1}
                      placedStickers={[]}
                      onAddSticker={() => {}}
                      onRemoveSticker={() => {}}
                      onUpdateSticker={() => {}}
                      customization={{
                        hideCameraFeed,
                        hideCountdownTimer,
                        hideCompiledStrip,
                        hideQrShare,
                        hidePrintBtn,
                        showPayment,
                        cardStyle,
                        cardBorderRadius,
                        cardShadow,
                        primaryColor,
                      }}
                    />
                  </div>
                </div>
              )}

              {/* --- SHARE SCREEN --- */}
              {previewScreen === "share" && (
                <div className="w-full scale-75 sm:scale-90 origin-top -mb-[5vh] z-10 pointer-events-none">
                  <div className="pointer-events-auto max-w-5xl w-full flex justify-center mx-auto">
                    <ShareScreen
                      config={mockConfig}
                      compiledStripUrl="https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=300&auto=format&fit=crop"
                      capturedPhotos={MOCK_PHOTOS}
                      customerName={mockCustomerName || "Widi"}
                      customerPhone={mockCustomerPhone || "081234567890"}
                      currentSessionNum={1}
                      sessionsCount={Number(mockSessionsCount) || 1}
                      photoId="mock-photo-id"
                      onComplete={() => {}}
                      handlePrint={() => {}}
                      customization={{
                        formTitle,
                        visitorFormLabel,
                        customerNameLabel,
                        customerPhoneLabel,
                        sessionsCountLabel,
                        cameraSelectLabel,
                        startButtonText,
                        logoSize,
                        welcomeTextSize,
                        formCardPadding,
                        startButtonSize,
                        primaryColor,
                        cardBorderRadius,
                        cardShadow,
                        inputBgStyle,
                        buttonStyle,
                        cardStyle,
                        hideLogo,
                        hideWelcomeText,
                        hideFormRegistrasi,
                        hideStartBtn,
                        hideFooterText,
                        hideCameraFeed,
                        hideCountdownTimer,
                        hideCompiledStrip,
                        hideQrShare,
                        hidePrintBtn,
                        welcomeTextAlignment,
                        customWelcomeTextColor,
                        customButtonTextColor,
                        showCustomCard,
                        customCardTitle,
                        customCardContent,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* BOTTOM SHEET NAVIGATION (EXCEL STYLE) */}
          <footer className="h-[72px] bg-white dark:bg-zinc-950 shrink-0 border-t border-zinc-200 dark:border-zinc-800 z-30 shadow-[0_-4px_16px_rgba(0,0,0,0.03)] overflow-x-auto hide-scrollbar">
            <div className="max-w-6xl mx-auto h-full flex items-center px-6">
              <div className="flex items-end h-full gap-1 pt-3">
                {[
                  { id: "registrasi", label: "Layar Registrasi", desc: "Pendaftaran data pengunjung" },
                  { id: "payment", label: "Layar Bayar", desc: "Pembayaran QRIS atau Tunai" },
                  { id: "capture", label: "Layar Kamera", desc: "Pengambilan foto dengan hitung mundur" },
                  { id: "share", label: "Layar Share", desc: "Cetak & unduh foto via QR Code" }
                ].map((screen) => {
                  const isActive = previewScreen === screen.id;
                  return (
                    <Tooltip key={screen.id}>
                      <TooltipTrigger render={
                        <button 
                          onClick={() => setPreviewScreen(screen.id as any)} 
                          className={`group flex items-center gap-3 px-5 py-2.5 rounded-t-xl transition-all border-x border-t ${isActive ? "bg-zinc-100 dark:bg-[#030303] border-zinc-200 dark:border-zinc-800 shadow-[0_-2px_10px_rgba(0,0,0,0.02)] z-10" : "bg-white dark:bg-zinc-950 border-transparent text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-900 z-0"}`}
                          style={{ marginBottom: isActive ? '-1px' : '0' }}
                        >
                          <div className={`transition-all duration-300 ${isActive ? "opacity-100 scale-100" : "opacity-60 scale-90 group-hover:opacity-100 group-hover:scale-95"}`}>
                            {renderSheetThumbnail(screen.id as any)}
                          </div>
                          <span className={`text-[11px] uppercase tracking-wider font-bold ${isActive ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-400"}`}>
                            {screen.label}
                          </span>
                        </button>
                      } />
                      <TooltipContent side="top">
                        <p className="text-[10px] font-semibold">{screen.desc}</p>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}