"use client";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface ConfirmDeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
}

export default function ConfirmDeleteDialog({
  isOpen,
  onClose,
  onConfirm,
  title = "Konfirmasi Hapus",
  description = "Apakah Anda yakin ingin menghapus item ini? Tindakan ini tidak dapat dibatalkan.",
  confirmText = "Hapus",
  cancelText = "Batal",
}: ConfirmDeleteDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent showCloseButton={false} className="max-w-xs bg-card border border-border text-foreground rounded-xl p-6 shadow-xl flex flex-col gap-4">
        <DialogHeader className="flex flex-col items-center text-center gap-3">
          <div className="w-12 h-12 rounded-full bg-red-500/10 dark:bg-red-500/20 flex items-center justify-center text-red-500 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <DialogTitle className="text-base font-bold tracking-tight">{title}</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
            {description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-row gap-2.5 mt-2 w-full justify-between items-center bg-transparent border-t-0 p-0 -mx-0 -mb-0">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            className="flex-1 h-10 text-xs font-semibold rounded-lg border border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="flex-1 h-10 text-xs font-semibold text-white bg-red-600 hover:bg-red-500 rounded-lg shadow-none cursor-pointer border-none"
          >
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
