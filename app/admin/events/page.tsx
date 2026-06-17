"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Search, Loader2, Calendar } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ConfirmDeleteDialog from "@/components/ui/ConfirmDeleteDialog";

import { usePhotoboothStore } from "../../hooks/usePhotoboothStore";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

import { EventItem, PhotoStripStat } from "./types";
import MissingTableWarning from "./components/MissingTableWarning";
import EventStats from "./components/EventStats";
import EventCard from "./components/EventCard";
import EventFormModal from "./components/EventFormModal";

const sqlInitializationScript = `-- ── TABLE MANAGEMEN EVENT SQL INITIALIZATION ──
-- Salin skrip di bawah ini lalu jalankan di Supabase SQL Editor Anda

create table if not exists events (
  id          text primary key,
  name        text not null,
  date        text,
  location    text,
  price_per_session integer default 25000,
  logo_url    text,
  qris_url    text,
  is_active   boolean default false,
  allowed_presets text[] default '{}',
  allowed_filters text[] default '{}',
  allowed_stickers text[] default '{}',
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- Mengaktifkan Row Level Security
alter table events enable row level security;

-- Menambahkan kebijakan akses RLS (Publik CRUD)
drop policy if exists "public read events" on events;
drop policy if exists "public insert events" on events;
drop policy if exists "public update events" on events;
drop policy if exists "public delete events" on events;

create policy "public read events" on events for select using (true);
create policy "public insert events" on events for insert with check (true);
create policy "public update events" on events for update using (true);
create policy "public delete events" on events for delete using (true);

-- Menambahkan kolom penampung event_name ke photo_strips
alter table photo_strips add column if not exists event_name text;

-- Pastikan kolom baru ditambahkan jika tabel events sudah ada sebelumnya
alter table events add column if not exists allowed_presets text[] default '{}';
alter table events add column if not exists allowed_filters text[] default '{}';
alter table events add column if not exists allowed_stickers text[] default '{}';

-- Aktifkan realtime sync untuk tabel events
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'events'
  ) then
    alter publication supabase_realtime add table events;
  end if;
end $$;`;

