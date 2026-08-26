"use client";
import { useActionState } from "react";
import { register, type FormState } from "./actions";
const initial: FormState = {};
export function RegistrationForm({ waitlist = false }: { waitlist?: boolean }) {
  const [state, action, pending] = useActionState(register, initial);
  const f = state.fields || {};
  return (
    <form action={action} className="form-card">
      <div aria-live="polite">
        {state.error && <div className="error">{state.error}</div>}
      </div>
      <section className="form-section">
        <h2>01 · Your details</h2>
        <div className="fields">
          <Field name="first_name" label="First name" value={f.first_name} />
          <Field name="last_name" label="Last name" value={f.last_name} />
          <Field name="email" label="Email" type="email" value={f.email} />
          <Field name="phone" label="Phone" type="tel" value={f.phone} />
          <Field name="age" label="Age" type="number" value={f.age} />
          <div className="field">
            <label htmlFor="self_rating">Self-rated level</label>
            <select
              id="self_rating"
              name="self_rating"
              required
              defaultValue={f.self_rating || ""}
            >
              <option value="" disabled>
                Choose your level
              </option>
              {[
                "Beginner",
                "Intermediate",
                "Intermediate/Advanced",
                "Advanced",
              ].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </div>
        </div>
      </section>
      <section className="form-section">
        <h2>02 · Your tennis</h2>
        <div className="fields">
          <div className="field">
            <label htmlFor="ntrp">NTRP (optional)</label>
            <select id="ntrp" name="ntrp" defaultValue={f.ntrp || ""}>
              <option value="">Not sure / none</option>
              {["2.5", "3.0", "3.5", "4.0", "4.5", "5.0+"].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </div>
          <Field name="utr" label="UTR (optional)" value={f.utr} />
          <Field
            name="years_playing"
            label="Years playing (optional)"
            type="number"
            value={f.years_playing}
          />
          <Field
            name="preferred_division"
            label="Preferred division (optional)"
            value={f.preferred_division}
          />
          <Area
            name="experience"
            label="Playing experience (optional)"
            value={f.experience}
          />
          <Area
            name="notes"
            label="Notes for the organizer (optional)"
            value={f.notes}
          />
        </div>
      </section>
      <section className="form-section">
        <h2>03 · Agreements</h2>
        <div className="check">
          <input id="rules" name="rules_accepted" type="checkbox" required />
          <label htmlFor="rules">
            I have read and agree to follow the tournament rules and organizer
            decisions.
          </label>
        </div>
        <div className="check">
          <input id="waiver" name="waiver_accepted" type="checkbox" required />
          <label htmlFor="waiver">
            I understand tennis involves risk and accept the tournament
            liability waiver.
          </label>
        </div>
      </section>
      <div className="submit-row">
        <button className="button dark" disabled={pending}>
          {pending
            ? waitlist
              ? "Joining waitlist…"
              : "Opening secure checkout…"
            : waitlist
              ? "Join the waitlist →"
              : "Register & pay $35 →"}
        </button>
        <span className="form-note">
          {waitlist
            ? "No payment is collected while you are waitlisted."
            : "Secure payment through Stripe. Your spot is confirmed after payment."}
        </span>
      </div>
    </form>
  );
}
function Field({
  name,
  label,
  type = "text",
  value,
}: {
  name: string;
  label: string;
  type?: string;
  value?: string;
}) {
  return (
    <div className="field">
      <label htmlFor={name}>{label}</label>
      <input
        id={name}
        name={name}
        type={type}
        required={!label.includes("optional")}
        defaultValue={value}
      />
    </div>
  );
}
function Area({
  name,
  label,
  value,
}: {
  name: string;
  label: string;
  value?: string;
}) {
  return (
    <div className="field full">
      <label htmlFor={name}>{label}</label>
      <textarea id={name} name={name} defaultValue={value} />
    </div>
  );
}
