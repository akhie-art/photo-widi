"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  Download, Loader2, ArrowLeft, Video, 
  Image as ImageIcon, Archive, Eye, Calendar, Heart 
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import JSZip from "jszip";
import { Muxer, ArrayBufferTarget } from "mp4-muxer";

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
  const [videoExtension, setVideoExtension] = useState<string>("mp4");
  const [isVideoLoading, setIsVideoLoading] = useState(false);
  const [isZipLoading, setIsZipLoading] = useState(false);

  const [selectedAssetForZoom, setSelectedAssetForZoom] = useState<AssetItem | null>(null);
  const [eventName, setEventName] = useState<string>("Glow Photobooth");

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

  // Fetch Event Name from Supabase (event_config)
  useEffect(() => {
    const fetchEventConfig = async () => {
      try {
        const { data, error } = await supabase
          .from("event_config")
          .select("config_json")
          .eq("id", "default")
          .single();

        if (!error && data && data.config_json) {
          const config = data.config_json as any;
          if (config.eventName && config.eventName.trim()) {
            setEventName(config.eventName.trim());
          }
        }
      } catch (err) {
        console.error("Failed to query event config:", err);
      }
    };

    fetchEventConfig();
  }, []);

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

  // Build list of available assets dynamically
  const assets = useMemo((): AssetItem[] => {
    if (!photoData) return [];
    const list: AssetItem[] = [];
    const baseName = eventName.replace(/\s+/g, "_");
    
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
        filename: `${baseName}_video_${photoData.id}.${videoExtension}`,
        thumbnail: capturedPhotos[0] || null,
      });
    }

    return list;
  }, [photoData, capturedPhotos, videoUrl, videoExtension, eventName]);

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
    if (assets.length === 0) {
      toast.error("Tidak ada aset untuk diunduh!");
      return;
    }

    setIsZipLoading(true);
    try {
      const zip = new JSZip();

      for (const asset of assets) {
        if (asset.url) {
          const res = await fetch(asset.url);
          const blob = await res.blob();
          zip.file(asset.filename, blob);
        }
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const zipUrl = URL.createObjectURL(zipBlob);

      const link = document.createElement("a");
      const zipPrefix = eventName.replace(/\s+/g, "_");
      link.download = `${zipPrefix}_session_${id}_assets.zip`;
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
          <div className="max-w-5xl w-full bg-white dark:bg-[#121214] border border-zinc-200/50 dark:border-zinc-900 rounded-3xl p-6 shadow-2xl transition-all">
            
            {/* Global Actions Panel (ZIP Download) */}
            <div className="w-full bg-zinc-50/50 dark:bg-zinc-950/20 border border-zinc-100 dark:border-zinc-900/80 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30 shrink-0">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                    Unduh Semua Hasil Foto ({assets.length} Aset)
                  </span>
                  <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium mt-0.5 leading-normal">
                    Dapatkan semua file foto satuan, strip final, dan video loop dalam satu file kompresi (.ZIP).
                  </span>
                </div>
              </div>
              <Button
                onClick={handleDownloadZip}
                disabled={isZipLoading || assets.length === 0}
                className="w-full sm:w-auto bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold py-3 px-6 rounded-xl transition-all text-xs tracking-wider flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20 hover:scale-[1.01] active:scale-[0.99] border-none cursor-pointer"
              >
                {isZipLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Sedang Mengompresi...</span>
                  </>
                ) : (
                  <>
                    <Archive className="w-4 h-4" strokeWidth={1.5} />
                    <span>Unduh Semua (.ZIP)</span>
                  </>
                )}
              </Button>
            </div>

            {/* Grid Galeri Aset */}
            <div className={`grid gap-4 w-full ${
              assets.length === 1 
                ? "grid-cols-1 max-w-sm mx-auto" 
                : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4"
            }`}>
              {assets.map((asset) => (
                <div
                  key={asset.id}
                  className="group flex flex-col justify-between bg-white dark:bg-zinc-950 ring-1 ring-inset ring-zinc-200/80 dark:ring-zinc-800/60 rounded-2xl overflow-hidden shadow-[0_4px_20px_rgb(0,0,0,0.01)] transition-all duration-300"
                >
                  {/* Media Container */}
                  <div className="p-2.5 bg-zinc-50/60 dark:bg-zinc-900/20 flex-1 flex flex-col items-center justify-center">
                    <div
                      className="relative w-full aspect-square rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-900 ring-1 ring-zinc-200 dark:ring-zinc-800 flex items-center justify-center transition-transform duration-300 group-hover:scale-[1.015] cursor-zoom-in"
                      onClick={() => setSelectedAssetForZoom(asset)}
                    >
                      {asset.type === "video" ? (
                        isVideoLoading ? (
                          <div className="flex flex-col items-center gap-2 text-zinc-400">
                            <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />
                            <span className="text-[9px] font-mono">Memuat video...</span>
                          </div>
                        ) : asset.url ? (
                          <div className="relative w-full h-full flex items-center justify-center">
                            <video
                              src={asset.url}
                              loop
                              autoPlay
                              muted
                              playsInline
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute top-2 right-2 bg-black/60 text-white rounded-lg p-1 text-[8px] font-mono tracking-wider uppercase flex items-center gap-1">
                              <Video className="w-2.5 h-2.5 text-emerald-400" />
                              <span>Video</span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-zinc-400">Gagal memuat</span>
                        )
                      ) : asset.url ? (
                        <img
                          src={asset.url}
                          alt={asset.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-xs text-zinc-400">Tidak ada gambar</span>
                      )}
                      
                      {/* Zoom Overlay on Hover */}
                      <div className="absolute inset-0 bg-zinc-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-200">
                        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/90 dark:bg-zinc-900/90 shadow-sm text-[11px] font-medium text-zinc-800 dark:text-zinc-200 backdrop-blur-sm">
                          <Eye className="w-3.5 h-3.5" />
                          <span>Perbesar</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Details & Action section */}
                  <div className="p-3.5 flex items-center justify-between gap-2 bg-white dark:bg-zinc-950 border-t border-zinc-100 dark:border-zinc-900/60">
                    <div className="flex flex-col min-w-0 text-left">
                      <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate tracking-tight">
                        {asset.name}
                      </span>
                      <span className="text-[9px] font-mono text-zinc-400 dark:text-zinc-500 uppercase mt-0.5 tracking-wide">
                        {asset.type === "video" ? "Video Loop" : (asset.type === "strip" ? "Foto Strip" : "Foto Satuan")}
                      </span>
                    </div>
                    
                    {/* Download button */}
                    <button
                      onClick={() => handleDownloadSingle(asset)}
                      disabled={!asset.url || (asset.type === "video" && isVideoLoading)}
                      className="p-2 rounded-xl text-zinc-700 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800 ring-1 ring-inset ring-zinc-200/50 dark:ring-zinc-800 transition-all active:scale-95 font-semibold disabled:opacity-50 cursor-pointer shrink-0"
                      title="Unduh Aset Ini"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Lightbox Modal for Photo Details */}
            {selectedAssetForZoom && (
              <div
                onClick={() => setSelectedAssetForZoom(null)}
                className="fixed inset-0 bg-zinc-950/90 z-[9999] flex items-center justify-center p-6 backdrop-blur-sm cursor-zoom-out animate-fade-in duration-200"
              >
                <div className="relative max-h-[90vh] max-w-full flex flex-col items-center justify-center" onClick={(e) => e.stopPropagation()}>
                  {selectedAssetForZoom.type === "video" ? (
                    selectedAssetForZoom.url ? (
                      <video
                        src={selectedAssetForZoom.url}
                        controls
                        loop
                        autoPlay
                        playsInline
                        className="max-h-[70vh] max-w-full rounded-xl shadow-2xl ring-1 ring-white/10 object-contain"
                      />
                    ) : (
                      <span className="text-white text-sm">Video tidak tersedia</span>
                    )
                  ) : selectedAssetForZoom.url ? (
                    <img
                      src={selectedAssetForZoom.url}
                      alt={selectedAssetForZoom.name}
                      className={`max-h-[70vh] max-w-full rounded-xl shadow-2xl ring-1 ring-white/10 object-contain ${
                        selectedAssetForZoom.type === "strip" ? "aspect-[500/1202.5] max-h-[75vh] w-auto" : ""
                      }`}
                    />
                  ) : (
                    <span className="text-white text-sm">Gambar tidak tersedia</span>
                  )}
                  
                  {/* Detail Tag under the preview in Lightbox */}
                  <div className="mt-4 flex flex-col items-center text-center select-none">
                    <span className="text-sm font-semibold text-white">
                      {selectedAssetForZoom.name}
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono tracking-wider uppercase mt-1">
                      {selectedAssetForZoom.type === "video" ? "Video Loop" : (selectedAssetForZoom.type === "strip" ? "Foto Strip" : "Foto Satuan")}
                    </span>
                    
                    {/* Action buttons inside Lightbox */}
                    <div className="flex items-center gap-3 mt-4">
                      <button
                        onClick={() => handleDownloadSingle(selectedAssetForZoom)}
                        className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-semibold ring-1 ring-white/10 transition-all cursor-pointer"
                      >
                        <Download className="w-4 h-4" />
                        <span>Unduh Aset</span>
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedAssetForZoom(null)}
                    className="absolute top-4 right-4 bg-black/50 hover:bg-black/80 backdrop-blur-md text-white w-8 h-8 rounded-full flex items-center justify-center transition-colors shadow-sm ring-1 ring-white/10 cursor-pointer font-bold"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}

            {/* Footer Metadata */}
            <div className="mt-8 border-t border-zinc-200/50 dark:border-zinc-800/40 pt-4 flex flex-col items-center gap-1 text-[10px] text-zinc-400 dark:text-zinc-500 select-none">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3 text-zinc-400/60" />
                Sesi Foto pada: {photoData.timestamp || new Date(photoData.created_at).toLocaleTimeString()}
              </span>
              <span>{eventName} &copy; {new Date().getFullYear()}</span>
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
              className="text-xs py-2 rounded-xl mt-2 w-full border-zinc-200 text-zinc-500 hover:bg-zinc-100 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1" />
              Kembali ke Beranda
            </Button>
          </div>
        )}
      </main>
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
          fastStart: "fragmented"
        });

        const encoder = new VideoEncoderClass({
          output: (chunk: any, meta: any) => muxer.addVideoChunk(chunk, meta),
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
          const isMp4 = mime.includes("mp4");
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
