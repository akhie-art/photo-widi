"use client";

import React from "react";
import { Camera, RefreshCw, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EventConfig } from "../../hooks/usePhotoboothStore";

interface CaptureScreenProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  isCapturing: boolean;
  capturedPhotos: string[];
  activeLayout: string;
  activeFilter: any;
  activeFiltersList: any[];
  activeLayoutsList: any[];
  countdown: number | null;
  poseAlert: string | null;
  isMirrored: boolean;
  setIsMirrored: (m: boolean) => void;
  startCaptureSequence: () => void;
  onCancel: () => void;
  layoutsCount: number;
  config: EventConfig;
  activeFrameId: string;
  countdownDuration: number;
  setCountdownDuration: (duration: number) => void;
  onRetakeSlot?: (index: number) => void;
  onComplete?: () => void;
  currentCaptureNum: number;
  customerName: string;
  customerPhone: string;
  currentSessionNum: number;
  sessionsCount: number;
}

export default function CaptureScreen({
  videoRef,
  isCapturing,
  capturedPhotos,
  activeLayout,
  activeFilter,
  countdown,
  poseAlert,
  isMirrored,
  setIsMirrored,
  startCaptureSequence,
  onCancel,
  layoutsCount,
  config,
  activeFrameId,
  countdownDuration,
  setCountdownDuration,
  onRetakeSlot,
  onComplete,
  currentCaptureNum,
  customerName,
  customerPhone,
  currentSessionNum,
  sessionsCount,
}: CaptureScreenProps) {

  // ─── Layout parameters mirroring canvasRenderer.ts ───────────────────────────
  const STRIP_W = 500;
  const STRIP_PADDING = 25;
  const STRIP_PHOTO_W = STRIP_W - STRIP_PADDING * 2; // 450
  const STRIP_PHOTO_H = STRIP_PHOTO_W * 0.75;        // 337.5
  const STRIP_GAP = 15;
  const STRIP_FOOTER_H = 110;

  const activeTemplate =
    config.presetTemplates?.find((p) => p.id === activeFrameId) ||
    config.presetTemplates?.find((p) => p.id === config.activePresetTemplateId) ||
    config.presetTemplates?.[0];

  const isFilmFrame =
    activeTemplate?.id === "preset_retro_scrapbook" ||
    !!activeTemplate?.imageOverlay?.includes("film_frame");

  const isRedVintage =
    !!activeTemplate?.imageOverlay?.includes("red_vintage");

  const frameStyle = activeTemplate?.frameStyle || config.frameStyle || "neon";
  const frameText = activeTemplate?.frameText || config.frameText || "";

  // ─── Canvas dimensions ────────────────────────────────────────────────────────
  const getLayoutDimensions = (): { w: number; h: number } => {
    if (activeLayout === "strip") {
      if (isFilmFrame) return { w: 500, h: 1202.5 };
      const h =
        STRIP_PADDING +
        layoutsCount * STRIP_PHOTO_H +
        (layoutsCount - 1) * STRIP_GAP +
        STRIP_FOOTER_H +
        STRIP_PADDING;
      return { w: STRIP_W, h };
    } else if (activeLayout === "grid") {
      const gW = 800, gPad = 40, gGap = 25;
      const gPhW = (gW - gPad * 2 - gGap) / 2;
      const h = gPad + 2 * gPhW + gGap + 130 + gPad;
      return { w: gW, h };
    } else {
      // polaroid
      const pW = 600, pPad = 35;
      const pPhW = pW - pPad * 2;
      const h = pPad + pPhW + 140 + pPad;
      return { w: pW, h };
    }
  };

  // ─── Per-slot position percentages ────────────────────────────────────────────
  const getSlotPositions = (): Array<{
    left: string;
    top: string;
    width: string;
    height: string;
  }> => {
    if (activeTemplate?.customSlots && activeTemplate.customSlots.length > 0) {
      return activeTemplate.customSlots.map(s => ({
        left:   `${s.xPct}%`,
        top:    `${s.yPct}%`,
        width:  `${s.widthPct}%`,
        height: `${s.heightPct}%`,
      }));
    }

    const { w: cW, h: cH } = getLayoutDimensions();

    if (activeLayout === "strip") {
      if (isFilmFrame) {
        return [
          { left: "13%", width: "74%", top: "4%",    height: "29%" },
          { left: "13%", width: "74%", top: "35.5%", height: "29%" },
          { left: "13%", width: "74%", top: "67%",   height: "29%" },
        ];
      }

      if (isRedVintage) {
        const slotTopPx = (13.96 / 100) * cH;
        const slotHPx   = (69.93 / 100) * cH;
        const phH = (slotHPx - (layoutsCount - 1) * STRIP_GAP) / layoutsCount;
        return Array.from({ length: layoutsCount }).map((_, i) => {
          const topPx = slotTopPx + i * (phH + STRIP_GAP);
          return {
            left: "14.84%",
            width: "68.07%",
            top: `${(topPx / cH) * 100}%`,
            height: `${(phH / cH) * 100}%`,
          };
        });
      }

      const isFilmstripStyle =
        frameStyle === "filmstrip" || activeTemplate?.id === "frame_filmstrip";
      const left  = isFilmstripStyle ? "7%"  : "5%";
      const width = isFilmstripStyle ? "86%" : "90%";

      return Array.from({ length: layoutsCount }).map((_, i) => {
        const topPx = STRIP_PADDING + i * (STRIP_PHOTO_H + STRIP_GAP);
        return {
          left,
          width,
          top:    `${(topPx / cH) * 100}%`,
          height: `${(STRIP_PHOTO_H / cH) * 100}%`,
        };
      });
    } else if (activeLayout === "grid") {
      const gW = 800, gPad = 40, gGap = 25;
      const gPhW = (gW - gPad * 2 - gGap) / 2;
      const { h: cH2 } = getLayoutDimensions();
      return [
        { x: gPad,         y: gPad },
        { x: gPad + gPhW + gGap, y: gPad },
        { x: gPad,         y: gPad + gPhW + gGap },
        { x: gPad + gPhW + gGap, y: gPad + gPhW + gGap },
      ].map(({ x, y }) => ({
        left:   `${(x / gW)   * 100}%`,
        top:    `${(y / cH2)  * 100}%`,
        width:  `${(gPhW / gW) * 100}%`,
        height: `${(gPhW / cH2) * 100}%`,
      }));
    } else {
      // polaroid
      const pW = 600, pPad = 35;
      const pPhW = pW - pPad * 2;
      const { h: cH3 } = getLayoutDimensions();
      return [
        {
          left:   `${(pPad  / pW)  * 100}%`,
          top:    `${(pPad  / cH3) * 100}%`,
          width:  `${(pPhW  / pW)  * 100}%`,
          height: `${(pPhW  / cH3) * 100}%`,
        },
      ];
    }
  };

  // ─── Style helpers ────────────────────────────────────────────────────────────
  const getBackgroundStyle = (): React.CSSProperties => {
    if (frameStyle === "neon")          return { background: "linear-gradient(to bottom, #0d0a16, #160f2c)" };
    if (frameStyle === "classic-white") return { backgroundColor: "#ffffff" };
    if (frameStyle === "classic-black") return { backgroundColor: "#09090b" };
    if (frameStyle === "pastel")        return { background: "linear-gradient(135deg, #fef2f2, #faf5ff, #eff6ff)" };
    if (frameStyle === "filmstrip")     return { backgroundColor: "#141416" };
    return { backgroundColor: "#18181b" };
  };

  const getSlotBorderStyle = (index: number): React.CSSProperties => {
    if (frameStyle === "neon") {
      const c = index % 2 === 0 ? "#3b82f6" : "#ec4899";
      return { border: `2px solid ${c}`, boxShadow: `0 0 10px ${c}`, borderRadius: "8px" };
    }
    if (frameStyle === "classic-white") return { border: "1px solid #e4e4e7", borderRadius: "2px" };
    if (frameStyle === "classic-black") return { border: "2px solid #27272a", borderRadius: "2px" };
    if (frameStyle === "pastel")        return { border: "3px solid #ffffff", borderRadius: "20px", boxShadow: "0 4px 12px rgba(0,0,0,0.03)" };
    if (frameStyle === "filmstrip")     return { border: "1px solid #27272a" };
    return { border: "1px solid #3f3f46" };
  };

  const getFooterHeight = () => {
    if (activeLayout === "strip")   return { fH: STRIP_FOOTER_H, fPad: STRIP_PADDING };
    if (activeLayout === "grid")    return { fH: 130, fPad: 40 };
    return { fH: 140, fPad: 35 };
  };

  // ─── Footer text element ──────────────────────────────────────────────────────
  const FooterText = () => {
    const { w: cW, h: cH } = getLayoutDimensions();
    const { fH, fPad }      = getFooterHeight();

    const style: React.CSSProperties = {
      position:       "absolute",
      bottom:         `${(fPad / cH) * 100}%`,
      left:           0,
      right:          0,
      height:         `${(fH / cH) * 100}%`,
      display:        "flex",
      flexDirection:  "column",
      alignItems:     "center",
      justifyContent: "center",
      padding:        "0 8%",
      pointerEvents:  "none",
    };

    const isLightFrame = frameStyle === "classic-white" || frameStyle === "pastel";

    if (frameStyle === "neon") return (
      <div style={style} className="font-sans text-center">
        <div style={{ fontSize: "4.5cqw", fontWeight: 900, textShadow: "0 0 5px #3b82f6, 0 0 10px #3b82f6", color: "#fff", lineHeight: 1.1, letterSpacing: "-0.03em" }}>
          {config.eventName.toUpperCase()}
        </div>
        <div style={{ fontSize: "3.2cqw", color: "#f472b6", fontStyle: "italic", textShadow: "0 0 4px #ec4899", fontWeight: 650, lineHeight: 1.2, marginTop: "0.3em" }}>
          {frameText}
        </div>
        <div style={{ fontSize: "2.1cqw", color: "#a1a1aa", lineHeight: 1.2, marginTop: "0.45em", letterSpacing: "0.05em", fontFamily: "monospace" }}>
          {config.location.toUpperCase()}  •  {config.date}
        </div>
      </div>
    );

    if (frameStyle === "classic-white") return (
      <div style={style} className="font-serif text-center">
        <div style={{ fontSize: "4.2cqw", fontWeight: 700, color: "#09090b", lineHeight: 1.2, letterSpacing: "-0.02em" }}>{config.eventName}</div>
        <div style={{ fontSize: "2.8cqw", color: "#52525b", lineHeight: 1.2, marginTop: "0.3em", fontStyle: "italic" }}>{frameText}</div>
        <div style={{ fontSize: "2.2cqw", color: "#71717a", lineHeight: 1.2, marginTop: "0.3em", letterSpacing: "0.02em", fontFamily: "sans-serif" }}>{config.location} • {config.date}</div>
      </div>
    );

    if (frameStyle === "classic-black") return (
      <div style={style} className="font-serif text-center">
        <div style={{ fontSize: "4.2cqw", fontWeight: 700, color: "#ffffff", lineHeight: 1.2, letterSpacing: "-0.02em" }}>{config.eventName}</div>
        <div style={{ fontSize: "2.8cqw", color: "#d4d4d8", lineHeight: 1.2, marginTop: "0.3em", fontStyle: "italic" }}>{frameText}</div>
        <div style={{ fontSize: "2.2cqw", color: "#71717a", lineHeight: 1.2, marginTop: "0.3em", letterSpacing: "0.02em", fontFamily: "sans-serif" }}>{config.location} • {config.date}</div>
      </div>
    );

    if (frameStyle === "pastel") return (
      <div style={style} className="text-center font-sans">
        <div style={{ fontSize: "4.5cqw", fontWeight: 800, color: "#312e81", lineHeight: 1.1 }}>{config.eventName}</div>
        <div style={{ fontSize: "3.2cqw", fontWeight: 700, color: "#be185d", lineHeight: 1.2, marginTop: "0.25em" }}>{frameText}</div>
        <div style={{ fontSize: "2.3cqw", color: "#4338ca", fontWeight: 500, lineHeight: 1.2, marginTop: "0.3em" }}>{config.location}  •  {config.date}</div>
      </div>
    );

    if (frameStyle === "filmstrip") return (
      <div style={style} className="font-mono text-center">
        <div style={{ fontSize: "4cqw", fontWeight: 750, color: "#f4f4f5", lineHeight: 1.1 }}>[{config.eventName.toUpperCase()}]</div>
        <div style={{ fontSize: "2.8cqw", color: "#a1a1aa", lineHeight: 1.2, marginTop: "0.3em" }}>// {frameText}</div>
        <div style={{ fontSize: "2.1cqw", color: "#52525b", lineHeight: 1.2, marginTop: "0.4em" }}>LOC: {config.location.toUpperCase()} // DATE: {config.date}</div>
      </div>
    );

    return null;
  };

  // ─── Computed values ──────────────────────────────────────────────────────────
  const { w: currentW, h: currentH } = getLayoutDimensions();
  const slots = getSlotPositions();
  
  // Find the first slot that does not have a photo yet (falsy value)
  let nextEmptyIndex = -1;
  for (let i = 0; i < layoutsCount; i++) {
    if (!capturedPhotos[i]) {
      nextEmptyIndex = i;
      break;
    }
  }

  const activeSlotIndex = isCapturing && currentCaptureNum > 0
    ? currentCaptureNum - 1
    : (nextEmptyIndex !== -1 ? nextEmptyIndex : Math.min(capturedPhotos.length, slots.length - 1));
  const activeSlot = slots[activeSlotIndex];

  const filledPhotosCount = Array.from({ length: layoutsCount }).filter((_, idx) => !!capturedPhotos[idx]).length;

  return (
    // Border dan shadow pembatas luar dihapus agar lebih bersih
    <div className="max-w-2xl mx-auto w-full bg-white dark:bg-[#121214] rounded-3xl p-6 flex flex-col gap-6 animate-fade-in duration-300 transition-colors">
      
      {/* ── Left Workspace: Studio Kamera (Camera Station) ── */}
      <div className="w-full flex flex-col items-center justify-between gap-5 min-h-[520px]">
        
        {/* Workspace HUD Header - border bawah dihapus */}
        <div className="w-full flex items-center justify-between pb-3 shrink-0 select-none">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-zinc-450 dark:text-zinc-500 font-mono uppercase tracking-wider font-bold">
                Timer:
              </span>
              <div className="bg-zinc-150/40 dark:bg-zinc-900/60 p-0.5 rounded-xl flex gap-1 border border-zinc-200/35 dark:border-zinc-800/30">
                {[3, 10, 15].map((sec) => {
                  const isActive = countdownDuration === sec;
                  return (
                    <button
                      key={sec}
                      disabled={isCapturing}
                      onClick={() => setCountdownDuration(sec)}
                      className={`px-2.5 py-1 rounded-lg text-[9px] font-mono font-bold transition-all cursor-pointer disabled:opacity-50 ${
                        isActive
                          ? "bg-white dark:bg-zinc-800 text-blue-650 dark:text-blue-400 shadow-sm border border-zinc-200/80 dark:border-zinc-700/60"
                          : "text-zinc-500 dark:text-zinc-450 hover:text-zinc-850 dark:hover:text-zinc-200"
                      }`}
                    >
                      {sec}s
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sesi Badge dipindahkan ke sebelah Timer */}
            <div className="inline-flex items-center gap-1 bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/30 text-blue-600 dark:text-blue-400 font-mono text-[9px] font-bold px-2 py-1.5 rounded-lg uppercase tracking-wider">
              Sesi {currentSessionNum}/{sessionsCount}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isCapturing && (
              <span className="bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded text-red-500 font-mono text-[9px] font-bold tracking-wider animate-pulse">
                REC
              </span>
            )}
          </div>
        </div>

        {/* ── WYSIWYG Frame Preview Container ── */}
        <div className="w-full flex justify-center items-center py-2 relative">
          <div
            className="relative overflow-hidden shadow-2xl border border-zinc-200/60 dark:border-zinc-850/60 rounded-xl transition-all duration-300 mx-auto"
            style={{
              aspectRatio: `${currentW} / ${currentH}`,
              width: "100%",
              maxWidth: `min(420px, calc(58vh * (${currentW} / ${currentH})))`,
              containerType: "inline-size",
              ...getBackgroundStyle(),
            }}
          >
            {/* Filmstrip sprocket holes */}
            {frameStyle === "filmstrip" && !isFilmFrame && (
              <>
                <div className="absolute left-1.5 top-0 bottom-0 w-[3.5%] flex flex-col justify-around py-[2%] z-10 pointer-events-none">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div key={i} className="w-full aspect-square bg-zinc-950 rounded-sm border border-zinc-900" />
                  ))}
                </div>
                <div className="absolute right-1.5 top-0 bottom-0 w-[3.5%] flex flex-col justify-around py-[2%] z-10 pointer-events-none">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div key={i} className="w-full aspect-square bg-zinc-950 rounded-sm border border-zinc-900" />
                  ))}
                </div>
              </>
            )}

            {/* Captured photo slots (already taken) */}
            {slots.map((slot, index) => {
              const isTaken = index < capturedPhotos.length;
              if (!isTaken) {
                return (
                  <div
                    key={index}
                    style={{
                      position: "absolute",
                      left: slot.left,
                      top: slot.top,
                      width: slot.width,
                      height: slot.height,
                      backgroundColor: "#000002",
                      overflow: "hidden",
                      ...getSlotBorderStyle(index),
                    }}
                    className="flex items-center justify-center relative group"
                  >
                    <span className="text-[5cqw] font-mono text-zinc-800 dark:text-zinc-700 font-bold select-none">
                      {index + 1}
                    </span>
                  </div>
                );
              }
              return (
                <button
                  key={index}
                  disabled={isCapturing}
                  onClick={() => onRetakeSlot && onRetakeSlot(index)}
                  style={{
                    position: "absolute",
                    left: slot.left,
                    top: slot.top,
                    width: slot.width,
                    height: slot.height,
                    overflow: "hidden",
                    ...getSlotBorderStyle(index),
                  }}
                  className="group relative cursor-pointer disabled:cursor-not-allowed overflow-hidden block p-0 border-0 outline-none"
                  title="Klik untuk mengulang foto ini"
                >
                  <img
                    src={capturedPhotos[index]}
                    alt={`Foto ${index + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    style={{ objectFit: "cover" }}
                  />
                  {!isCapturing && (
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center gap-1">
                      <RefreshCw className="w-4 h-4 text-white animate-spin" style={{ animationDuration: '6s' }} />
                      <span className="text-[7px] xl:text-[8px] font-mono text-white font-bold tracking-wider uppercase bg-black/60 px-1.5 py-0.5 rounded">
                        Ulangi Foto
                      </span>
                    </div>
                  )}
                </button>
              );
            })}

            {/* Live video — repositioned into the active slot */}
            {(isCapturing || filledPhotosCount < layoutsCount) && (
              <div
                className="absolute z-10 overflow-hidden"
                style={{
                  left:   activeSlot?.left,
                  top:    activeSlot?.top,
                  width:  activeSlot?.width,
                  height: activeSlot?.height,
                  ...getSlotBorderStyle(activeSlotIndex),
                }}
              >
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                  style={{
                    transform: isMirrored ? "scaleX(-1)" : "none",
                    filter:    activeFilter.css,
                    objectFit: "cover"
                  }}
                />
              </div>
            )}

            {/* Footer text (only when no custom image overlay) */}
            {!activeTemplate?.imageOverlay && <FooterText />}

            {/* Transparent PNG overlay */}
            {activeTemplate?.imageOverlay && (
              <img
                src={activeTemplate.imageOverlay}
                alt="Bingkai"
                className="absolute inset-0 w-full h-full z-20 pointer-events-none"
                style={{ objectFit: "fill" }}
              />
            )}

            {/* Countdown HUD - Blur and dark background removed */}
            {countdown !== null && (
              <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
                <span className="text-[18cqw] font-black text-blue-500 dark:text-blue-400 animate-scale-up drop-shadow-[0_4px_25px_rgba(0,0,0,0.6)]">
                  {countdown > 0 ? countdown : (
                    <Camera className="w-[12cqw] h-[12cqw] text-blue-400 animate-ping drop-shadow-xl" strokeWidth={1.5} />
                  )}
                </span>
              </div>
            )}

            {/* Pose Alert Banner */}
            {poseAlert && (
              <div className="absolute top-[4%] left-[4%] right-[4%] bg-black/85 border border-zinc-800/80 backdrop-blur-md py-2.5 px-4 rounded-xl text-center z-30 text-[2.6cqw] font-semibold text-zinc-200 tracking-wide shadow-xl animate-fade-in">
                {poseAlert}
              </div>
            )}

            {/* Photos Counter Tag */}
            {isCapturing && (
              <div className="absolute bottom-[3%] left-[3%] bg-zinc-950/80 px-2.5 py-1 rounded-lg text-[2.2cqw] font-mono border border-zinc-800 flex items-center gap-1.5 text-zinc-350 shadow-md z-30">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                <span>SLOT: {filledPhotosCount} / {layoutsCount}</span>
              </div>
            )}
          </div>
        </div>

        {/* Shutter controls - border atas dihapus */}
        <div className="w-full flex items-center justify-between pt-4 px-2">
          <Button
            variant="ghost"
            onClick={onCancel}
            disabled={isCapturing}
            className="text-xs font-mono text-zinc-400 dark:text-zinc-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-500/5 h-10 px-4 rounded-xl cursor-pointer transition-all"
          >
            <X className="w-3.5 h-3.5 mr-1.5" />
            <span>Batal</span>
          </Button>

          <div className="flex items-center gap-3">
            {/* Glowing Premium Camera Shutter Button */}
            <button
              onClick={startCaptureSequence}
              disabled={isCapturing}
              className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-900 border-4 border-zinc-300 dark:border-zinc-800 flex items-center justify-center hover:scale-105 disabled:opacity-45 disabled:pointer-events-none transition-all cursor-pointer group relative shadow-lg"
              title="Mulai Jepret"
            >
              <span
                className={`absolute inset-1 rounded-full transition-all duration-300 ${
                  isCapturing ? "bg-red-500 animate-pulse scale-90" : "bg-blue-600 group-hover:bg-blue-500"
                }`}
              />
              {!isCapturing && <Camera className="w-5 h-5 text-white z-10" strokeWidth={1.5} />}
            </button>

            {/* Premium Done / Preview Button */}
            {filledPhotosCount === layoutsCount && !isCapturing && (
              <Button
                onClick={onComplete}
                className="bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs px-4 h-10 rounded-xl cursor-pointer transition-all flex items-center gap-1.5 shadow-md shadow-blue-500/20"
              >
                <Check className="w-4 h-4" />
                <span>Lihat Hasil</span>
              </Button>
            )}
          </div>

          <Button
            variant="outline"
            onClick={() => setIsMirrored(!isMirrored)}
            className="bg-transparent border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-xs font-mono text-zinc-500 dark:text-zinc-400 px-4 h-10 rounded-xl cursor-pointer transition-all shadow-none"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            <span>Mirror</span>
          </Button>
        </div>
      </div>
    </div>
  );
}