"use client";

import { Calendar, MapPin, DollarSign, Image as ImageIcon, Edit, Trash2, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EventItem, PhotoStripStat } from "../types";

interface EventCardProps {
  event: EventItem;
  stats: PhotoStripStat;
  onEdit: (event: EventItem) => void;
  onDelete: (event: EventItem) => void;
  onActivate: (event: EventItem) => void;
}

export default function EventCard({ event, stats, onEdit, onDelete, onActivate }: EventCardProps) {
  return (
    <Card 
      className={`border transition-colors relative overflow-hidden rounded-2xl flex flex-col justify-between ${
        event.is_active 
          ? "border-blue-500 bg-blue-50/20 dark:bg-blue-900/10" 
          : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 hover:border-zinc-300 dark:hover:border-zinc-700"
      }`}
    >
      {event.is_active && (
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-blue-500" />
      )}

      <CardHeader className="pb-4 pt-5 px-5 border-b border-zinc-100 dark:border-zinc-800/60 flex flex-col gap-4 space-y-0">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 font-mono px-2 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800 uppercase tracking-wider">
            ID: {event.id}
          </span>
          {event.is_active && (
            <span className="text-[10px] font-bold text-blue-700 dark:text-blue-400 bg-blue-100/50 dark:bg-blue-900/30 px-2.5 py-1 rounded-full flex items-center gap-1.5 border border-blue-200/50 dark:border-blue-800">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              Aktif di Booth
            </span>
          )}
        </div>
        
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-base font-bold text-zinc-900 dark:text-zinc-100 leading-snug line-clamp-2">
            {event.name}
          </CardTitle>
          {event.logo_url && (
            <div className="w-11 h-11 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-1 shrink-0 flex items-center justify-center overflow-hidden">
              <img src={event.logo_url} alt="Logo" className="w-full h-full object-contain" />
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-5 flex flex-col gap-5 text-sm flex-1">
        <div className="grid grid-cols-2 gap-y-5 gap-x-4">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5 text-zinc-400">
              <Calendar className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold font-mono tracking-wider uppercase">Tanggal</span>
            </div>
            <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 pl-5">
              {event.date ? new Date(event.date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "-"}
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5 text-zinc-400">
              <MapPin className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold font-mono tracking-wider uppercase">Lokasi</span>
            </div>
            <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 pl-5 truncate">
              {event.location || "-"}
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5 text-zinc-400">
              <DollarSign className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold font-mono tracking-wider uppercase">Tarif / Sesi</span>
            </div>
            <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200 pl-5 font-mono">
              Rp {(event.price_per_session).toLocaleString("id-ID")}
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5 text-zinc-400">
              <ImageIcon className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold font-mono tracking-wider uppercase">Produksi Foto</span>
            </div>
            <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200 pl-5 font-mono">
              {stats.count} <span className="font-sans text-[10px] font-normal text-zinc-500">Sesi</span>
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2.5 p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/60 dark:border-zinc-800/60 mt-1">
          <span className="text-[10px] font-bold text-zinc-400 font-mono tracking-wider uppercase">Aset Diaktifkan</span>
          <div className="flex items-center gap-3 text-xs font-medium text-zinc-600 dark:text-zinc-400 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="text-zinc-900 dark:text-zinc-100 font-bold">{event.allowed_presets?.length || "Semua"}</span> Template
            </div>
            <span className="text-zinc-300 dark:text-zinc-700">•</span>
            <div className="flex items-center gap-1.5">
              <span className="text-zinc-900 dark:text-zinc-100 font-bold">{event.allowed_filters?.length || "Semua"}</span> Filter
            </div>
            <span className="text-zinc-300 dark:text-zinc-700">•</span>
            <div className="flex items-center gap-1.5">
              <span className="text-zinc-900 dark:text-zinc-100 font-bold">{event.allowed_stickers?.length || "Semua"}</span> Stiker
            </div>
          </div>
        </div>

        {event.qris_url && (
          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/60 dark:border-zinc-800/60">
            <div className="w-8 h-8 rounded bg-white dark:bg-zinc-800 p-1 border border-zinc-200 dark:border-zinc-700 shrink-0 flex items-center justify-center overflow-hidden">
              <img src={event.qris_url} alt="QRIS" className="w-full h-full object-contain" />
            </div>
            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">QRIS Pembayaran terpasang</span>
          </div>
        )}
      </CardContent>

      <div className="px-5 py-4 border-t border-zinc-100 dark:border-zinc-800/60 flex items-center justify-between gap-3 bg-white/50 dark:bg-zinc-950/50 shrink-0 rounded-b-2xl">
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onEdit(event)}
            className="h-8 w-8 p-0 rounded-md border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 dark:hover:text-zinc-100 dark:hover:bg-zinc-800 cursor-pointer transition-colors"
            title="Edit Event"
          >
            <Edit className="w-3.5 h-3.5" />
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => onDelete(event)}
            className="h-8 w-8 p-0 rounded-md border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-red-600 hover:bg-red-50 hover:border-red-200 dark:hover:bg-red-900/20 dark:hover:border-red-900/50 cursor-pointer transition-colors"
            title="Hapus Event"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>

        {!event.is_active ? (
          <Button
            type="button"
            onClick={() => onActivate(event)}
            className="h-8 px-4 text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 rounded-md cursor-pointer border-none transition-colors"
          >
            Aktifkan Event
          </Button>
        ) : (
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/10 px-3 py-1.5 rounded-md border border-emerald-100 dark:border-emerald-900/30">
            <CheckCircle2 className="w-4 h-4" />
            Sedang Aktif
          </div>
        )}
      </div>
    </Card>
  );
}