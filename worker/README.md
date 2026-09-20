# Anemone accounts, profiles and leaderboards (optional)

A small Cloudflare Worker with a D1 (SQLite) database. **Everything in Anemone works without it**; if it is unreachable, retired or full, only accounts, cloud sync and leaderboards stop. The site never depends on it.

## What it stores (and what it does not)

- A **username** and a **hash of a key derived in the browser** (PBKDF2, 200,000 rounds, SHA-256, from username + password). The password never reaches the server. There is no email, so there is no password reset by email: registration creates a **recovery code** (also turned into a key in the browser; only its hash is stored).
- **Optional profile fields** (first name, last name, occupation, education, age *range*, country, city, about). All are private by default, each has its own public/private switch, and for age range `under18` the name and free-text fields can never be made public.
- **Summary numbers** (XP, level, answers, right answers, study seconds, streak, lessons done, badges, weekly deltas, per-course numbers) and an opaque **cloud save** (the user's own save file, <= 380 KB).
- Group names and invitation codes, moderation reports.
- No IP addresses are stored except as a salted, truncated hash inside a rate-limit counter that is deleted within minutes.

Everything can be exported (`GET /api/export`) and deleted (`DELETE /api/account`) by the user.

## Endpoints

```
POST /api/register      {username, key, recoveryKey}
POST /api/recover       {username, recoveryKey, newKey}
GET  /api/me            (Bearer key)
PUT  /api/profile       {profile, vis}          PUT /api/optin {optin}
PUT  /api/sync          summary numbers          PUT/GET /api/save  cloud save
GET  /api/leaderboard?scope=global|weekly|course:<id>&metric=xp|acc|time|streak
GET  /api/profile/<username>                     (opted-in users only)
POST /api/groups | /api/groups/join | /api/groups/leave      GET /api/groups, /api/groups/<id>/board
POST /api/report        {kind: username|profile|group, target, reason}
GET  /api/export        DELETE /api/account
GET  /api/admin/reports          POST /api/admin/reports/<id> {action: dismiss|hide|ban}     (X-Admin-Token)
```

The leaderboard is **honour-based**: the course runs in the browser. The server validates value ranges and plausible rates (XP per hour, answers per minute, study seconds cannot exceed wall-clock time), clamps and flags implausible syncs, and computes weekly numbers from server-side deltas.

## Why D1 and not KV

Workers KV's free plan allows 1,000 writes per day, which a leaderboard with several measures, weekly windows, per-course boards and groups would exhaust quickly. D1's free plan allows 100,000 rows written and 5 million rows read per day, and gives real sorting and filtering.

## Deploy (free plan, no credit card)

```bash
cd worker
npx wrangler login                                  # once, opens the browser
npx wrangler d1 create anemone                      # prints a database_id -> paste into wrangler.toml
npx wrangler d1 execute anemone --remote --file=schema.sql
npx wrangler secret put ADMIN_TOKEN                 # >= 16 random characters
npx wrangler secret put THROTTLE_SALT               # any random string
npx wrangler deploy                                 # prints https://anemone-api.<you>.workers.dev
node smoke-test.mjs https://anemone-api.<you>.workers.dev https://alplix.github.io
```

Then set `apiBase` in `site.config.json` to the Worker URL and `ALLOWED_ORIGINS` in `wrangler.toml` to the site origin(s), rebuild, commit. A new `workers.dev` address can take a few minutes before its certificate is ready.

## Moderation

`src/moderation.js` (shared with the browser through the build) normalises text (case, accents, Turkish `i/ı/İ`, leet-speak, separators between letters) and matches whole words, adjacent-word joins, letters spaced apart, substrings for long entries (never inside allow-listed words), and substrings for Chinese, Japanese, Korean and Thai. Lists come from LDNOOBW (CC BY 4.0), 24 files covering 24 of the site's locales; **27 locales have no list yet** (`wordlists.json → missing`): those languages must get a list before their accounts are switched on. The filter is not perfect: it will miss creative spellings and can flag innocent words in rare cases; the report button and the admin queue exist for that. Run `node worker/test-moderation.mjs` after editing.

Regenerate the lists with `node scripts/build-wordlists.mjs` (needs network).
