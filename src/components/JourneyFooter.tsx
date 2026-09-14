import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";
import { ArrowUp, ArrowUpRight, Mail, MessageCircle, Phone } from "lucide-react";
import { siFacebook, siInstagram, siPinterest, siTiktok, siX, siYoutube } from "simple-icons";
import { FOOTER, SOCIAL_LABELS, type SocialNetwork } from "../data/footer";
import { t } from "../lib/i18n";
import { scrollToHash } from "../lib/scroll";
import "./journey-footer.css";

// LinkedIn's mark is no longer distributed by the icon set (trademark), so
// it is drawn as its own plain "in" lock-up.
const SOCIAL_ICONS: Partial<Record<SocialNetwork, { path: string }>> = {
  instagram: siInstagram, facebook: siFacebook, x: siX, youtube: siYoutube, tiktok: siTiktok, pinterest: siPinterest
};

function SocialIcon({ network }: { network: SocialNetwork }) {
  const icon = SOCIAL_ICONS[network];
  if (!icon) {
    return <svg viewBox="0 0 24 24" width={15} height={15} aria-hidden="true">
      <rect x="1.5" y="1.5" width="21" height="21" rx="4" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <text x="12" y="17" textAnchor="middle" fontSize="12.5" fontWeight="700" fontFamily="Arial, Helvetica, sans-serif" fill="currentColor">in</text>
    </svg>;
  }
  return <svg viewBox="0 0 24 24" width={15} height={15} aria-hidden="true" fill="currentColor"><path d={icon.path} /></svg>;
}

// The maker's mark: a script signature that draws itself on when the
// footer arrives — stroke first, then the ink fills in.
function Signature({ name, href }: { name: string; href: string }) {
  useEffect(() => {
    if (document.getElementById("trc-signature-font")) return;
    const link = document.createElement("link");
    link.id = "trc-signature-font";
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Great+Vibes&display=swap";
    document.head.appendChild(link);
  }, []);
  const inner = (
    <svg className="footer-signature-mark" viewBox="0 0 320 90" aria-hidden="true">
      <text x="8" y="62" fontSize="52" fontFamily="'Great Vibes', 'Snell Roundhand', cursive">{name}</text>
    </svg>
  );
  return href
    ? <a className="footer-signature" href={href} target="_blank" rel="noopener noreferrer" aria-label={name}>{inner}</a>
    : <span className="footer-signature" aria-label={name}>{inner}</span>;
}

function ContactLink({ href, className, label, hint, onPlaceholder, children }: {
  href: string | null;
  className: string;
  label: string;
  hint: string;
  onPlaceholder: () => void;
  children: ReactNode;
}) {
  if (href) {
    const external = /^https?:\/\//i.test(href);
    return <a href={href} className={className} aria-label={label} target={external ? "_blank" : undefined} rel={external ? "noopener noreferrer" : undefined}>{children}</a>;
  }
  return <button type="button" className={className} aria-label={`${label}. ${hint}`} title={hint} onClick={onPlaceholder}>{children}</button>;
}

export default function JourneyFooter({ departureHref = "#tier2-hero" }: { departureHref?: string }) {
  const footer = useRef<HTMLElement>(null);
  const [arrived, setArrived] = useState(false);
  const [notice, setNotice] = useState<{ message: string } | null>(null);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 4500);
    return () => window.clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    if (!("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) {
        setArrived(true);
        observer.disconnect();
      }
    }, { threshold: 0.15 });
    if (footer.current) observer.observe(footer.current);
    return () => observer.disconnect();
  }, []);

  const returnToDeparture = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault();
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) window.scrollTo({ top: 0, behavior: "instant" });
    else scrollToHash(departureHref);
    history.replaceState(null, "", departureHref);
    document.querySelector<HTMLAnchorElement>("#tier2-nav a")?.focus({ preventScroll: true });
  };

  const icons = { phone: Phone, whatsapp: MessageCircle, email: Mail };

  return (
    <footer ref={footer} id="journey-footer" className={`journey-footer${arrived ? " has-arrived" : ""}`} aria-label={t("footer.contact")}>
      <div className="journey-footer-inner">
        <div className="footer-arrival-line" aria-hidden="true"><span /><i /><span /></div>
        <div className="footer-manifest">
          <span>{FOOTER.eyebrow}</span>
          <span className="footer-manifest-status"><span className="footer-mobile-arrival">{t("footer.arrived")}</span></span>
        </div>

        <div className="footer-welcome">
          <div>
            <h2>{FOOTER.headline[0]} <em>{FOOTER.headline[1]}</em></h2>
            <p>{FOOTER.line}</p>
          </div>
          <div className="footer-arrival-stamp" aria-hidden="true">
            <strong>{t("footer.arrived")}</strong>
            <span>{FOOTER.stamp}</span>
          </div>
        </div>

        <div className="footer-contacts">
          {FOOTER.contacts.map((contact, index) => {
            const Icon = icons[contact.type];
            const label = t(`footer.${contact.type}`);
            return (
              <ContactLink key={contact.id} href={contact.href} className="footer-contact" label={contact.value ? `${label}: ${contact.value}` : label} hint={t("footer.placeholder")} onPlaceholder={() => setNotice({ message: t("footer.placeholder") })}>
                <span className="footer-contact-top"><span className="footer-contact-number" dir="ltr">0{index + 1}</span><Icon size={20} strokeWidth={1.3} aria-hidden="true" /><span>{label}</span><ArrowUpRight className="footer-contact-arrow" size={19} strokeWidth={1.4} aria-hidden="true" /></span>
                {contact.value
                  ? <span className="footer-contact-value" dir="ltr">{contact.value}</span>
                  : <span className="footer-contact-value footer-contact-value--pending">{t("footer.placeholder")}</span>}
              </ContactLink>
            );
          })}
        </div>

        <div className="footer-connections">
          <a className="footer-brand" href="/" aria-label={t("footer.home")}>
            <img src="/media/brand/GOLD.png" alt={t("footer.collection")} width={697} height={226} loading="lazy" decoding="async" />
          </a>
          {FOOTER.socials.length > 0 && <nav className="footer-socials" aria-label={t("footer.social")}>
            <span>{t("footer.social")}</span>
            <div>
              {FOOTER.socials.map(social => (
                <ContactLink key={social.id} href={social.href} className="footer-social" label={SOCIAL_LABELS[social.network]} hint={t("footer.socialPlaceholder")} onPlaceholder={() => setNotice({ message: `${SOCIAL_LABELS[social.network]}: ${t("footer.socialPlaceholder")}` })}>
                  <SocialIcon network={social.network} /><span>{SOCIAL_LABELS[social.network]}</span><ArrowUpRight size={14} aria-hidden="true" />
                </ContactLink>
              ))}
            </div>
          </nav>}
        </div>

        <div className="footer-colophon">
          <p><span dir="ltr">© {new Date().getFullYear()}</span> {t("footer.collection")}. <span>{t("footer.rights")}</span></p>
          <a className="footer-return" href={departureHref} onClick={returnToDeparture}>
            <span>{t("footer.back")}</span><ArrowUp size={18} strokeWidth={1.5} aria-hidden="true" />
          </a>
        </div>
        {FOOTER.signature.show && <div className="footer-signature-row"><span className="footer-made-by">{t("footer.madeBy")}</span><Signature name={FOOTER.signature.name} href={FOOTER.signature.href} /></div>}
      </div>
      <p className="footer-notice" role="status" aria-live="polite">{notice?.message}</p>
    </footer>
  );
}
