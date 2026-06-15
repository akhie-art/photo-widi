"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EventConfig, PhotoStrip } from "../../hooks/usePhotoboothStore";

interface OverviewTabProps {
  photos: PhotoStrip[];
  config: EventConfig;
  onStartSlideshow: () => void;
}

export default function OverviewTab({
  photos,
  config,
  onStartSlideshow,
}: OverviewTabProps) {
  const activeFrame = config.customFrames?.find((f) => f.id === config.activeFrameId);
  const activeFrameName = activeFrame ? activeFrame.name : "Default Neon";

  return (
    <div className="flex flex-col gap-8 animate-fade-in duration-200">
      <div>
        <h2 className="text-2xl font-bold text-foreground tracking-tight">Ringkasan Sesi Aktif</h2>
        <p className="text-muted-foreground text-xs mt-1 leading-relaxed">
          Pantau aktivitas dan statistik jepretan tamu di booth Anda secara minimalis.
        </p>
      </div>

      {/* Grid Cards Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card className="bg-card border-border shadow-sm">
          <CardHeader className="pb-1.5">
            <CardDescription className="text-[9px] font-mono tracking-wider text-zinc-500">
              TOTAL JEPRETAN FOTO
            </CardDescription>
            <CardTitle className="text-4xl font-extrabold text-blue-500 dark:text-blue-400 mt-1">
              {photos.length}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground font-light leading-relaxed">
              Foto strip yang tersimpan di galeri lokal.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-sm">
          <CardHeader className="pb-1.5">
            <CardDescription className="text-[9px] font-mono tracking-wider text-zinc-500">
              BINGKAI AKTIF
            </CardDescription>
            <CardTitle className="text-base font-bold text-purple-600 dark:text-purple-400 mt-2 truncate max-w-full">
              {activeFrameName}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground font-light leading-relaxed">
              Bingkai yang sedang terpasang di kamera pelanggan.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-sm">
          <CardHeader className="pb-1.5">
            <CardDescription className="text-[9px] font-mono tracking-wider text-zinc-500">
              HITUNG MUNDUR KAMERA
            </CardDescription>
            <CardTitle className="text-2xl font-extrabold text-pink-600 dark:text-pink-400 mt-1">
              {config.countdownDuration ?? 3} Detik
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground font-light leading-relaxed">
              Jeda hitung mundur webcam sebelum memotret.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick launch block */}
      <Card className="bg-card border-border rounded-2xl p-6 text-center flex flex-col items-center gap-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Tampilkan Slideshow pada Layar Proyektor</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto leading-relaxed">
            Siarkan secara real-time hasil jepretan tamu di layar TV atau proyektor besar.
          </p>
        </div>
        <Button
          onClick={onStartSlideshow}
          className="bg-blue-600 hover:bg-blue-500 text-white font-medium px-5 py-2 text-xs rounded-xl shadow-none transition-all cursor-pointer"
        >
          Buka Slideshow Layar Penuh
        </Button>
      </Card>
    </div>
  );
}
