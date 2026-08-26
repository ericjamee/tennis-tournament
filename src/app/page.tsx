import Link from "next/link";
import {
  CalendarCheck,
  CircleDot,
  Clock3,
  MapPin,
  Sparkles,
  Trophy,
  Users,
} from "lucide-react";
import { getTournament } from "@/lib/data";
import { ENTRY_FEE, ENTRY_FEE_FAQ, REFUND_FAQ } from "@/lib/tournament-details";
import TournamentBracket from "./tournament-bracket";

export const dynamic = "force-dynamic";

const quarters = [
  { label: "Q1", score: "11–8", result: "win" },
  { label: "Q2", score: "7–10", result: "loss" },
  { label: "Q3", score: "9–6", result: "win" },
  { label: "Q4", score: "8–5", result: "win" },
] as const;

const matchRules = [
  ["06:00", "Four timed quarters"],
  ["+1", "Every rally is one point"],
  ["1×", "One serve per point"],
  ["2 PTS", "Switch server every two points"],
] as const;

const projectedSchedule = [
  { time: "8:00 AM", label: "Check-in and short warm-up" },
  { time: "8:30 AM", label: "Championship opening round begins" },
  { time: "10:50 AM", label: "Championship and consolation quarterfinals" },
  { time: "1:10 PM", label: "Championship and consolation semifinals" },
  { time: "3:00 PM", label: "Championship and consolation finals" },
] as const;

