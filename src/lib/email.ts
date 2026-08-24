import { Resend } from "resend";

type RegistrationEmail = {
  to: string;
  name: string;
  status: "registered" | "waitlisted";
  waitlistPosition?: number | null;
  registrationId: string;
  tournamentName: string;
  date: string;
  venue: string;
};

const escapeHtml = (value: string) => value.replace(/[&<>'"]/g, (character) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;",
}[character] ?? character));

export async function sendRegistrationEmail(details: RegistrationEmail) {
  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) return { skipped: true };

  const resend = new Resend(process.env.RESEND_API_KEY);
  const waitlisted = details.status === "waitlisted";
  const subject = waitlisted
    ? `You’re on the ${details.tournamentName} waitlist`
    : `You’re registered for ${details.tournamentName}`;
  const position = waitlisted && details.waitlistPosition
    ? `<p style="font-size:18px"><strong>Waitlist position:</strong> ${details.waitlistPosition}</p>`
    : "";

  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL,
    to: details.to,
    subject,
    html: `<div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;color:#102218">
      <p style="font-weight:700;color:#174d35">PROVO TENNIS</p>
      <h1>${waitlisted ? "You’re on the waitlist." : "You’re in!"}</h1>
      <p>Hi ${escapeHtml(details.name)},</p>
      <p>${waitlisted ? "The player field is currently full, but your place in line is saved. We’ll email you if a spot opens." : "Your tournament registration is saved. We’ll send your match time, final court location, and payment details when they’re ready."}</p>
      ${position}
      <p><strong>Date:</strong> ${escapeHtml(details.date)}<br><strong>Venue:</strong> ${escapeHtml(details.venue)}<br><strong>Registration:</strong> ${escapeHtml(details.registrationId)}</p>
      <p>See you on the courts,<br>Provo Tennis</p>
    </div>`,
  });
  return { skipped: false };
}
