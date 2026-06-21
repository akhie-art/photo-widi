"use client";

import { useState } from "react";
import { 
  Calendar, 
  MapPin, 
  DollarSign, 
  Image as ImageIcon, 
  Edit, 
  Trash2, 
  ExternalLink, 
  Copy, 
  Check, 
  QrCode,
  Power,
  PowerOff
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EventItem, PhotoStripStat } from "../types";
import { toast } from "sonner";

interface EventCardProps {
  event: EventItem;
  stats: PhotoStripStat;
  onEdit?: (event: EventItem) => void;
  onDelete?: (event: EventItem) => void;
  onActivate?: (event: EventItem) => void;
  onDeactivate?: (event: EventItem) => void;
}

export default function EventCard({ event, stats, onEdit, onDelete, onActivate, onDeactivate }: EventCardProps) {
  const [copied, setCopied] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleVisit = () => {
    if (!event.is_active) {
      onActivate?.(event);
    }
    window.open(`/operator/${event.slug}`, "_blank");
  };

  const handleCopyLink = () => {
    if (typeof window === "undefined") return;
    
    if (!event.is_active) {
      onActivate?.(event);
    }

    const link = window.location.origin + `/operator/${event.slug}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success(`Link operator untuk event "${event.name}" berhasil disalin!`);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card 
      className={`group relative flex flex-col justify-between overflow-hidden rounded-xl border bg-white transition-all duration-200 hover:shadow-sm dark:bg-zinc-950/50 ${
        event.is_active 
          ? "border-zinc-300 dark:border-zinc-700" 
          : "border-zinc-200 dark:border-zinc-800/80 opacity-90 hover:opacity-100"
      }`}
    >
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0 p-5 pb-4">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            {event.is_active ? (
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                </span>
                <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">Aktif</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-zinc-300 dark:bg-zinc-700"></span>
                <span className="text-[11px] font-medium text-zinc-500">Nonaktif</span>
              </div>
            )}
            <span className="text-zinc-300 dark:text-zinc-700">•</span>
            <span className="font-mono text-[11px] font-medium tracking-tight text-zinc-500">
              {event.slug}
            </span>
          </div>
          
          <CardTitle className="line-clamp-2 text-base font-semibold leading-tight text-zinc-900 dark:text-zinc-100">
            {event.name}
          </CardTitle>
        </div>

        {event.logo_url && (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-zinc-100 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
            <img src={event.logo_url} alt="Logo" className="h-full w-full object-cover" />
          </div>
        )}
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-5 p-5 pt-0">
        <div className="grid grid-cols-2 gap-x-4 gap-y-4">
          <InfoItem 
            icon={<Calendar className="h-3.5 w-3.5" />} 
            label="Tanggal" 
            value={event.date ? new Date(event.date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "-"} 
          />
          <InfoItem 
            icon={<MapPin className="h-3.5 w-3.5" />} 
            label="Lokasi" 
            value={event.location || "-"} 
            truncate 
          />
          <InfoItem 
            icon={<DollarSign className="h-3.5 w-3.5" />} 
            label="Tarif / Sesi" 
            value={`Rp ${event.price_per_session.toLocaleString("id-ID")}`} 
          />
          <InfoItem 
            icon={<ImageIcon className="h-3.5 w-3.5" />} 
            label="Produksi" 
            value={`${stats.count} Sesi`} 
          />
        </div>

        <div className="flex flex-col gap-3 rounded-lg border border-zinc-100 bg-zinc-50/50 p-3 dark:border-zinc-800/50 dark:bg-zinc-900/20">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-zinc-500">Konfigurasi Aset</span>
            {event.qris_url && (
               <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400" title="QRIS Tersedia">
                 <QrCode className="h-3.5 w-3.5" />
               </div>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-zinc-600 dark:text-zinc-400">
            <div className="flex items-center gap-1">
              <span className="font-semibold text-zinc-900 dark:text-zinc-200">{event.allowed_presets?.length || "Semua"}</span> Tpl
            </div>
            <span className="text-zinc-300 dark:text-zinc-700">•</span>
            <div className="flex items-center gap-1">
              <span className="font-semibold text-zinc-900 dark:text-zinc-200">{event.allowed_filters?.length || "Semua"}</span> Flt
            </div>
            <span className="text-zinc-300 dark:text-zinc-700">•</span>
            <div className="flex items-center gap-1">
              <span className="font-semibold text-zinc-900 dark:text-zinc-200">{event.allowed_stickers?.length || "Semua"}</span> Stk
            </div>
          </div>
        </div>
      </CardContent>

      <div className="flex items-center justify-between border-t border-zinc-100 bg-zinc-50/30 p-4 dark:border-zinc-800/50 dark:bg-zinc-900/10">
        <div className="flex gap-1.5">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onEdit?.(event)}
            className="h-8 w-8 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
            title="Edit Event"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onDelete?.(event)}
            className="h-8 w-8 text-zinc-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 dark:hover:text-red-400"
            title="Hapus Event"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleCopyLink}
            className="h-8 w-8 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
            title="Salin Link"
          >
            {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
          </Button>

          <Button
            type="button"
            onClick={handleVisit}
            variant="outline"
            className="h-8 border-zinc-200 px-3 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"
          >
            <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
            Buka
          </Button>

          {!event.is_active ? (
            <Button
              type="button"
              onClick={() => onActivate?.(event)}
              className="h-8 px-3 text-xs font-medium"
            >
              <Power className="mr-1.5 h-3.5 w-3.5" />
              Aktifkan
            </Button>
          ) : (
            <Button
              type="button"
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              onClick={() => onDeactivate?.(event)}
              variant="outline"
              className={`h-8 w-28 px-0 text-xs font-medium transition-colors ${
                isHovered
                  ? "border-red-200 bg-red-50 text-red-600 hover:bg-red-50 hover:text-red-600 dark:border-red-900/30 dark:bg-red-950/20 dark:text-red-400"
                  : "border-zinc-200 text-zinc-600 dark:border-zinc-800 dark:text-zinc-400"
              }`}
            >
              {isHovered ? (
                <>
                  <PowerOff className="mr-1.5 h-3.5 w-3.5" />
                  Matikan
                </>
              ) : (
                "Sedang Aktif"
              )}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

// Sub-komponen untuk merapikan grid informasi
function InfoItem({ icon, label, value, truncate = false }: { icon: React.ReactNode, label: string, value: React.ReactNode, truncate?: boolean }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1.5 text-zinc-400">
        {icon}
        <span className="text-[10px] font-medium uppercase tracking-wider">{label}</span>
      </div>
      <p className={`text-sm font-medium text-zinc-900 dark:text-zinc-200 ${truncate ? "truncate" : ""}`}>
        {value}
      </p>
    </div>
  );
}