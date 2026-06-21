"use client"

import { useState, useEffect } from "react"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheck, Info, AlertTriangle, AlertOctagon, Loader2 } from "lucide-react"

const Toaster = ({ ...props }: ToasterProps) => {
  const [currentTheme, setCurrentTheme] = useState<"light" | "dark">("dark")

  useEffect(() => {
    if (typeof window === "undefined") return

    const getThemeFromHtml = (): "light" | "dark" => {
      return document.documentElement.classList.contains("dark") ? "dark" : "light"
    }

    // Set initial theme
    setCurrentTheme(getThemeFromHtml())

    // Listen to mutation changes on <html> element
    const observer = new MutationObserver(() => {
      setCurrentTheme(getThemeFromHtml())
    })

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect()
  }, [])

  return (
    <Sonner
      theme={currentTheme}
      className="toaster group"
      icons={{
        success: (
          <CircleCheck className="w-4.5 h-4.5 text-emerald-500 dark:text-emerald-400 shrink-0" />
        ),
        info: (
          <Info className="w-4.5 h-4.5 text-blue-500 dark:text-blue-400 shrink-0" />
        ),
        warning: (
          <AlertTriangle className="w-4.5 h-4.5 text-amber-500 dark:text-amber-400 shrink-0" />
        ),
        error: (
          <AlertOctagon className="w-4.5 h-4.5 text-rose-500 dark:text-rose-400 shrink-0" />
        ),
        loading: (
          <Loader2 className="w-4.5 h-4.5 text-zinc-500 dark:text-zinc-400 animate-spin shrink-0" />
        ),
      }}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-white/90 dark:group-[.toaster]:bg-zinc-950/80 group-[.toaster]:backdrop-blur-xl group-[.toaster]:text-zinc-800 dark:group-[.toaster]:text-zinc-200 group-[.toaster]:border-zinc-200/60 dark:group-[.toaster]:border-zinc-800/60 group-[.toaster]:shadow-2xl group-[.toaster]:rounded-2xl group-[.toaster]:font-sans group-[.toaster]:p-4.5 group-[.toaster]:gap-3.5 group-[.toaster]:border group-[.toaster]:flex group-[.toaster]:items-center transition-all duration-300",
          title: "group-[.toast]:text-xs group-[.toast]:font-bold group-[.toast]:tracking-tight group-[.toast]:text-zinc-900 dark:group-[.toast]:text-white",
          description: "group-[.toast]:text-[11px] group-[.toast]:text-zinc-500 dark:group-[.toast]:text-zinc-400 group-[.toast]:leading-relaxed",
          actionButton:
            "group-[.toast]:bg-zinc-950 dark:group-[.toast]:bg-white group-[.toast]:text-white dark:group-[.toast]:text-zinc-950 group-[.toast]:text-[10px] group-[.toast]:font-extrabold group-[.toast]:tracking-wide group-[.toast]:uppercase group-[.toast]:px-3.5 group-[.toast]:py-2 group-[.toast]:rounded-xl group-[.toast]:hover:opacity-90 transition-opacity",
          cancelButton:
            "group-[.toast]:bg-zinc-100 dark:group-[.toast]:bg-zinc-900 group-[.toast]:text-zinc-500 dark:group-[.toast]:text-zinc-400 group-[.toast]:text-[10px] group-[.toast]:font-bold group-[.toast]:tracking-wide group-[.toast]:uppercase group-[.toast]:px-3.5 group-[.toast]:py-2 group-[.toast]:rounded-xl group-[.toast]:hover:bg-zinc-200/80 dark:group-[.toast]:hover:bg-zinc-800/80 transition-colors",
          success:
            "group-[.toaster]:border-emerald-500/20 group-[.toaster]:bg-emerald-50/40 dark:group-[.toaster]:bg-emerald-950/5",
          error:
            "group-[.toaster]:border-rose-500/20 group-[.toaster]:bg-rose-50/40 dark:group-[.toaster]:bg-rose-950/5",
          info:
            "group-[.toaster]:border-blue-500/20 group-[.toaster]:bg-blue-50/40 dark:group-[.toaster]:bg-blue-950/5",
          warning:
            "group-[.toaster]:border-amber-500/20 group-[.toaster]:bg-amber-50/40 dark:group-[.toaster]:bg-amber-950/5",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
