"use server";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { z } from "zod";
import { fallbackTournament } from "@/lib/data";
import { sendRegistrationEmail } from "@/lib/email";
const schema=z.object({first_name:z.string().trim().min(1,"First name is required").max(80),last_name:z.string().trim().min(1,"Last name is required").max(80),email:z.email("Enter a valid email").transform(v=>v.toLowerCase()),phone:z.string().trim().min(7,"Enter a valid phone number").max(30),age:z.coerce.number().int().min(18,"Players must be 18 or older").max(100),self_rating:z.enum(["Beginner","Intermediate","Intermediate/Advanced","Advanced"]),ntrp:z.string().max(10).optional(),utr:z.string().max(10).optional(),years_playing:z.coerce.number().int().min(0).max(80).optional(),experience:z.string().max(1000).optional(),preferred_division:z.string().max(100).optional(),notes:z.string().max(1000).optional(),rules_accepted:z.literal("on",{error:"Accept the tournament rules"}),waiver_accepted:z.literal("on",{error:"Accept the liability waiver"})});
export type FormState={error?:string;fields?:Record<string,string>};
export async function register(_:FormState,formData:FormData):Promise<FormState>{
  const raw=Object.fromEntries(formData.entries()); const parsed=schema.safeParse(raw);
  if(!parsed.success)return{error:parsed.error.issues[0]?.message||"Check the form and try again",fields:Object.fromEntries(Object.entries(raw).map(([k,v])=>[k,String(v)]))};
  if(!process.env.NEXT_PUBLIC_SUPABASE_URL||!process.env.SUPABASE_SERVICE_ROLE_KEY)redirect(`/register/confirmation?id=DEMO-${Date.now().toString().slice(-6)}&name=${encodeURIComponent(`${parsed.data.first_name} ${parsed.data.last_name}`)}&status=registered`);
  const {createClient}=await import("@supabase/supabase-js"); const db=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const {data:tournament,error:tournamentError}=await db.from("tournaments").select("id,name,date,venue_name,venue_address").eq("slug",fallbackTournament.slug).single();
  if(tournamentError||!tournament)return{error:"Registration is temporarily unavailable. Please try again soon."};
  const {data,error}=await db.rpc("register_for_tournament",{p_tournament_id:tournament.id,p_registration:{...parsed.data,rules_accepted:true,waiver_accepted:true}});
  if(error){if(error.message.includes("duplicate"))return{error:"You’re already registered for this tournament with that email."};return{error:"We couldn’t save your registration. Please try again."};}
  const result=(Array.isArray(data)?data[0]:data) as {id:string;status:"registered"|"waitlisted";waitlist_position?:number|null};
  after(async () => {
    try { await sendRegistrationEmail({
      to:parsed.data.email,
      name:`${parsed.data.first_name} ${parsed.data.last_name}`,
      status:result.status,
      waitlistPosition:result.waitlist_position,
      registrationId:result.id,
      tournamentName:tournament.name,
      date:new Intl.DateTimeFormat("en-US",{dateStyle:"full",timeZone:"UTC"}).format(new Date(`${tournament.date}T12:00:00Z`)),
      venue:tournament.venue_name||tournament.venue_address||"Provo, Utah",
    }); } catch (emailError) { console.error("Registration email failed",emailError); }
  });
  const position=result.waitlist_position?`&position=${result.waitlist_position}`:"";
  redirect(`/register/confirmation?id=${result.id}&name=${encodeURIComponent(`${parsed.data.first_name} ${parsed.data.last_name}`)}&status=${result.status}${position}`);
}
