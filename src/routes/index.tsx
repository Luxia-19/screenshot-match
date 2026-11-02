import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Menu, SlidersHorizontal, Plus, X, Music, Image as ImageIcon, Play, Pause, Trash2, Archive,
  Lock, Wifi, WifiOff, Share2, Search, ChevronLeft, ChevronRight, Mail, Pencil,
  Palette, Sparkles, Download, Upload,
} from "lucide-react";
import {
  type Postcard, type Profile, type SortKey, loadCards, saveCards, loadProfile, saveProfile,
  loadTheme, saveTheme, readFile, filterCards, dayKey, APP_THEMES, CARD_PRESETS, BORDERS, FONTS,
  defaultCardTheme, type AppThemeKey, type CardTheme, exportPostcard, importPostcard, exportInteractiveHtml,
} from "@/lib/postcards";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Postcard Notes — a personal postcard diary" },
      { name: "description", content: "Write atmospheric postcard notes with photos and background audio." },
      { property: "og:title", content: "Postcard Notes" },
      { property: "og:description", content: "A personal diary of postcards with photos and sound." },
    ],
  }),
  component: App,
});

const fmt = (t: number) =>
  new Date(t).toLocaleString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });

function App() {
  const [cards, setCards] = useState<Postcard[]>([]);
  const [appTheme, setAppTheme] = useState<AppThemeKey>("paper");
  const [draft, setDraft] = useState<Postcard>({ id: crypto.randomUUID(), title: "", body: "", author: "", createdAt: Date.now(), images: [], theme: defaultCardTheme() });
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState("");
  useEffect(() => { const saved = loadCards(); setCards(saved); setAppTheme(loadTheme()); if (saved[0]) setDraft(saved[0]); setReady(true); }, []);
  useEffect(() => { document.documentElement.classList.toggle("dark", appTheme === "dark"); document.documentElement.dataset.theme = appTheme; if (ready) saveTheme(appTheme); }, [appTheme, ready]);
  useEffect(() => { if (ready) saveCards(cards); }, [cards, ready]);
  const setDraftPatch = (patch: Partial<Postcard>) => setDraft((current) => ({ ...current, ...patch }));
  const saveDraft = () => { setCards((current) => current.some((card) => card.id === draft.id) ? current.map((card) => card.id === draft.id ? draft : card) : [draft, ...current]); setStatus("Saved to your diary"); window.setTimeout(() => setStatus(""), 2400); };
  const exportHtml = () => { const blob = exportInteractiveHtml(draft); const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = `${(draft.title || "postcard-mail").replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.html`; link.click(); URL.revokeObjectURL(url); setStatus("Interactive mail exported"); window.setTimeout(() => setStatus(""), 2400); };
  const addImages = async (files: FileList | null) => { if (!files) return; const urls = await Promise.all([...files].map(readFile)); setDraftPatch({ images: [...draft.images, ...urls] }); };
  const addAudio = async (file: File | undefined) => { if (!file) return; setDraftPatch({ audio: { name: file.name, src: await readFile(file) }, autoplay: true }); };
  return (
    <div className="theme-shell min-h-screen bg-background text-foreground">
      <header className="theme-header sticky top-0 z-30 flex items-center justify-between border-b border-border bg-background/90 px-5 py-4 backdrop-blur"><div><p className="text-xs uppercase tracking-[.28em] text-muted-foreground">Postcard Notes</p><h1 className="font-display text-2xl italic">Studio</h1></div><div className="flex items-center gap-2"><span className="hidden text-xs text-muted-foreground sm:inline">Local-first · {cards.length} saved</span><select aria-label="App theme" value={appTheme} onChange={(event) => setAppTheme(event.target.value as AppThemeKey)} className="rounded-full border border-input bg-card px-3 py-2 text-sm">{APP_THEMES.slice(0, 6).map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}</select></div></header>
      <div className="theme-stripe h-1.5" />
      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[minmax(280px,360px)_1fr]">
        <section className="theme-editor h-fit space-y-5 rounded-2xl border border-border bg-card p-5 shadow-card lg:sticky lg:top-24"><div><p className="text-xs uppercase tracking-[.2em] text-muted-foreground">Compose</p><h2 className="font-display text-3xl">A letter worth opening</h2></div>
          <label className="block text-sm"><span className="text-muted-foreground">Title</span><input value={draft.title} onChange={(event) => setDraftPatch({ title: event.target.value })} placeholder="A little note from today" className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-ring" /></label>
          <label className="block text-sm"><span className="text-muted-foreground">Author tag</span><input value={draft.author ?? ""} onChange={(event) => setDraftPatch({ author: event.target.value })} placeholder="Your name" className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-ring" /></label>
          <label className="block text-sm"><span className="text-muted-foreground">Journal body</span><textarea value={draft.body} onChange={(event) => setDraftPatch({ body: event.target.value })} rows={9} placeholder="Dear diary…" className="mt-1 w-full resize-y rounded-lg border border-input bg-background px-3 py-2.5 leading-relaxed outline-none focus:ring-2 focus:ring-ring" /></label>
          <div><p className="mb-2 text-sm text-muted-foreground">Postcard style</p><div className="grid grid-cols-2 gap-2">{CARD_PRESETS.slice(0, 5).map((preset) => <button key={preset.name} onClick={() => setDraftPatch({ theme: { ...preset.theme } })} className="rounded-lg border border-border px-2 py-2 text-left text-xs transition hover:-translate-y-0.5 hover:bg-muted">{preset.name}</button>)}</div></div>
          <div className="grid grid-cols-2 gap-2"><label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-input py-3 text-xs hover:bg-muted"><ImageIcon className="size-4" />Photos<input type="file" accept="image/*" multiple hidden onChange={(event) => addImages(event.target.files)} /></label><label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-input py-3 text-xs hover:bg-muted"><Music className="size-4" />Atmosphere<input type="file" accept="audio/*" hidden onChange={(event) => addAudio(event.target.files?.[0])} /></label></div>
          <div className="flex gap-2"><button onClick={saveDraft} className="flex-1 rounded-lg bg-primary px-3 py-2.5 text-sm font-medium text-primary-foreground">Save draft</button><button onClick={exportHtml} className="flex-1 rounded-lg border border-primary px-3 py-2.5 text-sm font-medium text-primary"><Sparkles className="mr-1 inline size-4" />Export HTML</button></div>{status && <p className="text-center text-xs text-primary">{status}</p>}
        </section>
        <section className="min-w-0"><div className="mb-4 flex items-end justify-between"><div><p className="text-xs uppercase tracking-[.2em] text-muted-foreground">Live preview</p><h2 className="font-display text-3xl">Your sealed mail</h2></div><p className="hidden max-w-xs text-right text-xs text-muted-foreground sm:block">Everything here travels with the exported file. No servers, no setup.</p></div><StudioPreview card={draft} onExport={exportHtml} /></section>
      </main>
    </div>
  );
}

function StudioPreview({ card, onExport }: { card: Postcard; onExport: () => void }) {
  const [opened, setOpened] = useState(false); const [photos, setPhotos] = useState(false); const [playing, setPlaying] = useState(false); const [lightbox, setLightbox] = useState<string | null>(null); const audioRef = useRef<HTMLAudioElement>(null);
  useEffect(() => { setOpened(false); setPhotos(false); setPlaying(false); }, [card.id, card.title, card.theme?.bg]);
  const unseal = () => { setOpened(true); if (card.audio?.src) audioRef.current?.play().then(() => setPlaying(true)).catch(() => {}); };
  return <div className="studio-preview relative min-h-[620px] overflow-hidden rounded-[28px] border border-border p-4 shadow-lift sm:p-8" style={{ background: card.theme?.bg, color: card.theme?.text, fontFamily: card.theme ? FONTS[card.theme.font].css : undefined, ...(card.theme ? BORDERS[card.theme.border].css : {}) }}><div className="absolute inset-x-0 top-0 h-2" style={{ background: card.theme?.accent }} /><div className={`studio-seal-stage absolute inset-0 z-10 grid place-items-center p-6 ${opened ? "is-open" : ""}`}><button onClick={unseal} className="studio-envelope group relative aspect-[1.55] w-[min(78vw,480px)]" aria-label="Click to unseal envelope"><span className="studio-letter">✦</span><span className="studio-pocket" /><span className="studio-flap" /><span className="absolute inset-x-0 top-[calc(100%+1rem)] text-center font-display text-xl italic">Click to unseal envelope &amp; play atmosphere…</span></button></div><article className={`mx-auto flex min-h-[570px] max-w-3xl flex-col px-3 py-8 transition-all duration-700 sm:px-10 sm:py-12 ${opened ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}`}><div className="text-xs uppercase tracking-[.2em] opacity-60">{fmt(card.createdAt)} · {card.author || "A quiet sender"}</div><h3 className="mt-4 max-w-2xl text-5xl leading-[.95] sm:text-7xl">{card.title || "Untitled postcard"}</h3><p className="mt-8 max-w-2xl whitespace-pre-wrap text-lg leading-8 opacity-85">{card.body || "A blank page waiting for a memory."}</p><footer className="mt-auto border-t border-current/20 pt-5"><div className="flex items-center justify-between gap-3"><button onClick={() => setPhotos(!photos)} className="grid size-11 place-items-center rounded-lg border border-current/30 bg-black/5 text-2xl transition hover:scale-105" aria-label={photos ? "Close photo drawer" : "Open photo drawer"}>💌</button>{card.audio?.src ? <div className="flex items-center gap-2 rounded-full border border-current/20 px-3 py-2 text-xs"><audio ref={audioRef} src={card.audio.src} loop onPause={() => setPlaying(false)} onPlay={() => setPlaying(true)} /><button onClick={() => playing ? audioRef.current?.pause() : audioRef.current?.play()} className="grid size-7 place-items-center rounded-full" style={{ background: card.theme?.accent, color: card.theme?.bg }}>{playing ? <Pause className="size-3" /> : <Play className="size-3" />}</button><span>Atmosphere</span></div> : <span className="text-xs opacity-60">Standalone mail · offline ready</span>}<button onClick={onExport} className="rounded-full border border-current/30 px-3 py-2 text-xs">Export .html</button></div><div className={`flex gap-3 overflow-hidden transition-all duration-500 ${photos ? "mt-4 max-h-28 opacity-100" : "max-h-0 opacity-0"}`}>{card.images.map((src, index) => <button key={index} onClick={() => setLightbox(src)} className="rounded-md border border-current/30 bg-white p-1"><img src={src} alt={`Photo ${index + 1}`} className="size-20 object-cover" /></button>)}</div></footer></article>{lightbox && <button className="fixed inset-0 z-50 grid place-items-center bg-black/85 p-6" onClick={() => setLightbox(null)}><img src={lightbox} alt="Attached memory" className="max-h-full max-w-full object-contain" /></button>}</div>;
}

function LegacyApp() {
  const [cards, setCards] = useState<Postcard[]>([]);
  const [profile, setProfile] = useState<Profile>({ name: "", email: "", bio: "" });
  const [theme, setTheme] = useState<AppThemeKey>("paper");
  const [ready, setReady] = useState(false);
  const [left, setLeft] = useState(false);
  const [right, setRight] = useState(false);
  const [open, setOpen] = useState<Postcard | null>(null);
  const [editing, setEditing] = useState<Postcard | "new" | null>(null);
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<SortKey>("new");
  const [day, setDay] = useState<string | null>(null);
  const [view, setView] = useState<"all" | "archive" | "private">("all");
  const [online, setOnline] = useState(true);
  const [fileMessage, setFileMessage] = useState("");

  useEffect(() => {
    setCards(loadCards()); setProfile(loadProfile()); setTheme(loadTheme()); setReady(true);
    setOnline(navigator.onLine);
    const on = () => setOnline(true), off = () => setOnline(false);
    addEventListener("online", on); addEventListener("offline", off);
    return () => { removeEventListener("online", on); removeEventListener("offline", off); };
  }, []);
  useEffect(() => { if (ready) saveCards(cards); }, [cards, ready]);
  useEffect(() => { if (ready) saveProfile(profile); }, [profile, ready]);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.dataset.theme = theme;
    if (ready) saveTheme(theme);
  }, [theme, ready]);

  const shown = useMemo(() => filterCards(cards, { q, sort, day, view }), [cards, q, sort, day, view]);
  const update = (c: Postcard) => { setCards((cs) => cs.map((x) => (x.id === c.id ? c : x))); setOpen(c); };
  const downloadCard = async (card: Postcard) => {
    const blob = await exportPostcard(card);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `${(card.title || "postcard").replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.postcard`; a.click();
    URL.revokeObjectURL(url);
  };
  const importFile = async (file: File) => {
    try { const card = await importPostcard(file); setCards((cs) => [card, ...cs]); setFileMessage("Postcard imported"); }
    catch { setFileMessage("That file could not be opened"); }
    window.setTimeout(() => setFileMessage(""), 3000);
  };

  return (
    <div className="theme-shell min-h-screen bg-background text-foreground">
      <header className="theme-header sticky top-0 z-30 flex items-center justify-between border-b border-border bg-background/90 px-4 py-3 backdrop-blur">
        <IconBtn label="Open settings" onClick={() => setLeft(true)}><Menu /></IconBtn>
        <h1 className="font-display text-2xl italic tracking-tight">Postcard Notes</h1>
        <IconBtn label="Search and filter" onClick={() => setRight(true)}><SlidersHorizontal /></IconBtn>
      </header>
      <div className="theme-stripe h-1.5 opacity-90" />

      <main className="theme-main relative mx-auto max-w-6xl overflow-hidden px-4 pb-28 pt-6">
        <ThemeBackdrop theme={theme} />
        {(view !== "all" || day || q) && (
          <div className="mb-4 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            {view !== "all" && <Chip onClear={() => setView("all")}>{view === "archive" ? "Archive" : "Private notes"}</Chip>}
            {day && <Chip onClear={() => setDay(null)}>Date filter</Chip>}
            {q && <Chip onClear={() => setQ("")}>“{q}”</Chip>}
          </div>
        )}
        {shown.length === 0 ? (
          <div className="mt-24 text-center text-muted-foreground">
            <Mail className="mx-auto mb-3 size-10 opacity-50" />
            <p className="font-display text-xl">No postcards here yet.</p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {shown.map((c, i) => <CardSnippet key={c.id} c={c} i={i} onClick={() => setOpen(c)} />)}
          </div>
        )}
      </main>

      <button
        aria-label="New postcard"
        onClick={() => setEditing("new")}
        className="theme-fab fixed bottom-6 right-6 z-30 grid size-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-lift transition-transform duration-300 hover:scale-105"
      >
        <Plus className="size-6" />
      </button>

      <Drawer side="left" open={left} onClose={() => setLeft(false)}>
        <div className="flex items-center gap-3">
          <div className="grid size-14 place-items-center rounded-full bg-accent font-display text-2xl">
            {(profile.name || "?")[0]?.toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate font-display text-lg">{profile.name || "Your name"}</p>
            <p className="truncate text-sm text-muted-foreground">{profile.email || "no email"}</p>
          </div>
        </div>
        <Section title="Account">
          <Field label="Username" value={profile.name} onChange={(v) => setProfile({ ...profile, name: v })} />
          <Field label="Email" value={profile.email} onChange={(v) => setProfile({ ...profile, email: v })} />
          <label className="block text-sm">
            <span className="text-muted-foreground">Bio</span>
            <textarea value={profile.bio} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} rows={3}
              className="mt-1 w-full rounded-md border border-input bg-card px-3 py-2 outline-none focus:ring-2 focus:ring-ring" />
          </label>
        </Section>
        <Section title="Theme">
          <label className="block text-sm"><span className="mb-1 block text-muted-foreground">App skin</span>
            <select value={theme} onChange={(e) => setTheme(e.target.value as AppThemeKey)} className="w-full rounded-md border border-input bg-card px-3 py-2.5 outline-none focus:ring-2 focus:ring-ring">
              {APP_THEMES.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
            </select>
          </label>
        </Section>
        <Section title="Sharing & offline">
          <div className="flex items-center gap-2 text-sm">
            {online ? <Wifi className="size-4 text-stamp" /> : <WifiOff className="size-4 text-destructive" />}
            {online ? "Online — notes saved on this device" : "Offline standby — notes still saved locally"}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground"><Share2 className="size-4" /> Open a postcard to share it</div>
        </Section>
        <Section title="Postcard files">
          {open && <button onClick={() => downloadCard(open)} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-muted"><Download className="size-4" />Export open postcard</button>}
          <label className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted"><Upload className="size-4" />Import .postcard<input type="file" accept=".postcard,application/zip" hidden onChange={(e) => e.target.files?.[0] && importFile(e.target.files[0])} /></label>
          <p className="text-xs text-muted-foreground">A portable ZIP with your note, photos, audio, and styling.</p>
          {fileMessage && <p className="text-xs text-primary">{fileMessage}</p>}
        </Section>
      </Drawer>

      <Drawer side="right" open={right} onClose={() => setRight(false)}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search titles & notes"
            className="w-full rounded-md border border-input bg-card py-2 pl-9 pr-3 outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <Section title="Sort">
          {([["new", "Newest first"], ["old", "Oldest first"], ["az", "Title A–Z"]] as const).map(([k, l]) => (
            <button key={k} onClick={() => setSort(k)}
              className={`block w-full rounded-md px-3 py-2 text-left text-sm ${sort === k ? "bg-accent font-medium" : "hover:bg-muted"}`}>{l}</button>
          ))}
        </Section>
        <Section title="Calendar">
          <MiniCal cards={cards} day={day} setDay={setDay} />
        </Section>
        <Section title="Collections">
          {([["all", "All postcards", Mail], ["archive", "Archive", Archive], ["private", "Private notes", Lock]] as const).map(([k, l, I]) => (
            <button key={k} onClick={() => setView(k)}
              className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm ${view === k ? "bg-accent font-medium" : "hover:bg-muted"}`}>
              <I className="size-4" />{l}
            </button>
          ))}
        </Section>
      </Drawer>

      {open && (
        <Expanded c={open} onClose={() => setOpen(null)} onChange={update}
          onExport={() => downloadCard(open)}
          onEdit={() => { setEditing(open); setOpen(null); }}
          onDelete={() => { setCards((cs) => cs.filter((x) => x.id !== open.id)); setOpen(null); }} />
      )}
      {editing && (
        <Editor initial={editing === "new" ? null : editing} onClose={() => setEditing(null)}
          onSave={(c) => {
            setCards((cs) => (cs.some((x) => x.id === c.id) ? cs.map((x) => (x.id === c.id ? c : x)) : [c, ...cs]));
            setEditing(null);
          }} />
      )}
    </div>
  );
}

function ThemeBackdrop({ theme }: { theme: AppThemeKey }) {
  const common = { viewBox: "0 0 900 430", preserveAspectRatio: "xMidYMid slice" as const };
  const art = {
    paper: <><path d="M0 350 Q180 300 360 350 T720 340 T1000 350 V430 H0Z" fill="#c9ad84" opacity=".34"/><path d="M90 110h210v145H90z" fill="#fffaf0" stroke="#b28c5c" strokeWidth="3" opacity=".42"/><path d="M120 145h150M120 180h110M120 215h135" stroke="#b28c5c" strokeWidth="4" opacity=".35"/></>,
    dark: <><circle cx="700" cy="110" r="78" fill="#d8c28a" opacity=".16"/><path d="M0 320 170 190l100 85 135-150 150 130 110-90 235 155v110H0Z" fill="#b4c2c7" opacity=".12"/><path d="M0 350h900" stroke="#d8c28a" strokeWidth="2" opacity=".2"/></>,
    cyber: <><path d="M0 360 230 150l100 105 150-180 170 180 100-100 150 145v130H0Z" fill="#22d3ee" opacity=".1"/><path d="M0 360 230 150l100 105 150-180 170 180 100-100 150 145" fill="none" stroke="#f472b6" strokeWidth="3" opacity=".35"/><path d="M80 80h280M80 105h180" stroke="#22d3ee" strokeWidth="3" opacity=".28"/></>,
    matcha: <><path d="M0 335 Q180 250 340 335 T690 325 T960 340 V430H0Z" fill="#718a66" opacity=".2"/><path d="M170 350 C130 220 175 130 250 85M175 250 C110 225 80 175 72 130M178 210 C245 190 285 145 300 92" fill="none" stroke="#587451" strokeWidth="8" strokeLinecap="round" opacity=".22"/><ellipse cx="98" cy="128" rx="42" ry="18" transform="rotate(28 98 128)" fill="#718a66" opacity=".22"/><ellipse cx="286" cy="94" rx="42" ry="18" transform="rotate(-30 286 94)" fill="#718a66" opacity=".2"/></>,
    pastel: <><circle cx="180" cy="150" r="85" fill="#f6aeca" opacity=".16"/><circle cx="730" cy="115" r="110" fill="#cdb7ee" opacity=".16"/><path d="M0 355 Q120 255 240 355 T480 355 T720 355 T960 355" fill="none" stroke="#e89ebd" strokeWidth="34" opacity=".16"/><path d="M0 355 Q120 255 240 355 T480 355 T720 355 T960 355" fill="none" stroke="#b7dfd7" strokeWidth="12" opacity=".24"/></>,
    lotus: <><path d="M0 350 Q170 295 350 350 T700 345 T960 350 V430H0Z" fill="#c86b85" opacity=".14"/><path d="M455 335 C385 270 390 220 455 168 C520 220 525 270 455 335Z" fill="#c86b85" opacity=".18"/><path d="M455 335 C300 310 290 245 345 205 C410 232 448 273 455 335ZM455 335 C610 310 620 245 565 205 C500 232 462 273 455 335Z" fill="#df9bab" opacity=".22"/><path d="M370 345 Q455 300 540 345" fill="none" stroke="#c08b8f" strokeWidth="3" opacity=".28"/></>,
    gold: <><circle cx="450" cy="205" r="130" fill="#c89b3c" opacity=".1"/><path d="M0 350 190 190l120 115 140-160 155 170 105-100 190 135v80H0Z" fill="#c89b3c" opacity=".1"/><path d="M280 355h340" stroke="#f4d58b" strokeWidth="3" opacity=".34"/><circle cx="450" cy="205" r="62" fill="none" stroke="#f4d58b" strokeWidth="2" opacity=".25"/></>,
    river: <><path d="M0 145 C170 210 250 85 420 150 S700 220 900 125 V430H0Z" fill="#5d9e9a" opacity=".16"/><path d="M0 235 C160 300 260 170 430 235 S700 305 900 210" fill="none" stroke="#5d9e9a" strokeWidth="35" opacity=".14"/><path d="M0 300 C160 360 290 250 460 315 S720 370 900 275" fill="none" stroke="#ffffff" strokeWidth="5" opacity=".22"/><ellipse cx="700" cy="300" rx="96" ry="22" fill="#477f84" opacity=".15"/></>,
    mountain: <><circle cx="710" cy="90" r="64" fill="#c7d1d0" opacity=".32"/><path d="M0 360 185 125 310 278 480 70 680 300 760 195 930 360Z" fill="#718b91" opacity=".19"/><path d="m185 125 48 74 42 79-68-35-37 44-28-48Z M480 70l76 121-68-48-42 57-32-45Z" fill="#f7faf8" opacity=".45"/><path d="M0 360h930" stroke="#738b91" strokeWidth="2" opacity=".3"/></>,
  }[theme];
  return <div className={`theme-backdrop theme-backdrop-${theme}`} aria-hidden="true"><svg {...common}>{art}</svg></div>;
}

function IconBtn({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return <button aria-label={label} onClick={onClick} className="grid size-10 place-items-center rounded-full hover:bg-muted [&_svg]:size-5">{children}</button>;
}
function Chip({ children, onClear }: { children: React.ReactNode; onClear: () => void }) {
  return <span className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-3 py-1">{children}<button aria-label="Clear" onClick={onClear}><X className="size-3.5" /></button></span>;
}
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="mt-6 space-y-2"><h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{title}</h3>{children}</div>;
}
function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block text-sm"><span className="text-muted-foreground">{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 w-full rounded-md border border-input bg-card px-3 py-2 outline-none focus:ring-2 focus:ring-ring" />
    </label>
  );
}

function Drawer({ side, open, onClose, children }: { side: "left" | "right"; open: boolean; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className={`fixed inset-0 z-40 ${open ? "" : "pointer-events-none"}`}>
      <div onClick={onClose} className={`absolute inset-0 bg-foreground/30 transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`} />
      <aside className={`theme-drawer absolute top-0 h-full w-80 max-w-[85vw] overflow-y-auto border-border bg-background p-5 shadow-lift transition-transform duration-300
        ${side === "left" ? `left-0 border-r ${open ? "translate-x-0" : "-translate-x-full"}` : `right-0 border-l ${open ? "translate-x-0" : "translate-x-full"}`}`}>
        <div className="mb-4 flex justify-end"><IconBtn label="Close" onClick={onClose}><X /></IconBtn></div>
        {children}
      </aside>
    </div>
  );
}

function CardSnippet({ c, i, onClick }: { c: Postcard; i: number; onClick: () => void }) {
  return (
    <button onClick={onClick}
      style={{ rotate: `${((i % 3) - 1) * 0.6}deg`, background: c.theme?.bg, color: c.theme?.text, fontFamily: c.theme ? FONTS[c.theme.font].css : undefined }}
      className="theme-card group relative flex aspect-[3/2] flex-col overflow-hidden rounded-md border border-border bg-card p-5 text-left shadow-card transition-all duration-300 hover:-translate-y-1 hover:rotate-0 hover:shadow-lift">
      <div className="theme-stripe absolute inset-x-0 top-0 h-1 opacity-80" style={{ backgroundColor: c.theme?.accent }} />
      <div className="absolute right-4 top-4 grid size-12 place-items-center rounded-sm bg-accent stamp-perf" style={{ color: c.theme?.accent }}>
        {c.audio ? <Music className="size-5 text-stamp" /> : c.private ? <Lock className="size-5 text-primary" /> : <Mail className="size-5 text-primary" />}
      </div>
      <p className="text-xs uppercase tracking-widest text-muted-foreground">{fmt(c.createdAt)}</p>
      <h2 className="mt-2 line-clamp-2 pr-14 font-display text-2xl leading-tight">{c.title || "Untitled"}</h2>
      <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{c.body}</p>
      <div className="mt-auto flex gap-2 pt-3 text-xs">
        {c.audio && <span className="flex items-center gap-1 rounded-full bg-secondary px-2 py-1"><Music className="size-3" />Audio</span>}
        {c.images.length > 0 && <span className="flex items-center gap-1 rounded-full bg-secondary px-2 py-1"><ImageIcon className="size-3" />{c.images.length} photo{c.images.length > 1 ? "s" : ""} attached</span>}
      </div>
    </button>
  );
}

function AudioBar({ audio, autoplay = false }: { audio: { name: string; src: string }; autoplay?: boolean }) {
  const ref = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [pct, setPct] = useState(0);
  useEffect(() => { if (autoplay) ref.current?.play().catch(() => {}); }, [autoplay]);
  return (
    <div className="flex items-center gap-3 rounded-full border border-border bg-secondary px-3 py-2">
      <audio ref={ref} src={audio.src} loop onTimeUpdate={(e) => { const a = e.currentTarget; setPct(a.duration ? (a.currentTime / a.duration) * 100 : 0); }} onPause={() => setPlaying(false)} onPlay={() => setPlaying(true)} />
      <button aria-label={playing ? "Pause" : "Play"} onClick={() => (playing ? ref.current?.pause() : ref.current?.play())}
        className="grid size-8 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
        {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
      </button>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs">{audio.name}</p>
        <input aria-label="Audio seek" type="range" min="0" max="100" value={pct} onChange={(e) => { const a = ref.current; if (a?.duration) a.currentTime = (Number(e.target.value) / 100) * a.duration; }} className="mt-1 h-1 w-full accent-[var(--primary)]" />
      </div>
    </div>
  );
}

function Expanded({ c, onClose, onChange, onEdit, onDelete, onExport }: { c: Postcard; onClose: () => void; onChange: (c: Postcard) => void; onEdit: () => void; onDelete: () => void; onExport: () => void }) {
  const [shown, setShown] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [envelopeOpen, setEnvelopeOpen] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [customizing, setCustomizing] = useState(false);
  useEffect(() => {
    requestAnimationFrame(() => setShown(true));
    const timer = window.setTimeout(() => setRevealed(true), 720);
    return () => window.clearTimeout(timer);
  }, []);
  const share = async () => {
    const text = `${c.title}\n\n${c.body}`;
    if (navigator.share) await navigator.share({ title: c.title, text }).catch(() => {});
    else await navigator.clipboard.writeText(text);
  };
  return (
    <div className={`theme-modal fixed inset-0 z-50 bg-foreground/40 p-0 transition-opacity duration-300 sm:p-6 ${shown ? "opacity-100" : "opacity-0"}`} onClick={onClose}>
      {!revealed && <div className="opening-envelope absolute inset-0 z-10 grid place-items-center p-8" aria-label="Opening postcard">
        <div className="opening-envelope-art">
          <div className="opening-flap" />
          <div className="opening-card"><span>✦</span></div>
          <div className="opening-pocket" />
          <p className="opening-caption">Unfolding a memory…</p>
        </div>
      </div>}
      <div onClick={(e) => e.stopPropagation()}
        style={{ background: c.theme?.bg, color: c.theme?.text, fontFamily: c.theme ? FONTS[c.theme.font].css : undefined, ...(c.theme ? BORDERS[c.theme.border].css : {}) }}
        className={`theme-modal-card mx-auto flex h-full max-w-3xl flex-col overflow-hidden shadow-lift transition-all duration-700 sm:rounded-lg ${revealed && shown ? "scale-100 opacity-100" : "pointer-events-none scale-90 translate-y-8 opacity-0"}`}>
        <div className="theme-stripe h-2" style={{ backgroundColor: c.theme?.accent }} />
        <div className="space-y-3 border-b border-border p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">{fmt(c.createdAt)}</p>
              <h2 className="text-3xl leading-tight">{c.title || "Untitled"}</h2>
            </div>
            <div className="flex gap-1"><IconBtn label="Customize postcard" onClick={() => setCustomizing(!customizing)}><Palette /></IconBtn><IconBtn label="Close" onClick={onClose}><X /></IconBtn></div>
          </div>
          {c.audio && <AudioBar audio={c.audio} autoplay={c.autoplay && revealed} />}
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          <p className="whitespace-pre-wrap text-lg leading-relaxed">{c.body}</p>
          {c.images.length > 0 && <Envelope images={c.images} open={envelopeOpen} onToggle={() => setEnvelopeOpen(!envelopeOpen)} onPhoto={setLightbox} />}
          {customizing && <Customizer theme={c.theme ?? defaultCardTheme()} onChange={(theme) => onChange({ ...c, theme })} />}
        </div>
        <div className="flex flex-wrap gap-2 border-t border-border p-4 text-sm">
          <Act onClick={onEdit}><Pencil className="size-4" />Edit</Act>
          <Act onClick={onExport}><Download className="size-4" />Export</Act>
          <Act onClick={share}><Share2 className="size-4" />Share</Act>
          <Act onClick={() => onChange({ ...c, private: !c.private })}><Lock className="size-4" />{c.private ? "Make public" : "Make private"}</Act>
          <Act onClick={() => onChange({ ...c, archived: !c.archived })}><Archive className="size-4" />{c.archived ? "Unarchive" : "Archive"}</Act>
          <Act danger onClick={() => confirm("Delete this postcard?") && onDelete()}><Trash2 className="size-4" />Delete</Act>
        </div>
      </div>
      {lightbox && <div className="fixed inset-0 z-[60] grid place-items-center bg-black/85 p-6" onClick={(e) => { e.stopPropagation(); setLightbox(null); }}><img src={lightbox} alt="Attached memory" onClick={(e) => e.stopPropagation()} className="max-h-full max-w-full rounded-lg object-contain shadow-2xl" /></div>}
    </div>
  );
}
function Act({ onClick, children, danger }: { onClick: () => void; children: React.ReactNode; danger?: boolean }) {
  return <button onClick={onClick} className={`theme-action flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 hover:bg-muted ${danger ? "text-destructive" : ""}`}>{children}</button>;
}

function Envelope({ images, open, onToggle, onPhoto }: { images: string[]; open: boolean; onToggle: () => void; onPhoto: (src: string) => void }) {
  return <div className="relative mt-8 min-h-24 border-t border-current/20 pt-4">
    <button aria-label={open ? "Close photo envelope" : "Open photo envelope"} onClick={onToggle} className="absolute bottom-0 left-0 z-10 grid size-11 place-items-center rounded-md border border-current/30 bg-background/40 text-2xl shadow-card transition-transform hover:scale-105">💌</button>
    <div className={`ml-14 flex gap-3 transition-all duration-500 ${open ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-8 opacity-0"}`}>
      {images.map((src, i) => <button key={i} onClick={() => onPhoto(src)} className="envelope-photo shrink-0 overflow-hidden rounded-md border border-current/30 bg-white p-1 shadow-card" style={{ animationDelay: `${i * 90}ms`, rotate: `${(i % 3 - 1) * 3}deg` }}><img src={src} alt={`Photo ${i + 1}`} className="size-20 object-cover" /></button>)}
    </div>
    <div className={`absolute bottom-0 left-0 ml-14 h-10 w-24 rounded border border-current/30 bg-background/40 transition-opacity ${open ? "opacity-0" : "opacity-100"}`}><span className="sr-only">Photos are tucked inside this envelope</span></div>
  </div>;
}

function Customizer({ theme, onChange }: { theme: CardTheme; onChange: (theme: CardTheme) => void }) {
  const set = (patch: Partial<CardTheme>) => onChange({ ...theme, ...patch });
  return <div className="mt-6 space-y-3 rounded-lg border border-current/20 bg-black/5 p-4 text-sm">
    <div className="flex items-center gap-2 font-medium"><Sparkles className="size-4" /> Postcard styling</div>
    <div className="grid grid-cols-2 gap-2">{CARD_PRESETS.map((p) => <button key={p.name} onClick={() => onChange({ ...p.theme })} className="rounded border border-current/20 px-2 py-2 text-left text-xs hover:bg-black/10">{p.name}</button>)}</div>
    <label className="block">Background / gradient<input value={theme.bg} onChange={(e) => set({ bg: e.target.value })} className="mt-1 w-full rounded border border-input bg-background/60 px-2 py-1.5 text-xs" /></label>
    <div className="grid grid-cols-2 gap-2"><label>Border<select value={theme.border} onChange={(e) => set({ border: e.target.value as CardTheme["border"] })} className="mt-1 w-full rounded border border-input bg-background/60 px-2 py-1.5">{Object.entries(BORDERS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select></label><label>Font<select value={theme.font} onChange={(e) => set({ font: e.target.value as CardTheme["font"] })} className="mt-1 w-full rounded border border-input bg-background/60 px-2 py-1.5">{Object.entries(FONTS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select></label></div>
    <label className="flex items-center justify-between">Header tint <input type="color" value={theme.accent} onChange={(e) => set({ accent: e.target.value })} className="size-8 rounded border-0 bg-transparent" /></label>
  </div>;
}

function Editor({ initial, onClose, onSave }: { initial: Postcard | null; onClose: () => void; onSave: (c: Postcard) => void }) {
  const [c, setC] = useState<Postcard>(initial ?? { id: crypto.randomUUID(), title: "", body: "", createdAt: Date.now(), images: [], theme: defaultCardTheme() });
  const [customizing, setCustomizing] = useState(false);
  const addImages = async (fs: FileList | null) => {
    if (!fs) return;
    const urls = await Promise.all([...fs].map(readFile));
    setC((x) => ({ ...x, images: [...x.images, ...urls] }));
  };
  const addAudio = async (fs: FileList | null) => {
    const f = fs?.[0]; if (!f) return;
    setC((x) => ({ ...x, audio: { name: f.name, src: "" } }));
    const src = await readFile(f);
    setC((x) => ({ ...x, audio: { name: f.name, src } }));
  };
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 p-4" onClick={onClose}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={(e) => { e.preventDefault(); onSave(c); }}
        className="theme-editor max-h-full w-full max-w-lg space-y-4 overflow-y-auto rounded-lg border border-border bg-card p-6 shadow-lift">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl">{initial ? "Edit postcard" : "New postcard"}</h2>
          <IconBtn label="Close" onClick={onClose}><X /></IconBtn>
        </div>
        <input autoFocus required value={c.title} onChange={(e) => setC({ ...c, title: e.target.value })} placeholder="Title"
          className="w-full border-b border-input bg-transparent py-2 font-display text-xl outline-none focus:border-primary" />
        <textarea value={c.body} onChange={(e) => setC({ ...c, body: e.target.value })} rows={6} placeholder="Dear diary…"
          className="w-full rounded-md border border-input bg-background px-3 py-2 font-display outline-none focus:ring-2 focus:ring-ring" />
        <div className="flex items-center gap-2"><select aria-label="Theme for this postcard" value={CARD_PRESETS.find((p) => JSON.stringify(p.theme) === JSON.stringify(c.theme))?.name ?? "custom"} onChange={(e) => { const p = CARD_PRESETS.find((x) => x.name === e.target.value); if (p) setC({ ...c, theme: { ...p.theme } }); }} className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"><option value="custom">Custom postcard theme</option>{CARD_PRESETS.map((p) => <option key={p.name}>{p.name}</option>)}</select><button type="button" onClick={() => setCustomizing(!customizing)} className="grid size-10 place-items-center rounded-md border border-input" aria-label="Customize this postcard"><Palette className="size-4" /></button></div>
        <p className="-mt-2 text-xs text-muted-foreground">This styling belongs only to this postcard.</p>
        {customizing && <Customizer theme={c.theme ?? defaultCardTheme()} onChange={(theme) => setC({ ...c, theme })} />}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-input py-3 hover:bg-muted">
            <ImageIcon className="size-4" />Add photos
            <input type="file" accept="image/*" multiple hidden onChange={(e) => addImages(e.target.files)} />
          </label>
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-input py-3 hover:bg-muted">
            <Music className="size-4" />{c.audio ? "Replace audio" : "Add audio"}
            <input type="file" accept="audio/*" hidden onChange={(e) => addAudio(e.target.files)} />
          </label>
        </div>
        {c.audio && (
          <div className="flex items-center justify-between rounded-md bg-secondary px-3 py-2 text-sm">
            <span className="truncate"><Music className="mr-1 inline size-4" />{c.audio.name}</span>
            <button type="button" aria-label="Remove audio" onClick={() => setC({ ...c, audio: undefined })}><X className="size-4" /></button>
          </div>
        )}
        {c.audio && <label className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm">Auto-play atmospheric audio <input type="checkbox" checked={!!c.autoplay} onChange={(e) => setC({ ...c, autoplay: e.target.checked })} /></label>}
        {c.images.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {c.images.map((src, i) => (
              <div key={i} className="relative">
                <img src={src} alt="" className="size-16 rounded object-cover" />
                <button type="button" aria-label="Remove photo" onClick={() => setC({ ...c, images: c.images.filter((_, j) => j !== i) })}
                  className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-foreground text-background"><X className="size-3" /></button>
              </div>
            ))}
          </div>
        )}
        <button disabled={!!c.audio && !c.audio.src} className="w-full rounded-md bg-primary py-2.5 font-medium text-primary-foreground disabled:opacity-50">
          {initial ? "Save changes" : "Send to diary"}
        </button>
      </form>
    </div>
  );
}

function MiniCal({ cards, day, setDay }: { cards: Postcard[]; day: string | null; setDay: (d: string | null) => void }) {
  const [m, setM] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const has = useMemo(() => new Set(cards.map((c) => dayKey(c.createdAt))), [cards]);
  const days = new Date(m.getFullYear(), m.getMonth() + 1, 0).getDate();
  const lead = m.getDay();
  return (
    <div className="rounded-md border border-border bg-card p-3">
      <div className="mb-2 flex items-center justify-between text-sm">
        <button aria-label="Previous month" onClick={() => setM(new Date(m.getFullYear(), m.getMonth() - 1, 1))}><ChevronLeft className="size-4" /></button>
        <span className="font-display">{m.toLocaleString(undefined, { month: "long", year: "numeric" })}</span>
        <button aria-label="Next month" onClick={() => setM(new Date(m.getFullYear(), m.getMonth() + 1, 1))}><ChevronRight className="size-4" /></button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs">
        {"SMTWTFS".split("").map((d, i) => <span key={i} className="text-muted-foreground">{d}</span>)}
        {Array.from({ length: lead }).map((_, i) => <span key={"b" + i} />)}
        {Array.from({ length: days }, (_, i) => {
          const k = `${m.getFullYear()}-${m.getMonth()}-${i + 1}`;
          const sel = day === k;
          return (
            <button key={k} onClick={() => setDay(sel ? null : k)}
              className={`relative aspect-square rounded ${sel ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>
              {i + 1}
              {has.has(k) && !sel && <span className="absolute bottom-0.5 left-1/2 size-1 -translate-x-1/2 rounded-full bg-primary" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
