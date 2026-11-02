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

export type AppThemeKey = "paper" | "dark" | "cyber" | "matcha" | "pastel" | "lotus" | "gold" | "river" | "mountain";

export const APP_THEMES: { key: AppThemeKey; label: string; swatch: string }[] = [
  { key: "paper", label: "Default Paper", swatch: "#faf7f2" },
  { key: "dark", label: "Dark Slate", swatch: "#121316" },
  { key: "cyber", label: "Cyber Neon", swatch: "#0d0f18" },
  { key: "matcha", label: "Matcha Latte", swatch: "#edf2ea" },
  { key: "pastel", label: "Cute Pastel", swatch: "#fff0f4" },
  { key: "lotus", label: "Blossom Lotus", swatch: "#f7e9ec" },
  { key: "gold", label: "Premium Gold", swatch: "#17130d" },
  { key: "river", label: "Natural River", swatch: "#dcefeb" },
  { key: "mountain", label: "Mountain Serene", swatch: "#eef1f1" },
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
  {
    name: "Gold Reserve",
    theme: { bg: "linear-gradient(145deg, #2a2115, #10100d 72%)", border: "gold", font: "serif", text: "#f3d58b", accent: "#c89b3c" },
  },
  {
    name: "River Stone",
    theme: { bg: "linear-gradient(145deg, #e5f2ef, #b8d5d1)", border: "hairline", font: "sans", text: "#274a4c", accent: "#5d9e9a" },
  },
  {
    name: "Alpine Morning",
    theme: { bg: "linear-gradient(145deg, #f5f7f6, #d9e1e2)", border: "hairline", font: "serif", text: "#263638", accent: "#738b91" },
  },
];

