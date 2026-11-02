import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Menu, SlidersHorizontal, Plus, X, Music, Image as ImageIcon, Play, Pause, Trash2, Archive,
  Lock, Share2, Search, ChevronLeft, ChevronRight, Mail, Pencil, Palette, MailOpen,
} from "lucide-react";
import {
  type Postcard, type Profile, type SortKey, type AppThemeKey, type CardTheme,
  APP_THEMES, CARD_PRESETS, FONTS, BORDERS, defaultCardTheme,
  loadCards, saveCards, loadProfile, saveProfile, loadTheme, saveTheme, readFile, filterCards, dayKey,
} from "@/lib/postcards";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Postcard Notes — a personal postcard diary" },
      { name: "description", content: "Write atmospheric postcard notes with photos, themes and background audio." },
      { property: "og:title", content: "Postcard Notes" },
      { property: "og:description", content: "A personal diary of postcards with photos and sound." },
    ],
  }),
  component: App,
});

const fmt = (t: number) =>
  new Date(t).toLocaleString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });

const cardStyle = (t?: CardTheme): React.CSSProperties =>
  t
    ? { background: t.bg, color: t.text, fontFamily: FONTS[t.font].css, ...BORDERS[t.border].css }
    : {};

function App() {
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

  useEffect(() => {
    setCards(loadCards()); setProfile(loadProfile()); setTheme(loadTheme()); setReady(true);
  }, []);
  useEffect(() => { if (ready) saveCards(cards); }, [cards, ready]);
  useEffect(() => { if (ready) saveProfile(profile); }, [profile, ready]);
  useEffect(() => {
    document.documentElement.dataset["theme"] = theme;
    document.documentElement.classList.toggle("dark", theme === "dark");
    if (ready) saveTheme(theme);
  }, [theme, ready]);

  const shown = useMemo(() => filterCards(cards, { q, sort, day, view }), [cards, q, sort, day, view]);
  const update = (c: Postcard) => { setCards((cs) => cs.map((x) => (x.id === c.id ? c : x))); setOpen(c); };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-background/90 px-4 py-3 backdrop-blur">
        <IconBtn label="Open settings" onClick={() => setLeft(true)}><Menu /></IconBtn>
        <h1 className="font-display text-2xl italic tracking-tight">Postcard Notes</h1>
        <IconBtn label="Search and filter" onClick={() => setRight(true)}><SlidersHorizontal /></IconBtn>
      </header>
      <div className="airmail-edge h-1.5 opacity-70" />

      <main className="mx-auto max-w-6xl px-4 pb-28 pt-6">
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
        className="fixed bottom-6 right-6 z-30 grid size-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-lift transition-transform duration-300 hover:scale-105"
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
        <Section title="App theme">
          <div className="grid grid-cols-2 gap-2">
            {APP_THEMES.map((t) => (
              <button key={t.key} onClick={() => setTheme(t.key)}
                className={`flex items-center gap-2 rounded-md border px-2.5 py-2 text-left text-xs transition-colors ${theme === t.key ? "border-primary bg-accent font-medium" : "border-border hover:bg-muted"}`}>
                <span className="size-4 shrink-0 rounded-full border border-border" style={{ background: t.swatch }} />
                {t.label}
              </button>
            ))}
          </div>
        </Section>
        <Section title="Sharing">
          <div className="flex items-center gap-2 text-sm text-muted-foreground"><Share2 className="size-4" /> Open a postcard to share it</div>
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
        <EnvelopeView c={open} onClose={() => setOpen(null)} onChange={update}
          onEdit={() => { setEditing(open); setOpen(null); }}
          onDelete={() => { setCards((cs) => cs.filter((x) => x.id !== open.id)); setOpen(null); }} />
      )}
      {editing && (
        <Editor initial={editing === "new" ? null : editing} author={profile.name} onClose={() => setEditing(null)}
          onSave={(c) => {
            setCards((cs) => (cs.some((x) => x.id === c.id) ? cs.map((x) => (x.id === c.id ? c : x)) : [c, ...cs]));
            setEditing(null);
          }} />
      )}
    </div>
  );
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
      <aside className={`absolute top-0 h-full w-80 max-w-[85vw] overflow-y-auto border-border bg-background p-5 shadow-lift transition-transform duration-300
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
      style={{ rotate: `${((i % 3) - 1) * 0.6}deg`, ...cardStyle(c.theme) }}
      className={`group relative flex aspect-[3/2] flex-col overflow-hidden rounded-md p-5 text-left shadow-card transition-all duration-300 hover:-translate-y-1 hover:rotate-0 hover:shadow-lift ${c.theme ? "" : "border border-border bg-card"}`}>
      <div className="airmail-edge absolute inset-x-0 top-0 h-1 opacity-60" />
      <div className="absolute right-4 top-4 grid size-12 place-items-center rounded-sm stamp-perf" style={c.theme ? { background: `${c.theme.accent}22` } : undefined}>
        {c.audio ? <Music className="size-5" style={c.theme ? { color: c.theme.accent } : undefined} /> : c.private ? <Lock className="size-5 text-primary" /> : <Mail className="size-5 text-primary" />}
      </div>
      <p className="text-xs uppercase tracking-widest opacity-60">{fmt(c.createdAt)}</p>
      <h2 className="mt-2 line-clamp-2 pr-14 text-2xl leading-tight" style={c.theme ? { color: c.theme.accent } : undefined}>{c.title || "Untitled"}</h2>
      <p className="mt-2 line-clamp-2 text-sm opacity-75">{c.body}</p>
      <div className="mt-auto flex gap-2 pt-3 text-xs">
        {c.audio && <span className="flex items-center gap-1 rounded-full bg-foreground/10 px-2 py-1"><Music className="size-3" />Audio</span>}
        {c.images.length > 0 && <span className="flex items-center gap-1 rounded-full bg-foreground/10 px-2 py-1"><ImageIcon className="size-3" />{c.images.length} photo{c.images.length > 1 ? "s" : ""}</span>}
      </div>
    </button>
  );
}

/* ---------- Audio bar with seek + autoplay toggle ---------- */
function AudioBar({ audio, audioRef, autoplay, onToggleAutoplay, dark }: {
  audio: { name: string; src: string };
  audioRef: React.RefObject<HTMLAudioElement | null>;
  autoplay: boolean;
  onToggleAutoplay: () => void;
  dark?: boolean;
}) {
  const [playing, setPlaying] = useState(false);
  const [pct, setPct] = useState(0);
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onTime = () => setPct(a.duration ? (a.currentTime / a.duration) * 100 : 0);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("play", onPlay);
    a.addEventListener("pause", onPause);
    setPlaying(!a.paused);
    return () => { a.removeEventListener("timeupdate", onTime); a.removeEventListener("play", onPlay); a.removeEventListener("pause", onPause); };
  }, [audioRef]);
  const seek = (v: number) => {
    const a = audioRef.current;
    if (a?.duration) a.currentTime = (v / 100) * a.duration;
  };
  return (
    <div className={`flex items-center gap-3 rounded-full border px-3 py-2 ${dark ? "border-current/30 bg-black/20" : "border-border bg-secondary"}`}>
      <button aria-label={playing ? "Pause" : "Play"} onClick={() => (playing ? audioRef.current?.pause() : audioRef.current?.play())}
        className={`grid size-8 shrink-0 place-items-center rounded-full ${dark ? "bg-current/90 text-black" : "bg-primary text-primary-foreground"}`}
        style={dark ? { background: "currentColor" } : undefined}>
        {playing ? <Pause className="size-4" style={dark ? { color: "#000" } : undefined} /> : <Play className="size-4" style={dark ? { color: "#000" } : undefined} />}
      </button>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs">{audio.name}</p>
        <input type="range" min={0} max={100} step={0.1} value={pct} aria-label="Seek"
          onChange={(e) => seek(Number(e.target.value))}
          className="mt-1 h-1 w-full cursor-pointer accent-current" />
      </div>
      <button aria-label="Toggle autoplay" title="Autoplay on open" onClick={onToggleAutoplay}
        className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wide ${autoplay ? "border-current font-bold" : "border-current/40 opacity-60"}`}>
        Auto
      </button>
    </div>
  );
}

