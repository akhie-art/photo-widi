export const THEME_GLOWS = {
  sunset: {
    topLeft: "bg-amber-400/20 dark:bg-amber-500/15",
    bottomRight: "bg-pink-400/20 dark:bg-pink-500/15",
    primaryAccent: "bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-zinc-900",
    gradient: "from-amber-400 to-pink-500",
  },
  neon: {
    topLeft: "bg-fuchsia-400/20 dark:bg-fuchsia-500/15",
    bottomRight: "bg-cyan-400/20 dark:bg-cyan-500/15",
    primaryAccent: "bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-zinc-900",
    gradient: "from-fuchsia-500 to-cyan-400",
  },
  luxury: {
    topLeft: "bg-yellow-500/20 dark:bg-yellow-600/15",
    bottomRight: "bg-amber-500/20 dark:bg-amber-600/15",
    primaryAccent: "bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-zinc-900",
    gradient: "from-yellow-400 to-amber-600",
  },
  romantic: {
    topLeft: "bg-rose-400/20 dark:bg-rose-500/15",
    bottomRight: "bg-pink-400/20 dark:bg-pink-500/15",
    primaryAccent: "bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-zinc-900",
    gradient: "from-rose-400 to-pink-500",
  },
  emerald: {
    topLeft: "bg-emerald-400/20 dark:bg-emerald-500/15",
    bottomRight: "bg-teal-400/20 dark:bg-teal-500/15",
    primaryAccent: "bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-zinc-900",
    gradient: "from-emerald-400 to-teal-500",
  },
};

export const getFontFamilyName = (f: string) => {
  switch (f) {
    case "outfit": return "'Outfit', sans-serif";
    case "syne": return "'Syne', sans-serif";
    case "playfair": return "'Playfair Display', serif";
    case "cabinet": return "'Cabinet Grotesk', sans-serif";
    case "inter": default: return "'Inter', sans-serif";
  }
};