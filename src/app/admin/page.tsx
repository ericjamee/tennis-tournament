import Link from "next/link";
import { createSupabaseServer } from "@/lib/supabase-server";
import { hasSupabasePublicConfig, TOURNAMENT_SLUG } from "@/lib/supabase-env";
import { login, logout, updateTournament } from "./actions";
import { PlayerControls } from "./player-controls";

type PageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> };
type ScheduleItem = { time: string; label: string };
type FaqItem = { question: string; answer: string };
type TournamentRow = {
  id: string; name: string; subtitle: string | null; description: string | null; date: string; start_time: string;
  venue_name: string | null; venue_address: string | null; venue_confirmed: boolean; contact_email: string;
  capacity: number; entry_fee: number | null; registration_open: boolean; schedule_finalized: boolean;
  prize_description: string | null; rain_policy: string | null; refund_policy: string | null;
  rules: string[]; schedule: ScheduleItem[]; faq: FaqItem[];
};
type RegistrationRow = {
  id: string; tournament_id: string; first_name: string; last_name: string; email: string; phone: string;
  age: number; self_rating: string; ntrp: string | null; utr: string | null; experience: string | null;
  notes: string | null; status: string; waitlist_position: number | null; seed: number | null; created_at: string;
};

export const metadata = { title: "Organizer | Provo Tennis" };

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;
  if (!hasSupabasePublicConfig()) return <SetupNotice/>;

  const db = await createSupabaseServer();
  const { data: { user } } = await db.auth.getUser();
  if (!user) return <Login error={single(params.error)}/>;

  const [{ data: tournamentData }, { data: playerData }] = await Promise.all([
    db.from("tournaments").select("*").eq("slug", TOURNAMENT_SLUG).single(),
    db.from("registrations").select("*").order("created_at", { ascending: false }),
  ]);
  const tournament = tournamentData as TournamentRow | null;
  const allPlayers = (playerData ?? []) as RegistrationRow[];
  if (!tournament) return <main className="admin-shell"><div className="error">Tournament data could not be loaded. Run every Supabase migration, then refresh.</div></main>;

  const query = single(params.q)?.trim().toLowerCase() ?? "";
  const players = query ? allPlayers.filter((player) => `${player.first_name} ${player.last_name} ${player.email} ${player.phone}`.toLowerCase().includes(query)) : allPlayers;
  const registered = allPlayers.filter((player) => ["registered", "confirmed"].includes(player.status)).length;
  const waitlisted = allPlayers.filter((player) => player.status === "waitlisted").length;

  return <main className="admin-shell">
    <div className="admin-head"><div><div className="eyebrow">Organizer dashboard</div><h1>{tournament.name}</h1><p className="admin-email">Signed in as {user.email}</p></div><form action={logout}><button className="button">Sign out</button></form></div>
    {single(params.message) && <div className="success" role="status">{single(params.message)}</div>}
    {single(params.error) && <div className="error" role="alert">{single(params.error)}</div>}
    <div className="admin-grid"><Stat n={tournament.capacity} label="Capacity"/><Stat n={registered} label="Registered"/><Stat n={Math.max(tournament.capacity - registered, 0)} label="Spots left"/><Stat n={waitlisted} label="Waitlisted"/></div>
    <section className="admin-section">
      <div className="section-head"><div><div className="eyebrow">Players</div><h2>Registration desk</h2></div><a className="button dark" href="/api/admin/registrations.csv">Export CSV</a></div>
      <form className="player-search" action="/admin" method="get"><label htmlFor="q">Search players</label><div><input id="q" name="q" type="search" placeholder="Name, email, or phone" defaultValue={query}/><button className="button">Search</button>{query && <Link href="/admin" className="text-button">Clear</Link>}</div></form>
      <div className="table-wrap"><table className="players-table"><thead><tr><th>Player</th><th>Contact</th><th>Level</th><th>Status</th><th>Registered</th><th>Manage</th></tr></thead><tbody>
        {players.map((player) => <tr key={player.id}><td><b>{player.first_name} {player.last_name}</b><small>Age {player.age}{player.notes ? ` · Note: ${player.notes}` : ""}</small></td><td><a href={`mailto:${player.email}`}>{player.email}</a><small>{player.phone}</small></td><td>{player.self_rating}<small>NTRP {player.ntrp || "—"} · UTR {player.utr || "—"}</small></td><td><span className={`pill ${player.status}`}>{player.status}{player.status === "waitlisted" && player.waitlist_position ? ` #${player.waitlist_position}` : ""}</span></td><td>{new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(player.created_at))}</td><td><PlayerControls id={player.id} tournamentId={player.tournament_id} status={player.status} seed={player.seed}/></td></tr>)}
        {!players.length && <tr><td colSpan={6} className="empty-table">No players match this search.</td></tr>}
      </tbody></table></div>
    </section>
    <section className="admin-section">
      <div className="section-head"><div><div className="eyebrow">Public site</div><h2>Tournament settings</h2></div><Link className="button" href="/" target="_blank">Preview site ↗</Link></div>
      <form action={updateTournament} className="settings-form">
        <input type="hidden" name="id" value={tournament.id}/>
        <div className="fields"><Field name="name" label="Tournament name" value={tournament.name}/><Field name="subtitle" label="Subtitle" value={tournament.subtitle}/><Area name="description" label="Description" value={tournament.description}/><Field name="date" label="Date" type="date" value={tournament.date}/><Field name="start_time" label="Start time" type="time" value={tournament.start_time.slice(0, 5)}/><Field name="capacity" label="Player capacity" type="number" value={String(tournament.capacity)}/><Field name="entry_fee" label="Entry fee (leave blank until decided)" type="number" value={tournament.entry_fee === null ? "" : String(tournament.entry_fee)}/><Field name="contact_email" label="Contact email" type="email" value={tournament.contact_email}/><Field name="venue_name" label="Venue name" value={tournament.venue_name}/><Field name="venue_address" label="Venue address" value={tournament.venue_address}/><Area name="prize_description" label="Prize description" value={tournament.prize_description}/><Area name="rain_policy" label="Rain policy" value={tournament.rain_policy}/><Area name="refund_policy" label="Refund policy" value={tournament.refund_policy}/><Area name="rules" label="Rules · one per line" value={tournament.rules.join("\n")}/><Area name="schedule" label="Schedule · one per line as time | label" value={tournament.schedule.map((item) => `${item.time} | ${item.label}`).join("\n")}/><Area name="faq" label="FAQ · one per line as question | answer" value={tournament.faq.map((item) => `${item.question} | ${item.answer}`).join("\n")}/></div>
        <div className="settings-checks"><Toggle name="registration_open" label="Registration is open" checked={tournament.registration_open}/><Toggle name="venue_confirmed" label="Venue is confirmed" checked={tournament.venue_confirmed}/><Toggle name="schedule_finalized" label="Schedule is finalized" checked={tournament.schedule_finalized}/></div>
        <button className="button dark">Save tournament settings</button>
      </form>
    </section>
  </main>;
}

