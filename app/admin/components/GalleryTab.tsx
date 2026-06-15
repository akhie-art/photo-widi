"use client";

import { useState } from "react";
import { Image as ImageIcon, Download, Trash2 } from "lucide-react";
import { Card, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PhotoStrip } from "../../hooks/usePhotoboothStore";

interface GalleryTabProps {
  photos: PhotoStrip[];
  clearPhotos: () => void;
  deletePhoto: (id: string) => void;
}

export default function GalleryTab({
  photos,
  clearPhotos,
  deletePhoto,
}: GalleryTabProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-6 animate-fade-in duration-200">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground tracking-tight">Galeri Hasil Jepretan</h2>
          <p className="text-muted-foreground text-xs mt-1">
            Memantau, mendownload, atau memoderasi foto strip tamu secara langsung.
          </p>
        </div>

        {photos.length > 0 && (
          <Button
            variant="destructive"
            onClick={() => {
              if (confirm("Hapus semua hasil jepretan secara permanen?")) {
                clearPhotos();
              }
            }}
            className="text-xs px-3.5 py-1.5 rounded-lg h-auto shadow-none cursor-pointer"
          >
            Hapus Semua Foto
          </Button>
        )}
      </div>

      {photos.length === 0 ? (
        <div className="bg-card border border-border border-dashed rounded-3xl p-16 text-center flex flex-col items-center justify-center text-muted-foreground">
          <ImageIcon className="w-10 h-10 text-zinc-600 mb-3" strokeWidth={1.5} />
          <h3 className="text-sm font-semibold text-foreground">Belum ada foto</h3>
          <p className="text-xs text-muted-foreground max-w-xs mt-1 font-light leading-relaxed">
            Foto yang berhasil diambil oleh pelanggan di booth akan seketika tampil di halaman gallery ini.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
          {photos.map((photo) => (
            <Card
              key={photo.id}
              className="bg-card border-border overflow-hidden relative group shadow-sm flex flex-col justify-between"
            >
              <div
                className="aspect-[1/2] bg-background flex items-center justify-center relative cursor-zoom-in"
                onClick={() => setSelectedPhoto(photo.dataUrl)}
              >
                <img
                  src={photo.dataUrl}
                  alt="Photostrip capture"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-350 text-xs text-zinc-300 font-light">
                  🔍 Perbesar
                </div>
              </div>

              <CardFooter className="p-2.5 bg-card border-t border-border flex flex-col gap-1.5 items-stretch">
                {photo.customerName && (
                  <div className="text-[10px] text-foreground font-semibold leading-tight text-left">
                    <div className="truncate">{photo.customerName}</div>
                    <div className="text-[9px] text-muted-foreground mt-0.5 font-normal font-mono">
                      HP: {photo.customerPhone} | {photo.sessionsCount || 1} Sesi
                    </div>
                    {photo.operatorName && (
                      <div className="text-[9px] text-blue-500 dark:text-blue-400 mt-0.5 font-normal font-mono truncate">
                        Op: <span className="font-semibold">{photo.operatorName}</span>
                      </div>
                    )}
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <div className="text-[9px] font-mono text-muted-foreground leading-tight text-left">
                    <div>{photo.id.replace("strip_", "Sesi ")}</div>
                    <div className="mt-0.5 text-muted-foreground/85">{photo.timestamp}</div>
                  </div>

                  <div className="flex gap-1">
                    <button
                      onClick={() => {
                        const link = document.createElement("a");
                        link.download = `${photo.id}.png`;
                        link.href = photo.dataUrl;
                        link.click();
                      }}
                      className="p-1.5 bg-background hover:bg-accent rounded text-muted-foreground hover:text-foreground transition-colors border border-border cursor-pointer"
                      title="Download"
                    >
                      <Download className="w-3.5 h-3.5" strokeWidth={1.5} />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm("Hapus foto strip ini?")) {
                          deletePhoto(photo.id);
                        }
                      }}
                      className="p-1.5 bg-red-955/10 hover:bg-red-950/35 rounded text-red-400 hover:text-red-300 transition-colors border border-red-950/25 cursor-pointer"
                      title="Hapus"
                    >
                      <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                    </button>
                  </div>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Lightbox Modal for Photo Details */}
      {selectedPhoto && (
        <div
          onClick={() => setSelectedPhoto(null)}
          className="fixed inset-0 bg-black/95 z-[9999] flex items-center justify-center p-6 backdrop-blur-sm cursor-zoom-out"
        >
          <div className="relative max-h-[85vh] max-w-full" onClick={(e) => e.stopPropagation()}>
            <img
              src={selectedPhoto}
              alt="Expanded photostrip"
              className="max-h-[85vh] max-w-full rounded-lg shadow-2xl border border-zinc-900"
            />
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-4 right-4 bg-[#1e1e1f] border border-[#282829] w-9 h-9 rounded-full text-white hover:bg-[#202124] transition-colors flex items-center justify-center cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
