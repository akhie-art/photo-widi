"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Download, Video, Image as ImageIcon, Archive, Loader2, ArrowRight, CheckSquare, Square, FolderDown, MessageCircle, Mail, Share2, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import JSZip from "jszip";
import { EventConfig } from "../../hooks/usePhotoboothStore";
import { Muxer, ArrayBufferTarget } from "mp4-muxer";

interface ShareScreenProps {
  config: EventConfig;
  compiledStripUrl: string | null;
  capturedPhotos: string[];
  customerName: string;
  customerPhone: string;
  currentSessionNum: number;
  sessionsCount: number;
  photoId: string | null;
  onComplete: () => void;
  handlePrint: () => void;
  handlePrintManual?: () => void;
  customization?: any;
}

interface AssetItem {
  id: string;
  name: string;
  type: "strip" | "photo" | "video";
  url: string | null;
  filename: string;
  thumbnail: string | null;
}

const THEME_GLOWS = {
  sunset: {
    topLeft: "bg-amber-400/20 dark:bg-amber-500/15",
    bottomRight: "bg-pink-400/20 dark:bg-pink-500/15",
  },
  neon: {
    topLeft: "bg-fuchsia-400/20 dark:bg-fuchsia-500/15",
    bottomRight: "bg-cyan-400/20 dark:bg-cyan-500/15",
  },
  luxury: {
    topLeft: "bg-yellow-500/20 dark:bg-yellow-600/15",
    bottomRight: "bg-amber-500/20 dark:bg-amber-600/15",
  },
  romantic: {
    topLeft: "bg-rose-400/20 dark:bg-rose-500/15",
    bottomRight: "bg-pink-400/20 dark:bg-pink-500/15",
  },
  emerald: {
    topLeft: "bg-emerald-400/20 dark:bg-emerald-500/15",
    bottomRight: "bg-teal-400/20 dark:bg-teal-500/15",
  },
};

const getFontFamilyName = (f: string) => {
  switch (f) {
    case "outfit": return "'Outfit', sans-serif";
    case "syne": return "'Syne', sans-serif";
    case "playfair": return "'Playfair Display', serif";
    case "cabinet": return "'Cabinet Grotesk', sans-serif";
    case "inter":
    default:
      return "'Inter', sans-serif";
  }
};

const getBorderRadiusClass = (radius?: string) => {
  switch (radius) {
    case "none": return "rounded-none";
    case "sm": return "rounded-sm";
    case "md": return "rounded-md";
    case "lg": return "rounded-xl";
    case "xl": return "rounded-2xl";
    case "2xl":
    default:
      return "rounded-[28px]";
  }
};

const getShadowClass = (shadow?: string) => {
  switch (shadow) {
    case "none": return "shadow-none";
    case "sm": return "shadow-sm";
    case "md": return "shadow-md";
    case "lg": return "shadow-lg";
    case "xl": return "shadow-xl";
    case "2xl":
    default:
      return "shadow-2xl";
  }
};

const isColorLight = (color?: string) => {
  if (!color) return false;
  const hex = color.replace("#", "");
  if (hex.length !== 6) return false;
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 155;
};

const adjustColorBrightness = (col: string, amt: number) => {
  let usePound = false;
  if (col[0] === "#") {
    col = col.slice(1);
    usePound = true;
  }
  const num = parseInt(col, 16);
  let r = (num >> 16) + amt;
  if (r > 255) r = 255;
  else if (r < 0) r = 0;
  let b = ((num >> 8) & 0x00FF) + amt;
  if (b > 255) b = 255;
  else if (b < 0) b = 0;
  let g = (num & 0x0000FF) + amt;
  if (g > 255) g = 255;
  else if (g < 0) g = 0;
  return (usePound ? "#" : "") + (g | (b << 8) | (r << 16)).toString(16).padStart(6, "0");
};

