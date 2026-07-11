interface TemplateContext {
  firstName: string;
  remaining?: number;
}

export const WHATSAPP_TEMPLATES: { label: string; build: (ctx: TemplateContext) => string }[] = [
  {
    label: "Low sessions",
    build: ({ firstName, remaining }) =>
      `Hi ${firstName}, just a friendly note from Yogapratishthan — you have ${remaining ?? "a few"} session${remaining === 1 ? "" : "s"} left. Let us know if you'd like to renew so you don't miss your next class!`,
  },
  {
    label: "Membership expired",
    build: ({ firstName }) =>
      `Hi ${firstName}, your session package at Yogapratishthan has been fully used. We'd love to have you continue your practice — reply here or visit us to renew.`,
  },
  {
    label: "Attendance reminder",
    build: ({ firstName }) =>
      `Hi ${firstName}, we missed you in class! Hope everything is okay. Let us know if you'd like to schedule a make-up session.`,
  },
  {
    label: "General",
    build: ({ firstName }) => `Hi ${firstName}, this is Yogapratishthan — Iyengar Yoga Center.`,
  },
];

/** wa.me needs digits only, with country code. Assumes Indian numbers. */
export function toWhatsAppLink(phone: string, message: string): string {
  const digits = phone.replace(/\D/g, "");
  const withCountryCode = digits.length === 10 ? `91${digits}` : digits;
  return `https://wa.me/${withCountryCode}?text=${encodeURIComponent(message)}`;
}
