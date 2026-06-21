"use client";

import { useState } from "react";
import { Image as ImageIcon, Download, Trash2, Calendar, User, Eye, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PhotoStrip } from "../../../hooks/usePhotoboothStore";
import ConfirmDeleteDialog from "@/components/ui/ConfirmDeleteDialog";
import { toast } from "sonner";
import { GalleryTabProps } from "../types";

export default function GalleryTab({
  photos,
  clearPhotos,
  deletePhoto,
}: GalleryTabProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  // Dialog State
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);
  const [confirmTitle, setConfirmTitle] = useState("");
  const [confirmDesc, setConfirmDesc] = useState("");

  return (
    <>
      <ConfirmDeleteDialog
        isOpen={confirmOpen}
        onClose={() => {
          setConfirmOpen(false);
          setConfirmAction(null);
        }}
        onConfirm={() => {
          if (confirmAction) confirmAction();
        }}
        title={confirmTitle}
        description={confirmDesc}
      />

      <div className="flex flex-col gap-6 animate-fade-in duration-200">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
              Galeri Hasil Jepretan
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Memantau, mengunduh, atau memoderasi foto strip tamu secara langsung dari sistem.
            </p>
          </div>

          {photos.length > 0 && (
            <Button
              variant="outline"
              onClick={() => {
                setConfirmTitle("Hapus Semua Foto");
                setConfirmDesc("Apakah Anda yakin ingin menghapus semua hasil jepretan secara permanen? Tindakan ini tidak dapat dibatalkan.");
                setConfirmAction(() => () => {
                  clearPhotos();
                  toast.success("Semua hasil jepretan telah dihapus.");
                });
                setConfirmOpen(true);
              }}
              className="h-9 text-xs font-medium px-4 rounded-xl text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-900/20 w-full sm:w-auto transition-colors shadow-sm"
            >
              <Trash2 className="w-3.5 h-3.5 mr-2" />
              Hapus Semua Foto
            </Button>
          )}
        </div>

        {/* Content Area */}
        {photos.length === 0 ? (
          <div className="w-full flex flex-col items-center justify-center py-16 px-4 ring-1 ring-inset ring-zinc-200/80 dark:ring-zinc-800/60 border-dashed rounded-2xl bg-zinc-50/50 dark:bg-zinc-900/20">
            <div className="w-12 h-12 flex items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 mb-3">
              <ImageIcon className="w-5 h-5 text-zinc-400" strokeWidth={1.5} />
            </div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Belum ada foto</h3>
            <p className="text-xs text-zinc-500 mt-1 text-center max-w-xs leading-relaxed">
              Foto yang berhasil diambil oleh pelanggan di booth akan seketika tampil di halaman galeri ini.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className="group flex flex-col justify-between bg-white dark:bg-zinc-950 ring-1 ring-inset ring-zinc-200/80 dark:ring-zinc-800/60 rounded-2xl overflow-hidden shadow-[0_4px_20px_rgb(0,0,0,0.01)]"
              >
                {/* Photo Frame Container */}
                <div className="p-2.5 bg-zinc-50/60 dark:bg-zinc-900/20 flex-1 flex flex-col items-center justify-center">
                  <div
                    className={`relative w-full aspect-[1/2] rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-900 ring-1 ring-zinc-200 dark:ring-zinc-800 flex items-center justify-center transition-transform duration-300 group-hover:scale-[1.015] ${
                      photo.dataUrl ? "cursor-zoom-in" : "cursor-default"
                    }`}
                    onClick={() => photo.dataUrl && setSelectedPhoto(photo.dataUrl)}
                  >
                    {photo.dataUrl ? (
                      <>
                        <img
                          src={photo.dataUrl}
                          alt="Photostrip capture"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-zinc-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-200">
                          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/90 dark:bg-zinc-900/90 shadow-sm text-[11px] font-medium text-zinc-800 dark:text-zinc-200 backdrop-blur-sm">
                            <Eye className="w-3.5 h-3.5" />
                            <span>Perbesar</span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-zinc-300 border-t-zinc-600 dark:border-zinc-700 dark:border-t-zinc-400 animate-spin" />
                    )}
                  </div>
                </div>

                {/* Details Section - PERBAIKAN TOTAL DI SINI */}
                <div className="p-3.5 flex flex-col gap-3 bg-white dark:bg-zinc-950">
                  
                  {/* Baris Atas: Nama Pelanggan & Badge Sesi */}
                  <div className="flex items-start justify-between gap-2 min-w-0">
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate tracking-tight">
                        {photo.customerName || "Pelanggan Anonim"}
                      </span>
                      {photo.customerPhone && (
                        <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono flex items-center gap-1 mt-0.5">
                          <Phone className="w-2.5 h-2.5 text-zinc-400/80 shrink-0" />
                          {photo.customerPhone}
                        </span>
                      )}
                    </div>
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-medium bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 shrink-0 ring-1 ring-inset ring-zinc-200/50 dark:ring-zinc-800/50 font-sans">
                      {photo.sessionsCount || 1} Sesi
                    </span>
                  </div>

                  {/* Baris Tengah: Tag Operator (Jika Ada) */}
                  {photo.operatorName && (
                    <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-900/40 px-2 py-1 rounded-lg ring-1 ring-inset ring-zinc-100 dark:ring-zinc-900/40">
                      <User className="w-3 h-3 text-zinc-400 dark:text-zinc-500 shrink-0" />
                      <span className="truncate font-medium">Op: {photo.operatorName}</span>
                    </div>
                  )}

                  {/* Garis Pembatas Minimalis */}
                  <div className="h-px bg-zinc-100 dark:bg-zinc-900/60" />

                  {/* Baris Bawah: Meta ID/Waktu & Tombol Aksi (Disejajarkan Sempurna) */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex flex-col text-[10px] text-zinc-400 dark:text-zinc-500 font-mono leading-tight min-w-0">
                      <span className="truncate opacity-80">{photo.id.replace("strip_", "ID: ")}</span>
                      <span className="mt-1 flex items-center gap-1 text-[9px] opacity-75">
                        <Calendar className="w-2.5 h-2.5 text-zinc-400/60" /> 
                        {photo.timestamp}
                      </span>
                    </div>

                    {/* Kontainer Tombol Aksi */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={async () => {
                          try {
                            const response = await fetch(photo.dataUrl);
                            const blob = await response.blob();
                            const localUrl = URL.createObjectURL(blob);
                            const link = document.createElement("a");
                            link.download = `photobooth-${photo.id}.png`;
                            link.href = localUrl;
                            link.click();
                            setTimeout(() => URL.revokeObjectURL(localUrl), 100);
                          } catch (err) {
                            const link = document.createElement("a");
                            link.download = `photobooth-${photo.id}.png`;
                            link.href = photo.dataUrl;
                            link.click();
                          }
                        }}
                        className="p-2 rounded-xl text-zinc-500 bg-zinc-50 hover:text-zinc-900 hover:bg-zinc-100/80 ring-1 ring-inset ring-zinc-200/50 dark:bg-zinc-900/50 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-800 dark:ring-zinc-800 transition-all active:scale-95"
                        title="Unduh Gambar"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      
                      <button
                        onClick={() => {
                          setConfirmTitle("Hapus Foto Strip");
                          setConfirmDesc("Apakah Anda yakin ingin menghapus foto strip ini? Tindakan ini tidak dapat dibatalkan.");
                          setConfirmAction(() => () => {
                            deletePhoto(photo.id);
                            toast.success("Foto strip berhasil dihapus.");
                          });
                          setConfirmOpen(true);
                        }}
                        className="p-2 rounded-xl text-red-500 bg-red-50/40 hover:text-red-700 hover:bg-red-100 ring-1 ring-inset ring-red-100/80 dark:bg-red-950/20 dark:hover:bg-red-900/40 dark:hover:text-red-400 dark:ring-red-900/30 transition-all active:scale-95"
                        title="Hapus"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            ))}
          </div>
        )}

        {/* Lightbox Modal for Photo Details */}
        {selectedPhoto && (
          <div
            onClick={() => setSelectedPhoto(null)}
            className="fixed inset-0 bg-zinc-950/90 z-[9999] flex items-center justify-center p-6 backdrop-blur-sm cursor-zoom-out animate-fade-in duration-200"
          >
            <div className="relative max-h-[90vh] max-w-full group" onClick={(e) => e.stopPropagation()}>
              <img
                src={selectedPhoto}
                alt="Expanded photostrip"
                className="max-h-[90vh] max-w-full rounded-xl shadow-2xl ring-1 ring-white/10 object-contain"
              />
              <button
                onClick={() => setSelectedPhoto(null)}
                className="absolute top-4 right-4 bg-black/50 hover:bg-black/80 backdrop-blur-md text-white w-8 h-8 rounded-full flex items-center justify-center transition-colors shadow-sm ring-1 ring-white/10"
              >
                ✕
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}