export default function EventsPage() {
  const { updateConfig } = usePhotoboothStore();
  const [eventsList, setEventsList] = useState<EventItem[]>([]);
  const [photoStripsStats, setPhotoStripsStats] = useState<PhotoStripStat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTableMissing, setIsTableMissing] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "active" | "past">("all");

  // Modal States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Deletion States
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<EventItem | null>(null);

  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.from("events").select("*").order("created_at", { ascending: false });
      if (error) {
        if (error.code === "42P01" || error.message?.includes("does not exist")) setIsTableMissing(true);
        else toast.error(`Gagal memuat daftar event: ${error.message}`);
      } else {
        setEventsList(data || []);
        setIsTableMissing(false);
      }
    } catch (err) {
      console.error("Error fetching events:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const { data, error } = await supabase.from("photo_strips").select("amount, event_name");
      if (error) {
        const { data: fallbackData, error: fallbackError } = await supabase.from("photo_strips").select("amount");
        if (fallbackError) throw fallbackError;
        const totalAmount = fallbackData.reduce((acc, r) => acc + (r.amount || 0), 0);
        setPhotoStripsStats([{ event_name: "Default", amount: totalAmount, count: fallbackData.length }]);
      } else {
        const statsMap: Record<string, PhotoStripStat> = {};
        data.forEach((row) => {
          const evName = row.event_name || "Tanpa Event / Default";
          if (!statsMap[evName]) statsMap[evName] = { event_name: evName, amount: 0, count: 0 };
          statsMap[evName].count += 1;
          statsMap[evName].amount += row.amount || 0;
        });
        setPhotoStripsStats(Object.values(statsMap));
      }
    } catch (err) {
      console.error("Gagal memuat statistik:", err);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
    fetchStats();
  }, [fetchEvents, fetchStats]);

  useEffect(() => {
    if (isTableMissing) return;
    const channel = supabase.channel("events-realtime-changes").on("postgres_changes", { event: "*", schema: "public", table: "events" }, () => fetchEvents()).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [isTableMissing, fetchEvents]);

  const base64ToBlob = async (base64: string): Promise<Blob> => {
    const res = await fetch(base64);
    return await res.blob();
  };

  const uploadEventAsset = async (base64: string, prefix: "logo" | "qris", evId: string): Promise<string> => {
    if (!base64.startsWith("data:")) return base64;
    const blob = await base64ToBlob(base64);
    const ext = blob.type === "image/jpeg" ? "jpg" : "png";
    const path = `${prefix}_${evId}_${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("event-assets").upload(path, blob, { contentType: blob.type || "image/png", upsert: true });
    if (error) throw error;
    const { data } = supabase.storage.from("event-assets").getPublicUrl(path);
    return data.publicUrl;
  };

  const handleActivateEvent = async (event: EventItem) => {
    const loadingToast = toast.loading(`Mengaktifkan event "${event.name}"...`);
    try {
      const { error: resetError } = await supabase.from("events").update({ is_active: false }).not("id", "eq", event.id);
      if (resetError) throw resetError;
      const { error: setActiveError } = await supabase.from("events").update({ is_active: true }).eq("id", event.id);
      if (setActiveError) throw setActiveError;

      const success = await updateConfig({
        eventName: event.name, date: event.date, location: event.location,
        pricePerSession: event.price_per_session, logoUrl: event.logo_url, qrisUrl: event.qris_url,
        allowedPresets: event.allowed_presets || [], allowedFilters: event.allowed_filters || [], allowedStickers: event.allowed_stickers || [],
      });

      if (success) {
        toast.success(`Event "${event.name}" diaktifkan!`, { id: loadingToast });
        fetchEvents();
      } else {
        toast.error("Gagal menyinkronkan pengaturan ke booth.", { id: loadingToast });
      }
    } catch (err: any) {
      toast.error(`Gagal: ${err.message || err}`, { id: loadingToast });
    }
  };

  const handleSaveEvent = async (formData: Omit<EventItem, "is_active" | "created_at">) => {
    setIsSaving(true);
    const slugId = formData.id;

    if (formMode === "add" && eventsList.some(ev => ev.id === slugId)) {
      toast.error(`ID Event "${slugId}" sudah digunakan.`);
      setIsSaving(false);
      return;
    }

    try {
      let uploadedLogoUrl = formData.logo_url;
      if (uploadedLogoUrl && uploadedLogoUrl.startsWith("data:")) uploadedLogoUrl = await uploadEventAsset(uploadedLogoUrl, "logo", slugId);
      
      let uploadedQrisUrl = formData.qris_url;
      if (uploadedQrisUrl && uploadedQrisUrl.startsWith("data:")) uploadedQrisUrl = await uploadEventAsset(uploadedQrisUrl, "qris", slugId);

      const payload = {
        name: formData.name, date: formData.date, location: formData.location, price_per_session: formData.price_per_session,
        logo_url: uploadedLogoUrl, qris_url: uploadedQrisUrl,
        allowed_presets: formData.allowed_presets, allowed_filters: formData.allowed_filters, allowed_stickers: formData.allowed_stickers,
        updated_at: new Date().toISOString(),
      };

      if (formMode === "add") {
        const { error } = await supabase.from("events").insert({ id: slugId, ...payload, is_active: false });
        if (error) throw error;
        toast.success(`Event "${formData.name}" berhasil ditambahkan!`);
      } else {
        const { error } = await supabase.from("events").update(payload).eq("id", slugId);
        if (error) throw error;
        
        const currentActive = eventsList.find(ev => ev.id === slugId && ev.is_active);
        if (currentActive) {
          await updateConfig({
            eventName: formData.name, date: formData.date, location: formData.location, pricePerSession: formData.price_per_session,
            logoUrl: uploadedLogoUrl, qrisUrl: uploadedQrisUrl, allowedPresets: formData.allowed_presets, allowedFilters: formData.allowed_filters, allowedStickers: formData.allowed_stickers,
          });
        }
        toast.success(`Perubahan Event "${formData.name}" disimpan!`);
      }

      setIsFormOpen(false);
      fetchEvents();
    } catch (err: any) {
      toast.error(`Gagal menyimpan: ${err.message || err}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!eventToDelete) return;
    const loadingToast = toast.loading(`Menghapus event "${eventToDelete.name}"...`);
    try {
      const { data } = await supabase.storage.from("event-assets").list("");
      if (data) {
        const filesToDelete = data.filter(f => f.name.includes(`_${eventToDelete.id}_`)).map(f => f.name);
        if (filesToDelete.length > 0) await supabase.storage.from("event-assets").remove(filesToDelete);
      }
      const { error } = await supabase.from("events").delete().eq("id", eventToDelete.id);
      if (error) throw error;
      toast.success(`Event dihapus!`, { id: loadingToast });
      fetchEvents();
    } catch (err: any) {
      toast.error(`Gagal menghapus: ${err.message || err}`, { id: loadingToast });
    } finally {
      setEventToDelete(null);
      setIsDeleteOpen(false);
    }
  };

  const activeEvent = eventsList.find(ev => ev.is_active);
  const activeStats = photoStripsStats.find(s => s.event_name === activeEvent?.name) || { event_name: "", count: 0, amount: 0 };

  const filteredEvents = eventsList.filter((event) => {
    const matchesSearch = event.name.toLowerCase().includes(searchQuery.toLowerCase()) || event.id.toLowerCase().includes(searchQuery.toLowerCase()) || event.location.toLowerCase().includes(searchQuery.toLowerCase());
    if (activeTab === "active") return event.is_active && matchesSearch;
    if (activeTab === "past") {
      if (!event.date) return false;
      const today = new Date().toISOString().split("T")[0];
      return event.date < today && !event.is_active && matchesSearch;
    }
    return matchesSearch;
  });

  if (isTableMissing) {
    return <MissingTableWarning onRetry={fetchEvents} sqlScript={sqlInitializationScript} />;
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">Manajemen Event</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Buat, aktifkan, dan kelola profil event khusus untuk operator booth Anda.</p>
        </div>
        <Button onClick={() => { setSelectedEvent(null); setFormMode("add"); setIsFormOpen(true); }} className="h-10 text-sm font-semibold px-4.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 transition-colors flex items-center gap-2 cursor-pointer border-none">
          <Plus className="w-4 h-4" /> Tambah Event Baru
        </Button>
      </div>

      <EventStats eventsList={eventsList} activeEvent={activeEvent} activeStats={activeStats} />

      <Card className="bg-white dark:bg-zinc-950 border-none ring-1 ring-inset ring-zinc-200/80 dark:ring-zinc-800/60 rounded-xl p-4 flex flex-col md:flex-row gap-4 md:items-center justify-between">
        <div className="relative flex items-center max-w-sm w-full">
          <Search className="absolute left-3 w-4 h-4 text-zinc-400" />
          <Input type="text" placeholder="Cari event..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 h-10 rounded-lg bg-white dark:bg-zinc-950 border-none ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 focus-visible:ring-1 focus-visible:ring-zinc-400 text-sm w-full" />
        </div>
        <div className="flex items-center bg-zinc-100 dark:bg-zinc-900 p-1 rounded-lg border border-zinc-200/20 dark:border-zinc-800/20 max-w-sm self-start sm:self-auto">
          {["all", "active", "past"].map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab as any)} className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${activeTab === tab ? "bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100" : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"}`}>
              {tab === "all" ? `Semua (${eventsList.length})` : tab === "active" ? `Aktif (${eventsList.filter(ev => ev.is_active).length})` : "Selesai"}
            </button>
          ))}
        </div>
      </Card>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-zinc-400 font-mono text-xs gap-3">
          <Loader2 className="w-7 h-7 text-blue-500 animate-spin" /><span>Memuat data event...</span>
        </div>
      ) : filteredEvents.length === 0 ? (
        <Card className="border border-dashed border-zinc-200 dark:border-zinc-800 bg-white/20 dark:bg-zinc-950/20 py-16 rounded-2xl flex flex-col items-center justify-center text-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-400"><Calendar className="w-5 h-5" /></div>
          <div><p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Tidak ada event ditemukan</p><p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">Coba sesuaikan kata kunci pencarian Anda.</p></div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredEvents.map((event) => (
            <EventCard 
              key={event.id} 
              event={event} 
              stats={photoStripsStats.find(s => s.event_name === event.name) || { event_name: "", count: 0, amount: 0 }}
              onActivate={handleActivateEvent}
              onEdit={(ev) => { setSelectedEvent(ev); setFormMode("edit"); setIsFormOpen(true); }}
              onDelete={(ev) => { setEventToDelete(ev); setIsDeleteOpen(true); }}
            />
          ))}
        </div>
      )}

      <EventFormModal 
        isOpen={isFormOpen} 
        mode={formMode} 
        initialData={selectedEvent} 
        isSaving={isSaving}
        onClose={() => setIsFormOpen(false)} 
        onSave={handleSaveEvent} 
      />

      <ConfirmDeleteDialog
        isOpen={isDeleteOpen}
        onClose={() => { setIsDeleteOpen(false); setEventToDelete(null); }}
        onConfirm={handleDeleteConfirm}
        title="Hapus Event"
        description={`Apakah Anda yakin ingin menghapus event "${eventToDelete?.name}"? Tindakan ini akan menghapus aset logo & QRIS event secara permanen dari database.`}
        confirmText="Hapus Permanen"
        cancelText="Batal"
      />
    </div>
  );
}