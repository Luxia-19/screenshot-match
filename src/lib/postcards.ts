export type Postcard = {
  id: string;
  title: string;
  body: string;
  createdAt: number;
  images: string[];
  audio?: { name: string; src: string } | undefined;
  archived?: boolean;
  private?: boolean;
};

export type Profile = { name: string; email: string; bio: string };

const KEY = "postcards.v1";
const PKEY = "postcards.profile";
const TKEY = "postcards.theme";

export const seed: Postcard[] = [
  {
    id: "s1",
    title: "Rain over the Mekong",
    body: "The sky turned slate by four. Tuk-tuks hissed past, and the café owner turned up an old Sinn Sisamouth record. I stayed for a second coffee just to hear it end.",
    createdAt: Date.now() - 86400000 * 2,
    images: [],
  },
  {
    id: "s2",
    title: "Letter to future me",
    body: "Remember how it felt to start something without knowing how it ends. Keep that.",
    createdAt: Date.now() - 86400000 * 9,
    images: [],
    private: true,
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
export const loadTheme = () => safe<"paper" | "dark">(TKEY, "paper");
export const saveTheme = (t: "paper" | "dark") => save(TKEY, t);

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