export default function ShareScreen({
  config,
  compiledStripUrl,
  capturedPhotos,
  customerName,
  customerPhone,
  currentSessionNum,
  sessionsCount,
  photoId,
  onComplete,
  handlePrint,
  handlePrintManual,
  customization,
}: ShareScreenProps) {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoExtension, setVideoExtension] = useState<string>("mp4");
  const [isVideoLoading, setIsVideoLoading] = useState(true);
  const [isZipLoading, setIsZipLoading] = useState(false);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activePreviewId, setActivePreviewId] = useState<string>("strip");
  const [isSharing, setIsSharing] = useState(false);

  const cardStyle = customization?.cardStyle;

  const getCardStyleClasses = (style?: string) => {
    switch (style) {
      case "glass":
        return "w-[95%] lg:w-[80%] max-w-7xl h-[95%] lg:h-[85%] bg-white/20 dark:bg-white/5 backdrop-blur-md border border-white/10 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] backdrop-saturate-150 p-5 md:p-8 flex flex-col relative overflow-hidden transition-all duration-300 z-10 text-zinc-800 dark:text-[#e3e3e3] rounded-3xl";
      case "frameless":
        return "w-[95%] lg:w-[80%] max-w-7xl h-[95%] lg:h-[85%] bg-[#fdfbf7]/85 dark:bg-[#161513]/85 backdrop-blur-md border border-amber-700/20 shadow-[0_12px_40px_rgba(180,83,9,0.08)] p-5 md:p-8 flex flex-col relative overflow-hidden transition-all duration-300 z-10 text-zinc-800 dark:text-[#e3e3e3] rounded-3xl before:absolute before:inset-1 before:rounded-[22px] before:border-2 before:border-double before:border-amber-700/15 before:pointer-events-none";
      case "neobrutalist":
        return "w-[95%] lg:w-[80%] max-w-7xl h-[95%] lg:h-[85%] bg-[#FFF6E9] dark:bg-zinc-900 border-4 border-black dark:border-white shadow-[8px_8px_0px_0px_#000000] dark:shadow-[8px_8px_0px_0px_#ffffff] p-5 md:p-8 flex flex-col relative overflow-hidden transition-all duration-300 z-10 text-zinc-800 dark:text-[#e3e3e3] rounded-none";
      case "classic":
      default:
        return `w-[95%] lg:w-[80%] max-w-7xl h-[95%] lg:h-[85%] bg-white/90 dark:bg-zinc-950/80 backdrop-blur-xl border border-zinc-200/50 dark:border-zinc-800/40 p-5 md:p-8 flex flex-col relative overflow-hidden transition-all duration-300 z-10 text-zinc-800 dark:text-[#e3e3e3] ${
          getBorderRadiusClass(customization?.cardBorderRadius)
        } ${
          getShadowClass(customization?.cardShadow)
        }`;
    }
  };

  const getSubPanelClasses = (style?: string) => {
    switch (style) {
      case "glass":
        return "w-full lg:w-1/2 flex flex-col bg-white/10 dark:bg-black/25 backdrop-blur-md p-5 border border-white/10 rounded-2xl";
      case "frameless":
        return "w-full lg:w-1/2 flex flex-col bg-[#fcf9f2]/60 dark:bg-stone-900/40 backdrop-blur-sm border border-amber-700/10 p-5 rounded-2xl";
      case "neobrutalist":
        return "w-full lg:w-1/2 flex flex-col bg-white dark:bg-zinc-800 p-5 border-4 border-black dark:border-white shadow-[4px_4px_0px_0px_#000000] dark:shadow-[4px_4px_0px_0px_#ffffff] rounded-none";
      case "classic":
      default:
        return `w-full lg:w-1/2 flex flex-col bg-zinc-50/50 dark:bg-zinc-950/20 p-5 border border-zinc-200/60 dark:border-zinc-800/60 ${
          getBorderRadiusClass(customization?.cardBorderRadius)
        }`;
    }
  };

  const getRightPanelClasses = (style?: string, extra = "") => {
    switch (style) {
      case "glass":
        return `flex flex-col gap-4 bg-white/10 dark:bg-black/25 backdrop-blur-md p-5 border border-white/10 rounded-2xl ${extra}`;
      case "frameless":
        return `flex flex-col gap-4 bg-[#fcf9f2]/60 dark:bg-stone-900/40 backdrop-blur-sm border border-amber-700/10 p-5 rounded-2xl ${extra}`;
      case "neobrutalist":
        return `flex flex-col gap-4 bg-white dark:bg-zinc-800 border-4 border-black dark:border-white shadow-[4px_4px_0px_0px_#000000] dark:shadow-[4px_4px_0px_0px_#ffffff] p-5 rounded-none ${extra}`;
      case "classic":
      default:
        return `flex flex-col gap-4 bg-zinc-50/50 dark:bg-zinc-950/20 p-5 border border-zinc-200/60 dark:border-zinc-800/60 rounded-2xl ${extra} ${
          getBorderRadiusClass(customization?.cardBorderRadius)
        }`;
    }
  };

  const getShareButtonClasses = (style?: string, variant: "whatsapp" | "email" | "airdrop" = "whatsapp") => {
    const base = "flex items-center justify-center gap-1.5 py-2 px-3 transition-all font-semibold text-xs text-center cursor-pointer no-underline select-none w-full";
    switch (style) {
      case "neobrutalist":
        return `${base} rounded-none border-4 border-black dark:border-white shadow-[2px_2px_0px_0px_#000000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#000000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none bg-[#FFF6E9] text-black dark:bg-zinc-800 dark:text-white`;
      case "glass":
        return `${base} bg-white/10 dark:bg-black/15 backdrop-blur-sm border border-white/20 hover:bg-white/20 text-white rounded-xl`;
      case "frameless":
        return `${base} bg-white/50 dark:bg-black/20 border border-amber-700/15 hover:bg-[#fcf9f2]/80 dark:hover:bg-stone-900/60 rounded-xl text-amber-800 dark:text-amber-500 font-serif`;
      default:
        if (variant === "whatsapp") {
          return `${base} border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100/50 dark:hover:bg-emerald-950/40 rounded-xl`;
        } else if (variant === "email") {
          return `${base} border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100/50 dark:hover:bg-zinc-800 rounded-xl`;
        } else {
          return `${base} border border-blue-200 dark:border-blue-900/40 bg-blue-50/50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100/50 dark:hover:bg-blue-950/40 rounded-xl`;
        }
    }
  };

  const getBottomButtonClasses = (style?: string, isPrimary = false) => {
    const base = "font-semibold py-3.5 px-8 transition-all text-xs tracking-wider flex items-center justify-center gap-1.5 cursor-pointer border-none shadow-md";
    switch (style) {
      case "neobrutalist":
        return isPrimary 
          ? "font-semibold py-3.5 px-8 transition-all text-xs tracking-wider flex items-center justify-center gap-1.5 cursor-pointer rounded-none border-4 border-black dark:border-white font-black uppercase text-white shadow-[4px_4px_0px_0px_#000000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[3px_3px_0px_0px_#000000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none bg-[#ea580c]"
          : "font-semibold py-3.5 px-8 transition-all text-xs tracking-wider flex items-center justify-center gap-1.5 cursor-pointer rounded-none border-4 border-black dark:border-white font-black uppercase text-black dark:text-white shadow-[4px_4px_0px_0px_#000000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[3px_3px_0px_0px_#000000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none bg-white dark:bg-zinc-800";
      case "glass":
        return `${base} bg-white/20 dark:bg-white/10 hover:bg-white/30 border border-white/20 text-white font-extrabold uppercase rounded-xl`;
      case "frameless":
        return `${base} bg-gradient-to-r from-amber-700 via-rose-700 to-amber-700 hover:from-amber-600 hover:via-rose-600 hover:to-amber-600 text-white font-serif font-bold uppercase rounded-xl hover:-translate-y-0.5 active:translate-y-0 shadow-md hover:shadow-lg`;
      default:
        if (isPrimary) {
          return `${base} bg-emerald-600 hover:bg-emerald-500 text-white hover:scale-[1.01] active:scale-[0.99] shadow-md`;
        } else {
          return `${base} bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 hover:scale-[1.01] active:scale-[0.99] shadow-md`;
        }
    }
  };

  const getManualButtonClasses = (style?: string) => {
    const base = "transition-all text-xs tracking-wider flex items-center justify-center gap-1.5 cursor-pointer h-10 px-4 font-semibold";
    switch (style) {
      case "neobrutalist":
        return `${base} rounded-none border-4 border-black dark:border-white font-black bg-white text-black hover:bg-zinc-100 shadow-[3px_3px_0px_0px_#000000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_#000000] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none`;
      case "glass":
        return `${base} rounded-xl bg-transparent border border-white/20 text-white hover:bg-white/10`;
      default:
        return `${base} rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900`;
    }
  };



  const emailUrl = useMemo(() => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const shareLink = photoId ? `${origin}/share/${photoId}` : "";
    const subject = encodeURIComponent(`Foto & Video Photobooth - ${config.eventName}`);
    const body = encodeURIComponent(
      `Halo ${customerName},\n\nTerima kasih telah berkunjung ke ${config.eventName.trim()}!\n\nBerikut hasil photobooth kamu dari sesi ini:\n${shareLink}\n\nSalam,\nGlow Photobooth`
    );
    return `mailto:?subject=${subject}&body=${body}`;
  }, [customerName, config.eventName, photoId]);

  const handleNativeShare = async () => {
    const selectedAssets = assets.filter(a => selectedIds.includes(a.id) && a.url);
    if (selectedAssets.length === 0) {
      toast.error("Tidak ada aset terpilih untuk dibagikan!");
      return;
    }

    setIsSharing(true);
    try {
      const files: File[] = [];
      for (const asset of selectedAssets) {
        if (!asset.url) continue;
        const response = await fetch(asset.url);
        const blob = await response.blob();
        
        let mimeType = blob.type;
        if (asset.type === "video") {
          mimeType = "video/webm";
        } else if (asset.type === "photo" || asset.type === "strip") {
          mimeType = "image/png";
        }

        const file = new File([blob], asset.filename, { type: mimeType });
        files.push(file);
      }

      if (navigator.canShare && navigator.canShare({ files })) {
        await navigator.share({
          files,
          title: `Hasil Photobooth - ${config.eventName}`,
          text: `Halo, berikut hasil dari sesi photobooth ${config.eventName}!`,
        });
        toast.success("Berhasil membuka menu bagikan!");
      } else {
        toast.error("Bagikan langsung tidak didukung di browser ini. Gunakan Safari/Chrome Mobile, atau unduh berkas secara manual.");
      }
    } catch (err: any) {
      if (err instanceof DOMException && err.name === "AbortError") {
        console.log("Native share canceled by user");
        return;
      }
      console.error("Share error:", err);
      toast.error("Gagal memicu menu bagikan.");
    } finally {
      setIsSharing(false);
    }
  };

  const [isWaSharing, setIsWaSharing] = useState(false);

  const handleWhatsAppShare = async (e: React.MouseEvent<HTMLButtonElement>) => {
    if (typeof window === "undefined" || !activeAsset?.url) return;

    // Prevent default navigation to handle sharing manually
    e.preventDefault();
    setIsWaSharing(true);

    try {
      const response = await fetch(activeAsset.url);
      const blob = await response.blob();

      let mimeType = blob.type;
      if (activeAsset.type === "video") {
        mimeType = "video/webm";
      } else if (activeAsset.type === "photo" || activeAsset.type === "strip") {
        mimeType = "image/png";
      }

      const file = new File([blob], activeAsset.filename, { type: mimeType });

      // 1. Mobile/Tablet: Gunakan Web Share API jika didukung untuk langsung mengirim berkas file
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        const origin = window.location.origin;
        const shareLink = photoId ? `${origin}/share/${photoId}` : "";
        const caption = `Halo ${customerName}, terima kasih telah berkunjung ke ${config.eventName.trim()}! Berikut hasil photobooth kamu:\n\n${shareLink}`;

        await navigator.share({
          files: [file],
          title: activeAsset.name,
          text: caption,
        });
        toast.success("Berhasil memicu menu bagikan berkas!");
      } 
      // 2. Desktop/PC: Salin gambar ke clipboard agar user tinggal Paste (Ctrl+V / Cmd+V) di WhatsApp
      else {
        let copied = false;
        if (mimeType === "image/png" && navigator.clipboard && window.ClipboardItem) {
          try {
            const pngBlob = blob.type === "image/png" ? blob : new Blob([blob], { type: "image/png" });
            await navigator.clipboard.write([
              new ClipboardItem({
                "image/png": pngBlob
              })
            ]);
            copied = true;
          } catch (clipErr) {
            console.warn("Failed to write image to clipboard:", clipErr);
          }
        }

        if (copied) {
          toast.success("Gambar disalin ke clipboard! Silakan buka WhatsApp dan tempel (Paste / Cmd+V) langsung di chat.");
        } else {
          toast.error("Salin gambar ke clipboard tidak didukung di browser ini. Silakan unduh gambar dan seret ke chat.");
        }
      }
    } catch (err: any) {
      if (err instanceof DOMException && err.name === "AbortError") {
        console.log("WhatsApp share canceled by user");
        return;
      }
      console.error("WhatsApp share error:", err);
      toast.error("Gagal memproses gambar untuk WhatsApp.");
    } finally {
      setIsWaSharing(false);
    }
  };

  const [isEmailSharing, setIsEmailSharing] = useState(false);

  const handleEmailShare = async (e: React.MouseEvent<HTMLButtonElement>) => {
    if (typeof window === "undefined" || !activeAsset?.url) return;

    e.preventDefault();
    setIsEmailSharing(true);

    try {
      const response = await fetch(activeAsset.url);
      const blob = await response.blob();

      let mimeType = blob.type;
      if (activeAsset.type === "video") {
        mimeType = "video/webm";
      } else if (activeAsset.type === "photo" || activeAsset.type === "strip") {
        mimeType = "image/png";
      }

      const file = new File([blob], activeAsset.filename, { type: mimeType });

      // 1. Mobile/Tablet: Gunakan Web Share API jika didukung
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        const origin = window.location.origin;
        const shareLink = photoId ? `${origin}/share/${photoId}` : "";
        const body = `Halo ${customerName},\n\nTerima kasih telah berkunjung ke ${config.eventName.trim()}!\n\nBerikut hasil photobooth kamu:\n${shareLink}`;

        await navigator.share({
          files: [file],
          title: `Foto & Video Photobooth - ${config.eventName}`,
          text: body,
        });
        toast.success("Berhasil memicu bagikan berkas ke Email!");
      } 
      // 2. Desktop/PC: Salin gambar ke clipboard + buka aplikasi Email default
      else {
        let copied = false;
        if (mimeType === "image/png" && navigator.clipboard && window.ClipboardItem) {
          try {
            const pngBlob = blob.type === "image/png" ? blob : new Blob([blob], { type: "image/png" });
            await navigator.clipboard.write([
              new ClipboardItem({
                "image/png": pngBlob
              })
            ]);
            copied = true;
          } catch (clipErr) {
            console.warn("Failed to write image to clipboard for email:", clipErr);
          }
        }

        // Buka email composer
        window.location.href = emailUrl;

        if (copied) {
          toast.success("Gambar disalin ke clipboard! Tempel (Paste / Cmd+V) langsung di badan email.");
        } else {
          toast.success("Membuka aplikasi Email. Silakan bagikan tautan atau lampirkan hasil unduhan.");
        }
      }
    } catch (err: any) {
      if (err instanceof DOMException && err.name === "AbortError") {
        console.log("Email share canceled by user");
        return;
      }
      console.error("Email share error:", err);
      window.location.href = emailUrl;
    } finally {
      setIsEmailSharing(false);
    }
  };

  // Generate slideshow video loop from captured individual photos
  useEffect(() => {
    if (capturedPhotos.length === 0) return;

    let active = true;
    const generateVideo = async () => {
      try {
        setIsVideoLoading(true);
        const result = await generateSlideshowVideo(capturedPhotos);
        if (active) {
          setVideoUrl(result.url);
          setVideoExtension(result.extension);
        }
      } catch (err) {
        console.error("Failed to generate slideshow video:", err);
      } finally {
        if (active) {
          setIsVideoLoading(false);
        }
      }
    };

    generateVideo();
    return () => {
      active = false;
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
      }
    };
  }, [capturedPhotos]);

  // Build the list of available assets dynamically
  const assets = useMemo((): AssetItem[] => {
    const list: AssetItem[] = [];
    
    if (compiledStripUrl) {
      list.push({
        id: "strip",
        name: "Foto Strip Final",
        type: "strip",
        url: compiledStripUrl,
        filename: `${config.eventName.replace(/\s+/g, "_")}_session_${currentSessionNum}_strip.png`,
        thumbnail: compiledStripUrl,
      });
    }

    capturedPhotos.forEach((photo, idx) => {
      list.push({
        id: `photo_${idx}`,
        name: `Foto Satuan ${idx + 1}`,
        type: "photo",
        url: photo,
        filename: `${config.eventName.replace(/\s+/g, "_")}_session_${currentSessionNum}_photo_${idx + 1}.png`,
        thumbnail: photo,
      });
    });

    if (videoUrl) {
      list.push({
        id: "video",
        name: "Video Kumpulan Foto",
        type: "video",
        url: videoUrl,
        filename: `${config.eventName.replace(/\s+/g, "_")}_session_${currentSessionNum}_video.${videoExtension}`,
        thumbnail: capturedPhotos[0] || null,
      });
    }

    return list;
  }, [compiledStripUrl, capturedPhotos, videoUrl, videoExtension, config.eventName, currentSessionNum]);

  // Select all assets by default when they first load
  useEffect(() => {
    if (assets.length > 0 && selectedIds.length === 0) {
      setSelectedIds(assets.map(a => a.id));
    }
  }, [assets]);

  // Handle active preview fallback if previous selection becomes invalid
  useEffect(() => {
    if (assets.length > 0 && !assets.some(a => a.id === activePreviewId)) {
      setActivePreviewId(assets[0].id);
    }
  }, [assets, activePreviewId]);

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === assets.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(assets.map(a => a.id));
    }
  };

  const handleDownloadSingle = async (asset: AssetItem) => {
    if (!asset.url) return;
    try {
      const response = await fetch(asset.url);
      const blob = await response.blob();
      const localUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = asset.filename;
      link.href = localUrl;
      link.click();
      setTimeout(() => URL.revokeObjectURL(localUrl), 100);
      toast.success(`Mengunduh ${asset.name}`);
    } catch (err) {
      const link = document.createElement("a");
      link.download = asset.filename;
      link.href = asset.url;
      link.click();
      toast.success(`Mengunduh ${asset.name}`);
    }
  };

  const handleDownloadZip = async () => {
    if (selectedIds.length === 0) {
      toast.error("Pilih minimal satu aset untuk diunduh!");
      return;
    }

    setIsZipLoading(true);
    try {
      const zip = new JSZip();
      const selectedAssets = assets.filter(a => selectedIds.includes(a.id));

      for (const asset of selectedAssets) {
        if (asset.url) {
          const res = await fetch(asset.url);
          const blob = await res.blob();
          zip.file(asset.filename, blob);
        }
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const zipUrl = URL.createObjectURL(zipBlob);

      const link = document.createElement("a");
      link.download = `${config.eventName.replace(/\s+/g, "_")}_session_${currentSessionNum}_assets.zip`;
      link.href = zipUrl;
      link.click();

      URL.revokeObjectURL(zipUrl);
      toast.success("Berhasil mengunduh semua file (.ZIP)!");
    } catch (err) {
      console.error("ZIP creation error:", err);
      toast.error("Gagal mengompresi file ke ZIP.");
    } finally {
      setIsZipLoading(false);
    }
  };

  const getButtonStyle = (isPrimaryButton = false) => {
    const styles: React.CSSProperties = {};
    if (customization?.primaryColor) {
      if (customization.buttonStyle === "outline") {
        styles.border = `2px solid ${customization.primaryColor}`;
        styles.color = customization.primaryColor;
        styles.backgroundColor = "transparent";
      } else if (customization.buttonStyle === "gradient") {
        styles.backgroundImage = `linear-gradient(to right, ${customization.primaryColor}, ${adjustColorBrightness(customization.primaryColor, -30)})`;
        styles.color = customization.customButtonTextColor || (isColorLight(customization.primaryColor) ? "#09090b" : "#ffffff");
        styles.border = "none";
      } else {
        styles.backgroundColor = customization.primaryColor;
        styles.color = customization.customButtonTextColor || (isColorLight(customization.primaryColor) ? "#09090b" : "#ffffff");
        styles.border = "none";
      }
    } else if (isPrimaryButton) {
      styles.backgroundColor = "#059669";
      styles.color = "#ffffff";
      styles.border = "none";
    }
    return styles;
  };

  const bgTheme = config.bgTheme || "sunset";
  const themeGlow = THEME_GLOWS[bgTheme as keyof typeof THEME_GLOWS] || THEME_GLOWS.sunset;

  const activeAsset = assets.find(a => a.id === activePreviewId) || assets[0];

  if (customization?.hideQrShare && customization?.hideCompiledStrip && customization?.hidePrintBtn) {
    return (
      <div className="h-screen w-screen bg-[#FFFBF7] dark:bg-[#0b0b0c] flex items-center justify-center p-4 md:p-8 select-none relative overflow-hidden transition-colors duration-300">
        <div className="max-w-md w-full min-h-[300px] bg-zinc-950/40 border-2 border-dashed border-zinc-800/80 rounded-3xl flex flex-col items-center justify-center p-8 text-center gap-3 z-10">
          <div className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-550">
            <Share2 className="w-6 h-6 text-zinc-400" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-zinc-300">Layar Berbagi Dinonaktifkan</h3>
            <p className="text-xs text-zinc-550 max-w-[250px] leading-relaxed mx-auto">
              Aktifkan widget berbagi, pratinjau strip foto, atau tombol cetak di sidebar untuk menampilkan layar ini.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-[#FFFBF7] dark:bg-[#0b0b0c] flex items-center justify-center p-4 md:p-8 select-none relative overflow-hidden transition-colors duration-300">
      {/* Visual Ambient Background Glows */}
      <div className={`absolute top-[-10%] left-[-10%] w-[40%] aspect-square rounded-full blur-[100px] pointer-events-none z-0 animate-pulse ${themeGlow.topLeft}`} style={{ animationDuration: '8s' }} />
      <div className={`absolute bottom-[-10%] right-[-10%] w-[40%] aspect-square rounded-full blur-[100px] pointer-events-none z-0 animate-pulse ${themeGlow.bottomRight}`} style={{ animationDuration: '10s' }} />
      
      <div 
        className={getCardStyleClasses(cardStyle)}
        style={{ 
          fontFamily: getFontFamilyName(config.fontStyle || 'inter'),
          ...(customization?.primaryColor && cardStyle !== "neobrutalist" && cardStyle !== "glass" && cardStyle !== "frameless" ? { borderColor: `${customization.primaryColor}30` } : {})
        }}
      >
        {/* Top Header Section */}
        <div className={`flex items-center justify-between w-full border-b ${cardStyle === "neobrutalist" ? "border-black dark:border-white" : "border-zinc-200/50 dark:border-zinc-800/40"} pb-4 select-none`}>
          <div className="flex items-center gap-3">
            {config.logoUrl && !customization?.hideLogo && (
              <div className={`w-8 h-8 rounded-xl overflow-hidden bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center border border-zinc-200/50 dark:border-zinc-800/40 shrink-0 ${cardStyle === "neobrutalist" ? "border-2 border-black rounded-none" : ""}`}>
                <img src={config.logoUrl} alt="Logo" className="w-full h-full object-contain" />
              </div>
            )}
            <div className="flex flex-col text-left">
              <span className={`text-xs font-bold text-zinc-900 dark:text-zinc-100 leading-none ${cardStyle === "neobrutalist" ? "uppercase font-black" : ""}`}>
                Sesi Selesai! Simpan Aset Anda
              </span>
              <span className="text-[9px] text-zinc-400 dark:text-zinc-500 font-mono tracking-wide mt-1 leading-none">
                Pengunjung: {customerName} ({customerPhone})
              </span>
            </div>
          </div>
          <div className={`inline-flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-400 font-mono text-[10px] font-bold px-3 py-1.5 rounded-xl uppercase tracking-wider ${cardStyle === "neobrutalist" ? "border-2 border-black rounded-none bg-[#FFF6E9] text-black" : ""}`}
               style={customization?.primaryColor && cardStyle !== "neobrutalist" ? { color: customization.primaryColor, borderColor: `${customization.primaryColor}30`, backgroundColor: `${customization.primaryColor}10` } : undefined}>
            Sesi {currentSessionNum} dari {sessionsCount}
          </div>
        </div>

        {/* 2 Columns Layout */}
        <div className="flex-1 w-full flex flex-col lg:flex-row gap-4 lg:gap-8 justify-center items-stretch overflow-y-auto pr-1 mt-4">
          
          {/* Column 1: Asset list checklist */}
          <div 
            className={getSubPanelClasses(cardStyle)}
            style={customization?.primaryColor && cardStyle !== "neobrutalist" && cardStyle !== "glass" && cardStyle !== "frameless" ? { borderColor: `${customization.primaryColor}20` } : undefined}
          >
            <div className={`flex justify-between items-center mb-4 pb-2 border-b ${cardStyle === "neobrutalist" ? "border-black dark:border-white" : "border-zinc-200/50 dark:border-zinc-800/60"} w-full`}>
              <span className={`text-xs font-bold text-zinc-700 dark:text-zinc-300 ${cardStyle === "neobrutalist" ? "uppercase font-black" : ""}`}>Pilih Aset untuk Diunduh</span>
              
              <button
                onClick={handleSelectAll}
                className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 transition-colors flex items-center gap-1 cursor-pointer select-none"
                style={customization?.primaryColor && cardStyle !== "neobrutalist" ? { color: customization.primaryColor } : undefined}
              >
                {selectedIds.length === assets.length ? (
                  <>
                    <CheckSquare className="w-3.5 h-3.5" />
                    <span>Batal Pilih Semua</span>
                  </>
                ) : (
                  <>
                    <Square className="w-3.5 h-3.5" />
                    <span>Pilih Semua</span>
                  </>
                )}
              </button>
            </div>

            {/* List items scrollable wrapper */}
            <div className="flex flex-col gap-2 max-h-[340px] overflow-y-auto pr-1">
              {assets.map((asset) => {
                const isSelected = selectedIds.includes(asset.id);
                const isActive = activePreviewId === asset.id;
                
                return (
                  <div
                    key={asset.id}
                    onClick={() => setActivePreviewId(asset.id)}
                    className={`flex items-center justify-between p-3 border transition-all cursor-pointer select-none ${
                      isActive
                        ? customization?.primaryColor && cardStyle !== "neobrutalist" && cardStyle !== "glass" && cardStyle !== "frameless"
                          ? `border-${customization.primaryColor} bg-emerald-50/5 dark:bg-emerald-950/10` 
                          : "border-emerald-500/60 bg-emerald-50/5 dark:bg-emerald-950/10"
                        : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 hover:border-zinc-300 dark:hover:border-zinc-700"
                    } ${
                      cardStyle === "neobrutalist"
                        ? isActive
                          ? "border-4 border-[#ea580c] rounded-none bg-[#FFF6E9] dark:bg-zinc-900"
                          : "border-4 border-black dark:border-white rounded-none"
                        : cardStyle === "glass"
                          ? isActive
                            ? "border border-white/40 bg-white/20 rounded-2xl"
                            : "border border-white/10 bg-white/5 rounded-2xl"
                          : getBorderRadiusClass(customization?.cardBorderRadius)
                    }`}
                    style={isActive && customization?.primaryColor && cardStyle !== "neobrutalist" && cardStyle !== "glass" && cardStyle !== "frameless" ? { borderColor: customization.primaryColor } : undefined}
                  >
                    <div className="flex items-center gap-3">
                      {/* Checkbox */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleSelect(asset.id);
                        }}
                        className="text-zinc-400 dark:text-zinc-650 hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors"
                        style={customization?.primaryColor && cardStyle !== "neobrutalist" ? { color: customization.primaryColor } : undefined}
                      >
                        {isSelected ? (
                          <CheckSquare className="w-5 h-5" style={customization?.primaryColor && cardStyle !== "neobrutalist" ? { color: customization.primaryColor } : { color: "#10b981" }} />
                        ) : (
                          <Square className="w-5 h-5" />
                        )}
                      </button>

                      {/* Thumbnail */}
                      <div className={`w-10 h-10 overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-950 flex items-center justify-center shrink-0 ${
                        cardStyle === "neobrutalist" ? "border-2 border-black rounded-none" : getBorderRadiusClass(customization?.cardBorderRadius)
                      }`}>
                        {asset.type === "video" && isVideoLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin text-emerald-500" style={customization?.primaryColor && cardStyle !== "neobrutalist" ? { color: customization.primaryColor } : undefined} />
                        ) : asset.thumbnail ? (
                          <img src={asset.thumbnail} alt={asset.name} className="w-full h-full object-cover" />
                        ) : asset.type === "video" ? (
                          <Video className="w-4 h-4 text-zinc-400" />
                        ) : (
                          <ImageIcon className="w-4 h-4 text-zinc-400" />
                        )}
                      </div>

                      {/* Title & info */}
                      <div className="flex flex-col text-left">
                        <span className={`text-xs font-bold text-zinc-800 dark:text-zinc-200 ${cardStyle === "neobrutalist" ? "uppercase font-black" : ""}`}>{asset.name}</span>
                        <span className="text-[9px] font-mono text-zinc-400 dark:text-zinc-500 uppercase mt-0.5 tracking-wide">
                          {asset.type === "video" ? "Video Loop" : (asset.type === "strip" ? "Foto Strip" : "Foto Satuan")}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownloadSingle(asset);
                        }}
                        disabled={!asset.url}
                        className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-white transition-all cursor-pointer"
                        title="Unduh file ini"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* QR Code for Mobile Download */}
            {photoId && (
              customization?.hideQrShare ? (
                <div 
                  className={getSubPanelClasses(cardStyle)}
                  style={{
                    marginTop: "1.25rem",
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "1rem",
                    width: "100%",
                    borderStyle: "dashed",
                    borderWidth: "2px",
                    borderColor: "#3f3f46",
                    minHeight: "121px"
                  }}
                >
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider text-center">QR Download Dinonaktifkan</p>
                </div>
              ) : (
                <div 
                  className={getSubPanelClasses(cardStyle)}
                  style={{
                    marginTop: "1.25rem",
                    flexDirection: "row",
                    alignItems: "center",
                    gap: "1rem",
                    width: "100%",
                    ...(customization?.primaryColor && cardStyle !== "neobrutalist" && cardStyle !== "glass" && cardStyle !== "frameless" ? { borderColor: `${customization.primaryColor}20` } : {})
                  }}
                >
                  <div className={`p-2 bg-white border border-zinc-250 shrink-0 shadow-sm ${
                    cardStyle === "neobrutalist" ? "border-2 border-black rounded-none" : getBorderRadiusClass(customization?.cardBorderRadius)
                  }`}>
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&color=${(customization?.primaryColor || "#059669").replace("#", "")}&bgcolor=ffffff&data=${encodeURIComponent(
                        `${typeof window !== "undefined" ? window.location.origin : ""}/share/${photoId}`
                      )}`}
                      alt="Download QR Code"
                      className="w-[85px] h-[85px] rounded object-contain"
                    />
                  </div>
                  <div className="flex flex-col justify-center text-left">
                    <span className="text-[10px] text-zinc-500 font-mono tracking-wider uppercase font-semibold" style={customization?.primaryColor && cardStyle !== "neobrutalist" ? { color: customization.primaryColor } : undefined}>
                      Scan QR Code HP
                    </span>
                    <p className={`text-xs font-bold text-zinc-800 dark:text-zinc-200 mt-1 leading-snug ${cardStyle === "neobrutalist" ? "uppercase font-black" : ""}`}>
                      Buka di Handphone
                    </p>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-500 mt-0.5 leading-normal text-left">
                      Pindai QR ini untuk mengunduh dan menyimpan foto langsung di galeri handphone Anda.
                    </p>
                  </div>
                </div>
              )
            )}
          </div>

          {/* Column 2: Dynamic high-res preview panel & actions split */}
          <div className="w-full lg:w-1/2 flex flex-col gap-4">
            
            {/* Card 1: Pratinjau Aset */}
            <div 
              className={getRightPanelClasses(cardStyle, "flex-1 items-center justify-center")}
              style={customization?.primaryColor && cardStyle !== "neobrutalist" && cardStyle !== "glass" && cardStyle !== "frameless" ? { borderColor: `${customization.primaryColor}20` } : undefined}
            >
              <div className="flex items-center gap-1.5 self-start mb-1 text-zinc-700 dark:text-zinc-300 select-none">
                {activeAsset?.type === "video" ? (
                  <Video className="w-4 h-4 text-emerald-500" style={customization?.primaryColor && cardStyle !== "neobrutalist" ? { color: customization.primaryColor } : undefined} />
                ) : (
                  <ImageIcon className="w-4 h-4 text-emerald-500" style={customization?.primaryColor && cardStyle !== "neobrutalist" ? { color: customization.primaryColor } : undefined} />
                )}
                <span className="text-xs font-bold font-sans">Pratinjau Aset: {activeAsset?.name || "Foto Strip Final"}</span>
              </div>

              <div className="flex-1 flex items-center justify-center w-full min-h-[300px]">
                {customization?.hideCompiledStrip && activeAsset?.type === "strip" ? (
                  <div className="w-full h-full min-h-[300px] flex flex-col items-center justify-center p-6 text-center gap-3 bg-zinc-50/50 dark:bg-zinc-900/45 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
                    <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 dark:text-zinc-500">
                      <ImageIcon className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Hasil Strip Foto Dinonaktifkan</h3>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-[200px] leading-relaxed mx-auto">
                        Aktifkan widget ini di sidebar untuk menampilkan preview cetak strip foto.
                      </p>
                    </div>
                  </div>
                ) : activeAsset?.type === "video" ? (
                  isVideoLoading ? (
                    <div className="flex flex-col items-center gap-2 text-zinc-400">
                      <Loader2 className="w-6 h-6 animate-spin text-emerald-500" style={customization?.primaryColor && cardStyle !== "neobrutalist" ? { color: customization.primaryColor } : undefined} />
                      <span className="text-[10px] font-mono">Membuat video...</span>
                    </div>
                  ) : activeAsset.url ? (
                    <div className={`w-full aspect-[4/3] max-h-[380px] overflow-hidden bg-black border ${cardStyle === "neobrutalist" ? "border-4 border-black dark:border-white rounded-none" : "border-zinc-200 dark:border-zinc-800 rounded-xl"}`}>
                      <video
                        src={activeAsset.url}
                        controls
                        loop
                        autoPlay
                        muted
                        playsInline
                        className="w-full h-full object-contain"
                      />
                    </div>
                  ) : (
                    <span className="text-xs text-zinc-400">Gagal membuat video</span>
                  )
                ) : activeAsset?.url ? (
                  activeAsset.type === "strip" ? (
                    <div 
                       className="relative rounded-xl max-h-[380px] w-full flex items-center justify-center p-4 select-none"
                      style={{ perspective: "1000px" }}
                    >
                      <div
                        className="transition-all duration-500 hover:scale-[1.03] relative overflow-hidden"
                        style={{
                          transform: "rotateY(-12deg) rotateX(8deg) rotateZ(-1.5deg)",
                          boxShadow: "15px 15px 40px rgba(0,0,0,0.22), -3px -3px 15px rgba(255,255,255,0.03)",
                          transformStyle: "preserve-3d",
                          borderRadius: cardStyle === "neobrutalist" ? "0" : "16px",
                        }}
                      >
                        {/* High-end Gloss Sheen Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none z-20" />
                        <img
                          src={activeAsset.url}
                          alt={activeAsset.name}
                          className={`object-contain max-h-[350px] aspect-[500/1202.5] w-[140px] relative z-10 ${cardStyle === "neobrutalist" ? "rounded-none" : "rounded-2xl"}`}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className={`relative border overflow-hidden bg-zinc-100 dark:bg-zinc-900 max-h-[380px] w-full flex items-center justify-center ${cardStyle === "neobrutalist" ? "border-4 border-black dark:border-white rounded-none shadow-[2px_2px_0px_0px_#000000]" : "border-zinc-200 dark:border-zinc-800 shadow-md rounded-xl"}`}>
                      <img
                        src={activeAsset.url}
                        alt={activeAsset.name}
                        className="object-contain max-h-[380px] aspect-[4/3] w-full"
                      />
                    </div>
                  )
                ) : (
                  <span className="text-xs text-zinc-400">Aset tidak ditemukan</span>
                )}
              </div>
            </div>

            {/* Card 2: Aksi Bagikan */}
            {customization?.hideQrShare ? (
              <div className={`${getRightPanelClasses(cardStyle)} border-2 border-dashed border-zinc-200 dark:border-zinc-850 flex flex-col items-center justify-center p-6 text-center gap-2 min-h-[110px]`}>
                <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono tracking-wider uppercase font-semibold">
                  Menu Share Dinonaktifkan
                </span>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 max-w-[200px] leading-relaxed mx-auto">
                  Aktifkan widget share di sidebar untuk mengaktifkan WhatsApp, Email, dan AirDrop.
                </p>
              </div>
            ) : (
              <div 
                className={getRightPanelClasses(cardStyle)}
                style={customization?.primaryColor && cardStyle !== "neobrutalist" && cardStyle !== "glass" && cardStyle !== "frameless" ? { borderColor: `${customization.primaryColor}20` } : undefined}
              >
                {/* Share Actions */}
                <div className="w-full flex flex-col gap-2">
                  <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono tracking-wider uppercase font-semibold text-left select-none">
                    Bagikan Aset Ini
                  </span>
                  <div className="grid grid-cols-3 gap-2 w-full">
                    {/* WhatsApp Button */}
                    <button
                      type="button"
                      onClick={handleWhatsAppShare}
                      className={getShareButtonClasses(cardStyle, "whatsapp")}
                      style={customization?.primaryColor && cardStyle !== "neobrutalist" ? { color: customization.primaryColor, borderColor: `${customization.primaryColor}40` } : undefined}
                    >
                      {isWaSharing ? (
                        <Loader2 className="w-4 h-4 animate-spin text-emerald-500" style={customization?.primaryColor && cardStyle !== "neobrutalist" ? { color: customization.primaryColor } : undefined} />
                      ) : (
                        <MessageCircle className="w-4 h-4" />
                      )}
                      <span>WhatsApp</span>
                    </button>

                    {/* Email Button */}
                    <button
                      type="button"
                      onClick={handleEmailShare}
                      className={getShareButtonClasses(cardStyle, "email")}
                    >
                      {isEmailSharing ? (
                        <Loader2 className="w-4 h-4 animate-spin text-zinc-500" />
                      ) : (
                        <Mail className="w-4 h-4" />
                      )}
                      <span>Email</span>
                    </button>

                    {/* Native Share / AirDrop Button */}
                    <button
                      type="button"
                      onClick={handleNativeShare}
                      disabled={isSharing || selectedIds.length === 0 || (selectedIds.includes("video") && isVideoLoading)}
                      className={getShareButtonClasses(cardStyle, "airdrop")}
                    >
                      {isSharing ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Share2 className="w-4 h-4" />
                      )}
                      <span>AirDrop</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>

        </div>

        {/* Selesai & Lanjut Button */}
        <div className={`border-t ${cardStyle === "neobrutalist" ? "border-black dark:border-white" : "border-zinc-200/50 dark:border-zinc-800/40"} pt-4 mt-4 flex justify-between items-center gap-3 select-none`}>
          {!customization?.hidePrintBtn ? (
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className={getBottomButtonClasses(cardStyle, true)}
                style={cardStyle !== "neobrutalist" && cardStyle !== "glass" && cardStyle !== "frameless" ? {
                  ...getButtonStyle(true),
                  borderRadius: getBorderRadiusClass(customization?.cardBorderRadius) === "rounded-none" ? "0" :
                                getBorderRadiusClass(customization?.cardBorderRadius) === "rounded-sm" ? "2px" :
                                getBorderRadiusClass(customization?.cardBorderRadius) === "rounded-md" ? "6px" :
                                getBorderRadiusClass(customization?.cardBorderRadius) === "rounded-xl" ? "12px" :
                                getBorderRadiusClass(customization?.cardBorderRadius) === "rounded-2xl" ? "16px" : "20px"
                } : undefined}
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Otomatis</span>
              </button>
              {handlePrintManual && (
                <button
                  type="button"
                  onClick={handlePrintManual}
                  className={getManualButtonClasses(cardStyle)}
                  title="Cetak lewat dialog browser jika cetak otomatis bermasalah"
                >
                  <span>Manual</span>
                </button>
              )}
            </div>
          ) : (
            <div />
          )}
          <button
            onClick={onComplete}
            className={getBottomButtonClasses(cardStyle, false)}
            style={cardStyle !== "neobrutalist" && cardStyle !== "glass" && cardStyle !== "frameless" ? {
              ...getButtonStyle(false),
              borderRadius: getBorderRadiusClass(customization?.cardBorderRadius) === "rounded-none" ? "0" :
                            getBorderRadiusClass(customization?.cardBorderRadius) === "rounded-sm" ? "2px" :
                            getBorderRadiusClass(customization?.cardBorderRadius) === "rounded-md" ? "6px" :
                            getBorderRadiusClass(customization?.cardBorderRadius) === "rounded-xl" ? "12px" :
                            getBorderRadiusClass(customization?.cardBorderRadius) === "rounded-2xl" ? "16px" : "20px"
            } : undefined}
          >
            <span>Selesai &amp; Sesi Baru</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

interface VideoResult {
  url: string;
  extension: "mp4" | "webm";
}

const generateSlideshowVideo = async (photos: string[]): Promise<VideoResult> => {
  if (typeof window === "undefined") {
    throw new Error("Window not defined");
  }

  const VideoEncoderClass = (window as any).VideoEncoder;
  const VideoFrameClass = (window as any).VideoFrame;

  // 1. Check if WebCodecs (VideoEncoder) is supported. If not, fallback to MediaRecorder.
  if (!VideoEncoderClass || !VideoFrameClass) {
    console.warn("WebCodecs VideoEncoder/VideoFrame not supported, falling back to MediaRecorder (WebM)");
    return generateSlideshowVideoFallback(photos);
  }

  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) return reject("Canvas context not available");

    const images: HTMLImageElement[] = [];
    let loadedCount = 0;

    const startRecordingWebCodecs = async () => {
      try {
        const muxer = new Muxer({
          target: new ArrayBufferTarget(),
          video: {
            codec: "avc", // H.264 Profile (widely compatible on iOS/iPhone)
            width: canvas.width,
            height: canvas.height,
          },
          fastStart: "in-memory"
        });

        let cachedDecoderConfig: any = null;
        const encoder = new VideoEncoderClass({
          output: (chunk: any, meta: any) => {
            const data = new Uint8Array(chunk.byteLength);
            chunk.copyTo(data);

            if (meta && meta.decoderConfig) {
              cachedDecoderConfig = meta.decoderConfig;
            }

            if (!cachedDecoderConfig) {
              cachedDecoderConfig = {
                codec: "avc1.42001f",
                width: canvas.width,
                height: canvas.height,
                description: new Uint8Array([1, 66, 0, 31, 255, 224, 0]),
                colorSpace: {
                  primaries: "bt709",
                  transfer: "bt709",
                  matrix: "bt709",
                  fullRange: false
                }
              };
            }

            const frameDurationUs = Math.round(1000000 / 20);
            const duration = (chunk.duration !== null && chunk.duration !== undefined && chunk.duration > 0)
              ? chunk.duration 
              : frameDurationUs;

            muxer.addVideoChunkRaw(
              data,
              chunk.type,
              chunk.timestamp,
              duration,
              { decoderConfig: cachedDecoderConfig }
            );
          },
          error: (e: any) => {
            console.error("VideoEncoder error:", e);
            generateSlideshowVideoFallback(photos).then(resolve).catch(reject);
          }
        });

        encoder.configure({
          codec: "avc1.42001f",
          width: canvas.width,
          height: canvas.height,
          bitrate: 1200000,
          framerate: 20
        });

        const frameRate = 20;
        const durationPerImage = 1.2;
        const framesPerImage = durationPerImage * frameRate;
        const totalFrames = images.length * framesPerImage;

        for (let currentFrame = 0; currentFrame < totalFrames; currentFrame++) {
          const imageIndex = Math.floor(currentFrame / framesPerImage) % images.length;
          const img = images[imageIndex];

          ctx.fillStyle = "#0d0d10";
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          if (img) {
            const canvasAspect = canvas.width / canvas.height;
            const imgAspect = img.width / img.height;
            let drawWidth = canvas.width;
            let drawHeight = canvas.height;
            let drawX = 0;
            let drawY = 0;

            if (imgAspect > canvasAspect) {
              drawWidth = canvas.height * imgAspect;
              drawX = (canvas.width - drawWidth) / 2;
            } else {
              drawHeight = canvas.width / imgAspect;
              drawY = (canvas.height - drawHeight) / 2;
            }

            ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
          }

          const timestampUs = Math.round((currentFrame * 1000000) / frameRate);
          const frame = new VideoFrameClass(canvas, { timestamp: timestampUs });

          const isKeyFrame = currentFrame % framesPerImage === 0;
          encoder.encode(frame, { keyFrame: isKeyFrame });
          frame.close();
        }

        await encoder.flush();
        muxer.finalize();

        const buffer = muxer.target.buffer;
        const blob = new Blob([buffer], { type: "video/mp4" });
        resolve({
          url: URL.createObjectURL(blob),
          extension: "mp4"
        });

      } catch (err) {
        console.error("WebCodecs failed:", err);
        generateSlideshowVideoFallback(photos).then(resolve).catch(reject);
      }
    };

    photos.forEach((src, index) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        images[index] = img;
        loadedCount++;
        if (loadedCount === photos.length) {
          startRecordingWebCodecs();
        }
      };
      img.onerror = () => {
        loadedCount++;
        if (loadedCount === photos.length) {
          startRecordingWebCodecs();
        }
      };
      img.src = src;
    });
  });
};

const generateSlideshowVideoFallback = (photos: string[]): Promise<VideoResult> => {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.MediaRecorder) {
      return reject("MediaRecorder not supported");
    }

    const canvas = document.createElement("canvas");
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) return reject("Canvas context not available");

    const images: HTMLImageElement[] = [];
    let loadedCount = 0;

    const startRecording = () => {
      try {
        let stream: MediaStream;
        if (canvas.captureStream) {
          stream = canvas.captureStream(20);
        } else if ((canvas as any).mozCaptureStream) {
          stream = (canvas as any).mozCaptureStream(20);
        } else {
          return reject("Canvas stream capture not supported");
        }

        let options = { mimeType: "video/webm;codecs=vp9" };
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
          options = { mimeType: "video/webm;codecs=vp8" };
        }
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
          options = { mimeType: "video/webm" };
        }
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
          options = { mimeType: "video/mp4" };
        }
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
          options = { mimeType: "" };
        }

        const mediaRecorder = new MediaRecorder(stream, options);
        const chunks: Blob[] = [];

        mediaRecorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            chunks.push(e.data);
          }
        };

        mediaRecorder.onstop = () => {
          const mime = mediaRecorder.mimeType || "video/webm";
          const isMp4 = mime.includes("mp4") || mime.includes("quicktime");
          const blob = new Blob(chunks, { type: mime });
          resolve({
            url: URL.createObjectURL(blob),
            extension: isMp4 ? "mp4" : "webm"
          });
        };

        mediaRecorder.start();

        const frameRate = 20;
        const durationPerImage = 1.2;
        const totalFrames = images.length * durationPerImage * frameRate;
        let currentFrame = 0;

        const drawFrame = () => {
          if (currentFrame >= totalFrames) {
            mediaRecorder.stop();
            return;
          }

          const imageIndex = Math.floor(currentFrame / (durationPerImage * frameRate)) % images.length;
          const img = images[imageIndex];

          if (img) {
            ctx.fillStyle = "#0d0d10";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const canvasAspect = canvas.width / canvas.height;
            const imgAspect = img.width / img.height;
            let drawWidth = canvas.width;
            let drawHeight = canvas.height;
            let drawX = 0;
            let drawY = 0;

            if (imgAspect > canvasAspect) {
              drawWidth = canvas.height * imgAspect;
              drawX = (canvas.width - drawWidth) / 2;
            } else {
              drawHeight = canvas.width / imgAspect;
              drawY = (canvas.height - drawHeight) / 2;
            }

            ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
          }

          currentFrame++;
          requestAnimationFrame(drawFrame);
        };

        drawFrame();
      } catch (err) {
        reject(err);
      }
    };

    photos.forEach((src, index) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        images[index] = img;
        loadedCount++;
        if (loadedCount === photos.length) {
          startRecording();
        }
      };
      img.onerror = () => {
        loadedCount++;
        if (loadedCount === photos.length) {
          startRecording();
        }
      };
      img.src = src;
    });
  });
};
