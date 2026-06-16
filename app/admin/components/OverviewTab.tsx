"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EventConfig, PhotoStrip } from "../../hooks/usePhotoboothStore";
import { Camera, Palette, Clock, Image as ImageIcon, Sparkles, Calendar } from "lucide-react";

interface OverviewTabProps {
  photos: PhotoStrip[];
  config: EventConfig;
}

export default function OverviewTab({
  photos,
  config,
}: OverviewTabProps) {
  const activePreset = config.presetTemplates?.find((p) => p.id === config.activePresetTemplateId);
  const activeFrameName = activePreset ? activePreset.name : "Default Neon";

  // Get the 4 most recent photos
  const recentPhotos = photos.slice(0, 4);

  return (
    <div className="flex flex-col gap-8 animate-fade-in duration-300">
      
      {/* Welcome & Event Header */}
      <div className="flex flex-col gap-2">
        <div className="inline-flex items-center gap-1.5 w-fit px-2.5 py-1 rounded-md bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 text-[10px] font-semibold uppercase tracking-wider ring-1 ring-inset ring-zinc-200/50 dark:ring-zinc-800/50">
          <Sparkles className="w-3.5 h-3.5" /> Ringkasan Sesi Aktif
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight mt-1">
          {config.eventName || "Glowbooth Studio"}
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-2xl">
          Pantau aktivitas booth, statistik jepretan tamu, dan kelola operasional sistem secara *real-time* melalui panel kontrol terpusat.
        </p>
      </div>

      {/* Grid Cards Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        
        {/* Total Jepretan */}
        <Card className="bg-white dark:bg-zinc-950 border-none ring-1 ring-inset ring-zinc-200/80 dark:ring-zinc-800/60 shadow-[0_4px_20px_rgb(0,0,0,0.02)] rounded-2xl transition-all duration-300 hover:shadow-md group">
          <CardHeader className="pb-2 flex flex-row items-start justify-between space-y-0">
            <div className="space-y-1.5">
              <CardDescription className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Total Jepretan
              </CardDescription>
              <CardTitle className="text-4xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
                {photos.length}
              </CardTitle>
            </div>
            <div className="w-10 h-10 rounded-xl bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center text-zinc-600 dark:text-zinc-400 shrink-0 ring-1 ring-inset ring-zinc-200/50 dark:ring-zinc-800/50 group-hover:scale-105 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-all">
              <Camera className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <p className="text-[11px] text-zinc-500 leading-relaxed">
              Foto strip berhasil diambil dan tersimpan aman di server lokal.
            </p>
          </CardContent>
        </Card>

        {/* Bingkai Aktif */}
        <Card className="bg-white dark:bg-zinc-950 border-none ring-1 ring-inset ring-zinc-200/80 dark:ring-zinc-800/60 shadow-[0_4px_20px_rgb(0,0,0,0.02)] rounded-2xl transition-all duration-300 hover:shadow-md group">
          <CardHeader className="pb-2 flex flex-row items-start justify-between space-y-0">
            <div className="space-y-1.5 flex-1 min-w-0 pr-3">
              <CardDescription className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Bingkai Terpasang
              </CardDescription>
              <CardTitle className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight truncate pt-2">
                {activeFrameName}
              </CardTitle>
            </div>
            <div className="w-10 h-10 rounded-xl bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center text-zinc-600 dark:text-zinc-400 shrink-0 ring-1 ring-inset ring-zinc-200/50 dark:ring-zinc-800/50 group-hover:scale-105 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-all">
              <Palette className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <p className="text-[11px] text-zinc-500 leading-relaxed">
              Bingkai *overlay* PNG yang aktif digunakan pada sistem kamera.
            </p>
          </CardContent>
        </Card>

        {/* Hitung Mundur */}
        <Card className="bg-white dark:bg-zinc-950 border-none ring-1 ring-inset ring-zinc-200/80 dark:ring-zinc-800/60 shadow-[0_4px_20px_rgb(0,0,0,0.02)] rounded-2xl transition-all duration-300 hover:shadow-md group col-span-1 sm:col-span-2 lg:col-span-1">
          <CardHeader className="pb-2 flex flex-row items-start justify-between space-y-0">
            <div className="space-y-1.5">
              <CardDescription className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Timer Kamera
              </CardDescription>
              <CardTitle className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight pt-1">
                {config.countdownDuration ?? 3} Detik
              </CardTitle>
            </div>
            <div className="w-10 h-10 rounded-xl bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center text-zinc-600 dark:text-zinc-400 shrink-0 ring-1 ring-inset ring-zinc-200/50 dark:ring-zinc-800/50 group-hover:scale-105 group-hover:text-amber-600 dark:group-hover:text-amber-500 transition-all">
              <Clock className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <p className="text-[11px] text-zinc-500 leading-relaxed">
              Jeda persiapan pose pengunjung sebelum rana memotret.
            </p>
          </CardContent>
        </Card>

      </div>

      {/* Recent Activity Gallery */}
      <div className="flex flex-col gap-4 mt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center ring-1 ring-inset ring-zinc-200/50 dark:ring-zinc-800/50">
              <ImageIcon className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
            </div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Aktivitas Terkini</h3>
          </div>
          <span className="text-[10px] text-zinc-500 font-medium bg-zinc-100 dark:bg-zinc-900 px-2 py-1 rounded-md ring-1 ring-inset ring-zinc-200/50 dark:ring-zinc-800/50">
            4 Sesi Terakhir
          </span>
        </div>

        {recentPhotos.length === 0 ? (
          <div className="w-full flex flex-col items-center justify-center py-16 px-4 ring-1 ring-inset ring-zinc-200/80 dark:ring-zinc-800/60 border-dashed rounded-2xl bg-zinc-50/50 dark:bg-zinc-900/20">
            <div className="w-12 h-12 flex items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 mb-3">
              <Camera className="w-5 h-5 text-zinc-400" strokeWidth={1.5} />
            </div>
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Belum ada aktivitas foto jepretan hari ini.</p>
            <p className="text-xs text-zinc-500 mt-1 text-center max-w-xs leading-relaxed">
              Semua sesi foto baru pelanggan akan otomatis muncul *real-time* di panel ini.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {recentPhotos.map((photo) => (
              <div
                key={photo.id}
                className="group flex flex-col justify-between bg-white dark:bg-zinc-950 ring-1 ring-inset ring-zinc-200/80 dark:ring-zinc-800/60 rounded-2xl overflow-hidden shadow-[0_2px_10px_rgb(0,0,0,0.01)] hover:shadow-md transition-all duration-300"
              >
                {/* Photo Frame Container (Estetika Kertas) */}
                <div className="p-2.5 bg-zinc-50/60 dark:bg-zinc-900/20 flex-1 flex flex-col items-center justify-center">
                  <div className="relative w-full aspect-[2/3] rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-900 ring-1 ring-zinc-200 dark:ring-zinc-800 flex items-center justify-center transition-transform duration-300 group-hover:scale-[1.015]">
                    {photo.dataUrl ? (
                      <img
                        src={photo.dataUrl}
                        alt={photo.customerName || "Photostrip"}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-zinc-300 border-t-zinc-600 dark:border-zinc-700 dark:border-t-zinc-400 animate-spin" />
                    )}
                  </div>
                </div>

                {/* Info Section */}
                <div className="p-3 border-t border-zinc-100 dark:border-zinc-900 bg-white dark:bg-zinc-950 flex flex-col gap-1">
                  <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                    {photo.customerName || "Pengunjung Anonim"}
                  </p>
                  <div className="flex items-center gap-1 text-[9px] text-zinc-400 dark:text-zinc-500 font-mono">
                    <Calendar className="w-2.5 h-2.5" />
                    <span className="truncate">{photo.timestamp}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}