"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Download, Sparkles, Heart, Camera, Loader2, ArrowLeft, Video, Image as ImageIcon, Archive, CheckSquare, Square, MessageCircle, Mail, Share2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import JSZip from "jszip";

interface PhotoStripData {
  id: string;
  data_url: string;
  customer_name: string | null;
  customer_phone: string | null;
  timestamp: string | null;
  created_at: string;
  captured_photos?: string[] | null;
}

interface AssetItem {
  id: string;
  name: string;
  type: "strip" | "photo" | "video";
  url: string | null;
  filename: string;
  thumbnail: string | null;
}

export default function PublicSharePage() {
  const params = useParams();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const router = useRouter();

  const [photoData, setPhotoData] = useState<PhotoStripData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isVideoLoading, setIsVideoLoading] = useState(false);
  const [isZipLoading, setIsZipLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activePreviewId, setActivePreviewId] = useState<string>("strip");
  const [isSharing, setIsSharing] = useState(false);

  // Fetch Photo Strip from Supabase
  useEffect(() => {
    if (!id) return;

    const fetchPhoto = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from("photo_strips")
          .select("*")
          .eq("id", id)
          .single();

        if (error || !data) {
          console.error("Error fetching photo strip:", error);
        } else {
          setPhotoData(data as PhotoStripData);
        }
      } catch (err) {
        console.error("Failed to query photo strip:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPhoto();
  }, [id]);

  const capturedPhotos = useMemo(() => {
    return photoData?.captured_photos || [];
  }, [photoData]);

  // Generate slideshow video loop from captured individual photos
  useEffect(() => {
    if (capturedPhotos.length === 0) {
      setIsVideoLoading(false);
      return;
    }

    let active = true;
    const generateVideo = async () => {
      try {
        setIsVideoLoading(true);
        const url = await generateSlideshowVideo(capturedPhotos);
        if (active) {
          setVideoUrl(url);
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

  // Build list of available assets dynamically
  const assets = useMemo((): AssetItem[] => {
    if (!photoData) return [];
    const list: AssetItem[] = [];
    const baseName = "Glow_Photobooth";
    
    list.push({
      id: "strip",
      name: "Foto Strip Final",
      type: "strip",
      url: photoData.data_url,
      filename: `${baseName}_strip_${photoData.id}.png`,
      thumbnail: photoData.data_url,
    });

    capturedPhotos.forEach((photo, idx) => {
      list.push({
        id: `photo_${idx}`,
        name: `Foto Satuan ${idx + 1}`,
        type: "photo",
        url: photo,
        filename: `${baseName}_photo_${idx + 1}_${photoData.id}.png`,
        thumbnail: photo,
      });
    });

    if (videoUrl) {
      list.push({
        id: "video",
        name: "Video Kumpulan Foto",
        type: "video",
        url: videoUrl,
        filename: `${baseName}_video_${photoData.id}.webm`,
        thumbnail: capturedPhotos[0] || null,
      });
    }

    return list;
  }, [photoData, capturedPhotos, videoUrl]);

  // Select all assets by default when loaded
  useEffect(() => {
    if (assets.length > 0 && selectedIds.length === 0) {
      setSelectedIds(assets.map(a => a.id));
    }
  }, [assets]);

  // Fallback active preview if selected asset becomes invalid
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
      link.download = `Glow_Photobooth_session_${id}_assets.zip`;
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

  const handleNativeShare = async (asset: AssetItem) => {
    if (!asset.url) return;
    setIsSharing(true);
    try {
      const response = await fetch(asset.url);
      const blob = await response.blob();
      
      let mimeType = blob.type;
      if (asset.type === "video") {
        mimeType = "video/webm";
      } else if (asset.type === "photo" || asset.type === "strip") {
        mimeType = "image/png";
      }

      const file = new File([blob], asset.filename, { type: mimeType });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: asset.name,
          text: `Halo, ini ${asset.name} dari sesi photobooth saya!`,
        });
        toast.success("Berhasil membuka menu bagikan!");
      } else {
        toast.error("Bagikan langsung tidak didukung di browser ini. Unduh berkas secara manual.");
      }
    } catch (err) {
      console.error("Share error:", err);
      toast.error("Gagal memicu menu bagikan.");
    } finally {
      setIsSharing(false);
    }
  };

  const whatsappUrl = useMemo(() => {
    if (!photoData) return "";
    let cleanNumber = (photoData.customer_phone || "").replace(/\D/g, "");
    if (cleanNumber.startsWith("0")) {
      cleanNumber = "62" + cleanNumber.slice(1);
    } else if (cleanNumber.startsWith("8")) {
      cleanNumber = "62" + cleanNumber;
    }
    const text = encodeURIComponent(
      `Halo ${photoData.customer_name || "teman"}, ini adalah hasil photobooth Glow saya dari sesi ini!`
    );
    return `https://api.whatsapp.com/send?phone=${cleanNumber}&text=${text}`;
  }, [photoData]);

  const emailUrl = useMemo(() => {
    if (!photoData) return "";
    const subject = encodeURIComponent(`Foto & Video Glow Photobooth`);
    const body = encodeURIComponent(
      `Halo ${photoData.customer_name || "Pengunjung"},\n\nBerikut hasil photobooth kamu!\n\nSalam,\nGlow Photobooth`
    );
    return `mailto:?subject=${subject}&body=${body}`;
  }, [photoData]);

  const activeAsset = assets.find(a => a.id === activePreviewId) || assets[0];
  const hasCapturedPhotos = capturedPhotos.length > 0;

  return (
    <div className="flex-1 bg-[#fbfbfb] dark:bg-[#0b0b0c] text-zinc-800 dark:text-[#e3e3e3] font-sans flex flex-col justify-between overflow-x-hidden min-h-screen relative transition-colors duration-300">
      {/* Visual Ambient Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] aspect-square rounded-full bg-amber-400/8 dark:bg-amber-500/5 blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] aspect-square rounded-full bg-pink-400/8 dark:bg-pink-500/5 blur-[120px] pointer-events-none z-0" />

      {/* Main Container */}
      <main className="flex-1 flex flex-col items-center justify-center w-full z-10 relative py-12 px-4">
        {isLoading ? (
          <div className="flex flex-col items-center gap-3 text-zinc-500 font-mono text-xs">
            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
            <span>Memuat Kenangan Indah Anda...</span>
          </div>
        ) : photoData ? (
          <div className={`${hasCapturedPhotos ? "max-w-5xl" : "max-w-md"} w-full bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-900 rounded-3xl p-6 shadow-2xl transition-all`}>
            
            {/* Header */}
            <div className="flex items-center justify-between w-full border-b border-zinc-200/50 dark:border-zinc-800/40 pb-4 mb-6 select-none">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-extrabold text-xs tracking-tighter shadow-md shadow-emerald-500/10">
                  GB
                </div>
                <div className="flex flex-col text-left">
                  <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 leading-none">
                    Glow Photobooth Sesi Anda
                  </h2>
                  <span className="text-[9px] text-zinc-400 dark:text-zinc-500 font-mono tracking-wide mt-1 leading-none">
                    Pengunjung: {photoData.customer_name || "Tamu"}
                  </span>
                </div>
              </div>
              <div className="inline-flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-400 font-mono text-[9px] font-bold px-2.5 py-1.5 rounded-xl uppercase tracking-wider">
                Cetak Selesai
              </div>
            </div>

            {hasCapturedPhotos ? (
              /* Interactive view when individual photos exist */
              <div className="w-full flex flex-col md:flex-row gap-8 justify-center items-stretch text-left">
                
                {/* Column 1: Asset list checklist */}
                <div className="w-full md:w-1/2 flex flex-col bg-zinc-50/50 dark:bg-zinc-950/20 p-5 rounded-2xl border border-zinc-100 dark:border-zinc-900 justify-between">
                  <div>
                    <div className="flex justify-between items-center mb-4 pb-2 border-b border-zinc-200/50 dark:border-zinc-800/60 w-full">
                      <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Pilih Aset untuk Diunduh</span>
                      
                      <button
                        onClick={handleSelectAll}
                        className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 transition-colors flex items-center gap-1 cursor-pointer select-none"
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
                    <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1">
                      {assets.map((asset) => {
                        const isSelected = selectedIds.includes(asset.id);
                        const isActive = activePreviewId === asset.id;
                        
                        return (
                          <div
                            key={asset.id}
                            onClick={() => setActivePreviewId(asset.id)}
                            className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer select-none ${
                              isActive
                                ? "border-emerald-500/60 bg-emerald-50/5 dark:bg-emerald-950/10"
                                : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 hover:border-zinc-300 dark:hover:border-zinc-700"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              {/* Checkbox */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleSelect(asset.id);
                                }}
                                className="text-zinc-400 dark:text-zinc-600 hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors"
                              >
                                {isSelected ? (
                                  <CheckSquare className="w-5 h-5 text-emerald-500" />
                                ) : (
                                  <Square className="w-5 h-5" />
                                )}
                              </button>

                              {/* Thumbnail */}
                              <div className="w-10 h-10 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-100 flex items-center justify-center shrink-0">
                                {asset.type === "video" && isVideoLoading ? (
                                  <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
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
                                <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">{asset.name}</span>
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
                  </div>

                  {/* Download selected ZIP button */}
                  <Button
                    onClick={handleDownloadZip}
                    disabled={selectedIds.length === 0 || isZipLoading}
                    className="w-full mt-5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold py-3.5 rounded-xl transition-all text-xs tracking-wider flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20 hover:scale-[1.01] active:scale-[0.99] border-none cursor-pointer"
                  >
                    {isZipLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Sedang Mengompresi...</span>
                      </>
                    ) : (
                      <>
                        <Archive className="w-4 h-4" strokeWidth={1.5} />
                        <span>Unduh Terpilih ({selectedIds.length}) (.ZIP)</span>
                      </>
                    )}
                  </Button>
                </div>

                {/* Column 2: Dynamic high-res preview panel */}
                <div className="w-full md:w-1/2 flex flex-col items-center gap-4 bg-zinc-50/50 dark:bg-zinc-950/20 p-5 rounded-2xl border border-zinc-100 dark:border-zinc-900 justify-center">
                  <div className="flex items-center gap-1.5 self-start mb-1 text-zinc-700 dark:text-zinc-300">
                    {activeAsset?.type === "video" ? (
                      <Video className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <ImageIcon className="w-4 h-4 text-emerald-500" />
                    )}
                    <span className="text-xs font-bold font-sans">Pratinjau: {activeAsset?.name}</span>
                  </div>

                  <div className="flex-1 flex items-center justify-center w-full min-h-[300px]">
                    {activeAsset?.type === "video" ? (
                      isVideoLoading ? (
                        <div className="flex flex-col items-center gap-2 text-zinc-400">
                          <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
                          <span className="text-[10px] font-mono">Membuat video...</span>
                        </div>
                      ) : activeAsset.url ? (
                        <div className="w-full aspect-[4/3] max-h-[350px] rounded-xl overflow-hidden bg-black border border-zinc-200 dark:border-zinc-800">
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
                      <div className="relative rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-md overflow-hidden bg-zinc-100 max-h-[350px] w-full flex items-center justify-center">
                        <img
                          src={activeAsset.url}
                          alt={activeAsset.name}
                          className={`object-contain max-h-[350px] ${
                            activeAsset.type === "strip" ? "aspect-[500/1202.5] w-[130px]" : "aspect-[4/3] w-full"
                          }`}
                        />
                      </div>
                    ) : (
                      <span className="text-xs text-zinc-400">Aset tidak ditemukan</span>
                    )}
                  </div>

                  <Button
                    onClick={() => handleDownloadSingle(activeAsset)}
                    disabled={!activeAsset?.url || (activeAsset.type === "video" && isVideoLoading)}
                    className="w-full mt-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 font-semibold py-3 rounded-xl transition-all text-xs tracking-wider flex items-center justify-center gap-1.5 cursor-pointer border border-zinc-200 dark:border-zinc-800"
                  >
                    <Download className="w-4 h-4" />
                    <span>Unduh Aset Ini saja</span>
                  </Button>

                  {/* Share Actions */}
                  <div className="w-full flex flex-col gap-2 border-t border-zinc-200/50 dark:border-zinc-800/60 pt-4 mt-1">
                    <span className="text-[10px] text-zinc-500 font-mono tracking-wider uppercase font-semibold text-left">
                      Bagikan Aset Ini
                    </span>
                    <div className="grid grid-cols-3 gap-2 w-full">
                      {/* WhatsApp Button */}
                      <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100/50 dark:hover:bg-emerald-950/40 transition-all font-semibold text-xs text-center cursor-pointer no-underline select-none"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span>WhatsApp</span>
                      </a>

                      {/* Email Button */}
                      <a
                        href={emailUrl}
                        className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 text-zinc-600 dark:text-zinc-350 hover:bg-zinc-100/50 dark:hover:bg-zinc-800 transition-all font-semibold text-xs text-center cursor-pointer no-underline select-none"
                      >
                        <Mail className="w-4 h-4" />
                        <span>Email</span>
                      </a>

                      {/* Native Share / AirDrop Button */}
                      <Button
                        type="button"
                        onClick={() => handleNativeShare(activeAsset)}
                        disabled={isSharing || !activeAsset?.url || (activeAsset.type === "video" && isVideoLoading)}
                        className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-blue-200 dark:border-blue-900/40 bg-blue-50/50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100/50 dark:hover:bg-blue-950/40 transition-all font-semibold text-xs text-center cursor-pointer border shadow-sm select-none border-none animate-pulse-subtle"
                      >
                        {isSharing ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Share2 className="w-4 h-4" />
                        )}
                        <span>AirDrop</span>
                      </Button>
                    </div>
                  </div>
                </div>

              </div>
            ) : (
              /* Simple backward compatible view for single final strip only */
              <div className="flex flex-col items-center gap-6">
                <div className="relative rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-lg overflow-hidden bg-zinc-100 max-h-[380px] aspect-[500/1202.5] w-[160px]">
                  <img src={photoData.data_url} alt="Photo Strip Final" className="w-full h-full object-contain" />
                </div>

                <div className="w-full flex flex-col gap-3">
                  <Button
                    onClick={handleDownload}
                    className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold py-3.5 rounded-xl transition-all text-xs tracking-wider flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20 hover:scale-[1.01] active:scale-[0.99] border-none cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Simpan Foto Strip ke HP</span>
                  </Button>

                  <div className="grid grid-cols-2 gap-3 mt-1 w-full">
                    {/* WhatsApp */}
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1.5 py-3 px-4 rounded-xl border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100/50 dark:hover:bg-emerald-950/40 transition-all font-semibold text-xs text-center cursor-pointer no-underline select-none"
                    >
                      <MessageCircle className="w-4.5 h-4.5" />
                      <span>WhatsApp</span>
                    </a>

                    {/* AirDrop / Native Share */}
                    <Button
                      type="button"
                      onClick={() => handleNativeShare({
                        id: "strip",
                        name: "Foto Strip Final",
                        type: "strip",
                        url: photoData.data_url,
                        filename: `Glow_strip_${photoData.id}.png`,
                        thumbnail: photoData.data_url
                      })}
                      className="flex items-center justify-center gap-1.5 py-3 px-4 rounded-xl border border-blue-200 dark:border-blue-900/40 bg-blue-50/50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100/50 dark:hover:bg-blue-950/40 transition-all font-semibold text-xs text-center cursor-pointer border shadow-sm select-none border-none"
                    >
                      <Share2 className="w-4.5 h-4.5" />
                      <span>AirDrop / Share</span>
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-6 border-t border-zinc-200/50 dark:border-zinc-800/40 pt-4 flex flex-col items-center gap-1 text-[10px] text-zinc-400 dark:text-zinc-500 select-none">
              <span>Sesi Foto pada: {photoData.timestamp || new Date(photoData.created_at).toLocaleTimeString()}</span>
              <span>Glow Photobooth &copy; {new Date().getFullYear()}</span>
            </div>

          </div>
        ) : (
          /* Not Found */
          <div className="max-w-md w-full bg-white/70 dark:bg-zinc-900/40 backdrop-blur-xl border border-zinc-200/80 dark:border-zinc-800 rounded-3xl p-8 text-center flex flex-col items-center gap-4 shadow-2xl relative">
            <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-950/20 flex items-center justify-center text-red-500">
              <Heart className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">Foto Tidak Ditemukan</h3>
              <p className="text-[10px] text-zinc-500 mt-1 leading-relaxed">
                Tautan mungkin sudah kedaluwarsa atau foto telah dihapus oleh operator.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => router.push("/")}
              className="text-xs py-2 rounded-xl mt-2 w-full border-zinc-200 text-zinc-500 hover:bg-zinc-100"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1" />
              Kembali ke Beranda
            </Button>
          </div>
        )}
      </main>
    </div>
  );

  // Backward-compatible strip download handler
  async function handleDownload() {
    if (!photoData) return;
    try {
      const response = await fetch(photoData.data_url);
      const blob = await response.blob();
      const localUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = `photobooth_${photoData.customer_name || "customer"}_${photoData.id}.png`;
      link.href = localUrl;
      link.click();
      setTimeout(() => URL.revokeObjectURL(localUrl), 100);
      toast.success("Mengunduh Foto Strip Final");
    } catch (err) {
      const link = document.createElement("a");
      link.download = `photobooth_${photoData.customer_name || "customer"}_${photoData.id}.png`;
      link.href = photoData.data_url;
      link.click();
      toast.success("Mengunduh Foto Strip Final");
    }
  }
}

/**
 * Generate a sequential video slideshow from base64 frames using browser MediaRecorder
 */
const generateSlideshowVideo = (photos: string[]): Promise<string> => {
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
          stream = canvas.captureStream(20); // 20 fps
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
          const blob = new Blob(chunks, { type: mediaRecorder.mimeType || "video/webm" });
          resolve(URL.createObjectURL(blob));
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
