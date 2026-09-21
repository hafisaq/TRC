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

- [ ] Decide: with or without `www`
- [ ] Update `SITE_URL`

## 2. Allow the new domain in Sanity — *developer, one command*

Sanity only answers browsers from approved addresses. Today the list is `localhost:3333`, `localhost:5173`, and the replica. **Until the real domain is added, the live site loads fallback content and no films.**

```bash
cd studio-trc
npx sanity cors add https://theretreatcollection.travel --no-credentials
npx sanity cors add https://www.theretreatcollection.travel --no-credentials
```

- [ ] Both origins added
- [ ] Confirm with `npx sanity cors list`

## 3. Hosting and deploy — *owner, in Hostinger and GitHub*

- [ ] Point the domain at the Hostinger site
- [ ] Turn on SSL in hPanel
- [ ] Add GitHub repo secrets: `PROD_FTP_HOST`, `PROD_FTP_USER`, `PROD_FTP_PASS`
  - Use the **site-scoped** FTP account (hPanel → the website → Files → FTP Accounts), not the account-level one
  - Secrets go straight into GitHub, never through chat
- [ ] Optional: set the repo variable `PROD_SERVER_DIR` if the web root is not `public_html/`
- [ ] Deploy with the manual **Run workflow** button on the Deploy action

Production never deploys by itself. Only a push to `replica` auto-deploys, and only to the replica.

## 4. Email — *owner, about ten minutes*

- [ ] Create a real mailbox in hPanel, e.g. `enquiries@theretreatcollection.travel`
- [ ] Upload `config.php` into the production site's `public_html/api/` folder:

```php
<?php
return [
  'to_email'   => 'Hello@theretreatcollection.travel',
  'from_email' => 'enquiries@theretreatcollection.travel',
  'from_name'  => 'The Retreat Collection',
  'reply_to'   => 'Hello@theretreatcollection.travel',
  'site_url'   => 'https://www.theretreatcollection.travel',

  'smtp_host'  => 'smtp.hostinger.com',
  'smtp_port'  => 465,
  'smtp_user'  => 'enquiries@theretreatcollection.travel',
  'smtp_pass'  => 'THE-MAILBOX-PASSWORD',

  'salt'       => 'choose-any-random-text',
];
```

- [ ] Turn on **SPF** and **DKIM** for the domain (hPanel → Emails), so confirmations reach inboxes
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
