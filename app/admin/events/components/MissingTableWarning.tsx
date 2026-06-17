"use client";

import { useState } from "react";
import { AlertTriangle, Copy, Check, ExternalLink } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface MissingTableWarningProps {
  onRetry: () => void;
  sqlScript: string;
}

export default function MissingTableWarning({ onRetry, sqlScript }: MissingTableWarningProps) {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlScript);
    setIsCopied(true);
    toast.success("Skrip SQL berhasil disalin ke clipboard!");
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in duration-200">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
          Manajemen Event
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Kelola profil event dan sinkronisasikan pengaturan ke dalam operator booth photobooth Anda.
        </p>
      </div>

      <Card className="bg-white dark:bg-zinc-950 border-none ring-1 ring-inset ring-amber-500/20 dark:ring-amber-500/10 rounded-2xl p-6">
        <div className="flex flex-col gap-5">
          <div className="flex gap-3 items-start">
            <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-400">
                Tabel Database Belum Dibuat
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5 leading-relaxed">
                Halaman Manajemen Event mendeteksi tabel <code className="font-mono bg-zinc-100 dark:bg-zinc-900 px-1.5 py-0.5 rounded text-amber-700 dark:text-amber-400">events</code> belum dibuat di database Supabase Anda. 
                Silakan salin skrip SQL inisialisasi di bawah ini, lalu jalankan di **SQL Editor** pada dashboard proyek Supabase Anda.
              </p>
            </div>
          </div>

          <div className="relative bg-zinc-50 dark:bg-zinc-900/50 rounded-xl p-4 border border-zinc-200/50 dark:border-zinc-800/80 overflow-x-auto max-h-[300px] custom-scrollbar font-mono text-[10px] leading-normal text-zinc-600 dark:text-zinc-400">
            <pre>{sqlScript}</pre>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-zinc-200 dark:border-zinc-800/60 gap-3">
            <a 
              href="https://supabase.com/dashboard" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-xs text-blue-500 hover:text-blue-600 hover:underline flex items-center gap-1 font-medium"
            >
              Buka Dashboard Supabase <ExternalLink className="w-4 h-4" />
            </a>
            
            <div className="flex gap-2">
              <Button 
                type="button" 
                variant="outline"
                onClick={onRetry}
                className="h-9 text-xs border-zinc-200 dark:border-zinc-800 cursor-pointer text-zinc-700 dark:text-zinc-300"
              >
                Periksa Lagi Koneksi
              </Button>
              <Button 
                type="button" 
                onClick={handleCopySql}
                className="h-9 text-xs gap-1.5 bg-amber-600 hover:bg-amber-700 text-white font-medium active:scale-98 transition-all px-4 rounded-lg cursor-pointer border-none"
              >
                {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {isCopied ? 'Tersalin' : 'Salin SQL Inisialisasi'}
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}