export const defaultCardTheme = (): CardTheme => ({ ...CARD_PRESETS[0].theme });

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
    theme: { ...CARD_PRESETS[0].theme },
  },
  {
    id: "s2",
    title: "Letter to future me",
    body: "Remember how it felt to start something without knowing how it ends. Keep that.",
    author: "Traveler",
    createdAt: Date.now() - 86400000 * 9,
    images: [],
    private: true,
    theme: { ...CARD_PRESETS[1].theme },
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

export async function exportPostcard(card: Postcard): Promise<Blob> {
  const { default: JSZip } = await import("jszip");
  const zip = new JSZip();
  const extension = (name: string, fallback: string) => name.split(".").pop()?.toLowerCase() || fallback;
  const data = (src: string) => src.includes(",") ? src.split(",", 2)[1] : src;
  const manifest = {
    format: "postcard",
    version: 1,
    id: card.id,
    title: card.title,
    text: card.body,
    author: card.author ?? "",
    createdAt: card.createdAt,
    theme: card.theme,
    autoplay: card.autoplay ?? false,
    private: card.private ?? false,
    archived: card.archived ?? false,
    audio: card.audio ? { name: card.audio.name, path: `audio/ambient.${extension(card.audio.name, "mp3")}` } : null,
    images: card.images.map((_, i) => `images/photo_${i + 1}.jpg`),
  };
  zip.file("manifest.json", JSON.stringify(manifest, null, 2));
  card.images.forEach((src, i) => zip.file(`images/photo_${i + 1}.jpg`, data(src), { base64: true }));
  if (card.audio?.src) zip.file(manifest.audio!.path, data(card.audio.src), { base64: true });
  return zip.generateAsync({ type: "blob", mimeType: "application/octet-stream" });
}

export async function importPostcard(file: File): Promise<Postcard> {
  const { default: JSZip } = await import("jszip");
  const zip = await JSZip.loadAsync(file);
  const manifest = JSON.parse(await zip.file("manifest.json")!.async("string"));
  const toDataUrl = async (path: string, mime: string) => {
    const entry = zip.file(path);
    if (!entry) return "";
    const bytes = await entry.async("uint8array");
    let binary = "";
    bytes.forEach((b) => { binary += String.fromCharCode(b); });
    return `data:${mime};base64,${btoa(binary)}`;
  };
  const images = await Promise.all((manifest.images ?? []).map((path: string) => toDataUrl(path, "image/jpeg")));
  const audioSrc = manifest.audio?.path ? await toDataUrl(manifest.audio.path, "audio/mpeg") : "";
  return {
    id: crypto.randomUUID(),
    title: manifest.title ?? "Imported postcard",
    body: manifest.text ?? "",
    author: manifest.author ?? "",
    createdAt: Number(manifest.createdAt) || Date.now(),
    images: images.filter(Boolean),
    audio: audioSrc ? { name: manifest.audio.name ?? "ambient.mp3", src: audioSrc } : undefined,
    autoplay: !!manifest.autoplay,
    theme: manifest.theme ?? defaultCardTheme(),
    private: !!manifest.private,
    archived: !!manifest.archived,
  };
}

export function exportInteractiveHtml(card: Postcard): Blob {
  const theme = card.theme ?? defaultCardTheme();
  const esc = (value: string) => value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]!));
  const payload = JSON.stringify({
    title: card.title, body: card.body, author: card.author ?? "", createdAt: card.createdAt,
    theme, audio: card.audio?.src ?? "", images: card.images,
  }).replace(/</g, "\\u003c");
  const photos = card.images.map((src, index) => `<button class="thumb" data-photo="${index}"><img src="${src}" alt="Photo ${index + 1}"></button>`).join("");
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(card.title || "Postcard")}</title>
<style>
:root{color-scheme:light;--bg:${theme.bg};--ink:${theme.text};--accent:${theme.accent};font-family:${FONTS[theme.font].css}}*{box-sizing:border-box}body{margin:0;min-height:100vh;background:radial-gradient(circle at 20% 0,#ffffff33,transparent 34%),#111;color:#fff;display:grid;place-items:center;padding:clamp(16px,4vw,56px)}button{font:inherit;cursor:pointer}.shell{width:min(900px,100%);min-height:min(720px,calc(100vh - 32px));position:relative;overflow:hidden;border-radius:22px;padding:clamp(20px,4vw,52px);background:var(--bg);color:var(--ink);box-shadow:0 30px 80px #0009}.stripe{height:6px;margin:-52px -52px 32px;background:linear-gradient(90deg,var(--accent),transparent,var(--accent))}.seal{font-size:28px}.meta{font:12px system-ui;letter-spacing:.14em;text-transform:uppercase;opacity:.65}.envelope-stage{position:absolute;inset:0;display:grid;place-items:center;background:#1118;backdrop-filter:blur(8px);z-index:3}.envelope{position:relative;width:min(78vw,460px);aspect-ratio:1.55;perspective:800px;filter:drop-shadow(0 24px 24px #0004)}.pocket{position:absolute;inset:20% 0 0;background:var(--bg);border:1px solid var(--accent);clip-path:polygon(0 0,50% 55%,100% 0,100% 100%,0 100%);z-index:2}.flap{position:absolute;inset:0 0 auto;height:60%;background:color-mix(in srgb,var(--bg) 76%,var(--accent));clip-path:polygon(0 0,100% 0,50% 100%);transform-origin:top;z-index:4;transition:transform .7s}.inside{position:absolute;inset:16% 12% auto;height:65%;padding:20px;background:var(--bg);border:1px solid var(--accent);display:grid;place-items:center;color:var(--accent);transform:translateY(18%);transition:transform .9s}.envelope-stage.open{animation:fade .8s forwards}.envelope-stage.open .flap{transform:rotateX(180deg)}.envelope-stage.open .inside{transform:translateY(-38%)}@keyframes fade{to{opacity:0;visibility:hidden}}.content{max-width:720px;margin:auto}.content h1{font-size:clamp(2rem,6vw,4.7rem);line-height:.98;margin:12px 0 20px}.body{font:1.2rem/1.75 system-ui;white-space:pre-wrap}.footer{display:flex;align-items:center;justify-content:space-between;margin-top:40px;padding-top:20px;border-top:1px solid currentColor}.audio{display:flex;gap:10px;align-items:center;border:1px solid currentColor;border-radius:999px;padding:7px 12px}.audio button,.sealbtn{border:0;background:var(--accent);color:var(--bg);border-radius:999px;padding:8px 12px}.drawer{display:flex;gap:12px;max-height:0;overflow:hidden;opacity:0;transition:.5s}.drawer.show{max-height:130px;opacity:1;margin-top:15px}.thumb{padding:4px;border:1px solid currentColor;background:transparent}.thumb img{display:block;width:80px;height:80px;object-fit:cover}.lightbox{position:fixed;inset:0;background:#000d;display:none;place-items:center;z-index:8;padding:20px}.lightbox.show{display:grid}.lightbox img{max-width:94vw;max-height:90vh;object-fit:contain}
</style></head><body><main class="shell"><div class="stripe"></div><section class="content"><div class="meta">${esc(new Date(card.createdAt).toLocaleString())} · ${esc(card.author || "A quiet sender")}</div><h1>${esc(card.title || "Untitled postcard")}</h1><div class="body">${esc(card.body || "A blank page waiting for a memory.")}</div><footer class="footer"><button class="sealbtn" id="photos" aria-label="Open photo envelope">💌</button>${card.audio?.src ? `<div class="audio"><button id="audioToggle">▶</button><span>Atmosphere</span><audio id="audio" loop src="${card.audio.src}"></audio></div>` : `<span class="meta">made with Postcard Notes</span>`}</footer><div class="drawer" id="drawer">${photos}</div></section></main><div class="envelope-stage" id="stage"><div class="envelope"><div class="inside"><span class="seal">✦</span></div><div class="pocket"></div><div class="flap"></div></div></div><div class="lightbox" id="lightbox"><img id="lightboxImage" alt="Attached memory"></div><script>const data=${payload};const stage=document.getElementById('stage');const audio=document.getElementById('audio');setTimeout(()=>{stage.classList.add('open');if(audio){audio.play().catch(()=>{})}},120);document.getElementById('audioToggle')?.addEventListener('click',()=>{if(audio.paused){audio.play();event.target.textContent='Ⅱ'}else{audio.pause();event.target.textContent='▶'}});document.getElementById('photos')?.addEventListener('click',()=>document.getElementById('drawer').classList.toggle('show'));document.querySelectorAll('[data-photo]').forEach(b=>b.addEventListener('click',()=>{document.getElementById('lightboxImage').src=data.images[Number(b.dataset.photo)];document.getElementById('lightbox').classList.add('show')}));document.getElementById('lightbox').addEventListener('click',e=>{if(e.target.id==='lightbox')e.currentTarget.classList.remove('show')});</script></body></html>`;
  return new Blob([html], { type: "text/html;charset=utf-8" });
}

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
