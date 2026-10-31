# Launch to-do (Rico)

Things only a person can do. SEO is the only channel, and for a new domain links from
other sites move rankings more than anything on the site itself.

## Search engines

- [ ] Bing Webmaster Tools: verify (`/BingSiteAuth.xml` is live), then submit `https://synners.si/sitemap.xml`
- [ ] Google Search Console: Sitemaps → `sitemap.xml` → Submit (if not done yet)
- [ ] GSC in ~2 weeks: Pages report, check how many festival pages sit in "Crawled, currently not indexed"

## Reddit

Rules before posting: read each sub's self-promotion rules (some only allow it in a weekly
thread), use an account with some history, one post per sub, and link the matching page
(e.g. `/genres/metal/`), not the homepage. Lead with something useful ("every techno
festival in Europe 2027 on one map"), say plainly that you built it, and answer comments.

- [ ] r/festivals — mixed US/EU; angle: "European festivals for people planning a trip"
- [ ] r/Techno — link `/genres/techno/`
- [ ] r/Metal — strict rules, check first; link `/genres/metal/`
- [ ] r/hardstyle — link `/genres/hardstyle/` if the hub exists
- [ ] r/DnB — link `/genres/drum-and-bass/` if the hub exists
- [ ] r/EDM — link `/genres/edm/`
- [ ] r/Slovenia, r/croatia — local angle, link the country hub
- [ ] r/solotravel — only as an answer in a thread asking about festivals, never a standalone post

## Backlinks

- [ ] Show HN on Hacker News ("Show HN: Every music festival in Europe on one map")
- [ ] Product Hunt launch
- [ ] Send the 15 drafts in Gmail (account info@wassergo.de, subject "... auf Synners" / "... on Synners"); then email more smaller festivals that have a page on Synners: "You're listed on Synners, here is your page" with the `/festivals/<name>/` link. Smaller festivals link back more often than big ones.
- [ ] Slovenian and Balkan music blogs and magazines: offer the map or a "festivals in Slovenia 2027" list
- [ ] Festival Facebook groups and Discords (genre and country): share the hub page when someone asks "which festivals this summer?"

## Instagram (backlog)

Goal: a Synners Instagram page fed by a bot from the site data. Two post series:
- Monthly, on the 1st: "Festivals of the month" (carousel, one slide per festival).
- Weekly, on Monday: "Festivals next week".

- [ ] Rico: create the Instagram account (professional: Business or Creator) and a Facebook Page, and link them. Claude cannot create accounts or log in.
- [ ] Rico: create a Meta developer app with Instagram content publishing and generate a long-lived token. It goes into the Mac keychain or a local `.env`, never into the repo.
- [ ] Claude: generate the slides at build time with the existing satori share-image code (`src/lib/og-image.ts`, 1080×1350 portrait), from the same "upcoming at build time" data the hubs use.
- [ ] Claude: posting script after `scripts/deploy.sh`. The Graph API fetches images by public URL, so the slides are published to synners.si first, then posted. Remember what was posted (`.cache/`) so a rerun posts nothing twice.
- [ ] Claude: add it to the existing Monday LaunchAgent (weekly post; the monthly post on the first Monday of each month). Caption with festival handles where `instagram` is known, plus a link to `/months/<month>/`.
- [ ] Before the first post: Rico approves one test post (sending content out in his name).

## Report a missing festival (backlog)

Goal: visitors tell us about festivals the site does not list yet.

**v1, manual:**
- [ ] Rico: decide the inbox (e.g. a new `hello@synners.si` at Hostinger). There is no Synners address yet.
- [ ] Claude: a "Festival missing?" link on the list, hub and 404 pages. A `mailto:` with a prefilled subject and body (name, town, website, dates) needs no backend and collects nothing on the site itself.
- [ ] Rico: reads the mails and adds the festival by hand (or asks Claude to).

**v2, automatic:**
- [ ] A small form endpoint (the site is static, so a Hostinger PHP script or a serverless function). It stores the report, adds a rate limit and a honeypot, and never sends the visitor's address anywhere.
- [ ] A job sends each report to the Claude API (Sonnet, own key under a project-specific name, never `ANTHROPIC_API_KEY`). The model checks whether the festival exists (its own website), that it is a music festival, which country it is in, and that the site does not have it yet (same dedupe as `europe_build.py`).
- [ ] If it passes, the job fetches the official site with the existing date extraction and writes the row to a `festivals_reported.json`. The next weekly rebuild publishes it. Unclear cases go into a review list for Rico, never straight onto the site.
- [ ] Privacy notice on the form page: what is stored and for how long. Delete reports after processing.
