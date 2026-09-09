export type FooterContact = {
  id: "phone" | "whatsapp" | "email";
  value: string;
  href: string | null;
};

export type FooterSocial = {
  name: string;
  href: string | null;
};

export type FooterContent = {
  eyebrow: string;
  headline: [string, string];
  line: string;
  stamp: string;
  contacts: FooterContact[];
  socials: FooterSocial[];
};

// Hydrated in place from Sanity's Site settings (lib/cms.ts), like every
// other content store. The words below are only the offline fallback; the
// contact details are never guessed — an empty value renders as "coming
// soon" until the client types their own number into the Studio.
export const FOOTER: FooterContent = {
  eyebrow: "The arrival lounge",
  headline: ["Until the", "next departure."],
  line: "A world of possibilities. One conversation away.",
  stamp: "Your next chapter awaits",
  contacts: [
    { id: "phone", value: "", href: null },
    { id: "whatsapp", value: "", href: null },
    { id: "email", value: "", href: null }
  ],
  socials: []
};

// tel: keeps a leading +, WhatsApp wants bare international digits.
export function contactHref(id: FooterContact["id"], value: string): string | null {
  const v = value.trim();
  if (!v) return null;
  if (id === "email") return `mailto:${v}`;
  const digits = v.replace(/\D/g, "");
  if (!digits) return null;
  return id === "phone" ? `tel:${v.startsWith("+") ? "+" : ""}${digits}` : `https://wa.me/${digits}`;
}
