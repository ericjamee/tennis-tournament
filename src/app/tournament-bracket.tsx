import styles from "./tournament-bracket.module.css";

type Match = {
  id: string;
  time: string;
  court: "Court 1" | "Court 2";
  sources: [string, string];
};

type Round = {
  title: string;
  subtitle: string;
  matches: Match[];
};

const championshipRounds: Round[] = [
  {
    title: "Round of 16",
    subtitle: "Everybody starts here",
    matches: [
      ["M1", "8:30 AM", "Court 1"],
      ["M2", "8:30 AM", "Court 2"],
      ["M3", "9:05 AM", "Court 1"],
      ["M4", "9:05 AM", "Court 2"],
      ["M5", "9:40 AM", "Court 1"],
      ["M6", "9:40 AM", "Court 2"],
      ["M7", "10:15 AM", "Court 1"],
      ["M8", "10:15 AM", "Court 2"],
    ].map(([id, time, court]) => ({ id, time, court: court as Match["court"], sources: ["Player", "Player"] })),
  },
  {
    title: "Quarterfinals",
    subtitle: "Eight remain",
    matches: [
      { id: "M9", time: "10:50 AM", court: "Court 1", sources: ["Winner M1", "Winner M2"] },
      { id: "M10", time: "11:25 AM", court: "Court 1", sources: ["Winner M3", "Winner M4"] },
      { id: "M11", time: "12:00 PM", court: "Court 1", sources: ["Winner M5", "Winner M6"] },
      { id: "M12", time: "12:35 PM", court: "Court 1", sources: ["Winner M7", "Winner M8"] },
    ],
  },
  {
    title: "Semifinals",
    subtitle: "Final four",
    matches: [
      { id: "M13", time: "1:10 PM", court: "Court 1", sources: ["Winner M9", "Winner M10"] },
      { id: "M14", time: "1:45 PM", court: "Court 1", sources: ["Winner M11", "Winner M12"] },
    ],
  },
  {
    title: "Championship",
    subtitle: "For the title",
    matches: [
      { id: "M15", time: "3:00 PM", court: "Court 1", sources: ["Winner M13", "Winner M14"] },
    ],
  },
];

const consolationRounds: Round[] = [
  {
    title: "Consolation quarters",
    subtitle: "A new path after round one",
    matches: [
      { id: "C1", time: "10:50 AM", court: "Court 2", sources: ["Loser M1", "Loser M2"] },
      { id: "C2", time: "11:25 AM", court: "Court 2", sources: ["Loser M3", "Loser M4"] },
      { id: "C3", time: "12:00 PM", court: "Court 2", sources: ["Loser M5", "Loser M6"] },
      { id: "C4", time: "12:35 PM", court: "Court 2", sources: ["Loser M7", "Loser M8"] },
    ],
  },
  {
    title: "Consolation semis",
    subtitle: "Four remain",
    matches: [
      { id: "C5", time: "1:10 PM", court: "Court 2", sources: ["Winner C1", "Winner C2"] },
      { id: "C6", time: "1:45 PM", court: "Court 2", sources: ["Winner C3", "Winner C4"] },
    ],
  },
  {
    title: "Consolation final",
    subtitle: "Second title of the day",
    matches: [
      { id: "C7", time: "3:00 PM", court: "Court 2", sources: ["Winner C5", "Winner C6"] },
    ],
  },
];

function MatchCard({ match }: { match: Match }) {
  return (
    <article className={styles.match} aria-label={`${match.id}, estimated ${match.time} on ${match.court}`}>
      <div className={styles.matchMeta}>
        <time>{match.time}</time>
        <span>{match.court}</span>
      </div>
      <div className={styles.player}><span>{match.sources[0]}</span><i aria-hidden="true" /></div>
      <div className={styles.player}><span>{match.sources[1]}</span><i aria-hidden="true" /></div>
      <small>{match.id}</small>
    </article>
  );
}

function Bracket({ rounds, consolation = false }: { rounds: Round[]; consolation?: boolean }) {
  return (
    <div className={`${styles.bracket} ${consolation ? styles.consolation : ""}`}>
      {rounds.map((round) => (
        <section className={styles.round} key={round.title}>
          <header>
            <b>{round.title}</b>
            <span>{round.subtitle}</span>
          </header>
          <div className={styles.matches} style={{ "--match-count": round.matches.length } as React.CSSProperties}>
            {round.matches.map((match) => <MatchCard match={match} key={match.id} />)}
          </div>
        </section>
      ))}
      <div className={styles.winner}>
        <span>{consolation ? "Consolation" : "2026"}</span>
        <b>Champion</b>
        <i aria-hidden="true" />
      </div>
    </div>
  );
}

export default function TournamentBracket() {
  return (
    <section className={styles.section} id="bracket">
      <div className={styles.intro}>
        <div>
          <div className="eyebrow">The tournament draw</div>
          <h2 className="section-title">Sixteen enter.<br />Two paths forward.</h2>
        </div>
        <div className={styles.legend}>
          <span><i className={styles.mainDot} /> Championship draw</span>
          <span><i className={styles.consolationDot} /> Consolation draw</span>
          <p>Names will be added after registration closes and the field is seeded.</p>
        </div>
      </div>

      <div className={styles.notice}>
        <b>Preliminary two-court order of play</b>
        <span>Times are estimates, not assigned player start times. The final draw and schedule will be emailed after registration closes and the field is seeded.</span>
      </div>

      <div className={styles.scroller} tabIndex={0} aria-label="Horizontal championship tournament bracket">
        <div className={styles.canvas}>
          <div className={styles.drawLabel}><span>01</span><b>Championship draw</b><small>Win and advance toward the main title</small></div>
          <Bracket rounds={championshipRounds} />
          <div className={`${styles.drawLabel} ${styles.consolationLabel}`}><span>02</span><b>Consolation draw</b><small>First-round losses feed into a fresh eight-player bracket</small></div>
          <Bracket rounds={consolationRounds} consolation />
        </div>
      </div>
      <p className={styles.scrollHint}>On a phone, swipe sideways to follow each path →</p>
    </section>
  );
}
