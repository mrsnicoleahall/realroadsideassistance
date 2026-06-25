# Real Roadside Assistance

Booking site for **Real Roadside Assistance** — mobile auto detailing & roadside help serving **Detroit & the surrounding suburbs**. Owner: **Day**.

Customers pick a service, choose **ASAP** or a **3‑hour window** in the next two weeks, leave their contact info, and send a **$40 deposit** to lock the slot. No backend, no calendar integrations — just a fast static site.

---

## How it works

1. **Pick a service** — Roadside (jumpstart, tire, lockout, diagnostic, gas, brakes, misc) or a Detailing package (Sedan/SUV pricing, optional trunk add‑on).
2. **Pick a time** — ASAP, or a 3‑hour window (8–11, 11–2, 2–5, 5–8) across the next 14 days. Slots are generated live in the browser; past windows for *today* are hidden.
3. **Enter details** — name, phone (US‑only, validated & auto‑formatted), email, address, and vehicle. Friendly inline errors guide any fixes.
4. **Submit & deposit** — the booking is emailed to Day via **Formspree** (also routed into Airtable), then a confirmation screen shows a **Cash App** button to send the **$40 deposit** to **`$sauxyDay`**.

> The deposit is collected manually (no payment verification by design). The booking reaches Day either way; he confirms the deposit on his end.

---

## Tech

- Plain **HTML + CSS + vanilla JS** — no framework, no build step, no dependencies.
- **Formspree** for form delivery · **Cash App** deep link for the deposit.
- Dark theme with candy‑apple‑red accents; fonts: Anton / Archivo / Space Mono.

```
.
├── index.html      # markup & content
├── styles.css      # all styling (dark + candy apple red)
├── app.js          # services data, booking wizard, validation, deposit flow
├── assets/         # hero / banner photos
└── .github/workflows/deploy.yml   # FTP auto‑deploy
```

---

## Run locally

No tooling required — just serve the folder:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

---

## Deployment

Pushing to **`main`** automatically deploys the site to the web host over **FTP** via GitHub Actions (`.github/workflows/deploy.yml`). You can also trigger it manually from the **Actions** tab ("Run workflow").

- **Host:** `212.85.28.219` · **User:** `u822040025.realroadsideassistance.com`
- **Password:** stored as the repo secret **`FTP_PASSWORD`** (never commit it).
- Repo plumbing (`.git`, `.github`, `README.md`, `.DS_Store`) is excluded from upload.
- First publish uploads everything; later pushes sync only changed files.

If files need to land in a subfolder on the host (e.g. `public_html/`), change `server-dir` in the workflow.

---

## Editing the site

| Want to change… | Edit |
| --- | --- |
| Services, prices, packages | `SERVICES` object near the top of **`app.js`** |
| Time windows / days ahead | `BLOCKS` and `DAYS_AHEAD` in **`app.js`** |
| Deposit amount / Cash App tag | `DEPOSIT` and `CASHTAG` in **`app.js`** (and the footer/links in `index.html`) |
| Form delivery endpoint | `FORMSPREE` in **`app.js`** |
| Contact info / service area | `index.html` (header, footer, hero) |

---

_Built for Day. 🏁_
