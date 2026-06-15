"use client";

import { useState, useEffect } from "react";
import { QrCode, Banknote, ArrowRight, ArrowLeft, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface PaymentScreenProps {
  customerName: string;
  customerPhone: string;
  sessionsCount: number;
  onPaymentSuccess: () => void;
  onCancel: () => void;
  eventName: string;
}

export default function PaymentScreen({
  customerName,
  customerPhone,
  sessionsCount,
  onPaymentSuccess,
  onCancel,
  eventName,
}: PaymentScreenProps) {
  const [method, setMethod] = useState<"qris" | "cash" | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const pricePerSession = 25000; // Rp 25.000 per session
  const totalPrice = sessionsCount * pricePerSession;

  const formatPrice = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Simulation of payment success
  const handleSimulatePayment = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setIsSuccess(true);
      setTimeout(() => {
        onPaymentSuccess();
      }, 1500);
    }, 2000);
  };

  const handleCashConfirm = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setIsSuccess(true);
      setTimeout(() => {
        onPaymentSuccess();
      }, 1500);
    }, 1500);
  };

  return (
    <div className="max-w-md w-full bg-white/70 dark:bg-zinc-900/40 backdrop-blur-xl border border-zinc-200/80 dark:border-zinc-850 rounded-3xl p-8 text-center flex flex-col items-center gap-6 shadow-2xl relative overflow-hidden animate-fade-in duration-300 transition-colors">
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-blue-500/0 via-blue-500/35 to-blue-500/0" />

      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-zinc-900 dark:text-[#e3e3e3] tracking-tight">Rincian Pembayaran</h2>
        <p className="text-zinc-550 dark:text-zinc-400 text-xs mt-1.5 leading-relaxed">
          Pilih metode pembayaran untuk sesi foto di <strong className="text-zinc-850 dark:text-zinc-200 font-semibold">{eventName}</strong>.
        </p>
      </div>

      {/* Billing Info Summary */}
      <div className="w-full text-left bg-zinc-50/50 dark:bg-zinc-950/40 p-4.5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/60 flex flex-col gap-2.5 transition-colors">
        <div className="flex justify-between items-center text-xs">
          <span className="text-zinc-500 font-medium">Nama Tamu</span>
          <span className="text-zinc-800 dark:text-zinc-300 font-semibold truncate max-w-[180px]">{customerName}</span>
        </div>
        <div className="flex justify-between items-center text-xs border-t border-zinc-200 dark:border-zinc-900 pt-2.5">
          <span className="text-zinc-500 font-medium">Jumlah Sesi</span>
          <span className="text-zinc-800 dark:text-zinc-300 font-semibold font-mono">{sessionsCount} Sesi</span>
        </div>
        <div className="flex justify-between items-center text-sm border-t border-zinc-200 dark:border-zinc-900 pt-2.5 font-bold">
          <span className="text-zinc-655 dark:text-zinc-400">Total Tagihan</span>
          <span className="text-blue-600 dark:text-blue-400 font-mono">{formatPrice(totalPrice)}</span>
        </div>
      </div>

      {/* Success State Overlay */}
      {isSuccess ? (
        <div className="w-full py-8 flex flex-col items-center gap-4 animate-scale-up">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-lg shadow-emerald-500/5 animate-pulse">
            <CheckCircle className="w-8 h-8" strokeWidth={1.5} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-emerald-650 dark:text-emerald-400">Pembayaran Berhasil!</h3>
            <p className="text-[10px] text-zinc-500 font-mono mt-1">Mengalihkan ke kamera...</p>
          </div>
        </div>
      ) : isProcessing ? (
        /* Processing State */
        <div className="w-full py-8 flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          <div>
            <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Memproses Transaksi</h3>
            <p className="text-[10px] text-zinc-500 font-mono mt-1">Mohon tunggu sebentar...</p>
          </div>
        </div>
      ) : !method ? (
        /* Choose Method State */
        <div className="w-full flex flex-col gap-3">
          <span className="text-[9px] text-zinc-450 dark:text-zinc-500 font-mono block tracking-wider uppercase font-bold text-left mb-1">PILIH METODE BAYAR</span>
          
          <button
            type="button"
            onClick={() => setMethod("qris")}
            className="flex items-center justify-between p-4 bg-white dark:bg-zinc-950/30 hover:bg-zinc-50 dark:hover:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800/80 hover:border-zinc-350 dark:hover:border-zinc-700/80 rounded-2xl cursor-pointer text-left transition-all group/btn"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl border border-blue-100 dark:border-blue-900/30 group-hover/btn:scale-105 transition-transform duration-300">
                <QrCode className="w-5 h-5" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200">QRIS (Otomatis)</p>
                <p className="text-[10px] text-zinc-550 dark:text-zinc-500 mt-0.5">Bayar instan pakai Gopay, OVO, ShopeePay, dll.</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-zinc-400 dark:text-zinc-650 group-hover/btn:text-zinc-700 group-hover/btn:dark:text-zinc-300 group-hover/btn:translate-x-0.5 transition-all" strokeWidth={1.5} />
          </button>

          <button
            type="button"
            onClick={() => setMethod("cash")}
            className="flex items-center justify-between p-4 bg-white dark:bg-zinc-950/30 hover:bg-zinc-50 dark:hover:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800/80 hover:border-zinc-350 dark:hover:border-zinc-700/80 rounded-2xl cursor-pointer text-left transition-all group/btn"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl border border-emerald-100 dark:border-emerald-900/30 group-hover/btn:scale-105 transition-transform duration-300">
                <Banknote className="w-5 h-5" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200">Tunai / Cash</p>
                <p className="text-[10px] text-zinc-550 dark:text-zinc-500 mt-0.5">Bayar cash langsung ke kasir/operator booth.</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-zinc-400 dark:text-zinc-650 group-hover/btn:text-zinc-700 group-hover/btn:dark:text-zinc-300 group-hover/btn:translate-x-0.5 transition-all" strokeWidth={1.5} />
          </button>
        </div>
      ) : method === "qris" ? (
        /* QRIS Screen */
        <div className="w-full flex flex-col items-center gap-5">
          <span className="text-[9px] text-zinc-605 dark:text-zinc-500 font-mono block tracking-wider uppercase font-bold text-left w-full mb-1">SCAN QRIS UNTUK BAYAR</span>
          
          <div className="p-3 bg-white rounded-2xl border border-zinc-200 shadow-inner flex items-center justify-center animate-scale-up">
            {/* Generate mock QR code with transaction info */}
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&color=18181b&bgcolor=ffffff&data=${encodeURIComponent(
                `qris-pay-glowbooth-${Date.now()}-${totalPrice}`
              )}`}
              alt="QRIS Code"
              className="w-[170px] h-[170px] rounded"
            />
          </div>

          <div className="flex flex-col gap-1 w-full text-center">
            <span className="text-[9px] text-zinc-650 dark:text-zinc-500 font-mono block">STATUS TRANSAKSI</span>
            <div className="flex items-center justify-center gap-1.5 text-xs text-blue-650 dark:text-blue-400 font-medium font-sans">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Menunggu pembayaran masuk...</span>
            </div>
          </div>

          <div className="flex gap-3 w-full border-t border-zinc-200 dark:border-zinc-900 pt-4 mt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setMethod(null)}
              className="flex-1 bg-transparent border-zinc-250 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900/40 text-xs py-2.5 rounded-xl cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1" strokeWidth={1.5} />
              Kembali
            </Button>
            <Button
              type="button"
              onClick={handleSimulatePayment}
              className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-650 hover:from-blue-500 hover:to-indigo-550 text-white font-semibold py-2.5 rounded-xl text-xs tracking-wider border-none cursor-pointer"
            >
              Simulasikan Sukses
            </Button>
          </div>
        </div>
      ) : (
        /* Cash Screen */
        <div className="w-full flex flex-col items-center gap-5">
          <span className="text-[9px] text-zinc-600 dark:text-zinc-500 font-mono block tracking-wider uppercase font-bold text-left w-full mb-1">PEMBAYARAN TUNAI</span>
          
          <div className="bg-zinc-50 dark:bg-zinc-950/40 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800/80 text-left w-full flex flex-col gap-3.5 animate-scale-up">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 text-xs font-mono font-bold">1</div>
              <div>
                <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-300">Serahkan Pembayaran</p>
                <p className="text-[10px] text-zinc-600 dark:text-zinc-550 mt-0.5 leading-relaxed">
                  Serahkan uang tunai sebesar <strong className="text-zinc-850 dark:text-zinc-400 font-semibold">{formatPrice(totalPrice)}</strong> kepada operator booth.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 border-t border-zinc-200 dark:border-zinc-900/60 pt-3">
              <div className="w-6 h-6 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 text-xs font-mono font-bold">2</div>
              <div>
                <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-300">Konfirmasi Operator</p>
                <p className="text-[10px] text-zinc-600 dark:text-zinc-550 mt-0.5 leading-relaxed">
                  Setelah operator menerima pembayaran, klik tombol di bawah untuk mengaktifkan kamera.
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-3 w-full border-t border-zinc-200 dark:border-zinc-900 pt-4 mt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setMethod(null)}
              className="flex-1 bg-transparent border-zinc-250 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900/40 text-xs py-2.5 rounded-xl cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1" strokeWidth={1.5} />
              Kembali
            </Button>
            <Button
              type="button"
              onClick={handleCashConfirm}
              className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-550 text-white font-semibold py-2.5 rounded-xl text-xs tracking-wider border-none cursor-pointer"
            >
              Selesai Bayar Cash
            </Button>
          </div>
        </div>
      )}

      {/* Cancel Sesi Button */}
      {!isSuccess && !isProcessing && !method && (
        <Button
          variant="ghost"
          onClick={onCancel}
          className="text-xs font-mono text-zinc-500 hover:text-zinc-750 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900/20 py-2.5 rounded-xl cursor-pointer w-full mt-2"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1" strokeWidth={1.5} />
          Batalkan Pendaftaran Sesi
        </Button>
      )}
    </div>
  );
}
