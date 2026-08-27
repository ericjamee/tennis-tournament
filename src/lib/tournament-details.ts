export const ENTRY_FEE = 35;

export const EVENT_NAME = "Provo Tennis Tournament";
export const EVENT_DATE_LONG = "Saturday, September 19, 2026";
export const EVENT_DATE_SHORT = "Saturday, September 19";
export const EVENT_DATE_OG = "SEPT 19, 2026";

export const VENUE_NAME = "Riverview Park";
export const VENUE_ADDRESS = "4620 N 300 W, Provo, UT 84604";

export const SUDDEN_DEATH_RULE =
  "If the match is tied at two quarters apiece after four quarters, sudden death begins. The first player to win two consecutive points wins the match.";

export const ENTRY_FEE_FAQ = {
  question: "What does the $35 entry fee cover?",
  answer:
    "The $35 fee helps players commit to showing up and supports the tournament’s overall budget of approximately $600.",
} as const;

export const REFUND_FAQ = {
  question: "Can I get a refund?",
  answer:
    "If the tournament is canceled, entry fees will be refunded. If you need to withdraw, contact the organizer as soon as possible; a refund may depend on whether your spot can be filled from the waitlist.",
} as const;
