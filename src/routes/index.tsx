import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Menu, SlidersHorizontal, Plus, X, Music, Image as ImageIcon, Play, Pause, Trash2, Archive,
  Lock, Moon, Sun, Wifi, WifiOff, Share2, Search, ChevronLeft, ChevronRight, Mail, Pencil,
} from "lucide-react";
import {
  type Postcard, type Profile, type SortKey, loadCards, saveCards, loadProfile, saveProfile,
  loadTheme, saveTheme, readFile, filterCards, dayKey,
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
  const [profile, setProfile] = useState<Profile>({ name: "", email: "", bio: "" });
  const [theme, setTheme] = useState<"paper" | "dark">("paper");
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
        <Section title="Theme">
          <button onClick={() => setTheme(theme === "dark" ? "paper" : "dark")}
            className="flex w-full items-center justify-between rounded-md border border-border bg-card px-3 py-2.5">
            <span className="flex items-center gap-2">{theme === "dark" ? <Moon className="size-4" /> : <Sun className="size-4" />}{theme === "dark" ? "Dark mode" : "Warm paper"}</span>
            <span className={`relative h-6 w-11 rounded-full transition-colors duration-300 ${theme === "dark" ? "bg-primary" : "bg-muted"}`}>
              <span className={`absolute top-0.5 size-5 rounded-full bg-card shadow-card transition-all duration-300 ${theme === "dark" ? "left-5.5" : "left-0.5"}`} />
            </span>
          </button>
        </Section>
        <Section title="Sharing & offline">
          <div className="flex items-center gap-2 text-sm">
            {online ? <Wifi className="size-4 text-stamp" /> : <WifiOff className="size-4 text-destructive" />}
            {online ? "Online — notes saved on this device" : "Offline standby — notes still saved locally"}
          </div>
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
        <Expanded c={open} onClose={() => setOpen(null)} onChange={update}
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
      style={{ rotate: `${((i % 3) - 1) * 0.6}deg` }}
      className="group relative flex aspect-[3/2] flex-col overflow-hidden rounded-md border border-border bg-card p-5 text-left shadow-card transition-all duration-300 hover:-translate-y-1 hover:rotate-0 hover:shadow-lift">
      <div className="airmail-edge absolute inset-x-0 top-0 h-1 opacity-60" />
      <div className="absolute right-4 top-4 grid size-12 place-items-center rounded-sm bg-accent stamp-perf">
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

function AudioBar({ audio }: { audio: { name: string; src: string } }) {
  const ref = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [pct, setPct] = useState(0);
  return (
    <div className="flex items-center gap-3 rounded-full border border-border bg-secondary px-3 py-2">
      <audio ref={ref} src={audio.src} loop onTimeUpdate={(e) => { const a = e.currentTarget; setPct(a.duration ? (a.currentTime / a.duration) * 100 : 0); }} onPause={() => setPlaying(false)} onPlay={() => setPlaying(true)} />
      <button aria-label={playing ? "Pause" : "Play"} onClick={() => (playing ? ref.current?.pause() : ref.current?.play())}
        className="grid size-8 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
        {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
      </button>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs">{audio.name}</p>
        <div className="mt-1 h-1 rounded-full bg-border"><div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} /></div>
      </div>
    </div>
  );
}

function Expanded({ c, onClose, onChange, onEdit, onDelete }: { c: Postcard; onClose: () => void; onChange: (c: Postcard) => void; onEdit: () => void; onDelete: () => void }) {
  const [shown, setShown] = useState(false);
  useEffect(() => { requestAnimationFrame(() => setShown(true)); }, []);
  const share = async () => {
    const text = `${c.title}\n\n${c.body}`;
    if (navigator.share) await navigator.share({ title: c.title, text }).catch(() => {});
    else await navigator.clipboard.writeText(text);
  };
  return (
    <div className={`fixed inset-0 z-50 bg-foreground/40 p-0 transition-opacity duration-300 sm:p-6 ${shown ? "opacity-100" : "opacity-0"}`} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}
        className={`mx-auto flex h-full max-w-3xl flex-col overflow-hidden border border-border bg-card shadow-lift transition-all duration-300 sm:rounded-lg ${shown ? "scale-100" : "scale-95"}`}>
        <div className="airmail-edge h-2" />
        <div className="space-y-3 border-b border-border p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">{fmt(c.createdAt)}</p>
              <h2 className="font-display text-3xl leading-tight">{c.title || "Untitled"}</h2>
            </div>
            <IconBtn label="Close" onClick={onClose}><X /></IconBtn>
          </div>
          {c.audio && <AudioBar audio={c.audio} />}
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          {c.images.length > 0 && (
            <div className="mb-5 flex snap-x gap-3 overflow-x-auto pb-2">
              {c.images.map((src, i) => <img key={i} src={src} alt="" className="h-56 shrink-0 snap-start rounded-md border border-border object-cover" />)}
            </div>
          )}
          <p className="whitespace-pre-wrap font-display text-lg leading-relaxed">{c.body}</p>
        </div>
        <div className="flex flex-wrap gap-2 border-t border-border p-4 text-sm">
          <Act onClick={onEdit}><Pencil className="size-4" />Edit</Act>
          <Act onClick={share}><Share2 className="size-4" />Share</Act>
          <Act onClick={() => onChange({ ...c, private: !c.private })}><Lock className="size-4" />{c.private ? "Make public" : "Make private"}</Act>
          <Act onClick={() => onChange({ ...c, archived: !c.archived })}><Archive className="size-4" />{c.archived ? "Unarchive" : "Archive"}</Act>
          <Act danger onClick={() => confirm("Delete this postcard?") && onDelete()}><Trash2 className="size-4" />Delete</Act>
        </div>
      </div>
    </div>
  );
}
function Act({ onClick, children, danger }: { onClick: () => void; children: React.ReactNode; danger?: boolean }) {
  return <button onClick={onClick} className={`flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 hover:bg-muted ${danger ? "text-destructive" : ""}`}>{children}</button>;
}

function Editor({ initial, onClose, onSave }: { initial: Postcard | null; onClose: () => void; onSave: (c: Postcard) => void }) {
  const [c, setC] = useState<Postcard>(initial ?? { id: crypto.randomUUID(), title: "", body: "", createdAt: Date.now(), images: [] });
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
        className="max-h-full w-full max-w-lg space-y-4 overflow-y-auto rounded-lg border border-border bg-card p-6 shadow-lift">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl">{initial ? "Edit postcard" : "New postcard"}</h2>
          <IconBtn label="Close" onClick={onClose}><X /></IconBtn>
        </div>
        <input autoFocus required value={c.title} onChange={(e) => setC({ ...c, title: e.target.value })} placeholder="Title"
          className="w-full border-b border-input bg-transparent py-2 font-display text-xl outline-none focus:border-primary" />
        <textarea value={c.body} onChange={(e) => setC({ ...c, body: e.target.value })} rows={6} placeholder="Dear diary…"
          className="w-full rounded-md border border-input bg-background px-3 py-2 font-display outline-none focus:ring-2 focus:ring-ring" />
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
