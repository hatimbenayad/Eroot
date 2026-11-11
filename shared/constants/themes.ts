export interface ErootTheme {
  id: string;
  name: string;
  swatchHex: string;
  stageClass: string;
  canvasBackdropClass: string;
  cardSurfaceClass: string;
  textClass: string;
  subtextClass: string;
}

export const EROOT_THEMES: readonly ErootTheme[] = [
  {
    id: 'indigo-stage',
    name: 'Indigo Stage',
    swatchHex: '#1e1b4b',
    stageClass: 'bg-gradient-to-br from-slate-900 via-indigo-950 to-indigo-900',
    canvasBackdropClass: 'bg-gradient-to-br from-indigo-950 to-slate-900',
    cardSurfaceClass: 'bg-white/95 text-slate-900',
    textClass: 'text-white',
    subtextClass: 'text-indigo-200',
  },
  {
    id: 'midnight-slate',
    name: 'Midnight Slate',
    swatchHex: '#0f172a',
    stageClass: 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800',
    canvasBackdropClass: 'bg-gradient-to-br from-slate-900 to-slate-800',
    cardSurfaceClass: 'bg-white/95 text-slate-900',
    textClass: 'text-white',
    subtextClass: 'text-slate-300',
  },
  {
    id: 'ocean-current',
    name: 'Ocean Current',
    swatchHex: '#0c4a6e',
    stageClass: 'bg-gradient-to-br from-sky-950 via-cyan-900 to-blue-900',
    canvasBackdropClass: 'bg-gradient-to-br from-sky-900 to-cyan-900',
    cardSurfaceClass: 'bg-white/95 text-slate-900',
    textClass: 'text-white',
    subtextClass: 'text-sky-200',
  },
  {
    id: 'emerald-forest',
    name: 'Emerald Forest',
    swatchHex: '#064e3b',
    stageClass: 'bg-gradient-to-br from-emerald-950 via-teal-900 to-emerald-900',
    canvasBackdropClass: 'bg-gradient-to-br from-emerald-950 to-teal-900',
    cardSurfaceClass: 'bg-white/95 text-slate-900',
    textClass: 'text-white',
    subtextClass: 'text-emerald-200',
  },
  {
    id: 'sunset-terracotta',
    name: 'Sunset Terracotta',
    swatchHex: '#7c2d12',
    stageClass: 'bg-gradient-to-br from-stone-950 via-orange-950 to-rose-950',
    canvasBackdropClass: 'bg-gradient-to-br from-orange-950 to-rose-950',
    cardSurfaceClass: 'bg-white/95 text-slate-900',
    textClass: 'text-white',
    subtextClass: 'text-orange-200',
  },
  {
    id: 'royal-plum',
    name: 'Royal Plum',
    swatchHex: '#4c1d95',
    stageClass: 'bg-gradient-to-br from-purple-950 via-violet-900 to-fuchsia-950',
    canvasBackdropClass: 'bg-gradient-to-br from-violet-950 to-purple-900',
    cardSurfaceClass: 'bg-white/95 text-slate-900',
    textClass: 'text-white',
    subtextClass: 'text-violet-200',
  },
  {
    id: 'warm-sand',
    name: 'Warm Sand',
    swatchHex: '#fef3c7',
    stageClass: 'bg-gradient-to-br from-amber-50 via-orange-50 to-stone-100',
    canvasBackdropClass: 'bg-gradient-to-br from-amber-100 to-orange-50',
    cardSurfaceClass: 'bg-white text-slate-900',
    textClass: 'text-slate-900',
    subtextClass: 'text-slate-700',
  },
  {
    id: 'nordic-mist',
    name: 'Nordic Mist',
    swatchHex: '#e2e8f0',
    stageClass: 'bg-gradient-to-br from-slate-100 via-indigo-50 to-sky-100',
    canvasBackdropClass: 'bg-gradient-to-br from-slate-100 to-indigo-50',
    cardSurfaceClass: 'bg-white text-slate-900',
    textClass: 'text-slate-900',
    subtextClass: 'text-slate-700',
  },
] as const;

export function getErootTheme(themeId: string | undefined): ErootTheme {
  return EROOT_THEMES.find((t) => t.id === themeId) ?? EROOT_THEMES[0]!;
}

