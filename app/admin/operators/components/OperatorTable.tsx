"use client";

import { Users, Search, Loader2, Calendar, Edit, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Operator } from "../types";

interface OperatorTableProps {
  loading: boolean;
  operators: Operator[];
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  onEdit: (op: Operator) => void;
  onDelete: (op: Operator) => void;
}

export default function OperatorTable({
  loading,
  operators,
  searchQuery,
  onSearchQueryChange,
  onEdit,
  onDelete,
}: OperatorTableProps) {
  const filteredOperators = operators.filter(
    (op) =>
      op.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      op.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("id-ID", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  return (
    <Card className="bg-white dark:bg-zinc-950 border-none ring-1 ring-inset ring-zinc-200/80 dark:ring-zinc-800/60 rounded-2xl shadow-[0_2px_12px_rgb(0,0,0,0.01)] overflow-hidden">
      <CardHeader className="pb-4 border-b border-zinc-100 dark:border-zinc-900">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-col gap-0.5">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
              <Users className="w-4 h-4 text-zinc-500" /> Daftar Anggota Operator
            </CardTitle>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:max-w-xs flex items-center">
            <Search className="absolute left-3 w-4 h-4 text-zinc-400 pointer-events-none" />
            <Input
              type="text"
              placeholder="Cari nama atau email..."
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
              className="pl-9 pr-4 h-9 text-xs rounded-xl bg-white dark:bg-zinc-950 border-none ring-1 ring-inset ring-zinc-200/80 dark:ring-zinc-800/80 focus-visible:ring-2 focus-visible:ring-zinc-400 shadow-sm"
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0 overflow-x-auto scrollbar-thin">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-zinc-500 text-xs font-medium">
            <Loader2 className="w-5 h-5 animate-spin text-zinc-600 dark:text-zinc-400" />
            <span>Memuat data berkas operator...</span>
          </div>
        ) : filteredOperators.length === 0 ? (
          <div className="w-full flex flex-col items-center justify-center py-16 px-4 border-dashed text-center gap-2 text-zinc-500 select-none">
            <div className="w-12 h-12 flex items-center justify-center rounded-full bg-zinc-50 dark:bg-zinc-900 mb-1">
              <Users className="w-5 h-5 text-zinc-400" strokeWidth={1.5} />
            </div>
            <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">Tidak ada operator ditemukan</p>
            <p className="text-[11px] max-w-xs text-zinc-400 dark:text-zinc-500 leading-relaxed">
              {searchQuery ? "Kueri pencarian tidak mencocokkan data akun manapun." : "Belum ada operator terdaftar pada sistem ini."}
            </p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-zinc-50/80 dark:bg-zinc-900/50 border-b border-zinc-200/80 dark:border-zinc-800/80 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                <th className="px-6 py-3.5">Nama Operator</th>
                <th className="px-6 py-3.5">Email Akses</th>
                <th className="px-6 py-3.5">Tanggal Registrasi</th>
                <th className="px-6 py-3.5 text-right">Manajemen Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 text-xs">
              {filteredOperators.map((op) => (
                <tr key={op.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30 transition-colors">
                  <td className="px-6 py-3.5 font-medium text-zinc-900 dark:text-zinc-100 align-middle">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-350 flex items-center justify-center font-semibold text-[10px] uppercase shrink-0 ring-1 ring-inset ring-zinc-200/60 dark:ring-zinc-800/60 shadow-sm">
                        {op.display_name.substring(0, 2)}
                      </div>
                      <span className="text-xs font-medium">{op.display_name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-3.5 text-zinc-500 dark:text-zinc-400 font-mono text-[11px] align-middle">{op.email}</td>
                  <td className="px-6 py-3.5 text-zinc-400 dark:text-zinc-500 align-middle">
                    <div className="flex items-center gap-1.5 font-sans">
                      <Calendar className="w-3.5 h-3.5 opacity-80" />
                      <span>{formatDate(op.created_at)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-3.5 text-right align-middle">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        onClick={() => onEdit(op)}
                        className="h-8 w-8 p-0 text-zinc-500 bg-zinc-50 hover:text-zinc-900 hover:bg-zinc-100/80 ring-1 ring-inset ring-zinc-200/40 dark:bg-zinc-900/50 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-800 dark:ring-zinc-800 rounded-lg transition-all active:scale-95 cursor-pointer"
                        title="Ubah Akses"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => onDelete(op)}
                        className="h-8 w-8 p-0 text-red-500 bg-red-50/40 hover:text-red-700 hover:bg-red-100 ring-1 ring-inset ring-red-100/80 dark:bg-red-950/20 dark:hover:bg-red-900/40 dark:hover:text-red-400 dark:ring-red-900/30 rounded-lg transition-all active:scale-95 cursor-pointer"
                        title="Hapus Akun"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  );
}
