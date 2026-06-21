"use client";

import { useState, useEffect } from "react";
import { QrCode, Banknote, ArrowRight, ArrowLeft, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface PaymentScreenProps {
  customerName: string;
  customerPhone: string;
  sessionsCount: number;
  onPaymentSuccess: (method: "qris" | "cash") => void;
  onCancel: () => void;
  eventName: string;
  pricePerSession?: number;
  qrisUrl?: string;
  onEditField?: (field: string) => void;
  onChangeConfig?: (key: string, value: string) => void;
  selectedComponent?: string | null;
  customization?: any;
}

export default function PaymentScreen({
  customerName,
  customerPhone,
  sessionsCount,
  onPaymentSuccess,
  onCancel,
  eventName,
  pricePerSession = 25000,
  qrisUrl,
  onEditField,
  onChangeConfig,
  selectedComponent,
  customization,
}: PaymentScreenProps) {
  const [method, setMethod] = useState<"qris" | "cash" | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (selectedComponent === "qrisUpload") {
      setMethod("qris");
    } else if (selectedComponent === "paymentOptions") {
      setMethod("cash");
    } else if (selectedComponent === "billingSummary") {
      setMethod(null);
    }
  }, [selectedComponent]);

  const totalPrice = sessionsCount * pricePerSession;

  const formatPrice = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const handleQrisConfirm = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setIsSuccess(true);
      setTimeout(() => {
        onPaymentSuccess("qris");
      }, 1500);
    }, 1500);
  };

  const handleCashConfirm = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setIsSuccess(true);
      setTimeout(() => {
        onPaymentSuccess("cash");
      }, 1500);
    }, 1500);
  };

  const getCardStyleClasses = (style?: string) => {
    switch (style) {
      case "glass":
        return "max-w-md w-full bg-white/20 dark:bg-white/5 backdrop-blur-md border border-white/10 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] backdrop-saturate-150 p-8 flex flex-col items-center gap-6 relative overflow-hidden animate-fade-in duration-300 transition-all rounded-3xl";
      case "frameless":
        return "max-w-md w-full bg-[#fdfbf7]/85 dark:bg-[#161513]/85 backdrop-blur-md border border-amber-700/20 shadow-[0_12px_40px_rgba(180,83,9,0.08)] p-8 flex flex-col items-center gap-6 relative overflow-hidden animate-fade-in duration-300 transition-all rounded-3xl before:absolute before:inset-1 before:rounded-[22px] before:border-2 before:border-double before:border-amber-700/15 before:pointer-events-none";
      case "neobrutalist":
        return "max-w-md w-full bg-[#FFF6E9] dark:bg-zinc-900 border-4 border-black dark:border-white shadow-[8px_8px_0px_0px_#000000] dark:shadow-[8px_8px_0px_0px_#ffffff] p-8 flex flex-col items-center gap-6 relative overflow-hidden animate-fade-in duration-300 transition-all rounded-none";
      case "classic":
      default:
        return "max-w-md w-full bg-white/80 dark:bg-zinc-955/75 backdrop-blur-2xl border border-zinc-200/40 dark:border-zinc-800/40 p-8 flex flex-col items-center gap-6 shadow-2xl relative overflow-hidden animate-fade-in duration-300 transition-all rounded-3xl";
    }
  };

  const getSummaryBoxClasses = (style?: string) => {
    switch (style) {
      case "glass":
        return "w-full text-left bg-white/10 dark:bg-black/20 backdrop-blur-lg border border-white/10 p-4.5 rounded-2xl flex flex-col gap-2.5 transition-colors";
      case "frameless":
        return "w-full text-left bg-[#fcf9f2]/60 dark:bg-stone-900/40 backdrop-blur-sm border border-amber-700/10 p-4.5 rounded-2xl flex flex-col gap-2.5 transition-colors";
      case "neobrutalist":
        return "w-full text-left bg-white dark:bg-zinc-800 border-4 border-black dark:border-white shadow-[4px_4px_0px_0px_#000000] dark:shadow-[4px_4px_0px_0px_#ffffff] p-4.5 rounded-none flex flex-col gap-2.5 transition-colors";
      case "classic":
      default:
        return "w-full text-left bg-zinc-50/50 dark:bg-zinc-955/40 p-4.5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/60 flex flex-col gap-2.5 transition-colors";
    }
  };

  const getMethodButtonClasses = (style?: string) => {
    switch (style) {
      case "glass":
        return "flex items-center justify-between p-4 bg-white/10 dark:bg-black/10 backdrop-blur-md border border-white/10 hover:bg-white/20 dark:hover:bg-black/25 rounded-2xl cursor-pointer text-left transition-all group/btn w-full";
      case "frameless":
        return "flex items-center justify-between p-4 bg-white/50 dark:bg-black/20 border border-amber-700/15 hover:bg-[#fcf9f2]/80 dark:hover:bg-stone-900/60 rounded-xl cursor-pointer text-left transition-all group/btn w-full";
      case "neobrutalist":
        return "flex items-center justify-between p-4 bg-white dark:bg-zinc-800 border-4 border-black dark:border-white shadow-[4px_4px_0px_0px_#000000] dark:shadow-[4px_4px_0px_0px_#ffffff] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[3px_3px_0px_0px_#000000] dark:hover:shadow-[3px_3px_0px_0px_#ffffff] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none rounded-none cursor-pointer text-left transition-all group/btn w-full";
      case "classic":
      default:
        return "flex items-center justify-between p-4 bg-white dark:bg-zinc-955/30 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl cursor-pointer text-left transition-all group/btn w-full hover:bg-zinc-50 dark:hover:bg-zinc-900/40";
    }
  };

  const getIconWrapperClasses = (style?: string, type: "blue" | "emerald" = "blue") => {
    const colors = type === "blue" 
      ? "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30" 
      : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30";
    switch (style) {
      case "neobrutalist":
        return `p-2.5 ${colors} border-2 border-black dark:border-white rounded-none`;
      case "glass":
        return `p-2.5 bg-white/20 dark:bg-white/5 border border-white/20 text-white rounded-xl`;
      case "frameless":
        return `p-2.5 bg-transparent ${type === "blue" ? "text-blue-500" : "text-emerald-500"} rounded-lg`;
      case "classic":
      default:
        return `p-2.5 ${colors} rounded-xl`;
    }
  };

  const getActionButtonClasses = (style?: string, variant: "primary" | "secondary" = "primary") => {
    if (variant === "primary") {
      switch (style) {
        case "glass":
          return "flex-1 bg-white/20 dark:bg-white/10 hover:bg-white/30 dark:hover:bg-white/15 border border-white/20 text-white font-extrabold py-2.5 rounded-xl text-xs tracking-wider cursor-pointer transition-all duration-300 uppercase";
        case "frameless":
          return "flex-1 bg-gradient-to-r from-amber-700 via-rose-700 to-amber-700 hover:from-amber-600 hover:via-rose-600 hover:to-amber-600 text-white font-serif font-bold py-2.5 rounded-xl text-xs tracking-wider cursor-pointer transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 uppercase";
        case "neobrutalist":
          return "flex-1 bg-[#ea580c] text-white border-4 border-black dark:border-white font-black py-2.5 rounded-none text-xs tracking-wider shadow-[3px_3px_0px_0px_#000000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_#000000] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none cursor-pointer transition-all uppercase";
        case "classic":
        default:
          return "flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold py-2.5 rounded-xl text-xs tracking-wider border-none cursor-pointer transition-all duration-300 shadow-sm";
      }
    } else {
      switch (style) {
        case "glass":
          return "flex-1 bg-transparent border border-white/10 text-white/70 hover:text-white hover:bg-white/10 text-xs py-2.5 rounded-xl cursor-pointer transition-all duration-300 uppercase";
        case "frameless":
          return "flex-1 bg-transparent border border-amber-750/30 text-amber-800 dark:text-amber-500 hover:bg-amber-50/50 dark:hover:bg-stone-900/50 text-xs py-2.5 rounded-xl cursor-pointer transition-all duration-300 uppercase";
        case "neobrutalist":
          return "flex-1 bg-white dark:bg-zinc-850 text-black dark:text-white border-4 border-black dark:border-white font-bold text-xs py-2.5 rounded-none shadow-[3px_3px_0px_0px_#000000] dark:shadow-[3px_3px_0px_0px_#ffffff] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_#000000] dark:shadow-[2px_2px_0px_0px_#ffffff] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none cursor-pointer transition-all uppercase";
        case "classic":
        default:
          return "flex-1 bg-transparent border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900/40 text-xs py-2.5 rounded-xl cursor-pointer transition-all duration-300";
      }
    }
  };

  const getQrContainerClasses = (style?: string) => {
    switch (style) {
      case "glass":
        return "p-3 bg-white rounded-2xl border border-white/20 shadow-inner flex items-center justify-center animate-scale-up relative overflow-hidden";
      case "frameless":
        return "p-3 bg-transparent rounded-xl border border-zinc-200 dark:border-zinc-800 flex items-center justify-center animate-scale-up relative overflow-hidden";
      case "neobrutalist":
        return "p-3 bg-white border-4 border-black dark:border-white shadow-[4px_4px_0px_0px_#000000] rounded-none flex items-center justify-center animate-scale-up relative overflow-hidden";
      case "classic":
      default:
        return "p-3 bg-white rounded-2xl border border-zinc-200 shadow-inner flex items-center justify-center animate-scale-up relative overflow-hidden";
    }
  };

  const cardStyle = customization?.cardStyle;

  if (customization?.showPayment === false) {
    return (
      <div className="max-w-md w-full min-h-[300px] bg-zinc-950/40 border-2 border-dashed border-zinc-800/80 rounded-3xl flex flex-col items-center justify-center p-8 text-center gap-3">
        <div className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-500">
          <QrCode className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-zinc-300">Layar Pembayaran Dinonaktifkan</h3>
          <p className="text-xs text-zinc-500 max-w-[250px] leading-relaxed mx-auto">
            Aktifkan widget ini di sidebar untuk menampilkan rincian pembayaran QRIS/Tunai.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={getCardStyleClasses(cardStyle)}>
      {cardStyle !== "frameless" && cardStyle !== "neobrutalist" && (
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-blue-500/0 via-blue-500/35 to-blue-500/0" />
      )}

      {/* Figma-like State Switcher (only in builder/editor mode) */}
      {onEditField && (
        <div className="w-full flex bg-zinc-100 dark:bg-zinc-900 p-0.5 rounded-xl gap-0.5 border border-zinc-200/50 dark:border-zinc-800/60 shadow-inner z-30 mb-1">
          {([
            { id: null, label: "1. Utama" },
            { id: "qris", label: "2. QRIS" },
            { id: "cash", label: "3. Cash" }
          ] as const).map((opt) => (
            <button
              key={opt.id === null ? "null" : opt.id}
              type="button"
              onClick={() => {
                setMethod(opt.id);
                if (opt.id === "qris") {
                  onEditField("qrisUpload");
                } else if (opt.id === "cash") {
                  onEditField("paymentOptions");
                } else {
                  onEditField("billingSummary");
                }
              }}
              className={`flex-1 py-1.5 px-2 rounded-lg text-[9px] font-bold tracking-wide uppercase transition-all cursor-pointer ${
                method === opt.id
                  ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm border border-zinc-200/20"
                  : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}

      {/* Header */}
      <div>
        <h2 className={`text-xl font-bold text-zinc-900 dark:text-[#e3e3e3] tracking-tight ${cardStyle === "neobrutalist" ? "uppercase font-black" : ""}`}>Rincian Pembayaran</h2>
        <p className="text-zinc-500 dark:text-zinc-400 text-xs mt-1.5 leading-relaxed">
          Pilih metode pembayaran untuk sesi foto di <strong className="text-zinc-800 dark:text-zinc-200 font-semibold">{eventName}</strong>.
        </p>
      </div>

      {/* Billing Info Summary */}
      <div className={getSummaryBoxClasses(cardStyle)}>
        <div className="flex justify-between items-center text-xs">
          <span className="text-zinc-500 font-medium">Nama Tamu</span>
          <span className="text-zinc-800 dark:text-zinc-300 font-semibold truncate max-w-[180px]">{customerName}</span>
        </div>
        <div className={`flex justify-between items-center text-xs border-t ${cardStyle === "neobrutalist" ? "border-black dark:border-white" : "border-zinc-200 dark:border-zinc-900"} pt-2.5`}>
          <span className="text-zinc-500 font-medium">Jumlah Sesi</span>
          <span className="text-zinc-800 dark:text-zinc-300 font-semibold font-mono">{sessionsCount} Sesi</span>
        </div>
        <div className={`flex justify-between items-center text-sm border-t ${cardStyle === "neobrutalist" ? "border-black dark:border-white" : "border-zinc-200 dark:border-zinc-900"} pt-2.5 font-bold`}>
          <span className="text-zinc-650 dark:text-zinc-400">Total Tagihan</span>
          <span className={`${cardStyle === "neobrutalist" ? "text-[#ea580c] dark:text-amber-400 font-black" : "text-blue-650 dark:text-blue-450"} font-mono`}>{formatPrice(totalPrice)}</span>
        </div>
      </div>

      {/* Success State Overlay */}
      {isSuccess ? (
        <div className="w-full py-8 flex flex-col items-center gap-4 animate-scale-up">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-lg shadow-emerald-500/5 animate-pulse">
            <CheckCircle className="w-8 h-8" strokeWidth={1.5} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-emerald-600 dark:text-emerald-400">Pembayaran Berhasil!</h3>
            <p className="text-[10px] text-zinc-500 font-mono mt-1">Mengalihkan ke kamera...</p>
          </div>
        </div>
      ) : isProcessing ? (
        <div className="w-full py-8 flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          <div>
            <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Memproses Transaksi</h3>
            <p className="text-[10px] text-zinc-500 font-mono mt-1">Mohon tunggu sebentar...</p>
          </div>
        </div>
      ) : !method ? (
        <div className="w-full flex flex-col gap-3">
          <span className="text-[9px] text-zinc-400 dark:text-zinc-550 font-mono block tracking-wider uppercase font-bold text-left mb-1">PILIH METODE BAYAR</span>
          <button
            type="button"
            onClick={(e) => {
              setMethod("qris");
              if (onEditField) {
                e.stopPropagation();
                onEditField("qrisUpload");
              }
            }}
            className={getMethodButtonClasses(cardStyle)}
          >
            <div className="flex items-center gap-3">
              <div className={getIconWrapperClasses(cardStyle, "blue")}>
                <QrCode className="w-5 h-5" strokeWidth={1.5} />
              </div>
              <div>
                <p className={`text-xs font-bold text-zinc-800 dark:text-zinc-200 ${cardStyle === "neobrutalist" ? "uppercase font-black" : ""}`}>QRIS (Otomatis)</p>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-500 mt-0.5">Bayar instan pakai Gopay, OVO, ShopeePay, dll.</p>
              </div>
            </div>
            {onEditField ? (
              <div className="absolute top-1 right-2 bg-blue-600 text-white text-[8px] font-bold px-2 py-0.5 rounded opacity-0 group-hover/btn:opacity-100 transition-all pointer-events-none shadow-md z-30">
                Edit QRIS
              </div>
            ) : (
              <ArrowRight className="w-4 h-4 text-zinc-400 dark:text-zinc-650 group-hover/btn:text-zinc-700 group-hover/btn:dark:text-zinc-300 group-hover/btn:translate-x-0.5 transition-all" strokeWidth={1.5} />
            )}
          </button>
          <button
            type="button"
            onClick={(e) => {
              setMethod("cash");
              if (onEditField) {
                e.stopPropagation();
                onEditField("paymentOptions");
              }
            }}
            className={getMethodButtonClasses(cardStyle)}
          >
            <div className="flex items-center gap-3">
              <div className={getIconWrapperClasses(cardStyle, "emerald")}>
                <Banknote className="w-5 h-5" strokeWidth={1.5} />
              </div>
              <div>
                <p className={`text-xs font-bold text-zinc-800 dark:text-zinc-200 ${cardStyle === "neobrutalist" ? "uppercase font-black" : ""}`}>Tunai / Cash</p>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-500 mt-0.5">Bayar cash langsung ke kasir/operator booth.</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-zinc-400 dark:text-zinc-600 group-hover/btn:text-zinc-700 group-hover/btn:dark:text-zinc-300 group-hover/btn:translate-x-0.5 transition-all" strokeWidth={1.5} />
          </button>
        </div>
      ) : method === "qris" ? (
        <div className="w-full flex flex-col items-center gap-5">
          <span className="text-[9px] text-zinc-650 dark:text-zinc-500 font-mono block tracking-wider uppercase font-bold text-left w-full mb-1">SCAN QRIS UNTUK BAYAR</span>
          <div 
            onClick={(e) => {
              if (onEditField) {
                e.stopPropagation();
                onEditField("qrisUrl");
                const input = document.getElementById("inline-qris-file-input");
                input?.click();
              }
            }}
            className={`${getQrContainerClasses(cardStyle)} ${
              onEditField 
                ? "hover:outline hover:outline-2 hover:outline-blue-500 hover:outline-offset-4 cursor-pointer group" 
                : ""
            }`}
          >
            {!onEditField && (
              <div 
                className="absolute left-0 right-0 h-0.5 bg-emerald-500/80 shadow-[0_0_8px_3px_rgba(16,185,129,0.6)] z-20"
                style={{
                  animation: "scan-laser 2.5s ease-in-out infinite",
                  top: "3%"
                }}
              />
            )}
            <style>{`
              @keyframes scan-laser {
                0%, 100% { top: 3%; }
                50% { top: 97%; }
              }
            `}</style>
            <img
              src={qrisUrl || `https://api.qrserver.com/v1/create-qr-code/?size=200x200&color=18181b&bgcolor=ffffff&data=${encodeURIComponent(
                `qris-pay-glowbooth-${Date.now()}-${totalPrice}`
              )}`}
              alt="QRIS Code"
              className="w-[170px] h-[170px] rounded object-contain relative z-10"
            />
            {onEditField && (
              <>
                <input
                  type="file"
                  id="inline-qris-file-input"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                      if (ev.target?.result && onChangeConfig) {
                        onChangeConfig("qrisUrl", ev.target.result as string);
                      }
                    };
                    reader.readAsDataURL(file);
                  }}
                  onClick={(ev) => ev.stopPropagation()}
                />
                <div className="absolute -top-7 bg-blue-600 text-white text-[8px] font-bold px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-all whitespace-nowrap pointer-events-none shadow-md z-30">
                  Klik untuk Unggah QRIS
                </div>
              </>
            )}
          </div>
          <div className={`flex gap-3 w-full border-t ${cardStyle === "neobrutalist" ? "border-black dark:border-white" : "border-zinc-200 dark:border-zinc-900"} pt-4 mt-2`}>
            <button
              type="button"
              onClick={() => {
                setMethod(null);
                if (onEditField) {
                  onEditField("billingSummary");
                }
              }}
              className={getActionButtonClasses(cardStyle, "secondary")}
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1 inline-block" strokeWidth={1.5} />
              Kembali
            </button>
            <button
              type="button"
              onClick={handleQrisConfirm}
              className={getActionButtonClasses(cardStyle, "primary")}
            >
              Selesai Bayar
            </button>
          </div>
        </div>
      ) : (
        <div className="w-full flex flex-col items-center gap-5">
          <span className="text-[9px] text-zinc-650 dark:text-zinc-500 font-mono block tracking-wider uppercase font-bold text-left w-full mb-1">PEMBAYARAN TUNAI</span>
          <div className={getSummaryBoxClasses(cardStyle)}>
            <div className="flex items-start gap-3">
              <div className={`w-6 h-6 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 text-xs font-mono font-bold ${cardStyle === "neobrutalist" ? "border-2 border-black rounded-none" : ""}`}>1</div>
              <div>
                <p className={`text-xs font-semibold text-zinc-800 dark:text-zinc-300 ${cardStyle === "neobrutalist" ? "uppercase font-black" : ""}`}>Serahkan Uang</p>
                <p className="text-[10px] text-zinc-650 dark:text-zinc-500 mt-0.5 leading-relaxed">
                  Serahkan uang tunai sebesar <strong className="text-zinc-800 dark:text-zinc-400 font-semibold">{formatPrice(totalPrice)}</strong> kepada operator booth.
                </p>
              </div>
            </div>
            <div className={`flex items-start gap-3 border-t ${cardStyle === "neobrutalist" ? "border-black dark:border-white" : "border-zinc-200 dark:border-zinc-900/60"} pt-3`}>
              <div className={`w-6 h-6 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 text-xs font-mono font-bold ${cardStyle === "neobrutalist" ? "border-2 border-black rounded-none" : ""}`}>2</div>
              <div>
                <p className={`text-xs font-semibold text-zinc-800 dark:text-zinc-300 ${cardStyle === "neobrutalist" ? "uppercase font-black" : ""}`}>Konfirmasi Operator</p>
                <p className="text-[10px] text-zinc-650 dark:text-zinc-500 mt-0.5 leading-relaxed">
                  Setelah operator menerima pembayaran, klik tombol di bawah untuk mengaktifkan kamera.
                </p>
              </div>
            </div>
          </div>
          <div className={`flex gap-3 w-full border-t ${cardStyle === "neobrutalist" ? "border-black dark:border-white" : "border-zinc-200 dark:border-zinc-900"} pt-4 mt-2`}>
            <button
              type="button"
              onClick={() => {
                setMethod(null);
                if (onEditField) {
                  onEditField("billingSummary");
                }
              }}
              className={getActionButtonClasses(cardStyle, "secondary")}
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1 inline-block" strokeWidth={1.5} />
              Kembali
            </button>
            <button
              type="button"
              onClick={handleCashConfirm}
              className={getActionButtonClasses(cardStyle, "primary")}
            >
              Mulai Foto
            </button>
          </div>
        </div>
      )}
      {!isSuccess && !isProcessing && !method && (
        <button
          type="button"
          onClick={onCancel}
          className={`text-xs font-mono text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900/20 py-2.5 rounded-xl cursor-pointer w-full mt-2 transition-all flex items-center justify-center ${
            cardStyle === "neobrutalist" ? "border-2 border-black hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#000000] rounded-none text-black dark:text-white dark:border-white bg-[#FFF6E9] dark:bg-zinc-900 font-bold uppercase" : ""
          }`}
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1 inline-block" strokeWidth={1.5} />
          Batalkan Pendaftaran
        </button>
      )}
    </div>
  );
}
