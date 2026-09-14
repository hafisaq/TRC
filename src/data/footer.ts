export type ContactType = "phone" | "whatsapp" | "email";
export type SocialNetwork = "instagram" | "facebook" | "x" | "linkedin" | "youtube" | "tiktok" | "pinterest";

export type FooterContact = { id: string; type: ContactType; value: string; href: string | null };
export type FooterSocial = { id: string; network: SocialNetwork; href: string | null };
export type FooterSignature = { show: boolean; name: string; href: string };

export type FooterContent = {
  eyebrow: string;
  headline: [string, string];
  line: string;
  stamp: string;
  contacts: FooterContact[];
  socials: FooterSocial[];
  signature: FooterSignature;
};

export const SOCIAL_LABELS: Record<SocialNetwork, string> = {
  instagram: "Instagram", facebook: "Facebook", x: "X", linkedin: "LinkedIn", youtube: "YouTube", tiktok: "TikTok", pinterest: "Pinterest"
};

// Hydrated in place from Sanity's Site settings (lib/cms.ts). The words
// below are only the offline fallback; contact details are never guessed
// — with nothing published the contact block simply has nothing to show.
export const FOOTER: FooterContent = {
  eyebrow: "The arrival lounge",
  headline: ["Until the", "next departure."],
  line: "A world of possibilities. One conversation away.",
  stamp: "Your next chapter awaits",
  contacts: [],
  socials: [],
  signature: { show: false, name: "", href: "" }
};

// tel: keeps a leading +, WhatsApp wants bare international digits.
export function contactHref(type: ContactType, value: string): string | null {
  const v = value.trim();
  if (!v) return null;
  if (type === "email") return `mailto:${v}`;
  const digits = v.replace(/\D/g, "");
  if (!digits) return null;
  return type === "phone" ? `tel:${v.startsWith("+") ? "+" : ""}${digits}` : `https://wa.me/${digits}`;
}
