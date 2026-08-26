import { RegistrationForm } from "./form";
import { getTournament } from "@/lib/data";
import { ENTRY_FEE } from "@/lib/tournament-details";
export const metadata = {
  title: "Register | Provo Labor Day Tennis Tournament",
};
export const dynamic = "force-dynamic";
type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};
export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;
  const { tournament: t, registered } = await getTournament();
  const remaining = Math.max(t.capacity - registered, 0);
  const full = remaining === 0;
  const entryFee = t.entry_fee ?? ENTRY_FEE;
  return (
    <main className="form-shell">
      {params.payment === "cancelled" && (
        <div className="notice">
          Payment was canceled and your temporary spot was released. Submit the
          form again whenever you’re ready.
        </div>
      )}
      <div className="form-intro">
        <div>
          <div className="eyebrow">{full ? "Waitlist" : "Registration"}</div>
          <h1>{full ? "Get in line." : "Get in the game."}</h1>
        </div>
        <p>
          {full
            ? "The field is full, but plans change. Join the waitlist and we’ll contact you if a spot opens. You will not be charged unless a spot becomes available."
            : `Monday, September 7 · Provo, Utah · $${entryFee} entry · ${remaining} spots currently available. Two matches minimum, barring weather or withdrawals. Complete secure payment to confirm your spot.`}
        </p>
      </div>
      <RegistrationForm waitlist={full} />
    </main>
  );
}
