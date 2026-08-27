export const ENTRY_FEE = 35;

export const EVENT_NAME = "Provo Tennis Tournament";
export const EVENT_DATE_LONG = "Saturday, September 19, 2026";
export const EVENT_DATE_SHORT = "Saturday, September 19";
export const EVENT_DATE_OG = "SEPT 19, 2026";

export const ENTRY_FEE_FAQ = {
  question: "What does the $35 entry fee cover?",
  answer:
    "The $35 fee helps players commit to showing up and covers event costs; it is not intended to make a profit. The tournament is budgeted at roughly $600: about $200 for court rental, plus required event insurance, fresh tennis balls, prizes, and basic supplies. Even a full 16-player field brings in only $560.",
} as const;

export const REFUND_FAQ = {
  question: "Can I get a refund?",
  answer:
    "If the tournament is canceled, entry fees will be refunded. If you need to withdraw, contact the organizer as soon as possible; a refund may depend on whether your spot can be filled from the waitlist.",
} as const;
