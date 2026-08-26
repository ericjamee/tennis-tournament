import { RegistrationForm } from "./form";
import { getTournament } from "@/lib/data";
import { ENTRY_FEE } from "@/lib/tournament-details";
export const metadata={title:"Register | Provo Labor Day Tennis Tournament"};
export const dynamic="force-dynamic";
export default async function Page(){const{tournament:t,registered}=await getTournament();const remaining=Math.max(t.capacity-registered,0);const full=remaining===0;const entryFee=t.entry_fee??ENTRY_FEE;return <main className="form-shell"><div className="form-intro"><div><div className="eyebrow">{full?"Waitlist":"Registration"}</div><h1>{full?"Get in line.":"Get in the game."}</h1></div><p>{full?"The field is full, but plans change. Join the waitlist and we’ll contact you if a spot opens.":`Monday, September 7 · Provo, Utah · $${entryFee} entry · ${remaining} spots currently available. Two matches minimum, barring weather or withdrawals. Register now to reserve your spot; payment instructions will follow.`}</p></div><RegistrationForm/></main>}
