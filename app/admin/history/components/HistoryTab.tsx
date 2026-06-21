"use client";

import { useState } from "react";
import { Search, Download, Trash2, Calendar, User, BadgeAlert, History, Eye, Wallet, Printer } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PhotoStrip, EventConfig } from "../../../hooks/usePhotoboothStore";
import ConfirmDeleteDialog from "@/components/ui/ConfirmDeleteDialog";
import { toast } from "sonner";
import { HistoryTabProps } from "../types";

export default function HistoryTab({
  photos,
  config,
  clearPhotos,
  deletePhoto,
}: HistoryTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  // Confirm Dialog State
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);
  const [confirmTitle, setConfirmTitle] = useState("");
  const [confirmDesc, setConfirmDesc] = useState("");

  // Calculate stats
  const totalSessions = photos.length;
  const totalPrints = photos.reduce((acc, p) => acc + (p.sessionsCount || 1), 0);
  const price = config.pricePerSession ?? 25000;
  const estimatedRevenue = photos.reduce((acc, p) => acc + (p.amount ?? (p.sessionsCount || 1) * price), 0);

  // Filter photos by search query
  const filteredPhotos = photos.filter((photo) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      (photo.customerName || "").toLowerCase().includes(query) ||
      (photo.customerPhone || "").toLowerCase().includes(query) ||
      (photo.operatorName || "").toLowerCase().includes(query) ||
      photo.id.toLowerCase().includes(query)
    );
  });

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

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

      <div className="flex flex-col gap-6 animate-fade-in duration-300">
        
        {/* Header Section */}
        <div className="flex flex-col gap-1.5">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight flex items-center gap-2">
            <History className="w-5 h-5 text-zinc-700 dark:text-zinc-300" /> 
            Riwayat Sesi Foto
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Daftar lengkap sesi foto yang tersimpan, lengkap dengan data pelanggan, cetakan, dan pendapatan.
          </p>
        </div>

        {/* Stats Cards Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Total Sesi */}
          <Card className="bg-white dark:bg-zinc-950 border-none ring-1 ring-inset ring-zinc-200/80 dark:ring-zinc-800/60 shadow-[0_4px_20px_rgb(0,0,0,0.02)] rounded-2xl">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardDescription className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Total Sesi
              </CardDescription>
              <div className="p-2 bg-zinc-50 dark:bg-zinc-900 rounded-lg">
                <History className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
              </div>
            </CardHeader>
            <CardContent>
              <CardTitle className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {totalSessions}
              </CardTitle>
              <p className="text-[11px] text-zinc-500 mt-1">
                Sesi foto unik pelanggan terdaftar.
              </p>
            </CardContent>
          </Card>

          {/* Total Cetak */}
          <Card className="bg-white dark:bg-zinc-950 border-none ring-1 ring-inset ring-zinc-200/80 dark:ring-zinc-800/60 shadow-[0_4px_20px_rgb(0,0,0,0.02)] rounded-2xl">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardDescription className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Total Cetak
              </CardDescription>
              <div className="p-2 bg-zinc-50 dark:bg-zinc-900 rounded-lg">
                <Printer className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
              </div>
            </CardHeader>
            <CardContent>
              <CardTitle className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {totalPrints} Lembar
              </CardTitle>
              <p className="text-[11px] text-zinc-500 mt-1">
                Akumulasi cetak strip seluruh sesi.
              </p>
            </CardContent>
          </Card>

          {/* Estimasi Pendapatan */}
          <Card className="bg-white dark:bg-zinc-950 border-none ring-1 ring-inset ring-zinc-200/80 dark:ring-zinc-800/60 shadow-[0_4px_20px_rgb(0,0,0,0.02)] rounded-2xl">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardDescription className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Estimasi Omzet
              </CardDescription>
              <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg">
                <Wallet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
            </CardHeader>
            <CardContent>
              <CardTitle className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {formatRupiah(estimatedRevenue)}
              </CardTitle>
              <p className="text-[11px] text-zinc-500 mt-1">
                Berdasarkan {formatRupiah(price)} / sesi.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Toolbar: Search & Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:max-w-sm">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama, No. HP, atau ID..."
              className="pl-9 h-9 text-xs rounded-xl bg-white dark:bg-zinc-950 border-none ring-1 ring-inset ring-zinc-200/80 dark:ring-zinc-800/80 focus-visible:ring-2 focus-visible:ring-zinc-400 shadow-sm"
            />
          </div>

          {photos.length > 0 && (
            <Button
              variant="outline"
              onClick={() => {
                setConfirmTitle("Hapus Semua Riwayat");
                setConfirmDesc("Apakah Anda yakin ingin menghapus semua riwayat sesi foto secara permanen? Tindakan ini tidak dapat dibatalkan.");
                setConfirmAction(() => () => {
                  clearPhotos();
                  toast.success("Semua riwayat sesi foto berhasil dihapus.");
                });
                setConfirmOpen(true);
              }}
              className="h-9 text-xs font-medium px-4 rounded-xl text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-900/20 w-full sm:w-auto transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5 mr-2" />
              Hapus Semua Data
            </Button>
          )}
        </div>

        {/* Table Section */}
        {filteredPhotos.length === 0 ? (
          <div className="w-full flex flex-col items-center justify-center py-16 px-4 ring-1 ring-inset ring-zinc-200/80 dark:ring-zinc-800/60 border-dashed rounded-2xl bg-zinc-50/50 dark:bg-zinc-900/20">
            <div className="w-12 h-12 flex items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 mb-3">
              <BadgeAlert className="w-6 h-6 text-zinc-400" strokeWidth={1.5} />
            </div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {searchQuery ? "Data tidak ditemukan" : "Belum ada riwayat sesi"}
            </h3>
            <p className="text-xs text-zinc-500 mt-1 text-center max-w-[250px]">
              {searchQuery 
                ? "Coba gunakan kata kunci pencarian yang lain." 
                : "Riwayat transaksi dan data sesi pelanggan akan otomatis muncul di sini."}
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-zinc-950 ring-1 ring-inset ring-zinc-200/80 dark:ring-zinc-800/60 rounded-2xl overflow-hidden shadow-[0_2px_10px_rgb(0,0,0,0.02)]">
            <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="bg-zinc-50/80 dark:bg-zinc-900/50 border-b border-zinc-200/80 dark:border-zinc-800/80 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                    <th className="px-5 py-3.5 w-16 text-center">Preview</th>
                    <th className="px-5 py-3.5">Detail Sesi & Pelanggan</th>
                    <th className="px-5 py-3.5 text-center">Cetak</th>
                    <th className="px-5 py-3.5 text-right">Pembayaran</th>
                    <th className="px-5 py-3.5">Operator</th>
                    <th className="px-5 py-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 text-sm">
                  {filteredPhotos.map((photo) => (
                    <tr key={photo.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30 transition-colors group">
                      
                      {/* Thumbnail Preview */}
                      <td className="px-5 py-3 align-middle">
                        <div 
                          onClick={() => photo.dataUrl && setSelectedPhoto(photo.dataUrl)}
                          className={`w-9 h-12 rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-900 ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 relative flex items-center justify-center mx-auto transition-transform hover:scale-105 ${photo.dataUrl ? 'cursor-pointer' : 'cursor-default'}`}
                        >
                          {photo.dataUrl ? (
                            <>
                              <img src={photo.dataUrl} alt="strip" className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                                <Eye className="w-3.5 h-3.5 drop-shadow-md" />
                              </div>
                            </>
                          ) : (
                            <div className="w-3.5 h-3.5 rounded-full border border-zinc-300 border-t-zinc-600 animate-spin" />
                          )}
                        </div>
                      </td>

                      {/* Customer Info & Session ID */}
                      <td className="px-5 py-3 align-middle">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-medium text-zinc-900 dark:text-zinc-100 text-xs">
                            {photo.customerName || "Tanpa Nama"}
                          </span>
                          <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-mono">
                            <span>{photo.id.slice(0, 12)}...</span>
                            <span>•</span>
                            <span>{photo.customerPhone || "No HP tidak ada"}</span>
                          </div>
                          <span className="text-[10px] text-zinc-400 flex items-center gap-1 mt-0.5">
                            <Calendar className="w-3 h-3" /> {photo.timestamp}
                          </span>
                        </div>
                      </td>

                       {/* Print Count */}
                      <td className="px-5 py-3 text-center align-middle">
                        <span className="inline-flex items-center justify-center font-medium px-2 py-0.5 rounded-md text-[10px] bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 ring-1 ring-inset ring-zinc-200 dark:ring-zinc-700">
                          {photo.sessionsCount || 1}x Cetak
                        </span>
                      </td>

                      {/* Payment Info */}
                      <td className="px-5 py-3 text-right align-middle">
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 font-mono">
                            {formatRupiah(photo.amount ?? (photo.sessionsCount || 1) * price)}
                          </span>
                          {photo.paymentMethod ? (
                            <span className="flex items-center gap-1 text-[9px] font-medium uppercase tracking-wider text-zinc-500">
                              <span className={`w-1.5 h-1.5 rounded-full ${photo.paymentMethod === 'qris' ? 'bg-blue-500' : 'bg-emerald-500'}`} />
                              {photo.paymentMethod}
                            </span>
                          ) : (
                            <span className="text-[10px] text-zinc-400 italic">-</span>
                          )}
                        </div>
                      </td>

                      {/* Operator Name */}
                      <td className="px-5 py-3 align-middle">
                        {photo.operatorName ? (
                          <div className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400">
                            <div className="w-5 h-5 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center ring-1 ring-inset ring-zinc-200 dark:ring-zinc-700">
                              <User className="w-2.5 h-2.5" />
                            </div>
                            <span className="font-medium">{photo.operatorName}</span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-zinc-400 italic">Sistem Otomatis</span>
                        )}
                      </td>

                      {/* Actions - SEKARANG SELALU TAMPIL */}
                      <td className="px-5 py-3 text-right align-middle">
                        <div className="flex items-center justify-end gap-2">
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
                            className="p-2 rounded-lg text-zinc-500 bg-zinc-50 hover:text-zinc-900 hover:bg-zinc-200/50 ring-1 ring-inset ring-zinc-200/50 dark:bg-zinc-900/50 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 dark:ring-zinc-800 transition-colors"
                            title="Unduh Strip"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setConfirmTitle("Hapus Sesi Foto");
                              setConfirmDesc("Apakah Anda yakin ingin menghapus data ini? Aksi ini tidak bisa dikembalikan.");
                              setConfirmAction(() => () => {
                                deletePhoto(photo.id);
                                toast.success("Sesi foto berhasil dihapus.");
                              });
                              setConfirmOpen(true);
                            }}
                            className="p-2 rounded-lg text-red-500 bg-red-50/50 hover:text-red-700 hover:bg-red-100 ring-1 ring-inset ring-red-100 dark:bg-red-950/20 dark:hover:bg-red-900/40 dark:hover:text-red-400 dark:ring-red-900/30 transition-colors"
                            title="Hapus Sesi"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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