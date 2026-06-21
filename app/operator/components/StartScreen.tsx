"use client";

import { useState, useEffect, useRef } from "react";
import { Camera, ArrowRight, User, Phone, Layers, Settings, Plus, Trash2 } from "lucide-react";
import { EventConfig } from "../../hooks/usePhotoboothStore";

export interface UiCustomization {
  formTitle?: string;
  visitorFormLabel?: string;
  customerNameLabel?: string;
  customerPhoneLabel?: string;
  sessionsCountLabel?: string;
  cameraSelectLabel?: string;
  startButtonText?: string;
  logoSize?: "sm" | "md" | "lg" | "xl";
  welcomeTextSize?: "sm" | "md" | "lg" | "xl";
  formCardPadding?: "sm" | "md" | "lg";
  startButtonSize?: "sm" | "md" | "lg";
  primaryColor?: string;
  cardBorderRadius?: "none" | "sm" | "md" | "lg" | "xl" | "2xl";
  cardShadow?: "none" | "sm" | "md" | "lg" | "xl" | "2xl";
  inputBgStyle?: "white" | "tinted" | "transparent";
  buttonStyle?: "solid" | "outline" | "gradient";
  cardStyle?: "classic" | "glass" | "frameless" | "neobrutalist";
  hideLogo?: boolean;
  welcomeTextAlignment?: "left" | "center" | "right";
  customWelcomeTextColor?: string;
  customButtonTextColor?: string;
  hideWelcomeText?: boolean;
  hideFormRegistrasi?: boolean;
  hideStartBtn?: boolean;
  hideFooterText?: boolean;
  hideCameraFeed?: boolean;
  hideCountdownTimer?: boolean;
  hideCompiledStrip?: boolean;
  hideQrShare?: boolean;
  hidePrintBtn?: boolean;
  showCustomCard?: boolean;
  customCardTitle?: string;
  customCardContent?: string;
  couplePhotoUrl?: string;
  // Scale and rotation options
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
  groomLabel?: string;
  groomSubLabel?: string;
  groomPhotoUrl?: string;
  brideLabel?: string;
  brideSubLabel?: string;
  bridePhotoUrl?: string;
}

interface StartScreenProps {
  config: EventConfig;
  cameras: MediaDeviceInfo[];
  selectedCameraId: string;
  setSelectedCameraId: (id: string) => void;
  onStart: () => void;
  customerName: string;
  setCustomerName: (v: string) => void;
  customerPhone: string;
  setCustomerPhone: (v: string) => void;
  sessionsCount: number | "";
  setSessionsCount: (v: number | "") => void;
  onEditField?: (field: string) => void;
  onChangeConfig?: (key: string, value: string) => void;
  customization?: UiCustomization;
  onChangeCustomization?: (key: keyof UiCustomization, value: any) => void;
  selectedComponent?: string | null;
  showGuides?: boolean;
}

// -------------------------------------------------------------
// Interactive Element Wrapper for Resizing & Rotating in Builder
// -------------------------------------------------------------
interface InteractiveWrapperProps {
  id: string;
  scale: number;
  rotate: number;
  x: number;
  y: number;
  onUpdate: (scale: number, rotate: number, x: number, y: number) => void;
  onSelect: () => void;
  selected: boolean;
  enabled: boolean;
  children: React.ReactNode;
  showGuides?: boolean;
}

