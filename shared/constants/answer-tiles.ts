export type AnswerShape = 'triangle' | 'diamond' | 'circle' | 'square' | 'hexagon' | 'star';

export interface AnswerTileTheme {
  index: number;
  letter: 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
  shape: AnswerShape;
  colorName: string;
  bgHex: string;
  hoverHex: string;
  fgHex: string;
  badgeBgClass: string;
  tileClasses: string;
}

export const ANSWER_TILE_THEMES: readonly AnswerTileTheme[] = [
  {
    index: 0,
    letter: 'A',
    shape: 'triangle',
    colorName: 'Red',
    bgHex: '#dc2626',
    hoverHex: '#b91c1c',
    fgHex: '#ffffff',
    badgeBgClass: 'bg-black/20 text-white',
    tileClasses: 'bg-[#dc2626] hover:bg-[#b91c1c] text-white border-[#991b1b]',
  },
  {
    index: 1,
    letter: 'B',
    shape: 'diamond',
    colorName: 'Blue',
    bgHex: '#2563eb',
    hoverHex: '#1d4ed8',
    fgHex: '#ffffff',
    badgeBgClass: 'bg-black/20 text-white',
    tileClasses: 'bg-[#2563eb] hover:bg-[#1d4ed8] text-white border-[#1e40af]',
  },
  {
    index: 2,
    letter: 'C',
    shape: 'circle',
    colorName: 'Yellow',
    bgHex: '#eab308',
    hoverHex: '#ca8a04',
    // Dark ink ensures >= 4.5:1 WCAG AA contrast on bright yellow
    fgHex: '#0f172a',
    badgeBgClass: 'bg-slate-900/15 text-slate-950',
    tileClasses: 'bg-[#eab308] hover:bg-[#ca8a04] text-slate-950 border-[#a16207]',
  },
  {
    index: 3,
    letter: 'D',
    shape: 'square',
    colorName: 'Green',
    bgHex: '#16a34a',
    hoverHex: '#15803d',
    fgHex: '#ffffff',
    badgeBgClass: 'bg-black/20 text-white',
    tileClasses: 'bg-[#16a34a] hover:bg-[#15803d] text-white border-[#166534]',
  },
  {
    index: 4,
    letter: 'E',
    shape: 'hexagon',
    colorName: 'Teal',
    bgHex: '#0d9488',
    hoverHex: '#0f766e',
    fgHex: '#ffffff',
    badgeBgClass: 'bg-black/20 text-white',
    tileClasses: 'bg-[#0d9488] hover:bg-[#0f766e] text-white border-[#115e59]',
  },
  {
    index: 5,
    letter: 'F',
    shape: 'star',
    colorName: 'Purple',
    bgHex: '#9333ea',
    hoverHex: '#7e22ce',
    fgHex: '#ffffff',
    badgeBgClass: 'bg-black/20 text-white',
    tileClasses: 'bg-[#9333ea] hover:bg-[#7e22ce] text-white border-[#6b21a8]',
  },
] as const;

export function getAnswerTileTheme(index: number): AnswerTileTheme {
  const safeIndex = ((index % ANSWER_TILE_THEMES.length) + ANSWER_TILE_THEMES.length) % ANSWER_TILE_THEMES.length;
  return ANSWER_TILE_THEMES[safeIndex]!;
}

