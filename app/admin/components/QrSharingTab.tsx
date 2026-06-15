"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface QrSharingTabProps {
  customerUrl: string;
}

export default function QrSharingTab({ customerUrl }: QrSharingTabProps) {
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("glow_admin_theme") || "dark";
      setTheme(savedTheme);
    }
  }, []);

  const qrColor = theme === "dark" ? "ffffff" : "18181b";
  const qrBg = theme === "dark" ? "1e1e1f" : "ffffff";
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&color=${qrColor}&bgcolor=${qrBg}&data=${encodeURIComponent(
    customerUrl
  )}`;

  return (
    <div className="flex flex-col gap-6 items-center text-center animate-fade-in duration-200">
      <div className="max-w-md">
        <h2 className="text-2xl font-bold text-foreground tracking-tight">QR Code Sharing</h2>
        <p className="text-muted-foreground text-xs mt-1 leading-relaxed">
          Tampilkan QR Code ini di lokasi acara agar tamu dapat memindai langsung menggunakan kamera HP mereka.
        </p>
      </div>

      <Card className="bg-card border-border p-8 shadow-sm max-w-sm w-full flex flex-col items-center gap-6 relative overflow-hidden">
        <div className="p-4 bg-background rounded-2xl border border-border shadow-inner">
          {customerUrl ? (
            <img
              src={qrCodeUrl}
              alt="Webcam photobooth QR code"
              className="w-[200px] h-[200px] rounded-lg border border-border"
            />
          ) : (
            <div className="w-[200px] h-[200px] bg-background flex items-center justify-center text-xs text-muted-foreground font-mono">
              Mencari URL...
            </div>
          )}
        </div>

        <div className="w-full text-left bg-background p-3 rounded-xl border border-border flex flex-col gap-1">
          <span className="text-[9px] text-zinc-500 font-mono block">URL BOOTH AKTIF</span>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={customerUrl}
              className="bg-transparent text-xs font-mono text-foreground flex-1 focus:outline-none"
            />
            <Button
              size="xs"
              variant="ghost"
              onClick={() => {
                navigator.clipboard.writeText(customerUrl);
                alert("URL berhasil disalin!");
              }}
              className="text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 hover:bg-accent text-xs h-7 cursor-pointer"
            >
              Salin
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
