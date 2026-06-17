import type { Metadata } from "next";
import { Outfit, Geist_Mono } from "next/font/google";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import TitleHandler from "@/components/TitleHandler";
import { supabase } from "@/lib/supabase";
import Script from "next/script";

const outfit = Outfit({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  try {
    const { data: cfgRow } = await supabase
      .from("event_config")
      .select("config_json")
      .eq("id", "default")
      .single();

    const config = cfgRow?.config_json as any;
    const eventName = config?.eventName?.trim();
    return {
      title: eventName || "GLOW Virtual Photobooth",
      description: "Your modern premium virtual photobooth experience",
      manifest: "/manifest.json",
      appleWebApp: {
        capable: true,
        statusBarStyle: "default",
        title: "GlowBooth",
      },
    };
  } catch (err) {
    return {
      title: "GLOW Virtual Photobooth",
      description: "Your modern premium virtual photobooth experience",
      manifest: "/manifest.json",
      appleWebApp: {
        capable: true,
        statusBarStyle: "default",
        title: "GlowBooth",
      },
    };
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <Script id="theme-initializer" strategy="beforeInteractive">
          {`
            try {
              const saved = sessionStorage.getItem("glow_theme");
              const preferred = saved || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
              if (preferred === "dark") {
                document.documentElement.classList.add("dark");
              } else {
                document.documentElement.classList.remove("dark");
              }
            } catch (_) {}
          `}
        </Script>
        <Script id="register-sw" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js').then(
                  function(reg) {
                    console.log('SW registered with scope:', reg.scope);
                  },
                  function(err) {
                    console.log('SW registration failed:', err);
                  }
                );
              });
            }
          `}
        </Script>
        <TooltipProvider>
          <TitleHandler />
          {children}
          <Toaster richColors position="top-center" closeButton />
        </TooltipProvider>
      </body>
    </html>
  );
}
