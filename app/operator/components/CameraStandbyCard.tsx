"use client";

import React from "react";
import { Camera, RefreshCw, X, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface FilterItem {
  id: string;
  name: string;
  css: string;
}

interface CameraStandbyCardProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  isCapturing: boolean;
  countdownDuration: number;
  setCountdownDuration: (duration: number) => void;
  currentSessionNum: number;
  sessionsCount: number;
  countdown: number | null;
  isMirrored: boolean;
  setIsMirrored: (m: boolean) => void;
  activeFilter: FilterItem;
  startCaptureSequence: () => void;
  onCancel: () => void;
  filledPhotosCount: number;
  layoutsCount: number;
  currentCaptureNum: number;
  poseAlert: string | null;
  customization?: any;
}

export default function CameraStandbyCard({
  videoRef,
  isCapturing,
  countdownDuration,
  setCountdownDuration,
  currentSessionNum,
  sessionsCount,
  countdown,
  isMirrored,
  setIsMirrored,
  activeFilter,
  startCaptureSequence,
  onCancel,
  filledPhotosCount,
  layoutsCount,
  currentCaptureNum,
  poseAlert,
  customization,
}: CameraStandbyCardProps) {
  const allPhotosDone = filledPhotosCount >= layoutsCount;
  const cardStyle = customization?.cardStyle;

  const getCardStyleClasses = (style?: string) => {
    if (isCapturing) {
      return "fixed inset-0 bg-black z-50 flex items-center justify-center select-none overflow-hidden touch-none";
    }
    switch (style) {
      case "glass":
        return "flex-1 bg-white/20 dark:bg-white/5 backdrop-blur-md border border-white/10 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] backdrop-saturate-150 p-3 sm:p-5 flex flex-col gap-3 sm:gap-5 transition-colors rounded-3xl";
      case "frameless":
        return "flex-1 bg-[#fdfbf7]/85 dark:bg-[#161513]/85 backdrop-blur-md border border-amber-700/20 shadow-[0_12px_40px_rgba(180,83,9,0.08)] p-5 flex flex-col gap-3 sm:gap-5 transition-colors rounded-3xl before:absolute before:inset-1 before:rounded-[22px] before:border-2 before:border-double before:border-amber-700/15 before:pointer-events-none relative";
      case "neobrutalist":
        return "flex-1 bg-[#FFF6E9] dark:bg-zinc-900 border-4 border-black dark:border-white shadow-[6px_6px_0px_0px_#000000] dark:shadow-[6px_6px_0px_0px_#ffffff] p-3 sm:p-5 flex flex-col gap-3 sm:gap-5 transition-colors rounded-none";
      case "classic":
      default:
        return "flex-1 bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 p-3 sm:p-5 flex flex-col gap-3 sm:gap-5 transition-colors rounded-3xl";
    }
  };

  const getViewportClasses = (style?: string) => {
    if (isCapturing) {
      return "absolute inset-0 w-full h-full bg-black overflow-hidden flex items-center justify-center";
    }
    switch (style) {
      case "neobrutalist":
        return "relative aspect-[4/3] w-full flex-1 min-h-0 overflow-hidden border-4 border-black dark:border-white bg-black flex items-center justify-center rounded-none shadow-[4px_4px_0px_0px_#000000] dark:shadow-[4px_4px_0px_0px_#ffffff]";
      case "glass":
        return "relative aspect-[4/3] w-full flex-1 min-h-0 overflow-hidden border border-white/20 bg-black flex items-center justify-center rounded-2xl shadow-inner";
      case "frameless":
        return "relative aspect-[4/3] w-full flex-1 min-h-0 overflow-hidden border-2 border-double border-amber-750/30 bg-black flex items-center justify-center rounded-2xl shadow-inner";
      default:
        return "relative aspect-[4/3] w-full flex-1 min-h-0 rounded-2xl overflow-hidden border border-zinc-200/80 dark:border-zinc-800/60 bg-black shadow-inner flex items-center justify-center";
    }
  };

  const getCancelButtonClasses = (style?: string) => {
    switch (style) {
      case "neobrutalist":
        return "text-xs font-mono border-2 border-black dark:border-white font-bold bg-white text-black hover:bg-black/5 dark:bg-zinc-800 dark:text-white h-10 px-4 rounded-none cursor-pointer hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#000000] transition-all flex items-center justify-center";
      case "glass":
        return "text-xs font-mono text-white/70 hover:text-white hover:bg-white/10 h-10 px-4 rounded-xl cursor-pointer transition-all border border-white/10 flex items-center justify-center";
      case "frameless":
        return "text-xs font-serif text-amber-800 dark:text-amber-500 hover:text-rose-600 dark:hover:text-rose-400 h-10 px-4 rounded-xl cursor-pointer transition-all flex items-center justify-center font-bold";
      default:
        return "text-xs font-mono text-zinc-400 dark:text-zinc-550 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-500/5 h-10 px-4 rounded-xl cursor-pointer transition-all flex items-center justify-center";
    }
  };

  const getShutterButtonClasses = (style?: string) => {
    switch (style) {
      case "neobrutalist":
        return "w-16 h-16 rounded-none bg-[#ea580c] border-4 border-black dark:border-white flex items-center justify-center hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_#000000] shadow-[4px_4px_0px_0px_#000000] transition-all cursor-pointer group relative";
      case "glass":
        return "w-16 h-16 rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center hover:scale-105 transition-all cursor-pointer group relative shadow-lg shadow-white/5";
      case "frameless":
        return "w-16 h-16 rounded-full bg-gradient-to-r from-amber-600 to-rose-600 border-2 border-amber-400/50 flex items-center justify-center hover:scale-105 active:scale-95 transition-all cursor-pointer group relative shadow-lg shadow-rose-900/10";
      default:
        return "w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-900 border-4 border-zinc-300 dark:border-zinc-800 flex items-center justify-center hover:scale-105 transition-all cursor-pointer group relative shadow-lg";
    }
  };

  const getMirrorButtonClasses = (style?: string) => {
    switch (style) {
      case "neobrutalist":
        return "bg-white dark:bg-zinc-800 border-2 border-black dark:border-white text-xs font-mono text-black dark:text-white px-4 h-10 rounded-none cursor-pointer hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#000000] transition-all shadow-none flex items-center justify-center";
      case "glass":
        return "bg-white/10 dark:bg-black/25 border border-white/20 text-xs font-mono text-white px-4 h-10 rounded-xl cursor-pointer hover:bg-white/20 transition-all shadow-none flex items-center justify-center";
      case "frameless":
        return "bg-transparent border border-amber-700/30 hover:bg-[#fcf9f2]/60 dark:hover:bg-stone-900/40 text-xs font-serif text-amber-800 dark:text-amber-550 px-4 h-10 rounded-xl cursor-pointer transition-all shadow-none flex items-center justify-center font-semibold";
      default:
        return "bg-transparent border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-xs font-mono text-zinc-555 dark:text-zinc-400 px-4 h-10 rounded-xl cursor-pointer transition-all shadow-none flex items-center justify-center";
    }
  };

  if (customization?.hideCameraFeed) {
    return (
      <div className="flex-1 bg-zinc-950/40 border-2 border-dashed border-zinc-800/80 rounded-3xl flex flex-col items-center justify-center p-8 text-center gap-3 min-h-[350px] w-full">
        <div className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-500">
          <Camera className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-zinc-300">Live Viewport Dinonaktifkan</h3>
          <p className="text-xs text-zinc-500 max-w-[200px] leading-relaxed mx-auto">
            Aktifkan widget ini di sidebar untuk menampilkan feed kamera langsung.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={getCardStyleClasses(cardStyle)}>
      {/* 1. HUD Header - Regular Mode (Only shown if not capturing) */}
      {!isCapturing && (
        <div className={`w-full flex items-center justify-between pb-2 shrink-0 select-none border-b ${cardStyle === "neobrutalist" ? "border-black dark:border-white" : "border-zinc-100 dark:border-zinc-800/50"}`}>
          <div className="flex items-center gap-3">
            {!customization?.hideCountdownTimer && (
              <div className="flex items-center gap-2">
                <div className={`bg-zinc-100/40 dark:bg-zinc-900/60 p-0.5 rounded-xl flex gap-1 border border-zinc-200/35 dark:border-zinc-800/30 ${cardStyle === "neobrutalist" ? "border-2 border-black rounded-none bg-white" : ""}`}>
                  {[3, 10, 15].map((sec) => {
                    const isActive = countdownDuration === sec;
                    return (
                      <button
                        key={sec}
                        disabled={isCapturing}
                        onClick={() => setCountdownDuration(sec)}
                        className={`px-2 py-1 rounded-lg text-[9px] font-mono font-bold transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1 ${
                          isActive
                            ? (cardStyle === "neobrutalist" ? "bg-black text-white dark:bg-white dark:text-black rounded-none" : "bg-white dark:bg-zinc-800 text-blue-650 dark:text-blue-400 shadow-sm border border-zinc-200/80 dark:border-zinc-700/60")
                            : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-850 dark:hover:text-zinc-200"
                        }`}
                      >
                        <Timer className="w-2.5 h-2.5" />
                        <span>{sec}s</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Sesi Badge */}
            <div className={`inline-flex items-center gap-1 bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/30 text-blue-650 dark:text-blue-450 font-mono text-[9px] font-bold px-2 py-1.5 rounded-lg uppercase tracking-wider ${cardStyle === "neobrutalist" ? "border-2 border-black rounded-none bg-[#FFF6E9] text-black" : ""}`}>
              Sesi {currentSessionNum}/{sessionsCount}
            </div>
          </div>

          <div className="flex items-center gap-3" />
        </div>
      )}

      <div className={getViewportClasses(cardStyle)}>
        {customization?.hideCameraFeed ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center gap-3 bg-zinc-950/40 border-2 border-dashed border-zinc-800/80 rounded-2xl">
            <div className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-550">
              <Camera className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-zinc-300">Live Viewport Dinonaktifkan</h3>
              <p className="text-xs text-zinc-500 max-w-[200px] leading-relaxed mx-auto">
                Aktifkan widget ini di sidebar untuk menampilkan feed kamera langsung.
              </p>
            </div>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              style={{
                transform: isMirrored ? "scaleX(-1)" : "none",
                filter:    activeFilter.css,
              }}
            />

            {poseAlert && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 pointer-events-none z-10 select-none">
                <div className="bg-black/60 backdrop-blur-md px-3.5 py-1.5 rounded-full text-blue-400 border border-blue-500/30 text-[10px] font-bold tracking-wider animate-pulse max-w-[240px] text-center truncate shadow-lg">
                  GAYA: {poseAlert}
                </div>
              </div>
            )}
          </>
        )}

        {isCapturing && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/35 pointer-events-none" />
        )}

        {countdown !== null && !customization?.hideCountdownTimer && (
          <div className={
            isCapturing 
              ? "absolute inset-0 flex items-center justify-center pointer-events-none z-30" 
              : "absolute top-4 right-4 z-20"
          }>
            {countdown > 0 ? (
              <div className={
                isCapturing
                  ? "text-[180px] sm:text-[240px] font-black text-white drop-shadow-[0_8px_16px_rgba(0,0,0,0.5)] font-mono animate-ping"
                  : "bg-blue-650 text-white font-mono font-black text-base w-9 h-9 rounded-full flex items-center justify-center shadow-md border border-white/20"
              }>
                {countdown}
              </div>
            ) : (
              <div className={
                isCapturing
                  ? "text-[100px] sm:text-[140px] font-black text-blue-400 drop-shadow-[0_8px_16px_rgba(0,0,0,0.5)] font-sans animate-bounce"
                  : "bg-blue-650 text-white w-9 h-9 rounded-full flex items-center justify-center shadow-md border border-white/20"
              }>
                {isCapturing ? "SMILE!" : <Camera className="w-4.5 h-4.5 text-blue-200 animate-ping" strokeWidth={2} />}
              </div>
            )}
          </div>
        )}
      </div>

      {!allPhotosDone && !isCapturing && (
        <div className="w-full flex items-center justify-between pt-2 px-1">
          <button
            type="button"
            onClick={onCancel}
            disabled={isCapturing}
            className={getCancelButtonClasses(cardStyle)}
          >
            <X className="w-3.5 h-3.5 mr-1.5 inline-block" />
            <span>Batal</span>
          </button>

          {/* Shutter Button */}
          <button
            onClick={startCaptureSequence}
            disabled={isCapturing}
            className={getShutterButtonClasses(cardStyle)}
            title="Mulai Jepret"
          >
            <span
              className={`absolute inset-1 rounded-full transition-all duration-300 ${
                isCapturing 
                  ? "bg-red-500 animate-pulse scale-90" 
                  : (cardStyle === "neobrutalist" 
                      ? "bg-black group-hover:bg-[#ea580c] rounded-none inset-0 border-none" 
                      : "bg-blue-600 group-hover:bg-blue-500")
              }`}
            />
            {!isCapturing && <Camera className="w-5 h-5 text-white z-10" strokeWidth={1.5} />}
          </button>

          <button
            type="button"
            onClick={() => setIsMirrored(!isMirrored)}
            className={getMirrorButtonClasses(cardStyle)}
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5 inline-block" />
            <span>Mirror</span>
          </button>
        </div>
      )}
    </div>
  );
}
