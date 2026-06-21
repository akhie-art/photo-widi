"use client";

import { Camera, MapPin, Calendar, ArrowRight, Clock } from "lucide-react";

export interface EventItem {
  id: string;
  slug: string;
  name: string;
  date: string | null;
  location: string | null;
  price_per_session: number;
  logo_url: string | null;
  is_active: boolean;
  bg_theme: string;
}

const THEME_ACCENTS: Record<string, string> = {
  sunset: "hover:border-amber-400/50 dark:hover:border-amber-500/50",
  neon: "hover:border-fuchsia-400/50 dark:hover:border-fuchsia-500/50",
  luxury: "hover:border-yellow-400/50 dark:hover:border-yellow-500/50",
  romantic: "hover:border-rose-400/50 dark:hover:border-rose-500/50",
  emerald: "hover:border-emerald-400/50 dark:hover:border-emerald-500/50",
  default: "hover:border-zinc-300 dark:hover:border-zinc-700",
};

interface ScheduledEventsProps {
  events: EventItem[];
  loadingEvents: boolean;
  onSelectEvent: (slug: string) => void;
}

export default function ScheduledEvents({ events, loadingEvents, onSelectEvent }: ScheduledEventsProps) {
  return (
    <main className="flex-1 w-full max-w-6xl mx-auto px-6 py-10 flex flex-col gap-8">
      {/* Page Header */}
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">Event Terjadwal</h1>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm max-w-lg">
          Pilih event aktif di bawah ini untuk memulai sesi registrasi dan mengelola antrean foto.
        </p>
      </div>

      {/* Loading / Events Grid */}
      {loadingEvents ? (
        <div className="flex-1 flex flex-col items-center justify-center py-20 text-zinc-500 gap-4 text-sm">
          <div className="w-6 h-6 rounded-full border-2 border-zinc-200 dark:border-zinc-800 border-t-zinc-900 dark:border-t-zinc-100 animate-spin" />
          <span>Memuat data event...</span>
        </div>
      ) : events.length === 0 ? (
        <div className="w-full border border-dashed border-zinc-300 dark:border-zinc-800 rounded-2xl p-12 flex flex-col items-center justify-center text-center gap-4 bg-zinc-100/50 dark:bg-zinc-900/20">
          <div className="w-12 h-12 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-zinc-550 dark:text-zinc-400">
            <Calendar className="w-5 h-5" />
          </div>
          <div className="flex flex-col gap-1">
            <h3 className="font-medium text-zinc-900 dark:text-zinc-100 text-sm">Belum Ada Event</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-sm">
              Tidak ada event yang ditemukan. Silakan hubungi Administrator untuk mengatur event baru.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {events.map((event) => {
            const themeName = event.bg_theme || "default";
            const accentClass = THEME_ACCENTS[themeName] || THEME_ACCENTS.default;
            
            return (
              <div
                key={event.id}
                onClick={() => onSelectEvent(event.slug)}
                className={`group relative bg-white dark:bg-[#121212] border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-5 hover:shadow-sm transition-all duration-200 cursor-pointer flex flex-col h-full ${accentClass}`}
              >
                {/* Top Section: Logo & Badge */}
                <div className="flex items-start justify-between w-full mb-4">
                  <div className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200/50 dark:border-zinc-700/50 flex items-center justify-center overflow-hidden shrink-0">
                    {event.logo_url ? (
                      <img src={event.logo_url} alt="Logo" className="max-w-full max-h-full object-cover" />
                    ) : (
                      <Camera className="w-5 h-5 text-zinc-400" />
                    )}
                  </div>
                  
                  {event.is_active ? (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-100/50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 rounded-md text-xs font-medium select-none">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                      Aktif
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-md text-xs font-medium select-none">
                      <Clock className="w-3 h-3" />
                      Standby
                    </div>
                  )}
                </div>

                {/* Middle Section: Title & Details */}
                <div className="flex flex-col gap-3 flex-grow">
                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 line-clamp-1 group-hover:text-black dark:group-hover:text-white transition-colors">
                    {event.name}
                  </h3>
                  
                  <div className="flex flex-col gap-2 text-sm text-zinc-500 dark:text-zinc-400">
                    {event.date && (
                      <div className="flex items-center gap-2.5">
                        <Calendar className="w-4 h-4 text-zinc-400" />
                        <span className="truncate">{event.date}</span>
                      </div>
                    )}
                    {event.location && (
                      <div className="flex items-center gap-2.5">
                        <MapPin className="w-4 h-4 text-zinc-400" />
                        <span className="truncate">{event.location}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Section: Price & Action */}
                <div className="flex items-center justify-between w-full pt-5 mt-5 border-t border-zinc-100 dark:border-zinc-800/80">
                  <div className="flex flex-col">
                    <span className="text-[11px] text-zinc-500 dark:text-zinc-500 font-medium">Tarif per sesi</span>
                    <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      Rp {event.price_per_session.toLocaleString("id-ID")}
                    </span>
                  </div>
                  
                  <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 flex items-center justify-center group-hover:bg-zinc-900 group-hover:text-white dark:group-hover:bg-zinc-100 dark:group-hover:text-zinc-900 transition-colors">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
