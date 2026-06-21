"use client";

import { Camera, Palette, Plus, Trash2, Edit, Layout } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UiTemplate } from "../../../hooks/usePhotoboothStore";
import { THEME_GLOWS } from "./theme-constants";

interface TemplateListProps {
  templates: UiTemplate[];
  onAdd: () => void;
  onEdit: (template: UiTemplate) => void;
  onDelete: (id: string, name: string) => void;
}

export default function TemplateList({ templates, onAdd, onEdit, onDelete }: TemplateListProps) {
  return (
    <div className="flex flex-col gap-8 animate-fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2.5">
            <div className="p-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
              <Palette className="w-4 h-4 text-zinc-600 dark:text-zinc-300" />
            </div>
            Template UI/UX
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-xl">
            Buat dan kelola template tampilan portal menggunakan Visual Builder.
          </p>
        </div>
        <Button onClick={onAdd} className="h-9 text-sm font-medium gap-2 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 text-white rounded-lg shadow-sm">
          <Plus className="w-4 h-4" /> Buat Template
        </Button>
      </div>

      {templates.length === 0 ? (
        <div className="border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl p-12 flex flex-col items-center justify-center text-center gap-4 bg-zinc-50/50 dark:bg-zinc-900/20">
          <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400">
            <Layout className="w-5 h-5" />
          </div>
          <div className="flex flex-col gap-1 max-w-xs">
            <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Belum ada template</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Mulai rancang tampilan portal photobooth Anda sekarang.</p>
          </div>
          <Button variant="outline" onClick={onAdd} className="mt-2 h-9 text-sm rounded-lg border-zinc-200 dark:border-zinc-800">
            Buka Visual Builder
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {templates.map((template) => {
            const themePreset = THEME_GLOWS[template.bgTheme as keyof typeof THEME_GLOWS] || THEME_GLOWS.sunset;
            return (
              <Card key={template.id} className="bg-white dark:bg-[#0A0A0A] border border-zinc-200 dark:border-zinc-800/80 rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col group">
                <CardHeader className="p-4 border-b border-zinc-100 dark:border-zinc-800/60 flex flex-row items-center justify-between space-y-0">
                  <div className="min-w-0 pr-4">
                    <CardTitle className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">{template.name}</CardTitle>
                    <CardDescription className="text-xs text-zinc-500 mt-0.5 truncate capitalize">{template.fontStyle} Font</CardDescription>
                  </div>
                  <div className={`w-8 h-8 rounded-full bg-gradient-to-tr ${themePreset.gradient} shrink-0 opacity-80`} />
                </CardHeader>
                <CardContent className="p-4 flex-1 flex flex-col gap-4">
                  <div className="flex gap-3 items-center">
                    <div className="w-10 h-10 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center p-1 shrink-0">
                      {template.logoUrl ? <img src={template.logoUrl} alt="Logo" className="w-full h-full object-contain" /> : <Camera className="w-4 h-4 text-zinc-400" />}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <span className="text-[10px] px-2 py-0.5 rounded-md font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                        {template.showPayment ? 'QRIS On' : 'QRIS Off'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-2 mt-auto pt-2">
                    <Button variant="ghost" onClick={() => onEdit(template)} className="h-8 text-xs font-medium px-3 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md">
                      <Edit className="w-3.5 h-3.5 mr-1.5" /> Builder
                    </Button>
                    <Button variant="ghost" onClick={() => onDelete(template.id, template.name)} className="h-8 w-8 p-0 text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-md">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}