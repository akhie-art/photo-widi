"use client";

import React from "react";
import { Camera, RefreshCw, X } from "lucide-react";
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
}: CameraStandbyCardProps) {
  return (
    <div className="flex-1 bg-white dark:bg-[#121214] border border-zinc-200/80 dark:border-zinc-800/80 rounded-3xl p-5 flex flex-col justify-between gap-5 shadow-xl transition-colors">
      
      {/* Workspace HUD Header */}
      <div className="w-full flex items-center justify-between pb-2 shrink-0 select-none border-b border-zinc-100 dark:border-zinc-800/50">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono uppercase tracking-wider font-bold">
              Timer:
            </span>
            <div className="bg-zinc-100/40 dark:bg-zinc-900/60 p-0.5 rounded-xl flex gap-1 border border-zinc-200/35 dark:border-zinc-800/30">
              {[3, 10, 15].map((sec) => {
                const isActive = countdownDuration === sec;
                return (
                  <button
                    key={sec}
                    disabled={isCapturing}
                    onClick={() => setCountdownDuration(sec)}
                    className={`px-2.5 py-1 rounded-lg text-[9px] font-mono font-bold transition-all cursor-pointer disabled:opacity-50 ${
                      isActive
                        ? "bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-sm border border-zinc-200/80 dark:border-zinc-700/60"
                        : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-850 dark:hover:text-zinc-200"
                    }`}
                  >
                    {sec}s
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sesi Badge */}
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

      {/* Large Standby Camera Viewport */}
      <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden border border-zinc-200/80 dark:border-zinc-800/60 bg-black shadow-inner flex items-center justify-center">
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

        {/* Countdown HUD - Top Right, Small, No blur */}
        {countdown !== null && (
          <div className="absolute top-4 right-4 z-20">
            {countdown > 0 ? (
              <div className="bg-blue-600 text-white font-mono font-black text-base w-9 h-9 rounded-full flex items-center justify-center shadow-md border border-white/20">
                {countdown}
              </div>
            ) : (
              <div className="bg-blue-600 text-white w-9 h-9 rounded-full flex items-center justify-center shadow-md border border-white/20">
                <Camera className="w-4.5 h-4.5 text-blue-200 animate-ping" strokeWidth={2} />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Shutter controls */}
      <div className="w-full flex items-center justify-between pt-2 px-1">
        <Button
          variant="ghost"
          onClick={onCancel}
          disabled={isCapturing}
          className="text-xs font-mono text-zinc-400 dark:text-zinc-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-500/5 h-10 px-4 rounded-xl cursor-pointer transition-all"
        >
          <X className="w-3.5 h-3.5 mr-1.5" />
          <span>Batal</span>
        </Button>

        {/* Shutter Button */}
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
  );
}
