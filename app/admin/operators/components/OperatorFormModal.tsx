"use client";

import { useState, useEffect } from "react";
import { UserPlus, Edit, User, Mail, Key, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Operator } from "../types";
import { toast } from "sonner";

interface OperatorFormModalProps {
  isOpen: boolean;
  mode: "add" | "edit";
  initialData?: Operator | null;
  actionLoading: boolean;
  onClose: () => void;
  onSubmit: (data: { displayName: string; email: string; password?: string }) => void;
}

export default function OperatorFormModal({
  isOpen,
  mode,
  initialData,
  actionLoading,
  onClose,
  onSubmit,
}: OperatorFormModalProps) {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" && initialData) {
        setDisplayName(initialData.display_name);
        setEmail(initialData.email);
        setPassword("");
      } else {
        setDisplayName("");
        setEmail("");
        setPassword("");
      }
    }
  }, [isOpen, mode, initialData]);

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim() || !email.trim()) {
      toast.error("Nama dan Email wajib diisi.");
      return;
    }
    if (mode === "add" && !password.trim()) {
      toast.error("PIN / Sandi Kata wajib diisi untuk akun baru.");
      return;
    }
    if (password && password.length < 4) {
      toast.error("Password/PIN minimal 4 karakter.");
      return;
    }

    onSubmit({
      displayName: displayName.trim(),
      email: email.trim(),
      password: password || undefined,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-sm bg-white dark:bg-zinc-950 border-none ring-1 ring-zinc-200 dark:ring-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-2xl p-5 shadow-2xl flex flex-col gap-4">
        <DialogHeader className="flex flex-col gap-1">
          <DialogTitle className="text-sm font-semibold flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
            {mode === "add" ? (
              <>
                <UserPlus className="w-4 h-4 text-zinc-500" /> Tambah Operator Baru
              </>
            ) : (
              <>
                <Edit className="w-4 h-4 text-zinc-500" /> Perbarui Profil Operator
              </>
            )}
          </DialogTitle>
          <p className="text-xs text-zinc-500">
            {mode === "add" 
              ? "Buat kredensial login akun operasional petugas penjaga booth."
              : "Sesuaikan informasi profil operator. Biarkan kolom kata sandi kosong jika tidak ada pergantian PIN."}
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmitForm} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-medium text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 opacity-60" /> Nama Lengkap
            </Label>
            <Input
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Contoh: Budi Santoso"
              className="h-10 rounded-xl bg-white dark:bg-zinc-950 border-none ring-1 ring-inset ring-zinc-200/80 dark:ring-zinc-800/80 focus-visible:ring-2 focus-visible:ring-zinc-400 text-xs shadow-sm"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-medium text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 opacity-60" /> Email Otentikasi
            </Label>
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="budi@glowbooth.com"
              className="h-10 rounded-xl bg-white dark:bg-zinc-950 border-none ring-1 ring-inset ring-zinc-200/80 dark:ring-zinc-800/80 focus-visible:ring-2 focus-visible:ring-zinc-400 text-xs font-mono shadow-sm"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-medium text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 opacity-60" /> {mode === "add" ? "PIN / Sandi Kata" : "Ganti PIN Baru (Opsional)"}
            </Label>
            <Input
              type="password"
              required={mode === "add"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === "add" ? "Minimal 4 digit angka/huruf" : "Biarkan kosong jika tidak diubah"}
              className="h-10 rounded-xl bg-white dark:bg-zinc-950 border-none ring-1 ring-inset ring-zinc-200/80 dark:ring-zinc-800/80 focus-visible:ring-2 focus-visible:ring-zinc-400 text-xs shadow-sm"
            />
          </div>

          <DialogFooter className="mt-2.5 flex flex-row items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="flex-1 h-10 text-xs font-medium rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors cursor-pointer"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={actionLoading}
              className="flex-1 h-10 text-xs font-medium text-white dark:text-zinc-900 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 rounded-xl shadow-sm transition-colors flex items-center justify-center gap-1.5 border-none"
            >
              {actionLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  {mode === "add" ? "Membuat..." : "Menyimpan..."}
                </>
              ) : (
                mode === "add" ? "Buat Akun" : "Simpan Perubahan"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
