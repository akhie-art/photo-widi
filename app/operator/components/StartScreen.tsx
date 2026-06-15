"use client";

import { useState, useEffect } from "react";
import { Camera, ArrowRight, User, Phone, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EventConfig, FrameTemplate } from "../../hooks/usePhotoboothStore";

interface StartScreenProps {
  config: EventConfig;
  activeLayoutsList: any[];
  activeLayout: string;
  setActiveLayout: (layout: "strip" | "grid" | "polaroid") => void;
  activeFrameId: string;
  handleFrameSelect: (frame: FrameTemplate) => void;
  cameras: MediaDeviceInfo[];
  selectedCameraId: string;
  setSelectedCameraId: (id: string) => void;
  onStart: () => void;
  customerName: string;
  setCustomerName: (v: string) => void;
  customerPhone: string;
  setCustomerPhone: (v: string) => void;
  sessionsCount: number;
  setSessionsCount: (v: number) => void;
}

export default function StartScreen({
  config,
  activeLayoutsList,
  activeLayout,
  setActiveLayout,
  activeFrameId,
  handleFrameSelect,
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
}: StartScreenProps) {
  const canStart = customerName.trim() !== "" && customerPhone.trim() !== "";
  const [showError, setShowError] = useState(false);

  // Otomatis menghilangkan pesan error jika user mulai mengetik dan form sudah valid
  useEffect(() => {
    if (canStart) setShowError(false);
  }, [canStart]);

  return (
    <div className="max-w-md w-full bg-white/70 dark:bg-zinc-900/40 backdrop-blur-xl border border-zinc-200/80 dark:border-zinc-850 rounded-3xl p-8 text-center flex flex-col items-center gap-6 shadow-2xl relative overflow-hidden group/card animate-fade-in duration-300 transition-colors">
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-blue-500/0 via-blue-500/35 to-blue-500/0" />
      
      <div className="w-14 h-14 rounded-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 flex items-center justify-center text-blue-500 shadow-inner group-hover/card:scale-105 transition-transform duration-300">
        <Camera className="w-6.5 h-6.5 text-blue-500" strokeWidth={1.5} />
      </div>

      <div>
        <h2 className="text-xl font-bold text-zinc-900 dark:text-[#e3e3e3] tracking-tight">Selamat Datang!</h2>
        <p className="text-zinc-550 dark:text-zinc-400 text-xs mt-1.5 leading-relaxed">
          Masuk ke studio virtual dan abadikan kenangan di <strong className="text-zinc-850 dark:text-zinc-200 font-semibold">{config.eventName}</strong>.
        </p>
      </div>

      {/* Visitor Registration Form */}
      <div className="w-full text-left bg-zinc-50/50 dark:bg-zinc-950/40 p-5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/60 flex flex-col gap-4 transition-colors">
        <span className="text-[9px] text-zinc-450 dark:text-zinc-500 font-mono block tracking-wider uppercase font-bold">REGISTRASI PENGUNJUNG</span>
        
        {/* Nama Lengkap Input */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] text-zinc-600 dark:text-zinc-400 font-medium font-sans">
            Nama Lengkap
          </label>
          <div className="relative flex items-center">
            <User className="w-4 h-4 text-zinc-400 dark:text-zinc-500 absolute left-3.5 pointer-events-none" strokeWidth={1.5} />
            <input
              type="text"
              required
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Ketik nama Anda..."
              className={`bg-white dark:bg-zinc-900 border ${showError && customerName.trim() === "" ? "border-red-400 dark:border-red-500/50" : "border-zinc-200 dark:border-zinc-800/80"} text-zinc-850 dark:text-zinc-200 focus:outline-none focus:border-blue-500 text-xs py-3 pr-3 pl-10 rounded-xl w-full transition-all focus:ring-1 focus:ring-blue-500/30`}
            />
          </div>
        </div>

        {/* Nomor HP Input */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] text-zinc-600 dark:text-zinc-400 font-medium font-sans">
            Nomor HP / WhatsApp
          </label>
          <div className="relative flex items-center">
            <Phone className="w-4 h-4 text-zinc-400 dark:text-zinc-500 absolute left-3.5 pointer-events-none" strokeWidth={1.5} />
            <input
              type="tel"
              required
              value={customerPhone}
              onChange={(e) => {
                // Memfilter input agar HANYA menerima karakter angka (0-9)
                const numericValue = e.target.value.replace(/[^0-9]/g, '');
                setCustomerPhone(numericValue);
              }}
              placeholder="Contoh: 081234567890"
              className={`bg-white dark:bg-zinc-900 border ${showError && customerPhone.trim() === "" ? "border-red-400 dark:border-red-500/50" : "border-zinc-200 dark:border-zinc-800/80"} text-zinc-850 dark:text-zinc-200 focus:outline-none focus:border-blue-500 text-xs py-3 pr-3 pl-10 rounded-xl w-full transition-all focus:ring-1 focus:ring-blue-500/30`}
            />
          </div>
        </div>

        {/* Jumlah Sesi Input */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] text-zinc-600 dark:text-zinc-400 font-medium font-sans">
            Jumlah Sesi Foto
          </label>
          <div className="relative flex items-center">
            <Layers className="w-4 h-4 text-zinc-400 dark:text-zinc-500 absolute left-3.5 pointer-events-none" strokeWidth={1.5} />
            <input
              type="number"
              min={1}
              required
              value={sessionsCount || ""}
              onChange={(e) => {
                const val = Number(e.target.value);
                setSessionsCount(val > 0 ? val : 1);
              }}
              placeholder="Masukkan jumlah sesi..."
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 text-zinc-850 dark:text-zinc-200 focus:outline-none focus:border-blue-500 text-xs py-3 pr-3 pl-10 rounded-xl w-full transition-all focus:ring-1 focus:ring-blue-500/30"
            />
          </div>
        </div>
      </div>

      {/* Camera input check */}
      {cameras.length > 1 && (
        <div className="w-full text-left">
          <label className="text-[9px] text-zinc-500 dark:text-zinc-500 font-mono block mb-1.5 tracking-wider font-bold">PILIH KAMERA</label>
          <select
            value={selectedCameraId}
            onChange={(e) => setSelectedCameraId(e.target.value)}
            className="w-full bg-white dark:bg-zinc-950/50 border border-zinc-250 dark:border-zinc-850 rounded-xl p-3 text-xs text-zinc-700 dark:text-zinc-300 focus:outline-none focus:border-blue-500 font-sans cursor-pointer transition-all"
          >
            {cameras.map((cam) => (
              <option key={cam.deviceId} value={cam.deviceId}>
                {cam.label || `Kamera ${cam.deviceId.slice(0, 5)}`}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Action Button Section */}
      <div className="w-full flex flex-col gap-2">
        {showError && (
          <p className="text-[10px] text-red-500 dark:text-red-400 text-left font-medium animate-in fade-in slide-in-from-bottom-1">
            *Harap lengkapi Nama dan Nomor HP terlebih dahulu.
          </p>
        )}
        
        <Button
          onClick={() => {
            if (!canStart) {
              setShowError(true);
              return;
            }
            onStart();
          }}
          className={`group w-full font-semibold py-4 rounded-xl transition-all duration-300 text-xs tracking-wider uppercase flex items-center justify-center gap-2 border-none ${
            canStart 
              ? "bg-gradient-to-r from-blue-600 to-indigo-650 hover:from-blue-500 hover:to-indigo-550 text-white shadow-lg shadow-blue-600/25 hover:shadow-blue-500/40 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer" 
              : "bg-zinc-100 dark:bg-zinc-800/80 text-zinc-400 dark:text-zinc-500 cursor-not-allowed"
          }`}
        >
          <span>Mulai Sesi Foto</span>
          <ArrowRight 
            className={`w-4 h-4 transition-transform duration-300 ${canStart ? "group-hover:translate-x-1" : ""}`} 
            strokeWidth={1.5} 
          />
        </Button>
      </div>
      
      <div className="text-[10px] text-zinc-500 dark:text-zinc-500 flex items-center gap-1.5 font-mono">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        <span>Kamera Siap</span>
      </div>
    </div>
  );
}