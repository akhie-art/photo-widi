"use client";

import { useState, useEffect } from "react";
import { Camera, ArrowRight, User, Phone, Layers, Settings } from "lucide-react";
import { EventConfig } from "../../hooks/usePhotoboothStore";

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
  sessionsCount: number;
  setSessionsCount: (v: number) => void;
}

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
}: StartScreenProps) {
  const canStart = customerName.trim() !== "" && customerPhone.trim() !== "";
  const [showError, setShowError] = useState(false);

  // Automatically clear error when form becomes valid
  useEffect(() => {
    if (canStart) setShowError(false);
  }, [canStart]);

  return (
    <div className="max-w-[440px] w-full bg-white dark:bg-[#121214] border border-zinc-150/80 dark:border-zinc-900 rounded-[28px] p-8 text-center flex flex-col items-center gap-6 shadow-2xl relative overflow-hidden animate-fade-in duration-300 transition-colors">
      
      {/* Brand Logo & Icon */}
      <div className="h-16 flex items-center justify-center max-w-[200px] select-none pointer-events-none mt-2">
        {config.logoUrl ? (
          <img src={config.logoUrl} alt="Logo" className="max-h-full max-w-full object-contain" />
        ) : (
          <div className="w-12 h-12 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/80 flex items-center justify-center text-zinc-900 dark:text-zinc-100 shadow-sm">
            <Camera className="w-6 h-6 text-zinc-650 dark:text-zinc-350" strokeWidth={1.5} />
          </div>
        )}
      </div>

      {/* Header Titles */}
      <div className="flex flex-col gap-2 select-none">
        <h2 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight leading-none">
          Registrasi Pengunjung
        </h2>
        <p className="text-zinc-500 dark:text-zinc-400 text-xs mt-1.5 leading-relaxed max-w-sm mx-auto font-medium">
          Isi data kunjungan di bawah ini untuk memulai sesi foto pada <span className="font-bold text-zinc-850 dark:text-white">{config.eventName || "Photobooth"}</span>.
        </p>
      </div>

      {/* Visitor Registration Form Card */}
      <div className="w-full text-left bg-[#fbfbfa] dark:bg-zinc-950/20 p-5 rounded-2xl border border-zinc-150/70 dark:border-zinc-900 flex flex-col gap-4 transition-colors">
        <span className="text-[9px] text-zinc-400 dark:text-zinc-500 font-bold block tracking-widest uppercase flex items-center gap-1.5 select-none">
          <User className="w-3.5 h-3.5" strokeWidth={2} />
          <span>DATA PENGUNJUNG</span>
        </span>
        
        {/* Nama Panggilan */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] text-zinc-600 dark:text-zinc-400 font-bold uppercase tracking-wider select-none">
            Nama Panggilan
          </label>
          <div className="relative flex items-center">
            <User className="w-4 h-4 text-zinc-400 dark:text-zinc-550 absolute left-3.5 pointer-events-none" strokeWidth={1.5} />
            <input
              type="text"
              required
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Nama lengkap atau panggilan..."
              className={`bg-white dark:bg-zinc-900 border ${
                showError && customerName.trim() === "" 
                  ? "border-red-400 dark:border-red-500/50 focus:border-red-400 focus:ring-red-400/10" 
                  : "border-zinc-200 dark:border-zinc-800 focus:border-zinc-950 dark:focus:border-zinc-100 focus:ring-zinc-900/5 dark:focus:ring-zinc-100/5"
              } text-zinc-800 dark:text-zinc-200 text-xs py-3 pr-3 pl-10.5 rounded-xl w-full focus:outline-none focus:ring-2 transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-600`}
            />
          </div>
        </div>

        {/* Nomor WhatsApp */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] text-zinc-600 dark:text-zinc-400 font-bold uppercase tracking-wider select-none">
            Nomor WhatsApp
          </label>
          <div className="relative flex items-center">
            <Phone className="w-4 h-4 text-zinc-400 dark:text-zinc-550 absolute left-3.5 pointer-events-none" strokeWidth={1.5} />
            <input
              type="tel"
              required
              value={customerPhone}
              onChange={(e) => {
                const numericValue = e.target.value.replace(/[^0-9]/g, '');
                setCustomerPhone(numericValue);
              }}
              placeholder="Contoh: 081234567890"
              className={`bg-white dark:bg-zinc-900 border ${
                showError && customerPhone.trim() === "" 
                  ? "border-red-400 dark:border-red-500/50 focus:border-red-400 focus:ring-red-400/10" 
                  : "border-zinc-200 dark:border-zinc-800 focus:border-zinc-950 dark:focus:border-zinc-100 focus:ring-zinc-900/5 dark:focus:ring-zinc-100/5"
              } text-zinc-800 dark:text-zinc-200 text-xs py-3 pr-3 pl-10.5 rounded-xl w-full focus:outline-none focus:ring-2 transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-600`}
            />
          </div>
        </div>

        {/* Jumlah Sesi */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] text-zinc-600 dark:text-zinc-400 font-bold uppercase tracking-wider select-none">
            Jumlah Sesi Foto
          </label>
          <div className="relative flex items-center">
            <Layers className="w-4 h-4 text-zinc-400 dark:text-zinc-550 absolute left-3.5 pointer-events-none" strokeWidth={1.5} />
            <input
              type="number"
              min={1}
              required
              value={sessionsCount || ""}
              onChange={(e) => {
                const val = Number(e.target.value);
                setSessionsCount(val > 0 ? val : 1);
              }}
              placeholder="1"
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-zinc-950 dark:focus:border-zinc-100 focus:ring-2 focus:ring-zinc-900/5 dark:focus:ring-zinc-100/5 text-xs py-3 pr-3 pl-10.5 rounded-xl w-full transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
            />
          </div>
        </div>
      </div>

      {/* Camera Selection */}
      {cameras.length > 1 && (
        <div className="w-full text-left">
          <label className="text-[9px] text-zinc-400 dark:text-zinc-550 font-bold block mb-1.5 tracking-wider uppercase select-none flex items-center gap-1.5">
            <Settings className="w-3 h-3" />
            <span>PILIH KAMERA AKTIF</span>
          </label>
          <select
            value={selectedCameraId}
            onChange={(e) => setSelectedCameraId(e.target.value)}
            className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 text-xs text-zinc-700 dark:text-zinc-300 focus:outline-none focus:border-zinc-950 dark:focus:border-zinc-100 focus:ring-2 focus:ring-zinc-900/5 dark:focus:ring-zinc-100/5 font-sans cursor-pointer transition-all"
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
      <div className="w-full flex flex-col gap-2">
        <button
          onClick={() => {
            if (!canStart) {
              setShowError(true);
              return;
            }
            onStart();
          }}
          disabled={!canStart}
          className={`group w-full font-bold py-3.5 rounded-xl transition-all duration-300 text-xs tracking-wider uppercase flex items-center justify-center gap-2 border-none shadow-sm ${
            canStart 
              ? "bg-zinc-950 hover:bg-zinc-850 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 cursor-pointer hover:-translate-y-0.5 active:translate-y-0" 
              : "bg-zinc-100 dark:bg-zinc-900 text-zinc-400 dark:text-zinc-650 border border-zinc-200/50 dark:border-zinc-850 cursor-not-allowed opacity-60"
          }`}
        >
          <span>Mulai Sesi Foto</span>
          <ArrowRight 
            className={`w-4 h-4 transition-transform duration-300 ${canStart ? "group-hover:translate-x-1" : ""}`} 
            strokeWidth={2} 
          />
        </button>
      </div>
    </div>
  );
}