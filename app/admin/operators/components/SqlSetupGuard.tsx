"use client";

import { ShieldAlert, Check, Copy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface SqlSetupGuardProps {
  sqlInstructions: string;
  copiedSql: boolean;
  onCopySql: () => void;
  onRetry: () => void;
}

export default function SqlSetupGuard({
  sqlInstructions,
  copiedSql,
  onCopySql,
  onRetry,
}: SqlSetupGuardProps) {
  return (
    <Card className="bg-white dark:bg-zinc-950 border-none ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 rounded-2xl shadow-[0_4px_25px_rgb(0,0,0,0.02)] overflow-hidden">
      <CardHeader className="pb-3.5 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/10">
        <CardTitle className="text-sm font-semibold flex items-center gap-2.5 text-amber-600 dark:text-amber-400">
          <ShieldAlert className="w-4 h-4" /> SQL Function Diperlukan
        </CardTitle>
        <CardDescription className="text-xs text-zinc-500 mt-0.5">
          Sistem mendeteksi fungsi database manajemen operator belum terpasang pada instance Supabase Anda.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-5 flex flex-col gap-5 text-zinc-700 dark:text-zinc-300">
        
        <div className="text-xs space-y-3 bg-zinc-50 dark:bg-zinc-900/40 p-4 rounded-xl ring-1 ring-inset ring-zinc-100 dark:ring-zinc-900/30">
          <p className="font-semibold text-zinc-800 dark:text-zinc-200">Langkah Pemasangan Skrip:</p>
          <ol className="list-decimal pl-4 space-y-1.5 text-zinc-600 dark:text-zinc-400">
            <li>Buka halaman utama dashboard <strong>Supabase Console</strong> Anda.</li>
            <li>Akses menu <strong>SQL Editor</strong> melalui bar navigasi sebelah kiri.</li>
            <li>Buat dokumen query baru, lalu salin seluruh skrip di bawah ini ke editor.</li>
            <li>Klik tombol <strong>Run</strong> untuk mengonfigurasi fungsi pendaftaran operator secara aman.</li>
          </ol>
        </div>

        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-zinc-400 font-bold tracking-wider font-mono uppercase">Kode Migrasi Postgresql</span>
            <Button
              onClick={onCopySql}
              variant="outline"
              className="h-8 px-3 text-[11px] font-medium border-zinc-200 dark:border-zinc-800 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors gap-1.5"
            >
              {copiedSql ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  Tersalin!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-zinc-400" />
                  Salin Skrip SQL
                </>
              )}
            </Button>
          </div>

          <pre className="text-[11px] font-mono p-4 bg-zinc-950 border border-zinc-900 rounded-xl overflow-x-auto text-zinc-400 max-h-[260px] leading-relaxed scrollbar-thin">
            {sqlInstructions}
          </pre>
        </div>

        <div className="flex justify-end pt-3 border-t border-zinc-100 dark:border-zinc-900">
          <Button
            onClick={onRetry}
            className="h-10 text-xs font-medium px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 transition-colors shadow-sm w-full sm:w-auto"
          >
            Saya Sudah Menjalankan SQL, Segarkan Halaman
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
