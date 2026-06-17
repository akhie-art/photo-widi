"use client";

import { Calendar, Image as ImageIcon, TrendingUp, CalendarDays } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { EventItem, PhotoStripStat } from "../types";

interface EventStatsProps {
  eventsList: EventItem[];
  activeEvent: EventItem | undefined;
  activeStats: PhotoStripStat;
}

export default function EventStats({ eventsList, activeEvent, activeStats }: EventStatsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="bg-white dark:bg-zinc-950 border-none ring-1 ring-inset ring-zinc-200/80 dark:ring-zinc-800/60 rounded-xl">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="space-y-1.5 min-w-0">
            <span className="text-[10px] text-zinc-400 uppercase font-mono font-bold tracking-wider">EVENT AKTIF</span>
            <p className="text-sm font-bold text-zinc-800 dark:text-zinc-100 truncate pr-1">
              {activeEvent ? activeEvent.name : "Belum Ada Event Aktif"}
            </p>
            <p className="text-[9px] text-zinc-500 truncate">
              {activeEvent ? activeEvent.location : "Semua booth dinonaktifkan"}
            </p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0">
            <Calendar className="w-4.5 h-4.5" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white dark:bg-zinc-950 border-none ring-1 ring-inset ring-zinc-200/80 dark:ring-zinc-800/60 rounded-xl">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-[10px] text-zinc-400 uppercase font-mono font-bold tracking-wider">SESI FOTO (EVENT AKTIF)</span>
            <p className="text-sm font-bold text-zinc-800 dark:text-zinc-100 font-mono">
              {activeEvent ? activeStats.count : 0} <span className="text-xs font-normal text-zinc-500">sesi</span>
            </p>
            <p className="text-[9px] text-zinc-500">Tercatat di tabel photo_strips</p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
            <ImageIcon className="w-4.5 h-4.5" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white dark:bg-zinc-950 border-none ring-1 ring-inset ring-zinc-200/80 dark:ring-zinc-800/60 rounded-xl">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-[10px] text-zinc-400 uppercase font-mono font-bold tracking-wider">REVENUE (EVENT AKTIF)</span>
            <p className="text-sm font-bold text-zinc-800 dark:text-zinc-100 font-mono">
              Rp {activeEvent ? (activeStats.amount).toLocaleString("id-ID") : 0}
            </p>
            <p className="text-[9px] text-zinc-500">Harga: Rp {activeEvent ? (activeEvent.price_per_session).toLocaleString("id-ID") : 0}/sesi</p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500 shrink-0">
            <TrendingUp className="w-4.5 h-4.5" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white dark:bg-zinc-950 border-none ring-1 ring-inset ring-zinc-200/80 dark:ring-zinc-800/60 rounded-xl">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-[10px] text-zinc-400 uppercase font-mono font-bold tracking-wider">TOTAL DAFTAR EVENT</span>
            <p className="text-sm font-bold text-zinc-800 dark:text-zinc-100 font-mono">
              {eventsList.length} <span className="text-xs font-normal text-zinc-500">event</span>
            </p>
            <p className="text-[9px] text-zinc-500">Riwayat & event terjadwal</p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-violet-500/10 flex items-center justify-center text-violet-500 shrink-0">
            <CalendarDays className="w-4.5 h-4.5" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}