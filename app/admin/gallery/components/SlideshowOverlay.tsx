"use client";

import { useState, useEffect, useRef } from "react";
import { Sparkles, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PhotoStrip } from "../../../hooks/usePhotoboothStore";

interface SlideshowOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  photos: PhotoStrip[];
  eventName: string;
  location: string;
  date: string;
}

export default function SlideshowOverlay({
  isOpen,
  onClose,
  photos,
  eventName,
  location,
  date,
}: SlideshowOverlayProps) {
  const [slideshowIndex, setSlideshowIndex] = useState(0);
  const [newPhotoAlert, setNewPhotoAlert] = useState(false);
  const prevPhotosCountRef = useRef(0);

  // Auto-reset slideshowIndex to 0 when opening or when photos length change
  useEffect(() => {
    if (isOpen) {
      setSlideshowIndex(0);
    }
  }, [isOpen]);

  // Listen for new photo count to flash alert in slideshow
  useEffect(() => {
    if (!isOpen) {
      prevPhotosCountRef.current = photos.length;
      return;
    }

    if (photos.length > prevPhotosCountRef.current) {
      if (prevPhotosCountRef.current > 0) {
        setNewPhotoAlert(true);
        setSlideshowIndex(0); // Show newly taken photo first
        const timer = setTimeout(() => setNewPhotoAlert(false), 4500);
        return () => clearTimeout(timer);
      }
    }
    prevPhotosCountRef.current = photos.length;
  }, [photos.length, isOpen]);

  // Slideshow Auto-Cycle timer
  useEffect(() => {
    if (!isOpen || photos.length === 0) return;

    const interval = setInterval(() => {
      setSlideshowIndex((prevIndex) => (prevIndex + 1) % photos.length);
    }, 5000); // cycle every 5 seconds

    return () => clearInterval(interval);
  }, [isOpen, photos.length]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[#0e0e10] z-[9999] flex flex-col justify-between p-8 select-none">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#282829] pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 flex items-center justify-center animate-pulse">
            <Sparkles className="w-5 h-5 text-white" strokeWidth={1.5} />
          </div>
          <div className="text-left">
            <span className="text-xs font-semibold font-mono text-blue-400 tracking-wider block uppercase">
              GLOW PHOTO BOOTH
            </span>
            <h3 className="text-xl font-bold text-[#e3e3e3]">{eventName}</h3>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {newPhotoAlert && (
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg text-xs font-mono font-bold animate-bounce shadow-md flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-white animate-pulse" strokeWidth={1.5} />
              <span>FOTO BARU BERHASIL DIJEPRET!</span>
            </div>
          )}
          <Button
            variant="outline"
            onClick={onClose}
            className="bg-[#1e1e1f] border-[#282829] hover:bg-[#202124] text-zinc-300 text-xs font-mono px-4 py-2 rounded-lg transition-all"
          >
            Keluar Slideshow
          </Button>
        </div>
      </div>

      {/* Slideshow Image Display */}
      <div className="flex-1 flex items-center justify-center p-4">
        {photos.length === 0 ? (
          <div className="text-center max-w-md bg-[#1e1e1f] border border-[#282829] p-10 rounded-xl flex flex-col items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-[#131314] border border-[#282829] flex items-center justify-center text-blue-400">
              <Camera className="w-7 h-7" strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#e3e3e3]">Silakan Ambil Foto!</h2>
              <p className="text-xs text-zinc-400 mt-2 font-mono leading-relaxed">
                Pindai kode QR untuk mengambil foto. Hasil jepretan Anda akan langsung muncul di sini.
              </p>
            </div>
          </div>
        ) : (
          <div className="relative h-[72vh] aspect-[1/2] max-h-[680px] flex items-center justify-center">
            <img
              src={photos[slideshowIndex]?.dataUrl}
              alt={`Slideshow strip #${slideshowIndex}`}
              className="h-full object-contain rounded-lg shadow-xl border border-[#282829]"
            />
          </div>
        )}
      </div>

      {/* Slideshow Footer */}
      <div className="flex items-center justify-between border-t border-[#282829] pt-4 text-xs font-mono text-zinc-500">
        <div>
          LOKASI: <span className="text-zinc-300">{location}</span>  •  TANGGAL: <span className="text-zinc-300">{date}</span>
        </div>
        {photos.length > 0 && (
          <div>
            SESI <span className="text-blue-400 font-bold">{slideshowIndex + 1}</span> DARI <span className="text-zinc-300">{photos.length}</span>
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
          <span>LIVE SYNC ACTIVE</span>
        </div>
      </div>
    </div>
  );
}