export default async function Home() {
  const { tournament: t, registered } = await getTournament();
  const plannedVenue = t.venue_name || "Riverview Park";
  const plannedAddress = t.venue_name && t.venue_address ? t.venue_address : "4620 N 300 W, Provo, UT 84604";
  const displayedSchedule = t.schedule_finalized ? t.schedule : projectedSchedule;
  const entryFee = t.entry_fee ?? ENTRY_FEE;
  const currentFaq = t.faq.map((item) => item.question === REFUND_FAQ.question ? REFUND_FAQ : item);
  const displayedFaq = currentFaq.some((item) => item.question === ENTRY_FEE_FAQ.question)
    ? currentFaq
    : [...currentFaq, ENTRY_FEE_FAQ];
  const remaining = Math.max(t.capacity - registered, 0);
  const full = remaining === 0;
  const benefits = [
    [CalendarCheck, "Two matches minimum", "Every player is scheduled for at least two matches, barring weather or withdrawals."],
    [Users, "Level-based seeding", "A welcoming field seeded from recreational to advanced."],
    [CircleDot, "Fresh tennis balls", "Quality balls supplied for tournament play."],
    [Trophy, "Two titles", "Compete for the championship or fight through the consolation draw."],
    [Clock3, "Fast-match format", "Roughly 30–35 minutes per match keeps the day moving."],
    [Sparkles, "A local tradition", "Help launch a new community tournament series."],
  ] as const;

  return (
    <main>
      <section className="hero">
        <div className="hero-main">
          <div className="eyebrow">Inaugural event · Provo, Utah</div>
          <h1>Labor Day<br/><em>Tennis</em><br/>Tournament</h1>
          <p className="hero-sub">{t.subtitle}</p>
          <div className="hero-actions">
            <Link className="button" href="/register">{full ? "Join waitlist" : "Register to play"} →</Link>
            <small>{remaining} of {t.capacity} spots remaining</small>
          </div>
        </div>
        <aside className="hero-side">
          <div className="date-num">07</div>
          <div className="date-month">SEPTEMBER ’26</div>
          <div className="fact"><span>Day</span><span>Monday · Labor Day</span></div>
          <div className="fact"><span>Place</span><span>{plannedVenue}{t.venue_confirmed ? "" : " · planned"}</span></div>
          <div className="fact"><span>Field</span><span>{t.capacity} singles players</span></div>
          <div className="fact"><span>Matches</span><span>2 minimum</span></div>
          <div className="fact"><span>Entry</span><span>${entryFee}</span></div>
        </aside>
      </section>

      <div className="ticker"><div><span>ONE SERVE</span><span>●</span><span>EVERY POINT COUNTS</span><span>●</span><span>FOUR QUARTERS</span><span>●</span><span>TWO MATCHES MINIMUM</span></div></div>

      <section className="section">
        <div className="eyebrow">Why Provo Tennis?</div>
        <h2 className="section-title">Tennis deserves a place on the local calendar.</h2>
        <p className="lead">There are plenty of races, leagues, and community sporting events around Provo. We think tennis deserves some too.</p>
        <p className="muted">This is the first of what we hope becomes a regular series. We’re starting intentionally small: sixteen players, a high-energy format, and one memorable day on the courts.</p>
      </section>

      <section id="format" className="section dark-section format-section">
        <div className="eyebrow">How it works</div>
        <div className="format-intro">
          <h2 className="section-title">Not normal tennis.<br/>Easy to follow.</h2>
          <p>A match is four short races against the clock. Win three quarters and you win the match.</p>
        </div>

        <div className="match-visual" aria-label="Example match: four six-minute quarters, won three quarters to one">
          <div className="visual-label"><span>01</span> A MATCH, AT A GLANCE</div>
          <div className="quarter-timeline">
            {quarters.map((quarter) => (
              <div className={`quarter-block ${quarter.result}`} key={quarter.label}>
                <span>{quarter.label}</span>
                <b>6:00</b>
                <strong>{quarter.score}</strong>
                <small>{quarter.result === "win" ? "QUARTER WON" : "QUARTER LOST"}</small>
              </div>
            ))}
            <div className="match-result">
              <span>FINAL</span>
              <b>3–1</b>
              <strong>MATCH WON</strong>
            </div>
          </div>
          <p className="visual-caption">Example: this player wins Q1, Q3, and Q4—three quarters—so the match ends 3–1.</p>

          <div className="match-rule-grid">
            {matchRules.map(([stat, rule]) => <div key={rule}><b>{stat}</b><span>{rule}</span></div>)}
          </div>

          <div className="buzzer-rule">
            <span>WHEN THE CLOCK HITS ZERO</span>
            <div><b>Finish the point underway</b><i>→</i><b>Leader wins the quarter</b></div>
            <small>Tied at the buzzer? Play one deciding point.</small>
          </div>

          <div className="sudden-death">
            <span>MATCH TIED 2–2?</span>
            <b>SUDDEN DEATH</b>
            <strong>First to win <em>2 points in a row</em> wins the match.</strong>
          </div>
        </div>

        <div className="draw-visual">
          <div className="visual-label"><span>02</span> YOUR PATH THROUGH THE DRAW</div>
          <div className="draw-flow">
            <div className="draw-stage start"><small>START</small><b>16 PLAYERS</b><span>Opening round</span></div>
            <div className="draw-split" aria-hidden="true"><span>WIN</span><span>LOSS</span></div>
            <div className="draw-stage championship"><small>STAY IN</small><b>CHAMPIONSHIP</b><span>Keep winning toward the main title</span></div>
            <div className="draw-stage consolation"><small>NEW PATH</small><b>CONSOLATION</b><span>First-round loss moves you here</span></div>
            <div className="draw-stage guarantee"><small>THE GUARANTEE</small><b>2 MATCHES MINIMUM</b><span>After your second loss, your tournament is complete</span></div>
          </div>
          <div className="court-plan">
            <b>22</b><span>total matches</span><i>÷</i><b>2</b><span>planned courts</span><i>≈</i><b>1</b><span>full day of tennis</span>
          </div>
          <p className="format-note">Court count, individual start times, and the full order of play will be confirmed with the venue. The format is designed around two courts.</p>
        </div>

        <div className="official-note">
          <b>UTS-inspired, intentionally simplified.</b>
          <span>No bonus cards, coaching rules, or official UTS branding. This independent event is not affiliated with UTS.</span>
        </div>
      </section>

      <TournamentBracket />

      <section className="section">
        <div className="eyebrow">What you get</div>
        <h2 className="section-title">Everything you need for a great day of tennis.</h2>
        <div className="cards">{benefits.map(([Icon, title, copy]) => <div className="card" key={title}><Icon size={30}/><b>{title}</b><span>{copy}</span></div>)}</div>
      </section>

      <section className="split">
        <div className="schedule">
          <div className="eyebrow">{t.schedule_finalized ? "Official schedule" : "Tentative schedule"}</div>
          <h2>Match day</h2>
          <div className="schedule-list">{displayedSchedule.map((s) => <div className="schedule-row" key={s.time}><span>{s.time}</span><span>{s.label}</span></div>)}</div>
          <div className="venue-card">
            <MapPin size={28} aria-hidden="true" />
            <div><small>{t.venue_confirmed ? "Confirmed venue" : "Planned venue · reservation pending"}</small><b>{plannedVenue}</b><span>{plannedAddress}</span></div>
          </div>
        </div>
        <div className="prize"><Trophy size={48}/><h2>Play for Provo.</h2><p className="lead prize-lead">{t.prize_description || "Winner’s prize to be announced"}</p><p>Details will be shared as they’re finalized.</p></div>
      </section>

      <section className="section status-section">
        <div className="eyebrow centered">Registration is open</div>
        <div className="spots">{remaining}<small>of {t.capacity} spots remaining</small></div>
        <p className="muted status-copy">Recreational through competitive adult players are welcome. Tell us your level and we’ll seed the field thoughtfully.</p>
        <Link href="/register" className="button dark">{full ? "Join the waitlist" : "Claim your spot"} →</Link>
      </section>

      <section id="faq" className="section faq-section">
        <div className="eyebrow">Good to know</div>
        <h2 className="section-title">Questions, answered.</h2>
        <div className="faq">{displayedFaq.map((item) => <details key={item.question}><summary>{item.question}</summary><p>{item.answer}</p></details>)}</div>
      </section>
    </main>
  );
}
