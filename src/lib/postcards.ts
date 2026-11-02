export type CardTheme = {
  bg: string; // background color or gradient (CSS)
  border: BorderStyleKey;
  font: FontKey;
  text: string; // text color (CSS)
  accent: string; // header tint (CSS color)
};

export type BorderStyleKey = "stamp" | "gold" | "hairline" | "neon";
export type FontKey = "serif" | "script" | "mono" | "sans";

export type Postcard = {
  id: string;
  title: string;
  body: string;
  author?: string;
  createdAt: number;
  images: string[];
  audio?: { name: string; src: string } | undefined;
  autoplay?: boolean;
  theme?: CardTheme;
  archived?: boolean;
  private?: boolean;
};

export type Profile = { name: string; email: string; bio: string };

export type AppThemeKey = "paper" | "dark" | "cyber" | "matcha" | "pastel" | "lotus";

export const APP_THEMES: { key: AppThemeKey; label: string; swatch: string }[] = [
  { key: "paper", label: "Default Paper", swatch: "#faf7f2" },
  { key: "dark", label: "Dark Slate", swatch: "#121316" },
  { key: "cyber", label: "Cyber Neon", swatch: "#0d0f18" },
  { key: "matcha", label: "Matcha Latte", swatch: "#edf2ea" },
  { key: "pastel", label: "Cute Pastel", swatch: "#fff0f4" },
  { key: "lotus", label: "Blossom Lotus", swatch: "#f7e9ec" },
];

export const FONTS: Record<FontKey, { label: string; css: string }> = {
  serif: { label: "Serif", css: '"Fraunces", Georgia, serif' },
  script: { label: "Handwritten", css: '"Caveat", cursive' },
  mono: { label: "Monospace", css: '"IBM Plex Mono", monospace' },
  sans: { label: "Clean Sans", css: '"Karla", system-ui, sans-serif' },
};

export const BORDERS: Record<BorderStyleKey, { label: string; css: React.CSSProperties }> = {
  stamp: { label: "Dashed stamp edge", css: { border: "2px dashed currentColor" } },
  gold: { label: "Gold foil", css: { border: "3px double #c9a227" } },
  hairline: { label: "Minimalist hairline", css: { border: "1px solid currentColor" } },
  neon: { label: "Neon glow", css: { border: "1px solid #22d3ee", boxShadow: "0 0 12px #22d3ee66, inset 0 0 12px #22d3ee22" } },
};

export const CARD_PRESETS: { name: string; theme: CardTheme }[] = [
  {
    name: "Vintage Parchment",
    theme: { bg: "linear-gradient(160deg, #f5ead6, #e8d9bc)", border: "stamp", font: "serif", text: "#4a3b28", accent: "#8a6d3b" },
  },
  {
    name: "Midnight Sky",
    theme: { bg: "linear-gradient(160deg, #1b2340, #0e1226)", border: "hairline", font: "serif", text: "#dfe6ff", accent: "#8fa3e8" },
  },
  {
    name: "Cyberpunk Letter",
    theme: { bg: "linear-gradient(160deg, #141126, #1e0f2e)", border: "neon", font: "mono", text: "#7df9ff", accent: "#ff5da2" },
  },
  {
    name: "Sakura Flower",
    theme: { bg: "linear-gradient(160deg, #ffeef3, #ffd9e4)", border: "hairline", font: "script", text: "#7a3b52", accent: "#e58aa5" },
  },
  {
    name: "Matcha Press",
    theme: { bg: "linear-gradient(160deg, #eef3e6, #dde8cf)", border: "gold", font: "sans", text: "#3c4a2e", accent: "#6b8a4f" },
  },
];

export const defaultCardTheme = (): CardTheme => ({ ...CARD_PRESETS[0]!.theme });

const KEY = "postcards.v1";
const PKEY = "postcards.profile";
const TKEY = "postcards.theme";

export const seed: Postcard[] = [
  {
    id: "s1",
    title: "Rain over the Mekong",
    body: "The sky turned slate by four. Tuk-tuks hissed past, and the café owner turned up an old Sinn Sisamouth record. I stayed for a second coffee just to hear it end.",
    author: "Traveler",
    createdAt: Date.now() - 86400000 * 2,
    images: [],
    theme: { ...CARD_PRESETS[0]!.theme },
  },
  {
    id: "s2",
    title: "Letter to future me",
    body: "Remember how it felt to start something without knowing how it ends. Keep that.",
    author: "Traveler",
    createdAt: Date.now() - 86400000 * 9,
    images: [],
    private: true,
    theme: { ...CARD_PRESETS[1]!.theme },
  },
];

const safe = <T>(k: string, fb: T): T => {
  try {
    const v = localStorage.getItem(k);
    return v ? (JSON.parse(v) as T) : fb;
  } catch {
    return fb;
  }
};
const save = (k: string, v: unknown) => {
  try {
    localStorage.setItem(k, JSON.stringify(v));
    return true;
  } catch {
    return false;
  }
};

export const loadCards = () => safe<Postcard[]>(KEY, seed);
export const saveCards = (c: Postcard[]) => save(KEY, c);
export const loadProfile = () => safe<Profile>(PKEY, { name: "Traveler", email: "", bio: "" });
export const saveProfile = (p: Profile) => save(PKEY, p);
export const loadTheme = () => safe<AppThemeKey>(TKEY, "paper");
export const saveTheme = (t: AppThemeKey) => save(TKEY, t);

export const readFile = (f: File) =>
  new Promise<string>((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = rej;
    r.readAsDataURL(f);
  });

export type SortKey = "new" | "old" | "az";
export function filterCards(
  cards: Postcard[],
  o: { q: string; sort: SortKey; day: string | null; view: "all" | "archive" | "private" },
) {
  const q = o.q.trim().toLowerCase();
  return cards
    .filter((c) =>
      o.view === "archive" ? c.archived : o.view === "private" ? c.private && !c.archived : !c.archived,
    )
    .filter((c) => !q || c.title.toLowerCase().includes(q) || c.body.toLowerCase().includes(q))
    .filter((c) => !o.day || dayKey(c.createdAt) === o.day)
    .sort((a, b) =>
      o.sort === "az" ? a.title.localeCompare(b.title) : o.sort === "old" ? a.createdAt - b.createdAt : b.createdAt - a.createdAt,
    );
}
export const dayKey = (t: number) => {
  const d = new Date(t);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
};
