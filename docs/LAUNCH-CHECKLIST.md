# The Retreat Collection — Launch Checklist

Moving from the replica (`khaki-deer-133961.hostingersite.com`) to the real domain (`theretreatcollection.travel`).

Most of this is settings, not code. Owner is marked on each step.

**The order that matters:** step 2 before anyone visits the live site, step 4 before the site is announced. Everything else can follow within the first day.

---

## 1. Tell the site its new address — *developer, one line*

The public URL lives in exactly one file: `scripts/site.config.mjs`.

```js
export const SITE_URL = "https://www.theretreatcollection.travel";
```

On the next build this updates the canonical links, `sitemap.xml`, and `robots.txt`.
The production build (`npm run build`) also drops the "hide from Google" guard that the replica build (`npm run build:replica`) adds on purpose.

- [x] Decided: without `www` (the old site already sent `www` to the bare domain)
- [x] `SITE_URL` set to `https://theretreatcollection.travel`

## 2. Allow the new domain in Sanity — *developer, one command*

Sanity only answers browsers from approved addresses. Today the list is `localhost:3333`, `localhost:5173`, and the replica. **Until the real domain is added, the live site loads fallback content and no films.**

```bash
cd studio-trc
npx sanity cors add https://theretreatcollection.travel --no-credentials
npx sanity cors add https://www.theretreatcollection.travel --no-credentials
```

- [x] Both origins added (27 Sep 2026)

## 3. Hosting and deploy — *owner, in Hostinger, GoDaddy and GitHub*

**What the domain looks like today (checked 27 Sep 2026):** registered at GoDaddy, DNS at GoDaddy, an old GoDaddy Website Builder page on it, and **the client's email runs on Microsoft 365** (`Hello@theretreatcollection.travel`).

So: do **not** move the nameservers to Hostinger — that would break the email. Keep DNS at GoDaddy and point only the website:

- [x] Hostinger: separate website `theretreatcollection.travel` (the replica stays its own site). Server IP `82.25.120.108`
- [x] GoDaddy DNS: `A @ → 82.25.120.108`, `CNAME www → theretreatcollection.travel`; old Website Builder A record removed; mail records untouched (27 Sep 2026)
- [x] SSL: Let's Encrypt issued by Hostinger, auto-renews
- [ ] Turn on SSL in hPanel
- [ ] Add GitHub repo secrets: `PROD_FTP_HOST`, `PROD_FTP_USER`, `PROD_FTP_PASS`
  - Use the **site-scoped** FTP account (hPanel → the website → Files → FTP Accounts), not the account-level one
  - Secrets go straight into GitHub, never through chat
- [x] Repo variable `PROD_SERVER_DIR = ./` — the site-scoped FTP account already lands in `public_html`
- [x] First production deploy: 27 Sep 2026. **Site live.**

Every later production release is the same button: Actions → Deploy → Run workflow → branch `replica`.

Production never deploys by itself. Only a push to `replica` auto-deploys, and only to the replica.

## 4. Email — *owner + client, about ten minutes*

The domain's mail is on Microsoft 365, so the site sends through the client's own mailbox — no Hostinger mailbox needed. The mailer supports Microsoft's port 587.

- [ ] Client: in the Microsoft 365 admin centre, open the mailbox the site will send from (e.g. `Hello@`), and under **Mail → Email apps** turn on **Authenticated SMTP**
- [ ] Client: give you that mailbox's password *directly*, not through this chat
- [ ] Upload `config.php` into the production site's `public_html/api/` folder:

```php
<?php
return [
  'to_email'   => 'Hello@theretreatcollection.travel',
  'from_email' => 'Hello@theretreatcollection.travel',
  'from_name'  => 'The Retreat Collection',
  'reply_to'   => 'Hello@theretreatcollection.travel',
  'site_url'   => 'https://theretreatcollection.travel',

  'smtp_host'  => 'smtp.office365.com',
  'smtp_port'  => 587,
  'smtp_user'  => 'Hello@theretreatcollection.travel',
  'smtp_pass'  => 'THE-MAILBOX-PASSWORD',

  'salt'       => 'choose-any-random-text',
];
```

- [ ] SPF and DKIM already exist for Microsoft 365 at GoDaddy — nothing to add
- [ ] Send a test enquiry from the live site; check both emails arrive in the inbox, not Spam
- [ ] Delete the "TRC website" app password in the `trc.hafis@gmail.com` Google account

Notes:
- `config.php` is never in the repository and the deploy never touches it.
- The first line of the file must be `<?php` with nothing before it.
- Hostinger's basic `mail()` reports success but silently drops mail when the From address is not a real mailbox. Always use SMTP.
- Bot protection allows five enquiries per hour per visitor.

## 5. Analytics — *owner, about five minutes*

- [ ] Create a fresh **GA4 property** for the real domain → copy the Measurement ID (`G-XXXXXXXXXX`)
- [ ] Create a fresh **Microsoft Clarity project** → copy the Project ID
- [ ] In the Studio: **Site settings → Analytics** → paste both, tick **Analytics on**
- [ ] Fill in "only measure on this domain" so the replica goes quiet
- [ ] Add the site to **Google Search Console** and submit `/sitemap.xml`

Starting with fresh IDs keeps test traffic from the replica out of the launch numbers.

## 6. Content checks in the Studio — *client*

Studio: https://trc-retreat.sanity.studio

- [ ] **Site settings**: real phone, WhatsApp, email, and social profile links
- [ ] **Site settings**: language switch on or off
- [ ] **Site settings**: maker's signature on or off
- [ ] **About page**: final wording
- [ ] **English labels**: any interface wording changes
- [ ] **Arabic translations**: approved by the copywriter, using the translation sheet (`python3 scripts/i18n/extract.py` regenerates it)

## 7. Final pass on the live domain — *developer*

- [ ] Boarding pass sends both emails (company notice + traveller confirmation)
- [ ] Films play on the home stops, region selectors, and country pages
- [ ] Arabic side renders right-to-left with no overflow
- [ ] "Install app" prompt works on Android; "Add to Home Screen" steps on iPhone
- [ ] `/about` and every country route load on a direct visit and on refresh
- [ ] Page speed test on the real address, desktop and mobile
- [ ] `robots.txt` no longer blocks indexing; `sitemap.xml` lists the real domain

---

## Reference

| Thing | Where |
|---|---|
| Repository | `/Users/aqhafis/Desktop/trc-claude` (branch `task/sanity-setup`; `replica` auto-deploys) |
| Sanity project | `nvmppjc2`, dataset `production` |
| Studio | https://trc-retreat.sanity.studio |
| Replica | https://khaki-deer-133961.hostingersite.com |
| Site URL setting | `scripts/site.config.mjs` |
| Deploy workflow | `.github/workflows/deploy.yml` |
| Email endpoint | `public/api/enquiry.php`, templates in `public/api/email/` |
| Email settings sample | `public/api/config.sample.php` |
| Analytics code | `src/lib/analytics.ts` |
