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