/* ---------- 3D envelope unsealing → letter ---------- */
function EnvelopeView({ c, onClose, onChange, onEdit, onDelete }: {
  c: Postcard; onClose: () => void; onChange: (c: Postcard) => void; onEdit: () => void; onDelete: () => void;
}) {
  const [stage, setStage] = useState<"sealed" | "flap" | "slide" | "open">("sealed");
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [photosOut, setPhotosOut] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const t = c.theme;

  const unseal = () => {
    if (stage !== "sealed") return;
    setStage("flap");
    if (c.audio?.src && c.autoplay !== false) audioRef.current?.play().catch(() => {});
    setTimeout(() => setStage("slide"), 620);
    setTimeout(() => setStage("open"), 1450);
  };

  const share = async () => {
    const text = `${c.title}\n\n${c.body}`;
    if (navigator.share) await navigator.share({ title: c.title, text }).catch(() => {});
    else await navigator.clipboard.writeText(text);
  };

  const envBg = t ? t.bg : "linear-gradient(160deg, var(--card), var(--secondary))";
  const envColor = t ? t.text : "var(--foreground)";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 p-4 backdrop-blur-sm" onClick={onClose}>
      {c.audio && <audio ref={audioRef} src={c.audio.src} loop />}

      {stage !== "open" ? (
        /* ---- Sealed / opening envelope ---- */
        <div onClick={(e) => e.stopPropagation()} className="flex flex-col items-center gap-6">
          <div style={{ perspective: "1000px" }}>
            <div className="relative h-56 w-80 sm:h-64 sm:w-96" style={{ color: envColor }}>
              {/* letter inside */}
              <div
                className="absolute inset-x-3 top-2 bottom-2 rounded-sm p-4 shadow-card transition-all duration-[800ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
                style={{
                  background: envBg,
                  transform: stage === "slide" ? "translateY(-105%) scale(1.02)" : "translateY(0)",
                  zIndex: stage === "slide" ? 30 : 1,
                }}
              >
                <p className="text-[10px] uppercase tracking-widest opacity-60">{fmt(c.createdAt)}</p>
                <p className="mt-1 line-clamp-2 text-lg leading-tight" style={t ? { color: t.accent, fontFamily: FONTS[t.font].css } : undefined}>{c.title || "Untitled"}</p>
              </div>
              {/* envelope pocket (front) */}
              <div
                className="absolute inset-0 z-10 rounded-md shadow-lift"
                style={{
                  background: envBg,
                  filter: "brightness(0.94)",
                  clipPath: "polygon(0 0, 50% 42%, 100% 0, 100% 100%, 0 100%)",
                }}
              />
              {/* stamp */}
              <div className="absolute right-3 top-3 z-20 grid size-11 place-items-center rounded-sm stamp-perf"
                style={{ background: t ? `${t.accent}33` : "var(--accent)", transform: "rotate(3deg)" }}>
                <Mail className="size-5" style={t ? { color: t.accent } : undefined} />
              </div>
              {/* flap */}
              <div
                className="absolute inset-x-0 top-0 z-20 h-[45%] origin-top rounded-t-md transition-transform duration-[600ms] ease-out"
                style={{
                  background: envBg,
                  filter: "brightness(1.06)",
                  clipPath: "polygon(0 0, 100% 0, 50% 100%)",
                  transform: stage === "sealed" ? "rotateX(0deg)" : "rotateX(180deg)",
                  transformStyle: "preserve-3d",
                  backfaceVisibility: "visible",
                  zIndex: stage === "sealed" ? 20 : 5,
                }}
              />
            </div>
          </div>
          {stage === "sealed" ? (
            <button onClick={unseal}
              className="flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-medium text-primary-foreground shadow-lift transition-transform duration-300 hover:scale-105">
              <MailOpen className="size-5" /> Unseal this letter
            </button>
          ) : (
            <p className="animate-pulse text-sm text-primary-foreground/90">Opening…</p>
          )}
          <button onClick={onClose} className="text-sm text-primary-foreground/80 underline underline-offset-4">Back to board</button>
        </div>
      ) : (
        /* ---- Expanded letter ---- */
        <div onClick={(e) => e.stopPropagation()}
          style={cardStyle(t)}
          className={`mx-auto flex h-full max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden shadow-lift sm:rounded-lg ${t ? "" : "border border-border bg-card"}`}>
          <div className="airmail-edge h-2 shrink-0" />
          <div className="space-y-3 border-b p-5" style={t ? { borderColor: `${t.text}33`, background: `${t.accent}14` } : undefined}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-widest opacity-60">{fmt(c.createdAt)}{c.author ? ` · ${c.author}` : ""}</p>
                <h2 className="text-3xl leading-tight" style={t ? { color: t.accent } : undefined}>{c.title || "Untitled"}</h2>
              </div>
              <div className="flex gap-1">
                <IconBtn label="Customize theme" onClick={onEdit}><Palette /></IconBtn>
                <IconBtn label="Close" onClick={onClose}><X /></IconBtn>
              </div>
            </div>
            {c.audio && (
              <AudioBar audio={c.audio} audioRef={audioRef} autoplay={!!c.autoplay} dark={!!t}
                onToggleAutoplay={() => onChange({ ...c, autoplay: !c.autoplay })} />
            )}
          </div>
          <div className="relative flex-1 overflow-y-auto p-5">
            <p className="whitespace-pre-wrap text-lg leading-relaxed">{c.body}</p>
            {/* 💌 hidden photo envelope, bottom-left */}
            {c.images.length > 0 && (
              <div className="sticky bottom-0 mt-8 flex items-end gap-3">
                <button aria-label="Open photo envelope" onClick={() => setPhotosOut((v) => !v)}
                  className="grid size-12 shrink-0 place-items-center rounded-full border text-xl shadow-card transition-transform duration-300 hover:scale-110"
                  style={t ? { borderColor: `${t.text}44`, background: `${t.accent}22` } : { borderColor: "var(--border)", background: "var(--secondary)" }}>
                  💌
                </button>
                {photosOut && (
                  <div className="flex gap-2 overflow-x-auto pb-1" style={{ perspective: "600px" }}>
                    {c.images.map((src, i) => (
                      <button key={i} onClick={() => setLightbox(src)} className="envelope-photo shrink-0"
                        style={{ animationDelay: `${i * 90}ms` }}>
                        <img src={src} alt="" className="h-24 w-20 rounded-md border border-black/10 object-cover shadow-card transition-transform duration-300 hover:-translate-y-1" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2 border-t p-4 text-sm" style={t ? { borderColor: `${t.text}33` } : undefined}>
            <Act onClick={onEdit}><Pencil className="size-4" />Edit</Act>
            <Act onClick={share}><Share2 className="size-4" />Share</Act>
            <Act onClick={() => onChange({ ...c, private: !c.private })}><Lock className="size-4" />{c.private ? "Make public" : "Make private"}</Act>
            <Act onClick={() => onChange({ ...c, archived: !c.archived })}><Archive className="size-4" />{c.archived ? "Unarchive" : "Archive"}</Act>
            <Act danger onClick={() => confirm("Delete this postcard?") && onDelete()}><Trash2 className="size-4" />Delete</Act>
          </div>
        </div>
      )}

      {lightbox && (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-black/85 p-4" onClick={() => setLightbox(null)}>
          <img src={lightbox} alt="" className="max-h-full max-w-full rounded-md shadow-lift" />
          <button aria-label="Close photo" className="absolute right-4 top-4 grid size-10 place-items-center rounded-full bg-white/10 text-white"><X className="size-5" /></button>
        </div>
      )}
    </div>
  );
}

function Act({ onClick, children, danger }: { onClick: () => void; children: React.ReactNode; danger?: boolean }) {
  return <button onClick={onClick} className={`flex items-center gap-1.5 rounded-md border border-current/30 px-3 py-1.5 hover:bg-foreground/5 ${danger ? "text-destructive" : ""}`}>{children}</button>;
}

/* ---------- Editor with postcard theme customizer ---------- */
function Editor({ initial, author, onClose, onSave }: {
  initial: Postcard | null; author: string; onClose: () => void; onSave: (c: Postcard) => void;
}) {
  const [c, setC] = useState<Postcard>(
    initial ?? { id: crypto.randomUUID(), title: "", body: "", author, createdAt: Date.now(), images: [], theme: defaultCardTheme() },
  );
  const [showTheme, setShowTheme] = useState(false);
  const th = c.theme ?? defaultCardTheme();
  const setTh = (patch: Partial<CardTheme>) => setC({ ...c, theme: { ...th, ...patch } });

  const addImages = async (fs: FileList | null) => {
    if (!fs) return;
    const urls = await Promise.all([...fs].map(readFile));
    setC((x) => ({ ...x, images: [...x.images, ...urls] }));
  };
  const addAudio = async (fs: FileList | null) => {
    const f = fs?.[0]; if (!f) return;
    setC((x) => ({ ...x, audio: { name: f.name, src: "" }, autoplay: true }));
    const src = await readFile(f);
    setC((x) => ({ ...x, audio: { name: f.name, src } }));
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 p-4" onClick={onClose}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={(e) => { e.preventDefault(); onSave(c); }}
        className="max-h-full w-full max-w-lg space-y-4 overflow-y-auto rounded-lg border border-border bg-card p-6 shadow-lift">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl">{initial ? "Edit postcard" : "New postcard"}</h2>
          <div className="flex gap-1">
            <IconBtn label="Theme customizer" onClick={() => setShowTheme((v) => !v)}><Palette /></IconBtn>
            <IconBtn label="Close" onClick={onClose}><X /></IconBtn>
          </div>
        </div>

        {/* live preview strip */}
        <div className="rounded-md p-4 shadow-card" style={cardStyle(c.theme)}>
          <p className="text-[10px] uppercase tracking-widest opacity-60">Preview</p>
          <p className="text-xl leading-tight" style={{ color: th.accent }}>{c.title || "Untitled"}</p>
          <p className="mt-1 line-clamp-2 text-sm opacity-80">{c.body || "Dear diary…"}</p>
        </div>

        <input autoFocus required value={c.title} onChange={(e) => setC({ ...c, title: e.target.value })} placeholder="Title"
          className="w-full border-b border-input bg-transparent py-2 font-display text-xl outline-none focus:border-primary" />
        <textarea value={c.body} onChange={(e) => setC({ ...c, body: e.target.value })} rows={6} placeholder="Dear diary…"
          className="w-full rounded-md border border-input bg-background px-3 py-2 font-display outline-none focus:ring-2 focus:ring-ring" />

        {showTheme && (
          <div className="space-y-3 rounded-md border border-border bg-background p-4 text-sm">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Preset themes</p>
            <div className="flex flex-wrap gap-2">
              {CARD_PRESETS.map((p) => (
                <button type="button" key={p.name} onClick={() => setC({ ...c, theme: { ...p.theme } })}
                  className="rounded-full border border-border px-3 py-1.5 text-xs shadow-card transition-transform hover:scale-105"
                  style={{ background: p.theme.bg, color: p.theme.text }}>
                  {p.name}
                </button>
              ))}
            </div>
            <p className="pt-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">Customize</p>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">Background
                <input type="color" value={toHex(th.bg)} onChange={(e) => setTh({ bg: e.target.value })} className="mt-1 h-9 w-full cursor-pointer rounded border border-input" />
              </label>
              <label className="block">Text color
                <input type="color" value={toHex(th.text)} onChange={(e) => setTh({ text: e.target.value })} className="mt-1 h-9 w-full cursor-pointer rounded border border-input" />
              </label>
              <label className="block">Accent tint
                <input type="color" value={toHex(th.accent)} onChange={(e) => setTh({ accent: e.target.value })} className="mt-1 h-9 w-full cursor-pointer rounded border border-input" />
              </label>
              <label className="block">Font
                <select value={th.font} onChange={(e) => setTh({ font: e.target.value as CardTheme["font"] })}
                  className="mt-1 w-full rounded-md border border-input bg-card px-2 py-2">
                  {Object.entries(FONTS).map(([k, f]) => <option key={k} value={k}>{f.label}</option>)}
                </select>
              </label>
            </div>
            <div>
              <span>Border style</span>
              <div className="mt-1 grid grid-cols-2 gap-2">
                {Object.entries(BORDERS).map(([k, b]) => (
                  <button type="button" key={k} onClick={() => setTh({ border: k as CardTheme["border"] })}
                    className={`rounded-md px-2 py-2 text-xs ${th.border === k ? "bg-accent font-medium ring-2 ring-ring" : "bg-card"}`}
                    style={b.css}>
                    {b.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

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
            <span className="flex items-center gap-2">
              <label className="flex cursor-pointer items-center gap-1 text-xs">
                <input type="checkbox" checked={!!c.autoplay} onChange={(e) => setC({ ...c, autoplay: e.target.checked })} />Autoplay
              </label>
              <button type="button" aria-label="Remove audio" onClick={() => setC({ ...c, audio: undefined })}><X className="size-4" /></button>
            </span>
          </div>
        )}
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

/* Extract a hex color from a CSS color/gradient for <input type=color> */
function toHex(css: string): string {
  const m = css.match(/#[0-9a-fA-F]{6}/);
  return m ? m[0] : "#f5ead6";
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