function SetupNotice() { return <main className="admin-shell"><div className="eyebrow">Organizer</div><h1>Admin setup</h1><div className="notice">Connect Supabase environment variables and run both included migrations to activate secure organizer login, player management, tournament settings, and email-ready registration.</div><Link className="button dark" href="/">View public site</Link></main>; }
function Login({ error }: { error?: string }) { return <main className="admin-shell"><div className="eyebrow">Organizer access</div><h1>Welcome back.</h1><form action={login} className="form-card login-card">{error && <div className="error">{error}</div>}<div className="field"><label htmlFor="email">Email</label><input id="email" name="email" type="email" autoComplete="email" required/></div><div className="field"><label htmlFor="password">Password</label><input id="password" name="password" type="password" autoComplete="current-password" required/></div><button className="button dark">Sign in →</button></form></main>; }
function Stat({ n, label }: { n: number; label: string }) { return <div className="stat"><strong>{n}</strong><span>{label}</span></div>; }
function Field({ name, label, type = "text", value }: { name: string; label: string; type?: string; value: string | null }) { return <div className="field"><label htmlFor={name}>{label}</label><input id={name} name={name} type={type} defaultValue={value ?? ""} required={!["entry_fee", "venue_name", "venue_address"].includes(name)}/></div>; }
function Area({ name, label, value }: { name: string; label: string; value: string | null }) { return <div className="field full"><label htmlFor={name}>{label}</label><textarea id={name} name={name} defaultValue={value ?? ""}/></div>; }
function Toggle({ name, label, checked }: { name: string; label: string; checked: boolean }) { return <label className="toggle"><input type="hidden" name={name} value="false"/><input name={name} type="checkbox" value="true" defaultChecked={checked}/><span>{label}</span></label>; }
function single(value: string | string[] | undefined) { return Array.isArray(value) ? value[0] : value; }
