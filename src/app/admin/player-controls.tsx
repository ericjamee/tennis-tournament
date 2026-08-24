"use client";

import { deleteRegistration, updateRegistration } from "./actions";

export function PlayerControls({ id, tournamentId, status, seed }: { id: string; tournamentId: string; status: string; seed: number | null }) {
  const hidden = <><input type="hidden" name="id" value={id}/><input type="hidden" name="tournament_id" value={tournamentId}/></>;
  return <div className="player-controls">
    <form action={updateRegistration} className="seed-form">{hidden}<input className="seed-input" aria-label="Seed" name="seed" type="number" min="1" placeholder="—" defaultValue={seed ?? ""}/><button className="text-button" name="intent" value="save_seed">Save seed</button></form>
    <form action={updateRegistration} className="row-actions">{hidden}
      {status === "waitlisted" && <button className="text-button promote" name="intent" value="promote">Promote</button>}
      {status === "registered" && <button className="text-button" name="intent" value="confirm">Confirm</button>}
      {status === "confirmed" && <button className="text-button" name="intent" value="mark_registered">Mark registered</button>}
      {status !== "withdrawn" && <button className="text-button" name="intent" value="withdraw">Withdraw</button>}
      {status === "withdrawn" && <button className="text-button" name="intent" value="restore">Restore</button>}
    </form>
    <form action={deleteRegistration}>{hidden}<button className="text-button danger" onClick={(event) => { if (!window.confirm("Permanently delete this registration? This cannot be undone.")) event.preventDefault(); }}>Delete</button></form>
  </div>;
}
