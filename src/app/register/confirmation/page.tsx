import Link from "next/link";
import { fulfillCheckoutSession } from "@/lib/payment-fulfillment";
import { ENTRY_FEE } from "@/lib/tournament-details";

type PageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> };
export const metadata = { title: "You’re in! | Provo Tennis" };
export const dynamic = "force-dynamic";

const single = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value;

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;
  const sessionId = single(params.session_id);

  if (sessionId) {
    let paidRegistration: Awaited<ReturnType<typeof fulfillCheckoutSession>>["registration"] | null = null;
    try {
      const { registration } = await fulfillCheckoutSession(sessionId);
      paidRegistration = registration;
    } catch (error) {
      console.error("Checkout confirmation failed", error);
    }
    if (paidRegistration) {
      return <Confirmation
        name={`${paidRegistration.first_name} ${paidRegistration.last_name}`}
        registrationId={paidRegistration.id}
        paid
      />;
    }
    return <main className="confirmation">
      <div className="eyebrow centered">Payment verification</div>
      <h1>We’re checking it.</h1>
      <p className="lead">We couldn’t verify the payment yet. Your card will never be charged twice. Please refresh this page in a moment, or contact the organizer if this message remains.</p>
      <Link className="button" href="/">Back home</Link>
    </main>;
  }

  const waitlisted = single(params.status) === "waitlisted";
  return <Confirmation
    name={single(params.name) || "Player"}
    registrationId={single(params.id) || "Pending"}
    waitlisted={waitlisted}
    waitlistPosition={single(params.position)}
  />;
}

function Confirmation({
  name,
  registrationId,
  paid = false,
  waitlisted = false,
  waitlistPosition,
}: {
  name: string;
  registrationId: string;
  paid?: boolean;
  waitlisted?: boolean;
  waitlistPosition?: string;
}) {
  return <main className="confirmation">
    <div className="eyebrow centered">{paid ? "Payment received" : "Registration received"}</div>
    <h1>{waitlisted ? "You’re on the list!" : "You’re in! 🎾"}</h1>
    <p className="lead">{waitlisted ? "We’ll contact you as soon as a spot opens. You have not been charged." : "Your spot in the Provo Labor Day Tennis Tournament is confirmed."}</p>
    <div className="confirmation-box">
      <div className="confirmation-row"><b>Name</b><span>{name}</span></div>
      <div className="confirmation-row"><b>Date</b><span>Monday, September 7, 2026</span></div>
      <div className="confirmation-row"><b>Venue</b><span>Riverview Park · reservation pending</span></div>
      <div className="confirmation-row"><b>Status</b><span>{waitlisted ? "Waitlisted" : "Registered"}</span></div>
      {waitlisted && waitlistPosition && <div className="confirmation-row"><b>Waitlist position</b><span>#{waitlistPosition}</span></div>}
      <div className="confirmation-row"><b>Registration #</b><span>{registrationId}</span></div>
      <div className="confirmation-row"><b>Entry fee</b><span>{waitlisted ? "Not charged" : `$${ENTRY_FEE} · paid`}</span></div>
    </div>
    <p>{waitlisted ? "We’ll email you if a spot becomes available." : "We’ll email your match time and final event details once they’re ready."}</p>
    <div className="submit-row centered"><a className="button dark" href="/api/calendar">Add to calendar</a><Link className="button" href="/">Back home</Link></div>
  </main>;
}