function InteractiveWrapper({
  id,
  scale = 1,
  rotate = 0,
  x = 0,
  y = 0,
  onUpdate,
  onSelect,
  selected,
  enabled,
  children,
  showGuides = true
}: InteractiveWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState<"resize" | "rotate" | "move" | null>(null);
  const dragStartPos = useRef({ x: 0, y: 0, offsetX: 0, offsetY: 0 });

  if (!enabled) {
    return (
      <div 
        style={{ 
          transform: `translate(${x}px, ${y}px) scale(${scale}) rotate(${rotate}deg)`, 
          transformOrigin: "center",
        }}
        className="w-full flex justify-center"
      >
        {children}
      </div>
    );
  }

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      if (isDragging === "rotate") {
        const angleRad = Math.atan2(e.clientY - centerY, e.clientX - centerX);
        let angleDeg = Math.round((angleRad * 180) / Math.PI) - 90; // offset by 90deg to point straight up
        if (angleDeg < -180) angleDeg += 360;
        if (angleDeg > 180) angleDeg -= 360;
        onUpdate(scale, angleDeg, x, y);
      } else if (isDragging === "resize") {
        const dist = Math.hypot(e.clientX - centerX, e.clientY - centerY);
        const baseDist = Math.max(20, Math.hypot(rect.width / 2, rect.height / 2)) / (scale || 1);
        const newScale = Math.min(2.5, Math.max(0.4, Number((dist / baseDist).toFixed(2))));
        onUpdate(newScale, rotate, x, y);
      } else if (isDragging === "move") {
        const dx = e.clientX - dragStartPos.current.x;
        const dy = e.clientY - dragStartPos.current.y;
        let newX = dragStartPos.current.offsetX + dx;
        let newY = dragStartPos.current.offsetY + dy;
        
        // Snapping logic: if newX is close to 0 (vertical center alignment)
        const snapThreshold = 8;
        if (showGuides) {
          if (Math.abs(newX) < snapThreshold) {
            newX = 0;
          }
          // Snapping logic: if newY is close to 0 (original Y position)
          if (Math.abs(newY) < snapThreshold) {
            newY = 0;
          }
        }
        onUpdate(scale, rotate, newX, newY);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(null);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 0) return;
      const touch = e.touches[0];
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      if (isDragging === "rotate") {
        const angleRad = Math.atan2(touch.clientY - centerY, touch.clientX - centerX);
        let angleDeg = Math.round((angleRad * 180) / Math.PI) - 90;
        if (angleDeg < -180) angleDeg += 360;
        if (angleDeg > 180) angleDeg -= 360;
        onUpdate(scale, angleDeg, x, y);
      } else if (isDragging === "resize") {
        const dist = Math.hypot(touch.clientX - centerX, touch.clientY - centerY);
        const baseDist = Math.max(20, Math.hypot(rect.width / 2, rect.height / 2)) / (scale || 1);
        const newScale = Math.min(2.5, Math.max(0.4, Number((dist / baseDist).toFixed(2))));
        onUpdate(newScale, rotate, x, y);
      } else if (isDragging === "move") {
        const dx = touch.clientX - dragStartPos.current.x;
        const dy = touch.clientY - dragStartPos.current.y;
        let newX = dragStartPos.current.offsetX + dx;
        let newY = dragStartPos.current.offsetY + dy;
        
        // Snapping logic: if newX is close to 0 (vertical center alignment)
        const snapThreshold = 8;
        if (showGuides) {
          if (Math.abs(newX) < snapThreshold) {
            newX = 0;
          }
          // Snapping logic: if newY is close to 0 (original Y position)
          if (Math.abs(newY) < snapThreshold) {
            newY = 0;
          }
        }
        onUpdate(scale, rotate, newX, newY);
      }
    };

    const handleTouchEnd = () => {
      setIsDragging(null);
    };

    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleTouchEnd);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isDragging, scale, rotate, x, y, onUpdate, showGuides]);

  return (
    <div
      ref={containerRef}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      onMouseDown={(e) => {
        if (!enabled) return;
        const target = e.target as HTMLElement;
        if (
          target.closest("button") || 
          target.closest("input") || 
          target.closest("textarea") || 
          target.closest("select") || 
          target.closest(".drag-handle")
        ) {
          return;
        }
        e.stopPropagation();
        onSelect();
        setIsDragging("move");
        dragStartPos.current = {
          x: e.clientX,
          y: e.clientY,
          offsetX: x || 0,
          offsetY: y || 0,
        };
      }}
      onTouchStart={(e) => {
        if (!enabled) return;
        const target = e.target as HTMLElement;
        if (
          target.closest("button") || 
          target.closest("input") || 
          target.closest("textarea") || 
          target.closest("select") || 
          target.closest(".drag-handle")
        ) {
          return;
        }
        e.stopPropagation();
        onSelect();
        if (e.touches.length > 0) {
          setIsDragging("move");
          dragStartPos.current = {
            x: e.touches[0].clientX,
            y: e.touches[0].clientY,
            offsetX: x || 0,
            offsetY: y || 0,
          };
        }
      }}
      style={{
        transform: `translate(${x}px, ${y}px) scale(${scale}) rotate(${rotate}deg)`,
        transformOrigin: "center",
        transition: isDragging ? "none" : "transform 0.15s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
      className={`relative select-none ${
        selected 
          ? "ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-zinc-950 z-35" 
          : "hover:ring-1 hover:ring-blue-400/60 hover:ring-offset-1 dark:hover:ring-offset-zinc-950 cursor-move"
      } transition-shadow duration-150 rounded-xl w-full flex justify-center`}
    >
      {children}

      {/* Alignment snapping guides */}
      {showGuides && isDragging === "move" && Math.abs(x) < 0.1 && (
        <div className="absolute top-[-1000px] bottom-[-1000px] left-1/2 -translate-x-1/2 w-0 border-l-[1.5px] border-dashed border-blue-500/80 z-40 pointer-events-none flex items-center justify-center">
          <div className="absolute top-1/4 -translate-y-1/2 bg-blue-600 dark:bg-blue-500 text-white text-[7px] font-sans font-extrabold px-1.5 py-0.5 rounded shadow shadow-blue-500/30 whitespace-nowrap uppercase tracking-widest border border-blue-450 dark:border-blue-400">
            Center X
          </div>
        </div>
      )}

      {/* Y Axis Original Alignment Guide */}
      {showGuides && isDragging === "move" && Math.abs(y) < 0.1 && (
        <div className="absolute left-[-1000px] right-[-1000px] top-1/2 -translate-y-1/2 h-0 border-t-[1.5px] border-dashed border-emerald-500/80 z-40 pointer-events-none flex items-center justify-center">
          <div className="absolute left-6 -translate-y-1/2 bg-emerald-600 dark:bg-emerald-500 text-white text-[7px] font-sans font-extrabold px-1.5 py-0.5 rounded shadow shadow-emerald-500/30 whitespace-nowrap uppercase tracking-widest border border-emerald-450 dark:border-emerald-400">
            Align Y
          </div>
        </div>
      )}

      {/* Resize & Rotate Handles (only shown when selected) */}
      {selected && (
        <>
          {/* Top Rotation Handler (lollipop handle) */}
          <div className="absolute -top-7 left-1/2 -translate-x-1/2 flex flex-col items-center z-40 drag-handle">
            <button
              type="button"
              onMouseDown={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setIsDragging("rotate");
              }}
              onTouchStart={(e) => {
                e.stopPropagation();
                setIsDragging("rotate");
              }}
              className="w-5 h-5 rounded-full bg-blue-600 hover:bg-blue-500 border-2 border-white dark:border-zinc-950 shadow-md flex items-center justify-center cursor-alias text-white transition-colors"
              title="Putar Elemen"
            >
              <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89M9 11l3-3 3 3" />
              </svg>
            </button>
            <div className="w-[1.5px] h-2 bg-blue-500" />
          </div>

          {/* Bottom-Right Resizing Handler */}
          <button
            type="button"
            onMouseDown={(e) => {
              e.stopPropagation();
              e.preventDefault();
              setIsDragging("resize");
            }}
            onTouchStart={(e) => {
              e.stopPropagation();
              setIsDragging("resize");
            }}
            className="absolute -bottom-2 right-2 w-5.5 h-5.5 rounded-full bg-blue-600 hover:bg-blue-500 border-2 border-white dark:border-zinc-950 shadow-md flex items-center justify-center cursor-se-resize text-white z-40 transition-colors drag-handle"
            title="Ubah Ukuran Elemen"
          >
            <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 20h16M20 4v16M8 12l8 8" />
            </svg>
          </button>

          {/* Scale/Rotate badge indicator */}
          <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 bg-zinc-900/90 text-white text-[8px] font-mono font-bold px-1.5 py-0.5 rounded shadow-sm border border-zinc-800 z-40 whitespace-nowrap flex items-center gap-1.5 pointer-events-auto">
            <span>Skala: {scale.toFixed(1)}x • Putar: {rotate}° • Posisi: ({Math.round(x)}, {Math.round(y)})</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onUpdate(scale, rotate, 0, 0);
              }}
              className="px-1 py-0.25 bg-zinc-800 hover:bg-zinc-700 text-[7px] text-zinc-300 hover:text-white rounded border border-zinc-700 transition-colors drag-handle cursor-pointer"
            >
              Reset
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// Main StartScreen Component
// -------------------------------------------------------------
export default function StartScreen({
  config,
  cameras,
  selectedCameraId,
  setSelectedCameraId,
  onStart,
  customerName,
  setCustomerName,
  customerPhone,
  setCustomerPhone,
  sessionsCount,
  setSessionsCount,
  onEditField,
  onChangeConfig,
  customization,
  onChangeCustomization,
  selectedComponent,
  showGuides = true,
}: StartScreenProps) {
  const canStart = customerName.trim() !== "" && customerPhone.trim() !== "";
  const [showError, setShowError] = useState(false);

  // Manage sessionsCount text input state locally to allow smooth backspacing/typing
  const [localSessions, setLocalSessions] = useState(sessionsCount.toString());

  useEffect(() => {
    setLocalSessions(sessionsCount.toString());
  }, [sessionsCount]);

  // Automatically clear error when form becomes valid
  useEffect(() => {
    if (canStart) setShowError(false);
  }, [canStart]);

  const getLogoSizeClass = (size?: string) => {
    switch (size) {
      case "sm": return "h-10 max-w-[150px]";
      case "lg": return "h-24 max-w-[250px]";
      case "xl": return "h-32 max-w-[300px]";
      case "md":
      default:
        return "h-16 max-w-[200px]";
    }
  };

  const getWelcomeDescSizeClass = (size?: string) => {
    switch (size) {
      case "sm": return "text-[10px]";
      case "lg": return "text-sm";
      case "xl": return "text-base";
      case "md":
      default:
        return "text-xs";
    }
  };

  const getStartButtonSizeClass = (size?: string) => {
    switch (size) {
      case "sm": return "py-2.5 text-[10px] rounded-lg";
      case "lg": return "py-4.5 text-sm rounded-2xl";
      case "md":
      default:
        return "py-3.5 text-xs rounded-xl";
    }
  };

  const getBorderRadiusClass = (radius?: string) => {
    switch (radius) {
      case "none": return "rounded-none";
      case "sm": return "rounded-sm";
      case "md": return "rounded-md";
      case "lg": return "rounded-xl";
      case "xl": return "rounded-2xl";
      case "2xl":
      default:
        return "rounded-[28px]";
    }
  };

  const getShadowClass = (shadow?: string) => {
    switch (shadow) {
      case "none": return "shadow-none";
      case "sm": return "shadow-sm";
      case "md": return "shadow-md";
      case "lg": return "shadow-lg";
      case "xl": return "shadow-xl";
      case "2xl":
      default:
        return "shadow-2xl";
    }
  };

  const getAlignmentClass = (align?: string) => {
    switch (align) {
      case "left": return "text-left items-start";
      case "right": return "text-right items-end";
      case "center":
      default:
        return "text-center items-center";
    }
  };

  const getInputBgClass = (style?: string) => {
    switch (style) {
      case "tinted": return "bg-zinc-50 dark:bg-zinc-900/40";
      case "transparent": return "bg-transparent";
      case "white":
      default:
        return "bg-white dark:bg-zinc-900";
    }
  };

  const isColorLight = (color?: string) => {
    if (!color) return false;
    const hex = color.replace("#", "");
    if (hex.length !== 6) return false;
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 155;
  };

  const adjustColorBrightness = (col: string, amt: number) => {
    let usePound = false;
    if (col[0] === "#") {
      col = col.slice(1);
      usePound = true;
    }
    const num = parseInt(col, 16);
    let r = (num >> 16) + amt;
    if (r > 255) r = 255;
    else if (r < 0) r = 0;
    let b = ((num >> 8) & 0x00FF) + amt;
    if (b > 255) b = 255;
    else if (b < 0) b = 0;
    let g = (num & 0x0000FF) + amt;
    if (g > 255) g = 255;
    else if (g < 0) g = 0;
    return (usePound ? "#" : "") + (g | (b << 8) | (r << 16)).toString(16).padStart(6, "0");
  };

  const getButtonStyle = () => {
    if (!(onEditField || canStart)) return {};
    const styles: React.CSSProperties = {};
    
    if (customization?.cardStyle === "neobrutalist") {
      styles.border = "3px solid #000000";
      styles.borderRadius = "0px";
      styles.boxShadow = "4px 4px 0px 0px #000000";
      styles.backgroundColor = customization?.primaryColor || "#FF8080";
      styles.color = "#000000";
      return styles;
    }
    
    if (customization?.primaryColor) {
      if (customization.buttonStyle === "outline") {
        styles.border = `2px solid ${customization.primaryColor}`;
        styles.color = customization.primaryColor;
        styles.backgroundColor = "transparent";
      } else if (customization.buttonStyle === "gradient") {
        styles.backgroundImage = `linear-gradient(to right, ${customization.primaryColor}, ${adjustColorBrightness(customization.primaryColor, -30)})`;
        styles.color = customization.customButtonTextColor || (isColorLight(customization.primaryColor) ? "#09090b" : "#ffffff");
      } else {
        styles.backgroundColor = customization.primaryColor;
        styles.color = customization.customButtonTextColor || (isColorLight(customization.primaryColor) ? "#09090b" : "#ffffff");
      }
    }
    return styles;
  };

  const getCardStyleClasses = (style?: string) => {
    switch (style) {
      case "glass":
        return "bg-white/25 dark:bg-white/[0.04] backdrop-blur-xl border border-white/25 dark:border-white/10 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.15)] dark:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)] p-8 flex flex-col gap-6 relative animate-fade-in duration-300 transition-all rounded-3xl before:absolute before:inset-1.5 before:rounded-[20px] before:border before:border-white/10 dark:before:border-white/5 before:pointer-events-none ring-1 ring-white/10";
      case "frameless":
        return "bg-[#fdfbf7]/85 dark:bg-[#161513]/85 backdrop-blur-md border border-amber-700/20 shadow-[0_12px_40px_rgba(180,83,9,0.08)] p-8 flex flex-col gap-6 relative animate-fade-in duration-300 transition-all rounded-3xl before:absolute before:inset-1 before:rounded-[22px] before:border-2 before:border-double before:border-amber-700/15 before:pointer-events-none";
      case "neobrutalist":
        return "bg-[#FFF6E9] dark:bg-zinc-900 border-4 border-black dark:border-white shadow-[8px_8px_0px_0px_#000000] dark:shadow-[8px_8px_0px_0px_#ffffff] p-8 flex flex-col gap-6 relative animate-fade-in duration-300 transition-all rounded-none";
      case "classic":
      default:
        return `bg-white/80 dark:bg-zinc-955/75 backdrop-blur-2xl border border-zinc-200/40 dark:border-zinc-800/40 p-8 flex flex-col gap-6 relative animate-fade-in duration-300 transition-all ${
          getBorderRadiusClass(customization?.cardBorderRadius)
        } ${
          getShadowClass(customization?.cardShadow)
        }`;
    }
  };

  const getFormCardClasses = (style?: string) => {
    const basePadding = customization?.formCardPadding === "sm" ? "p-3.5 gap-3" :
                        customization?.formCardPadding === "lg" ? "p-6.5 gap-5" :
                        "p-5 gap-4";
    switch (style) {
      case "glass":
        return `w-full text-left bg-white/15 dark:bg-black/20 backdrop-blur-lg border border-white/15 dark:border-white/5 flex flex-col transition-all duration-300 hover:border-white/35 dark:hover:border-white/15 hover:bg-white/20 dark:hover:bg-black/25 relative group rounded-2xl ${basePadding} shadow-sm`;
      case "frameless":
        return `w-full text-left bg-[#fcf9f2]/60 dark:bg-stone-900/40 backdrop-blur-sm border border-amber-700/10 flex flex-col transition-all duration-200 relative group p-6 gap-4 rounded-2xl`;
      case "neobrutalist":
        return `w-full text-left bg-white dark:bg-zinc-800 border-4 border-black dark:border-white shadow-[6px_6px_0px_0px_#000000] dark:shadow-[6px_6px_0px_0px_#ffffff] flex flex-col transition-all duration-200 relative group rounded-none ${basePadding}`;
      case "classic":
      default:
        return `w-full text-left bg-zinc-50/40 dark:bg-zinc-955/45 backdrop-blur-md border border-zinc-200/30 dark:border-zinc-800/40 flex flex-col transition-all duration-200 relative group ${basePadding} ${
          customization?.cardBorderRadius === "none" ? "rounded-none" :
          customization?.cardBorderRadius === "sm" ? "rounded-sm" :
          customization?.cardBorderRadius === "md" ? "rounded-md" :
          customization?.cardBorderRadius === "lg" ? "rounded-xl" :
          customization?.cardBorderRadius === "xl" ? "rounded-2xl" :
          "rounded-2xl"
        }`;
    }
  };

  const getInputClasses = (style?: string, hasError?: boolean) => {
    const errorBorder = hasError 
      ? "border-red-400 dark:border-red-500/50 focus:border-red-400 focus:ring-red-400/10" 
      : "";
    
    switch (style) {
      case "glass":
        return `border ${
          errorBorder || "border-white/20 dark:border-white/10 focus:border-white/50 dark:focus:border-white/25 focus:ring-amber-500/10 text-zinc-900 dark:text-zinc-100"
        } bg-white/10 dark:bg-black/40 text-xs py-3 pr-3 pl-10.5 rounded-xl w-full focus:outline-none focus:ring-2 transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-500/70 backdrop-blur-sm shadow-inner`;
      case "frameless":
        return `border-b ${
          errorBorder || "border-b-amber-700/35 focus:border-b-amber-600 text-amber-900 dark:text-[#f3efe8]"
        } border-t-0 border-x-0 bg-transparent rounded-none text-xs py-3 pr-3 pl-8 w-full focus:outline-none transition-all placeholder:text-stone-400 dark:placeholder:text-stone-500 font-serif italic`;
      case "neobrutalist":
        return `border-4 ${
          errorBorder || "border-black dark:border-white focus:ring-0 focus:translate-x-[1px] focus:translate-y-[1px]"
        } bg-white dark:bg-zinc-850 text-black dark:text-white font-bold text-xs py-3 pr-3 pl-10.5 rounded-none w-full focus:outline-none transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-550 shadow-[3px_3px_0px_0px_#000000] dark:shadow-[3px_3px_0px_0px_#ffffff]`;
      case "classic":
      default:
        return `border ${
          errorBorder || "border-zinc-200 dark:border-zinc-800 focus:border-zinc-950 dark:focus:border-zinc-100 focus:ring-zinc-900/5 dark:focus:ring-zinc-100/5 text-zinc-800 dark:text-zinc-200"
        } ${getInputBgClass(customization?.inputBgStyle)} text-xs py-3 pr-3 pl-10.5 rounded-xl w-full focus:outline-none focus:ring-2 transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-600`;
    }
  };

  const getIconLeftClass = (style?: string) => {
    return style === "frameless" ? "left-1" : "left-3.5";
  };

  const getButtonClasses = (style?: string) => {
    const baseSize = getStartButtonSizeClass(customization?.startButtonSize);
    
    switch (style) {
      case "glass":
        return `group w-full font-extrabold transition-all duration-300 tracking-wider uppercase flex items-center justify-center gap-2 border border-white/20 shadow-md ${baseSize} ${
          (onEditField || canStart)
            ? "bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-600 hover:via-yellow-500 hover:to-amber-600 text-zinc-950 shadow-[0_4px_20px_-2px_rgba(245,158,11,0.35)] hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
            : "bg-white/5 text-white/30 cursor-not-allowed opacity-60"
        } rounded-full`;
      case "frameless":
        return `group w-full font-serif font-bold transition-all duration-300 tracking-widest uppercase flex items-center justify-center gap-2 ${baseSize} ${
          (onEditField || canStart)
            ? "bg-gradient-to-r from-amber-700 via-rose-700 to-amber-700 hover:from-amber-600 hover:via-rose-600 hover:to-amber-600 text-white shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
            : "bg-stone-100 dark:bg-stone-900 text-stone-400 border border-stone-200/50 cursor-not-allowed opacity-60"
        } rounded-full`;
      case "neobrutalist":
        return `group w-full font-black transition-all duration-100 tracking-wider uppercase flex items-center justify-center gap-2 ${baseSize} ${
          (onEditField || canStart)
            ? "hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#000000] dark:hover:shadow-[2px_2px_0px_0px_#ffffff] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none cursor-pointer"
            : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-655 border-2 border-black cursor-not-allowed opacity-60 animate-none"
        }`;
      case "classic":
      default:
        return `group w-full font-bold transition-all duration-300 tracking-wider uppercase flex items-center justify-center gap-2 border-none shadow-sm ${baseSize} ${
          (onEditField || canStart) && customization?.primaryColor
            ? "hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
            : onEditField || canStart 
              ? "bg-zinc-950 hover:bg-zinc-855 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-955 cursor-pointer hover:-translate-y-0.5 active:translate-y-0" 
              : "bg-zinc-100 dark:bg-zinc-900 text-zinc-400 dark:text-zinc-655 border border-zinc-200/50 dark:border-zinc-850 cursor-not-allowed opacity-60"
        }`;
    }
  };

  return (
    <div className={`max-w-[440px] w-full ${
      getCardStyleClasses(customization?.cardStyle)
    } ${
      getAlignmentClass(customization?.welcomeTextAlignment)
    } ${
      onEditField ? "" : "overflow-hidden"
    }`}>
      {/* Google Fonts Wedding Cursive Import */}
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Alex+Brush&display=swap');
        .font-wedding-script {
          font-family: 'Alex Brush', cursive !important;
        }
      `}} />
      
      {/* Brand Logo & Icon */}
      {!customization?.hideLogo ? (
        <InteractiveWrapper
          id="logo"
          scale={customization?.logoScale ?? 1}
          rotate={customization?.logoRotate ?? 0}
          x={customization?.logoX ?? 0}
          y={customization?.logoY ?? 0}
          onUpdate={(s, r, px, py) => {
            onChangeCustomization?.("logoScale", s);
            onChangeCustomization?.("logoRotate", r);
            onChangeCustomization?.("logoX", px);
            onChangeCustomization?.("logoY", py);
          }}
          onSelect={() => onEditField?.("logo")}
          selected={selectedComponent === "logo"}
          enabled={!!onEditField}
          showGuides={showGuides}
        >
          <div 
            onClick={(e) => {
              if (onEditField) {
                e.stopPropagation();
                onEditField("logo");
                const input = document.getElementById("inline-logo-file-input");
                input?.click();
              }
            }}
            className={`${getLogoSizeClass(customization?.logoSize)} flex items-center justify-center select-none mt-2 transition-all duration-200 ${
              onEditField 
                ? "cursor-pointer relative group rounded-lg" 
                : "pointer-events-none"
            }`}
          >
            {config.logoUrl ? (
              <img src={config.logoUrl} alt="Logo" className="max-h-full max-w-full object-contain" />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/80 flex items-center justify-center text-zinc-900 dark:text-zinc-100 shadow-sm animate-pulse">
                <Camera className="w-6 h-6 text-zinc-655 dark:text-zinc-350" strokeWidth={1.5} />
              </div>
            )}
            {onEditField && (
              <>
                <input
                  type="file"
                  id="inline-logo-file-input"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                      if (ev.target?.result && onChangeConfig) {
                        onChangeConfig("logoUrl", ev.target.result as string);
                      }
                    };
                    reader.readAsDataURL(file);
                  }}
                  onClick={(ev) => ev.stopPropagation()}
                />
                
                {/* Direct size selector toolbar */}
                {onChangeCustomization && (
                  <div 
                    onClick={(e) => e.stopPropagation()}
                    className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-zinc-950/90 text-white text-[9px] font-semibold px-2.5 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-all flex items-center gap-1 shadow-lg border border-zinc-850 z-35 backdrop-blur-md font-sans"
                  >
                    <span className="text-zinc-450 mr-0.5 text-[8px]">Logo:</span>
                    {(["sm", "md", "lg", "xl"] as const).map((sz) => (
                      <button
                        key={sz}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onChangeCustomization("logoSize", sz);
                        }}
                        className={`px-1.5 py-0.5 rounded uppercase text-[7px] font-bold ${
                          (customization?.logoSize || "md") === sz 
                            ? "bg-blue-600 text-white shadow-sm" 
                            : "text-zinc-400 hover:text-zinc-202 hover:bg-zinc-800"
                        }`}
                      >
                        {sz}
                      </button>
                    ))}
                    <div className="w-[1px] h-3 bg-zinc-800 mx-1" />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onChangeCustomization("hideLogo", "true" as any);
                      }}
                      className="p-1 rounded text-red-405 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                      title="Hapus Logo"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </InteractiveWrapper>
      ) : onEditField ? (
        <div 
          onClick={() => onChangeCustomization?.("hideLogo", "false" as any)}
          className="text-[10px] text-zinc-400 dark:text-zinc-550 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg p-3 select-none w-full text-center font-sans font-medium flex items-center justify-center gap-1 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900/30 transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Logo Tersembunyi (Klik untuk menampilkan kembali)</span>
        </div>
      ) : null}

      {/* Header Titles */}
      {!customization?.hideWelcomeText ? (
        <InteractiveWrapper
          id="welcomeText"
          scale={customization?.welcomeTextScale ?? 1}
          rotate={customization?.welcomeTextRotate ?? 0}
          x={customization?.welcomeTextX ?? 0}
          y={customization?.welcomeTextY ?? 0}
          onUpdate={(s, r, px, py) => {
            onChangeCustomization?.("welcomeTextScale", s);
            onChangeCustomization?.("welcomeTextRotate", r);
            onChangeCustomization?.("welcomeTextX", px);
            onChangeCustomization?.("welcomeTextY", py);
          }}
          onSelect={() => onEditField?.("welcomeText")}
          selected={selectedComponent === "welcomeText"}
          enabled={!!onEditField}
          showGuides={showGuides}
        >
          <div 
            onClick={() => onEditField?.("welcomeText")}
            className={`flex flex-col gap-2 select-none transition-all duration-200 w-full relative group ${
              onEditField 
                ? "cursor-pointer rounded-lg p-1.5" 
                : ""
            }`}
          >
            {onEditField && onChangeCustomization ? (
              <input
                type="text"
                value={customization?.formTitle ?? "Registrasi Pengunjung"}
                onChange={(e) => onChangeCustomization("formTitle", e.target.value)}
                onClick={(e) => e.stopPropagation()}
                className={`${
                  customization?.cardStyle === "frameless" 
                    ? "font-wedding-script text-amber-700 dark:text-amber-500" 
                    : "font-black text-zinc-900 dark:text-white"
                } ${
                  customization?.welcomeTextSize === "sm" ? (customization?.cardStyle === "frameless" ? "text-3xl" : "text-xl") :
                  customization?.welcomeTextSize === "lg" ? (customization?.cardStyle === "frameless" ? "text-5xl" : "text-3xl") :
                  customization?.welcomeTextSize === "xl" ? (customization?.cardStyle === "frameless" ? "text-6xl" : "text-4xl") : 
                  (customization?.cardStyle === "frameless" ? "text-4xl" : "text-2xl")
                } tracking-wide leading-relaxed bg-transparent border border-dashed border-zinc-300 dark:border-zinc-800 rounded px-2 py-1 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 w-full ${
                  customization?.welcomeTextAlignment === "left" ? "text-left" :
                  customization?.welcomeTextAlignment === "right" ? "text-right" :
                  "text-center"
                }`}
                style={customization?.customWelcomeTextColor ? { color: customization.customWelcomeTextColor } : undefined}
                placeholder="Edit Judul Form..."
              />
            ) : (
              <h2 
                className={`${
                  customization?.cardStyle === "frameless" 
                    ? "font-wedding-script text-amber-700 dark:text-amber-500" 
                    : "font-black text-zinc-900 dark:text-white"
                } ${
                  customization?.welcomeTextSize === "sm" ? (customization?.cardStyle === "frameless" ? "text-3xl" : "text-xl") :
                  customization?.welcomeTextSize === "lg" ? (customization?.cardStyle === "frameless" ? "text-5xl" : "text-3xl") :
                  customization?.welcomeTextSize === "xl" ? (customization?.cardStyle === "frameless" ? "text-6xl" : "text-4xl") : 
                  (customization?.cardStyle === "frameless" ? "text-4xl" : "text-2xl")
                } tracking-wide leading-relaxed ${
                  customization?.welcomeTextAlignment === "left" ? "text-left" :
                  customization?.welcomeTextAlignment === "right" ? "text-right" :
                  "text-center"
                }`}
                style={customization?.customWelcomeTextColor ? { color: customization.customWelcomeTextColor } : undefined}
              >
                {customization?.formTitle || "Registrasi Pengunjung"}
              </h2>
            )}

            {onEditField && onChangeConfig ? (
              <textarea
                value={config.welcomeText}
                onChange={(e) => onChangeConfig("welcomeText", e.target.value)}
                onClick={(e) => e.stopPropagation()}
                className={`w-full ${
                  customization?.cardStyle === "frameless" 
                    ? "font-serif italic text-amber-900/80 dark:text-stone-300" 
                    : "text-zinc-500 dark:text-zinc-400 font-medium"
                } ${getWelcomeDescSizeClass(customization?.welcomeTextSize)} mt-1.5 leading-relaxed max-w-sm mx-auto bg-zinc-50/50 dark:bg-zinc-900/50 border border-dashed border-zinc-300 dark:border-zinc-800 rounded px-2 py-1.5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none h-14 ${
                  customization?.welcomeTextAlignment === "left" ? "text-left" :
                  customization?.welcomeTextAlignment === "right" ? "text-right" :
                  "text-center"
                }`}
                style={customization?.customWelcomeTextColor ? { color: customization.customWelcomeTextColor } : undefined}
                placeholder="Ketik teks selamat datang disini..."
              />
            ) : (
              <p 
                className={`${
                  customization?.cardStyle === "frameless" 
                    ? "font-serif italic text-amber-900/85 dark:text-stone-300" 
                    : "text-zinc-500 dark:text-zinc-400 font-medium"
                } ${getWelcomeDescSizeClass(customization?.welcomeTextSize)} mt-1.5 leading-relaxed max-w-sm mx-auto ${
                  customization?.welcomeTextAlignment === "left" ? "text-left" :
                  customization?.welcomeTextAlignment === "right" ? "text-right" :
                  "text-center"
                }`}
                style={customization?.customWelcomeTextColor ? { color: customization.customWelcomeTextColor } : undefined}
              >
                {config.welcomeText || (
                  <>
                    Isi data kunjungan di bawah ini untuk memulai sesi foto pada <span className="font-bold text-zinc-850 dark:text-white" style={customization?.primaryColor ? { color: customization.primaryColor } : undefined}>{config.eventName || "Photobooth"}</span>.
                  </>
                )}
              </p>
            )}
            {onEditField && (
              <>
                <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[8px] font-bold px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-all whitespace-nowrap pointer-events-none shadow-md z-30">
                  Klik / Edit Teks Selamat Datang
                </div>
                
                {/* Direct text size selector toolbar */}
                {onChangeCustomization && (
                  <div 
                    onClick={(e) => e.stopPropagation()}
                    className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-zinc-950/90 text-white text-[9px] font-semibold px-2.5 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-all flex items-center gap-1 shadow-lg border border-zinc-850 z-35 backdrop-blur-md"
                  >
                    <span className="text-zinc-450 mr-0.5 text-[8px]">Teks:</span>
                    {(["sm", "md", "lg", "xl"] as const).map((sz) => (
                      <button
                        key={sz}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onChangeCustomization("welcomeTextSize", sz);
                        }}
                        className={`px-1.5 py-0.5 rounded uppercase text-[7px] font-bold ${
                          (customization?.welcomeTextSize || "md") === sz 
                            ? "bg-blue-600 text-white shadow-sm" 
                            : "text-zinc-400 hover:text-zinc-202 hover:bg-zinc-800"
                        }`}
                      >
                        {sz}
                      </button>
                    ))}
                    <div className="w-[1px] h-3 bg-zinc-800 mx-1" />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onChangeCustomization("hideWelcomeText", "true" as any);
                      }}
                      className="p-1 rounded text-red-405 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                      title="Hapus Teks Selamat Datang"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </InteractiveWrapper>
      ) : onEditField ? (
        <div 
          onClick={() => onChangeCustomization?.("hideWelcomeText", "false" as any)}
          className="border border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg p-3 text-[10px] text-zinc-400 dark:text-zinc-550 flex items-center justify-center gap-1.5 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900/30 transition-all w-full select-none font-sans font-medium"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Teks Selamat Datang Tersembunyi (Klik untuk menampilkan kembali)</span>
        </div>
      ) : null}

      {/* Couple Photo for Wedding Theme (Hidden in Royal Wedding cardStyle === "frameless" to avoid duplicates since Groom & Bride cards are on the sides) */}
      {customization?.couplePhotoUrl && customization?.cardStyle !== "frameless" && (
        <InteractiveWrapper
          id="couplePhoto"
          scale={customization?.couplePhotoScale ?? 1}
          rotate={customization?.couplePhotoRotate ?? 0}
          x={customization?.couplePhotoX ?? 0}
          y={customization?.couplePhotoY ?? 0}
          onUpdate={(s, r, px, py) => {
            onChangeCustomization?.("couplePhotoScale", s);
            onChangeCustomization?.("couplePhotoRotate", r);
            onChangeCustomization?.("couplePhotoX", px);
            onChangeCustomization?.("couplePhotoY", py);
          }}
          onSelect={() => onEditField?.("couplePhoto")}
          selected={selectedComponent === "couplePhoto"}
          enabled={!!onEditField}
          showGuides={showGuides}
        >
          <div className="w-full flex justify-center mb-4 mt-2 select-none animate-fade-in">
            {(customization?.cardStyle as any) === "frameless" && (customization?.couplePhotoUrl === "/wedding-couple.png" || !customization?.couplePhotoUrl) ? (
              <div className="w-36 h-36 rounded-full border-4 border-double border-amber-500/30 dark:border-amber-600/30 flex items-center justify-center p-2 bg-[#fdfbf7]/90 dark:bg-stone-900/60 shadow-lg relative">
                <svg viewBox="0 0 200 200" className="w-full h-full text-amber-600 dark:text-amber-500 fill-none stroke-current" strokeWidth="1.5">
                  <path d="M 50,100 C 50,60 70,40 100,40 C 130,40 150,60 150,100 C 150,140 130,160 100,160 C 70,160 50,140 50,100" strokeWidth="1" strokeDasharray="2 2" />
                  <path d="M 100,165 C 65,160 55,130 55,100 C 55,70 65,40 100,35" strokeWidth="2" />
                  <path d="M 55,120 C 45,115 45,125 55,120 Z M 57,100 C 47,95 47,105 57,100 Z M 62,80 C 52,75 52,85 62,80 Z M 72,60 C 65,52 75,50 72,60 Z M 85,45 C 80,35 90,35 85,45 Z" fill="currentColor" />
                  <path d="M 100,165 C 135,160 145,130 145,100 C 145,70 135,40 100,35" strokeWidth="2" />
                  <path d="M 145,120 C 155,115 155,125 145,120 Z M 143,100 C 153,95 153,105 143,100 Z M 138,80 C 148,75 148,85 138,80 Z M 128,60 C 135,52 125,50 128,60 Z M 115,45 C 120,35 110,35 115,45 Z" fill="currentColor" />
                  <text x="100" y="105" textAnchor="middle" className="font-serif text-5xl font-light tracking-wide fill-current" stroke="none" style={{ fontFamily: "'Playfair Display', serif" }}>W</text>
                  <text x="100" y="130" textAnchor="middle" className="font-serif text-[8px] tracking-[0.25em] fill-current opacity-70 font-semibold" stroke="none" style={{ fontFamily: "'Playfair Display', serif" }}>WEDDING</text>
                  <text x="100" y="142" textAnchor="middle" className="font-serif text-[6px] italic tracking-widest fill-current opacity-55" stroke="none" style={{ fontFamily: "'Playfair Display', serif" }}>&amp;</text>
                  <text x="100" y="154" textAnchor="middle" className="font-serif text-[8px] tracking-[0.25em] fill-current opacity-70 font-semibold" stroke="none" style={{ fontFamily: "'Playfair Display', serif" }}>MEMORIES</text>
                  <path d="M 95,165 Q 100,161 105,165 Q 100,172 95,165 Z" fill="currentColor" />
                </svg>
              </div>
            ) : (
              <div className={`relative w-36 h-36 rounded-full border-4 overflow-hidden shadow-md ${
                customization?.cardStyle === "glass" 
                  ? "border-white/20 shadow-[0_8px_32px_0_rgba(31,38,135,0.15)] ring-2 ring-amber-500/20" 
                  : "border-amber-200 dark:border-amber-700/50"
              }`}>
                <img 
                  src={customization.couplePhotoUrl} 
                  alt="Wedding Couple" 
                  className="w-full h-full object-cover" 
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const parent = e.currentTarget.parentElement;
                    if (parent) {
                      parent.classList.add('flex', 'items-center', 'justify-center', 'bg-amber-50');
                      parent.innerHTML = `<svg viewBox="0 0 24 24" class="w-12 h-12 text-amber-500 fill-none stroke-current" stroke-width="1.5"><path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z"/><path d="M20.89 12A8.99 8.99 0 0 0 12 3.12V20.88a8.99 8.99 0 0 0 8.89-8.88z"/></svg>`;
                    }
                  }}
                />
              </div>
            )}
          </div>
        </InteractiveWrapper>
      )}

      {/* Couple Display for Frameless (Royal Wedding) on Mobile/Portrait screens */}
      {customization?.cardStyle === "frameless" && (
        <div className="md:hidden w-full flex flex-col items-center gap-3 mt-2 mb-4 animate-fade-in select-none">
          <div className="flex items-center justify-center gap-6">
            {/* Groom Avatar */}
            <div className="flex flex-col items-center gap-1.5">
              <div className="w-16 h-16 rounded-full border-2 border-amber-700/20 overflow-hidden bg-[#faf7f2] dark:bg-stone-900 flex items-center justify-center shadow">
                {customization?.groomPhotoUrl ? (
                  <img src={customization.groomPhotoUrl} alt="Groom" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-6 h-6 text-amber-800/40" strokeWidth={1.5} />
                )}
              </div>
              <span className="font-wedding-script text-xl text-amber-850 dark:text-amber-500 font-bold max-w-[100px] truncate leading-none">
                {customization?.groomLabel || "Mempelai Pria"}
              </span>
            </div>

            {/* Heart divider */}
            <div className="flex items-center justify-center animate-pulse">
              <span className="text-rose-500 text-2xl">❤️</span>
            </div>

            {/* Bride Avatar */}
            <div className="flex flex-col items-center gap-1.5">
              <div className="w-16 h-16 rounded-full border-2 border-amber-700/20 overflow-hidden bg-[#faf7f2] dark:bg-stone-900 flex items-center justify-center shadow">
                {customization?.bridePhotoUrl ? (
                  <img src={customization.bridePhotoUrl} alt="Bride" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-6 h-6 text-amber-800/40" strokeWidth={1.5} />
                )}
              </div>
              <span className="font-wedding-script text-xl text-amber-850 dark:text-amber-500 font-bold max-w-[100px] truncate leading-none">
                {customization?.brideLabel || "Mempelai Wanita"}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Visitor Registration Form Card */}
      {!customization?.hideFormRegistrasi ? (
        <InteractiveWrapper
          id="formRegistrasi"
          scale={customization?.formScale ?? 1}
          rotate={customization?.formRotate ?? 0}
          x={customization?.formX ?? 0}
          y={customization?.formY ?? 0}
          onUpdate={(s, r, px, py) => {
            onChangeCustomization?.("formScale", s);
            onChangeCustomization?.("formRotate", r);
            onChangeCustomization?.("formX", px);
            onChangeCustomization?.("formY", py);
          }}
          onSelect={() => onEditField?.("formRegistrasi")}
          selected={selectedComponent === "formRegistrasi"}
          enabled={!!onEditField}
          showGuides={showGuides}
        >
          <div 
            onClick={() => onEditField?.("formRegistrasi")}
            className={`${getFormCardClasses(customization?.cardStyle)} ${
              onEditField 
                ? "cursor-pointer" 
                : ""
            }`}
            style={customization?.primaryColor && customization?.cardStyle !== "neobrutalist" && customization?.cardStyle !== "frameless" ? { borderColor: `${customization.primaryColor}30` } : undefined}
          >
            <span className="text-[9px] text-zinc-400 dark:text-zinc-550 font-bold block tracking-widest uppercase flex items-center gap-1.5 select-none w-full">
              <User className="w-3.5 h-3.5" strokeWidth={2} style={customization?.primaryColor ? { color: customization.primaryColor } : undefined} />
              {onEditField && onChangeCustomization ? (
                <input
                  type="text"
                  value={customization?.visitorFormLabel ?? "DATA PENGUNJUNG"}
                  onChange={(e) => onChangeCustomization("visitorFormLabel", e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-transparent border border-dashed border-zinc-300 dark:border-zinc-800 rounded px-1.5 py-0.5 focus:outline-none focus:border-blue-500 text-[9px] font-bold text-zinc-400 dark:text-zinc-550 tracking-widest uppercase w-full max-w-[200px]"
                  placeholder="DATA PENGUNJUNG..."
                />
              ) : (
                <span>{customization?.visitorFormLabel || "DATA PENGUNJUNG"}</span>
              )}
            </span>
            {onEditField && (
              <>
                <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[8px] font-bold px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-all whitespace-nowrap pointer-events-none shadow-md z-30 font-sans">
                  Edit Form (Klik untuk Pengaturan)
                </div>
                
                {/* Direct padding selector toolbar */}
                {onChangeCustomization && (
                  <div 
                    onClick={(e) => e.stopPropagation()}
                    className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-zinc-950/90 text-white text-[9px] font-semibold px-2.5 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-all flex items-center gap-1 shadow-lg border border-zinc-850 z-35 backdrop-blur-md"
                  >
                    <span className="text-zinc-450 mr-0.5 text-[8px]">Padding:</span>
                    {(["sm", "md", "lg"] as const).map((sz) => (
                      <button
                        key={sz}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onChangeCustomization("formCardPadding", sz);
                        }}
                        className={`px-1.5 py-0.5 rounded uppercase text-[7px] font-bold ${
                          (customization?.formCardPadding || "md") === sz 
                            ? "bg-blue-600 text-white shadow-sm" 
                            : "text-zinc-400 hover:text-zinc-202 hover:bg-zinc-800"
                        }`}
                      >
                        {sz === "sm" ? "Ringkas" : sz === "md" ? "Standar" : "Longgar"}
                      </button>
                    ))}
                    <div className="w-[1px] h-3 bg-zinc-800 mx-1" />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onChangeCustomization("hideFormRegistrasi", "true" as any);
                      }}
                      className="p-1 rounded text-red-405 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                      title="Hapus Form Registrasi"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </>
            )}
          
          {/* Nama Panggilan */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-zinc-655 dark:text-zinc-400 font-bold uppercase tracking-wider select-none flex items-center justify-between">
              {onEditField && onChangeCustomization ? (
                <input
                  type="text"
                  value={customization?.customerNameLabel ?? "Nama Panggilan"}
                  onChange={(e) => onChangeCustomization("customerNameLabel", e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-transparent border border-dashed border-zinc-300 dark:border-zinc-800 rounded px-1.5 py-0.5 focus:outline-none focus:border-blue-500 text-[10px] text-zinc-650 dark:text-zinc-400 font-bold uppercase tracking-wider w-full max-w-[200px]"
                  placeholder="Nama Panggilan..."
                />
              ) : (
                <span>{customization?.customerNameLabel || "Nama Panggilan"}</span>
              )}
            </label>
            <div className="relative flex items-center">
              <User 
                className={`w-4 h-4 text-zinc-400 dark:text-zinc-550 absolute ${getIconLeftClass(customization?.cardStyle)} pointer-events-none transition-colors`} 
                style={customization?.primaryColor ? { color: customization.primaryColor } : undefined} 
                strokeWidth={1.5} 
              />
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Nama lengkap atau panggilan..."
                className={getInputClasses(customization?.cardStyle, showError && customerName.trim() === "")}
                style={
                  customization?.primaryColor && !(showError && customerName.trim() === "") && customization?.cardStyle !== "neobrutalist" && customization?.cardStyle !== "frameless"
                    ? { borderColor: `${customization.primaryColor}30` }
                    : undefined
                }
              />
            </div>
          </div>

          {/* Nomor WhatsApp */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-zinc-655 dark:text-zinc-400 font-bold uppercase tracking-wider select-none flex items-center justify-between">
              {onEditField && onChangeCustomization ? (
                <input
                  type="text"
                  value={customization?.customerPhoneLabel ?? "Nomor WhatsApp"}
                  onChange={(e) => onChangeCustomization("customerPhoneLabel", e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-transparent border border-dashed border-zinc-300 dark:border-zinc-800 rounded px-1.5 py-0.5 focus:outline-none focus:border-blue-500 text-[10px] text-zinc-650 dark:text-zinc-400 font-bold uppercase tracking-wider w-full max-w-[200px]"
                  placeholder="Nomor WhatsApp..."
                />
              ) : (
                <span>{customization?.customerPhoneLabel || "Nomor WhatsApp"}</span>
              )}
            </label>
            <div className="relative flex items-center">
              <Phone 
                className={`w-4 h-4 text-zinc-400 dark:text-zinc-550 absolute ${getIconLeftClass(customization?.cardStyle)} pointer-events-none transition-colors`} 
                style={customization?.primaryColor ? { color: customization.primaryColor } : undefined} 
                strokeWidth={1.5} 
              />
              <input
                type="tel"
                required
                value={customerPhone}
                onChange={(e) => {
                  const numericValue = e.target.value.replace(/[^0-9]/g, '');
                  setCustomerPhone(numericValue);
                }}
                placeholder="Contoh: 081234567890"
                className={getInputClasses(customization?.cardStyle, showError && customerPhone.trim() === "")}
                style={
                  customization?.primaryColor && !(showError && customerPhone.trim() === "") && customization?.cardStyle !== "neobrutalist" && customization?.cardStyle !== "frameless"
                    ? { borderColor: `${customization.primaryColor}30` }
                    : undefined
                }
              />
            </div>
          </div>

          {/* Jumlah Sesi */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-zinc-655 dark:text-zinc-400 font-bold uppercase tracking-wider select-none flex items-center justify-between">
              {onEditField && onChangeCustomization ? (
                <input
                  type="text"
                  value={customization?.sessionsCountLabel ?? "Jumlah Sesi Foto"}
                  onChange={(e) => onChangeCustomization("sessionsCountLabel", e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-transparent border border-dashed border-zinc-300 dark:border-zinc-800 rounded px-1.5 py-0.5 focus:outline-none focus:border-blue-500 text-[10px] text-zinc-650 dark:text-zinc-400 font-bold uppercase tracking-wider w-full max-w-[200px]"
                  placeholder="Jumlah Sesi Foto..."
                />
              ) : (
                <span>{customization?.sessionsCountLabel || "Jumlah Sesi Foto"}</span>
              )}
            </label>
            <div className="relative flex items-center">
              <Layers 
                className={`w-4 h-4 text-zinc-400 dark:text-zinc-555 absolute ${getIconLeftClass(customization?.cardStyle)} pointer-events-none transition-colors`} 
                style={customization?.primaryColor ? { color: customization.primaryColor } : undefined} 
                strokeWidth={1.5} 
              />
              <input
                type="text"
                pattern="[0-9]*"
                inputMode="numeric"
                required
                value={localSessions}
                onChange={(e) => {
                  const rawVal = e.target.value;
                  const cleanVal = rawVal.replace(/[^0-9]/g, '');
                  setLocalSessions(cleanVal);
                  
                  if (cleanVal === '') {
                    setSessionsCount("");
                  } else {
                    const val = Number(cleanVal);
                    if (val > 0) {
                      setSessionsCount(val);
                    }
                  }
                }}
                onBlur={() => {
                  if (localSessions !== "") {
                    const val = Number(localSessions);
                    if (val <= 0) {
                      setLocalSessions("");
                      setSessionsCount("");
                    } else {
                      setLocalSessions(val.toString());
                      setSessionsCount(val);
                    }
                  }
                }}
                placeholder="1"
                className={getInputClasses(customization?.cardStyle, false)}
                style={
                  customization?.primaryColor && customization?.cardStyle !== "neobrutalist" && customization?.cardStyle !== "frameless"
                    ? { borderColor: `${customization.primaryColor}30` }
                    : undefined
                }
              />
            </div>
          </div>
        </div>
        </InteractiveWrapper>
      ) : onEditField ? (
        <div 
          onClick={() => onChangeCustomization?.("hideFormRegistrasi", "false" as any)}
          className="border border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg p-3 text-[10px] text-zinc-400 dark:text-zinc-555 flex items-center justify-center gap-1.5 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900/30 transition-all w-full select-none font-sans font-medium"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Formulir Registrasi Tersembunyi (Klik untuk menampilkan kembali)</span>
        </div>
      ) : null}

      {/* Custom Information Card */}
      {customization?.showCustomCard ? (
        <InteractiveWrapper
          id="customCard"
          scale={customization?.customCardScale ?? 1}
          rotate={customization?.customCardRotate ?? 0}
          x={customization?.customCardX ?? 0}
          y={customization?.customCardY ?? 0}
          onUpdate={(s, r, px, py) => {
            onChangeCustomization?.("customCardScale", s);
            onChangeCustomization?.("customCardRotate", r);
            onChangeCustomization?.("customCardX", px);
            onChangeCustomization?.("customCardY", py);
          }}
          onSelect={() => onEditField?.("customCard")}
          selected={selectedComponent === "customCard"}
          enabled={!!onEditField}
          showGuides={showGuides}
        >
          <div 
            onClick={() => onEditField?.("customCard")}
            className={`w-full text-left bg-zinc-50/40 dark:bg-zinc-955/45 backdrop-blur-md border border-zinc-200/30 dark:border-zinc-800/40 p-5 flex flex-col gap-2.5 transition-all duration-200 relative group ${
              getBorderRadiusClass(customization?.cardBorderRadius)
            } ${
              onEditField 
                ? "cursor-pointer" 
                : ""
            }`}
            style={customization?.primaryColor ? { borderColor: `${customization.primaryColor}30` } : undefined}
          >
            <div className="flex items-center justify-between w-full">
              <h4 className="text-[10px] font-extrabold text-zinc-900 dark:text-white uppercase tracking-wider">
                {customization.customCardTitle || "Info Kustom"}
              </h4>
              {onEditField && onChangeCustomization && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onChangeCustomization("showCustomCard", "false" as any);
                  }}
                  className="p-1 rounded text-red-405 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                  title="Sembunyikan Kartu"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-relaxed font-medium">
              {customization.customCardContent || "Silakan ketik petunjuk atau informasi tambahan di sini."}
            </p>
            {onEditField && (
              <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[8px] font-bold px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-all whitespace-nowrap pointer-events-none shadow-md z-30 font-sans">
                Edit Kartu Kustom (Klik untuk Pengaturan)
              </div>
            )}
          </div>
        </InteractiveWrapper>
      ) : onEditField ? (
        <div 
          onClick={() => onChangeCustomization?.("showCustomCard", "true" as any)}
          className="border border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg p-3 text-[10px] text-zinc-400 dark:text-zinc-555 flex items-center justify-center gap-1.5 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900/30 transition-all w-full select-none font-sans font-medium"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Tambah Kartu Kustom (Klik untuk menampilkan)</span>
        </div>
      ) : null}

      {/* Camera Selection */}
      {cameras.length > 1 && (
        <div className="w-full text-left font-sans animate-fade-in">
          <label className="text-[9px] text-zinc-400 dark:text-zinc-555 font-bold block mb-1.5 tracking-wider uppercase select-none flex items-center gap-1.5">
            <Settings className="w-3 h-3" style={customization?.primaryColor ? { color: customization.primaryColor } : undefined} />
            {onEditField && onChangeCustomization ? (
              <input
                type="text"
                value={customization?.cameraSelectLabel ?? "PILIH KAMERA AKTIF"}
                onChange={(e) => onChangeCustomization("cameraSelectLabel", e.target.value)}
                onClick={(e) => e.stopPropagation()}
                className="bg-transparent border border-dashed border-zinc-300 dark:border-zinc-800 rounded px-1.5 py-0.5 focus:outline-none focus:border-blue-500 text-[9px] text-zinc-400 dark:text-zinc-555 font-bold tracking-wider uppercase w-full max-w-[200px]"
                placeholder="PILIH KAMERA AKTIF..."
              />
            ) : (
              <span>{customization?.cameraSelectLabel || "PILIH KAMERA AKTIF"}</span>
            )}
          </label>
          <select
            value={selectedCameraId}
            onChange={(e) => setSelectedCameraId(e.target.value)}
            className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 text-xs text-zinc-700 dark:text-zinc-300 focus:outline-none focus:border-zinc-950 dark:focus:border-zinc-100 focus:ring-2 focus:ring-zinc-900/5 dark:focus:ring-zinc-100/5 font-sans cursor-pointer transition-all"
            style={
              customization?.primaryColor
                ? { borderColor: `${customization.primaryColor}30` }
                : undefined
            }
          >
            {cameras.map((cam) => (
              <option key={cam.deviceId} value={cam.deviceId}>
                {cam.label || `Kamera ${cam.deviceId.slice(0, 5)}`}
              </option>
            ))}
              </select>
        </div>
      )}

      {/* Start Button */}
      {!customization?.hideStartBtn ? (
        <InteractiveWrapper
          id="startBtn"
          scale={customization?.startBtnScale ?? 1}
          rotate={customization?.startBtnRotate ?? 0}
          x={customization?.startBtnX ?? 0}
          y={customization?.startBtnY ?? 0}
          onUpdate={(s, r, px, py) => {
            onChangeCustomization?.("startBtnScale", s);
            onChangeCustomization?.("startBtnRotate", r);
            onChangeCustomization?.("startBtnX", px);
            onChangeCustomization?.("startBtnY", py);
          }}
          onSelect={() => onEditField?.("startBtn")}
          selected={selectedComponent === "startBtn"}
          enabled={!!onEditField}
          showGuides={showGuides}
        >
          <div 
            onClick={() => onEditField?.("startBtn")}
            className="w-full flex flex-col gap-2 transition-all duration-205 relative group"
          >
            <button
              onClick={(e) => {
                if (onEditField) {
                  e.stopPropagation();
                  onEditField("startBtn");
                } else {
                  if (!canStart) {
                    setShowError(true);
                    return;
                  }
                  onStart();
                }
              }}
              disabled={!onEditField && !canStart}
              style={getButtonStyle()}
              className={getButtonClasses(customization?.cardStyle)}
            >
              {onEditField && onChangeCustomization ? (
                <input
                  type="text"
                  value={customization?.startButtonText ?? "Mulai Sesi Foto"}
                  onChange={(e) => onChangeCustomization("startButtonText", e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-transparent border border-dashed border-zinc-500 dark:border-zinc-400 rounded px-1.5 py-0.5 focus:outline-none text-center font-bold tracking-wider uppercase w-full animate-none text-current"
                  placeholder="Edit Tombol Mulai..."
                />
              ) : (
                <span>{customization?.startButtonText || "Mulai Sesi Foto"}</span>
              )}
              <ArrowRight 
                className={`w-4 h-4 transition-transform duration-300 ${onEditField || canStart ? "group-hover:translate-x-1" : ""}`} 
                strokeWidth={2} 
              />
            </button>
            
            {/* Direct button size selector toolbar */}
            {onEditField && onChangeCustomization && (
              <div 
                onClick={(e) => e.stopPropagation()}
                className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-zinc-955/90 text-white text-[9px] font-semibold px-2.5 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-all flex items-center gap-1 shadow-lg border border-zinc-850 z-35 backdrop-blur-md"
              >
                <span className="text-zinc-450 mr-0.5 text-[8px]">Tombol:</span>
                {(["sm", "md", "lg"] as const).map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onChangeCustomization("startButtonSize", sz);
                    }}
                    className={`px-1.5 py-0.5 rounded uppercase text-[7px] font-bold ${
                      (customization?.startButtonSize || "md") === sz 
                        ? "bg-blue-600 text-white shadow-sm" 
                        : "text-zinc-400 hover:text-zinc-202 hover:bg-zinc-800"
                    }`}
                  >
                    {sz === "sm" ? "Kecil" : sz === "md" ? "Sedang" : "Besar"}
                  </button>
                ))}
                <div className="w-[1px] h-3 bg-zinc-800 mx-1" />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onChangeCustomization("hideStartBtn", "true" as any);
                  }}
                  className="p-1 rounded text-red-405 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                  title="Hapus Tombol"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        </InteractiveWrapper>
      ) : onEditField ? (
        <div 
          onClick={() => onChangeCustomization?.("hideStartBtn", "false" as any)}
          className="border border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg p-3 text-[10px] text-zinc-400 dark:text-zinc-555 flex items-center justify-center gap-1.5 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900/30 transition-all w-full select-none font-sans font-medium"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Tombol Mulai Tersembunyi (Klik untuk menampilkan kembali)</span>
        </div>
      ) : null}

      {/* Footer Copywriting */}
      {!customization?.hideFooterText ? (
        <InteractiveWrapper
          id="footerText"
          scale={customization?.footerScale ?? 1}
          rotate={customization?.footerRotate ?? 0}
          x={customization?.footerX ?? 0}
          y={customization?.footerY ?? 0}
          onUpdate={(s, r, px, py) => {
            onChangeCustomization?.("footerScale", s);
            onChangeCustomization?.("footerRotate", r);
            onChangeCustomization?.("footerX", px);
            onChangeCustomization?.("footerY", py);
          }}
          onSelect={() => onEditField?.("footerText")}
          selected={selectedComponent === "footerText"}
          enabled={!!onEditField}
          showGuides={showGuides}
        >
          {onEditField && onChangeConfig ? (
            <div 
              onClick={() => onEditField?.("footerText")}
              className="cursor-pointer relative group rounded px-1.5 py-0.5 w-full flex justify-center mt-1"
            >
              <input
                type="text"
                value={config.footerText}
                onChange={(e) => onChangeConfig("footerText", e.target.value)}
                onClick={(e) => e.stopPropagation()}
                className="text-[9px] text-zinc-655 dark:text-zinc-400 select-none font-semibold bg-zinc-50/50 dark:bg-[#121214] border border-dashed border-zinc-300 dark:border-zinc-800 rounded px-2 py-0.5 text-center focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 w-full max-w-xs"
                placeholder="Tulis copyright / footer disini..."
              />
              
              {/* Direct footer toolbar */}
              {onChangeCustomization && (
                <div 
                  onClick={(e) => e.stopPropagation()}
                  className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-zinc-955/90 text-white text-[9px] font-semibold px-2.5 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-all flex items-center gap-1 shadow-lg border border-zinc-850 z-35 backdrop-blur-md font-sans"
                >
                  <span className="text-zinc-450 mr-0.5 text-[8px]">Footer:</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onChangeCustomization("hideFooterText", "true" as any);
                    }}
                    className="p-1 rounded text-red-405 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                    title="Hapus Footer"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <p className="text-[9px] text-zinc-405 dark:text-zinc-555 select-none font-semibold mt-1">
              {config.footerText || "© 2026 Glowbooth Studio. All rights reserved."}
            </p>
          )}
        </InteractiveWrapper>
      ) : onEditField ? (
        <div 
          onClick={() => onChangeCustomization?.("hideFooterText", "false" as any)}
          className="border border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg p-3 text-[10px] text-zinc-400 dark:text-zinc-555 flex items-center justify-center gap-1.5 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900/30 transition-all w-full select-none font-sans font-medium"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Teks Kaki (Footer) Tersembunyi (Klik untuk menampilkan kembali)</span>
        </div>
      ) : null}
    </div>
  );
}