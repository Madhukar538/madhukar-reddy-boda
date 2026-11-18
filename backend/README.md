# Portfolio API (.NET 8 + MongoDB)

The backend for dhucar.in: content management (posts, projects, profile), privacy-first traffic analytics, and a hardened admin sign-in with passkeys and two-factor authentication.

It follows the org's layered house style: one controller per endpoint → BAL → DAL → DTOs, a uniform `Response<T>` envelope, convention-based DI (every `*BAL`/`*DAL` class is registered by Scrutor), and global exception middleware as a last resort behind local try/catch.

```
src/
  Dhucar.Portfolio.Api            controllers, auth filter, middleware, composition root
  Dhucar.Portfolio.BusinessLogic  BAL classes (validation, orchestration, auditing)
  Dhucar.Portfolio.DataAccess     DAL classes (MongoDB driver) and indexes
  Dhucar.Portfolio.Properties     DTOs, Mongo documents, settings, Response<T>
  Dhucar.Portfolio.Common         security primitives, logging, request context
tests/Dhucar.Portfolio.Tests      integration tests against a real mongod
seed/content.json                 the site's current content, imported into an empty database
```

## Endpoints

All endpoints are `POST /api/{Name}` with a JSON body and return `{ returnCode, returnMessage, data, responseTime, serverDate, rowCount }`. `returnCode` 1 is success; failures map to 400/401/403/404/409/429/500.

| Area | Public | Admin (Bearer token) |
|---|---|---|
| Sign-in | `SetupAdmin`, `ConfirmTotpSetup`, `Login`, `VerifyMfa`, `RefreshToken`, `PasskeyLoginOptions`, `PasskeyLogin` | `Logout`, `GetCurrentAdmin`, `RegenerateRecoveryCodes` |
| Passkeys | | `PasskeyRegisterOptions`, `PasskeyRegister`, `GetPasskeys`, `DeletePasskey` |
| Posts | `GetPosts`, `GetPost` | `GetAllPosts`, `SavePost`, `DeletePost` |
| Projects | `GetProjects` | `GetAllProjects`, `SaveProject`, `DeleteProject` |
| Profile | `GetProfile` | `SaveProfile` |
| Traffic | `TrackPageView` | `GetTrafficSummary` |
| Audit | | `GetAuditLog` |

`GET /health` returns `{ "status": "ok" }`.

## Security design

**Sign-in.** There is one admin account.
- **Passkey (WebAuthn):** phishing-resistant and a single step. User verification is required (Face ID, Touch ID, Windows Hello or a PIN) and credentials are discoverable, so no email is needed.
- **Password + TOTP:** the password alone never signs in. It returns a 5-minute, single-purpose MFA token, and the session starts only after a valid authenticator code.
- **Recovery codes:** 10 single-use codes, each carrying 100 random bits, stored as SHA-256 hashes.

**Credentials at rest**
- Passwords are hashed with PBKDF2 (ASP.NET Core Identity v3: HMAC-SHA512, 100,000 iterations, random salt).
- TOTP secrets are encrypted with AES-256-GCM using a key from the environment.
- Refresh tokens are stored only as SHA-256 hashes, and passkey records hold no private keys.

**Tokens and sessions**
- Access tokens are HS256 JWTs that last 15 minutes, with issuer, audience, lifetime and algorithm checked.
- MFA and enrolment tokens use their own audience, so they can never be used as access tokens.
- Every request re-checks the account's security stamp, so "sign out everywhere" takes effect immediately.
- Refresh tokens rotate on every use. If an already-used token comes back, that whole session is revoked.
- The refresh cookie is `__Host-`, `HttpOnly`, `Secure`, `SameSite=Strict`, and the refresh endpoint also requires an `X-Requested-With` header, which cross-site requests can't send.

**Replay and races.**
- Each TOTP code works once, including under concurrent requests (an atomic "newer step only" update).
- Challenges (MFA, enrolment, passkey ceremonies) are single-use, claimed atomically, and expire through a TTL index.
- Recovery codes are consumed atomically.

**Brute force**
- Five failed passwords or codes lock the account for 15 minutes.
- Sign-in endpoints are limited to 10 requests per minute per IP, with separate limits for admin, public and tracking traffic.
- An unknown email takes as long as a wrong password, and gets the same message.

**Passkey-only switch.** The document `settings` → `{ _id: "security" }` holds `IsPasswordLoginEnabled`. The API creates it on first start, with the value `true`. Set it to `false` by hand (with `mongosh` in the `mongo` container, see **Deploy** below) and email + password + code sign-in stops at once: the sign-in page shows only the passkey button, and the API refuses `Login` and `VerifyMfa`. Set it back to `true` to allow passwords again. It is read on every request, so no restart is needed. While no passkey is registered the switch is ignored, so the admin can't be locked out.

**Step-up.** Deleting a passkey or regenerating recovery codes needs a fresh authenticator code.

**Bootstrap.** There is no default admin. Setup requires a one-time `SetupToken` (at least 32 characters) from the environment. Remove it once the admin is enrolled; with it unset, setup is disabled.

**Transport and browser**
- CORS allows only the configured origins, with credentials.
- Responses carry HSTS, `nosniff`, `X-Frame-Options: DENY`, a `default-src 'none'` CSP, `no-store`, and no `Server` header.
- Request bodies are capped at 512 KB.

**Content safety.** Post HTML is sanitised on save against an allowlist (HtmlSanitizer). Scripts, event handlers, inline styles, iframes and `javascript:` URLs are removed, even if the admin account were compromised.

**Webhooks.** After a content change the API calls the site's revalidation endpoint with `X-Timestamp` and `X-Signature: sha256=HMAC(secret, "{timestamp}.{body}")`. The site should reject stale timestamps (more than 5 minutes old) and bad signatures.

**Privacy (traffic analytics)**
- No IP address, cookie, user id or full user agent is stored.
- Unique visitors are counted with an HMAC of IP and user agent under a random daily salt. The salt is deleted after two days, so older hashes can't be linked to anyone.
- Do Not Track and Global Privacy Control are honoured, bots are dropped, and admin and API paths are never recorded.
- Only the referrer's host is kept, never the full URL.
- Page views expire after 395 days.

**Audit.** Sign-ins, failures, lockouts, refresh-token reuse, passkey changes and every content change are logged with time, IP and user agent, and kept for 400 days.

**Fail-safe config.** The API refuses to start if keys are missing or weak, origins include a wildcard, or the webhook secret is short.

## Configuration

Settings live under `Portfolio`. In production, set them as environment variables using `__` as the separator, e.g. `Portfolio__Security__JwtSigningKey`.

| Variable | Notes |
|---|---|
| `Portfolio__Mongo__ConnectionString` | Set by `docker-compose.yaml` to `mongodb://mongo:27017`. Locally: `mongodb://localhost:27017`. |
| `Portfolio__Mongo__Username`, `Portfolio__Mongo__Password` | Optional sign-in, kept out of the connection string so the password needs no URL encoding. Set by `docker-compose.yaml` to the API's own user. |
| `Portfolio__Security__JwtSigningKey` | `openssl rand -base64 48` |
| `Portfolio__Security__EncryptionKey` | exactly 32 bytes: `openssl rand -base64 32` |
| `Portfolio__Security__SetupToken` | `openssl rand -hex 32`, only until the admin is enrolled |
| `Portfolio__Security__AllowedOrigins__0` | `https://dhucar.in` |
| `Portfolio__Security__IsCloudflareTrusted` | `true` only when the API is reachable solely through Cloudflare (Tunnel). It then uses `CF-Connecting-IP` and `CF-IPCountry`. |
| `Portfolio__Passkeys__RpId` / `Portfolio__Passkeys__Origins__0` | `dhucar.in` / `https://dhucar.in` |
| `Portfolio__Site__RevalidateUrl` / `Portfolio__Site__RevalidateSecret` | Next.js revalidation endpoint and a shared secret of 32+ characters |
| `Portfolio__Telegram__BotToken` / `Portfolio__Telegram__ChatId` | Optional: the same Telegram bot as the site's bug reports. Each new blog comment then pings you. Leave empty to turn alerts off. |
| `Portfolio__Security__CommentsPerMinute` / `Portfolio__Security__ReactionsPerMinute` | Optional per-IP limits; defaults 3 and 30. |

## First-time setup

1. Deploy the API with `SETUP_TOKEN` set, and the site with `NEXT_PUBLIC_API_URL` pointing at it.
2. Open `https://dhucar.in/admin/setup` and enter the setup token, your email and a password of 12+ characters.
3. Scan the QR code with an authenticator app and confirm with a code. Save the 10 recovery codes offline.
4. Remove `SETUP_TOKEN` from the API and redeploy it.
5. Sign in at `/admin/login` and add a passkey under **Security**. From then on, sign in with the passkey.

## The admin pages

`/admin` is part of the Next.js site. It is a static shell that loads everything from this API after sign-in. It is never indexed and never tracked, and it can't be framed.

- **Traffic:** a tickets summary, then page views and visitors for the last 7, 30 or 90 days, top pages and referrers, devices and countries.
- **Images in posts:** "Insert image" in the post editor uploads a photo (resized to 1600 px and converted to WebP in the browser, at most 2 MB) or reuses an earlier one, and inserts it in one of four layouts: photo with text below, text on the photo, photo beside text, or a wide banner. The API checks the file's bytes (PNG, JPEG, WebP or GIF only), stores it in MongoDB by content hash, and serves it at `/media/<hash>.<ext>` with a one-year immutable cache; the site serves the same path from its own domain.
- **Posts** and **Projects:** create, edit, hide or delete. Saving refreshes the live site within seconds. Post HTML is previewed in a sandboxed frame with scripts off, and sanitised by the API on save.
- **Comments:** reader comments wait here for approval (Waiting, Approved, Spam).
- **Tickets:** every bug report and enquiry from the site's form and genie. Filter by status and priority, search, change status or priority and keep notes; the Traffic page shows a summary. The site files tickets server-to-server, signed with `REVALIDATE_SECRET` (`CreateTicket` refuses anything unsigned or older than 5 minutes).
- **Profile:** name, links, tech stack, current role and education.
- **Security:** passkeys, recovery codes, sign out everywhere, and the activity log. Removing a passkey or creating new recovery codes needs a current authenticator code.

The access token is kept in memory only. The session renews itself through the HttpOnly refresh cookie, one tab at a time (Web Locks), so rotating refresh tokens never trip reuse detection. The site and the API must share a registrable domain (`dhucar.in` and `api.dhucar.in`), because the refresh cookie is `SameSite=Strict`.

## Connecting the site

Set these on the Next.js app (see `.env.example`):

| Variable | Notes |
|---|---|
| `API_URL` | Server-side base URL, e.g. `https://api.dhucar.in`. Without it the site uses its built-in content. |
| `NEXT_PUBLIC_API_URL` | Same URL, for the page-view beacon. Needed at build time. |
| `REVALIDATE_SECRET` | Same value as `Portfolio__Site__RevalidateSecret`. |

Content is cached in Next's data cache under the tags `posts`, `projects` and `profile`. After every change the API calls `/api/revalidate`, which checks the signature and timestamp and refreshes only those tags, so edits appear on the next request. If that call doesn't get through (a secret mismatch, or a firewall in front of the site), the API logs `Site refresh refused` with the site's answer, and the admin page asks the site to refresh directly, proving itself with the admin's access token, which the site checks with the API. As a last safety net the cache also expires every 5 minutes. If the API can't be reached, pages keep their last good content, or fall back to the built-in content.

## Run and test

```bash
# Tests (start a real mongod through Mongo2Go; no Docker needed)
dotnet test tests/Dhucar.Portfolio.Tests

# Local API (Development settings expect MongoDB on localhost:27017)
ASPNETCORE_ENVIRONMENT=Development dotnet run --project src/Dhucar.Portfolio.Api
```

Swagger UI is available at `/swagger` in Development only.

## Data migrations

The seed only fills an empty database, so changes to data that is already live ship as migrations. Each one is a class in `src/Dhucar.Portfolio.BusinessLogic/Migrations` that implements `IMigration`:

- `Id`: `NNNN-what-it-does`, numbered one past the last (`0001-…`, `0002-…`). Migrations run in `Id` order. Never rename one that has shipped.
- `Apply()`: changes the data and returns the site cache tags to refresh (for example `profile`). It must be safe to run twice.

On every start, after seeding, `MigrationBAL.RunPending()` applies each migration not yet listed in the `migrations` collection, records it there, then asks the site to revalidate the returned tags once. A migration that throws is not recorded, so the next start retries it. Classes implementing `IMigration` are registered automatically.

To change live data in a release: add a migration (and update `src/data/profile.ts` and the seed with `scripts/export-content.ts`, so a fresh database gets the same result), deploy, and the first start applies it.

## Sites (multi-tenant)

The API can serve more than one portfolio. **Each site has its own MongoDB database**, so one site's posts, comments, tickets, media, admins and sign-ins can never be read or changed from another. The data-access code is the same for every site: only the database changes.

- **The primary site** (dhucar.in) is the configured database (`Portfolio:Mongo:Database`) and the slug `main`. Every request that names no other site is for it, so everything here works as it did before sites existed.
- **Other sites** are listed in the `tenants` collection of the primary database: slug, name, hosts, database (`site_<slug>`) and status. `TenantBAL.Provision` adds one, creating its indexes and default settings. Signing up is not exposed yet.
- **Which site a request is for** (`TenantMiddleware`): the `X-Tenant` header (sent by a site's server), else the browser's `Origin` host, else the primary site. A named site that is unknown or suspended gets `404 Unknown site.` and never falls back to another site's data.
- **Each site's own admin, on its own domain:** `/admin` on a site's domain is the same admin (re-exported under `src/app/(sites)`), talking to the API through that domain's `/api/<Action>` pass-through with `X-Tenant-Host`, so its session cookie (`__Host-rt_<slug>`) is first-party there. Its first admin is set up at `/admin/setup` with the site's setup token. Tickets, Themes and Sites aren't shown there.
- **Managing sites:** the primary admin's **Sites** page (`GetSites`, `CreateSite`, `SetSiteStatus`) lists sites, adds one (its setup token is shown once) and suspends or reactivates it. Any other site's admin gets 403.
- **First admin per site.** `Provision` returns the site's own setup token once (only its SHA-256 is stored). `SetupAdmin` with `X-Tenant` naming the site accepts that token and nothing else; the server's `SetupToken` works on the primary site only.
- **Sign-in is per site.** Tokens carry the site (`tid`) and are refused anywhere else; tokens without one (issued before this) belong to the primary site.
- **Per-site in memory too:** the engagement caches and live-presence rooms are keyed by site.
- **Browsers:** CORS allows the primary site's configured origins plus `https://<host>` for each host a registered site claims (`SiteCorsPolicyProvider`); the presence hub checks the same. A page whose origin belongs to one site can't name another with `X-Tenant` (404).
- **Passkeys:** each site is its own relying party (`PasskeyRelyingParty`): the primary site as configured, any other site its first host. A site with no host has no passkeys yet.
- **Sessions:** each site has its own refresh cookie (`__Host-rt_<slug>`), so a browser signed in to two sites keeps both.
- **Images:** another site's image URLs name it (`/media/<file>?site=<slug>`), because browsers fetch images without headers.
- **Primary site only, for now:** page revalidation, Telegram alerts and data migrations.
- **On their own domains** (the Next.js app): with `SITES_ENABLED=true`, `src/proxy.ts` rewrites any host not in `PRIMARY_HOSTS` (default `dhucar.in,www.dhucar.in,localhost,127.0.0.1`) to `/sites/<host>/…` (`src/app/(sites)`): that site's own layout, Editorial homepage, Experience and About, loaded from the API by `X-Tenant-Host`, with no fallback to this site's content. Every other path on such a domain is a 404 in the site's own layout. Off by default; `/sites/…` can never be opened directly. Point a site's DNS (and Cloudflare) at the app before turning it on.

The database user needs `readWrite` on each site's database as well as `portfolio`: grant it when adding a site, or use a role that covers `site_*`. Nothing changes for the primary site.

## Deploy (Coolify)

`docker-compose.yaml` (Coolify's default name) runs two containers: the API and its MongoDB (`mongo:8.0`). The database has no published port and is reachable only from the API on the compose network, so there is no IP allow-list to keep up to date. Its files live in the `mongo-data` volume, which survives redeploys.

Set these in Coolify's environment variables:

| Variable | Notes |
|---|---|
| `MONGO_ROOT_PASSWORD` | `openssl rand -hex 24`. Root, for admin work by hand only; the API never uses it. |
| `MONGO_APP_PASSWORD` | `openssl rand -hex 32`. The API's own user, `readWrite` on `portfolio` only. |
| `JWT_SIGNING_KEY`, `ENCRYPTION_KEY`, `REVALIDATE_SECRET` | As in **Configuration** above. |
| `SETUP_TOKEN` | Only for the first admin enrolment. |

On every start, before MongoDB opens to the network, the `mongo` container sets **both** users from these variables (`mongo/entrypoint.sh` and `mongo/set-users.js`, built into the image by `mongo/Dockerfile`). It does this on a private server with no access control, bound to `127.0.0.1:27018` inside the container, for a few seconds. So changing either password in Coolify and redeploying just works, without the old password. The health check passes only once the API's user can sign in, and the API waits for it. Passwords are passed as options, never inside a URL, so any characters work (hex is still easiest to copy).

In Coolify, set the API service's domain to `https://api.dhucar.in` (container port 8080) so the tunnel reaches it through Coolify's proxy. No host port is published: the API must be reachable only through Cloudflare.

If the database is unreachable at start, the API still starts: `/health` answers with `"db": "down"` and the startup tasks (indexes, seed, migrations) retry in the background, from 10 seconds up to every 5 minutes, until they succeed.

**Working with the data.** Coolify → the resource → Terminal → `mongo` container:

```sh
mongosh -u root -p          # asks for MONGO_ROOT_PASSWORD
use portfolio
db.settings.findOne({ _id: "security" })
```

**Backups.** The `mongo-backup` container (`mongo/backup.sh`, built into the image by `mongo/Dockerfile`) dumps the `portfolio` database every night at 21:00 UTC (02:30 IST), plus once on every start, into the `mongo-backups` volume, and keeps the newest 14 (`BACKUP_KEEP`, `BACKUP_AT_UTC` to change). Its log shows each dump and the next time. It uses the API's own user, so it can read `portfolio` and nothing else.

Every dump is then **restore-checked**: restored into a throwaway MongoDB started inside the backup container (never the live database), and every collection the live database had must come back. A dump that fails the check is kept but not counted as good. The result is written to the `backup-status` volume, which the API reads (read-only) for the line at the top of Admin → Traffic: when the last good backup was, how many collections and documents came back, and whether the offsite copy is verified. It warns when the last good backup is over 36 hours old or the last attempt failed. CI runs the same drill on every pull request (the "Backups (restore drill)" job).

The dumps sit on the same disk as the database, so copy one elsewhere now and then:

```sh
# on the server: the newest dump, out of the backup container
docker exec <mongo-backup-container> sh -c 'ls -1t /backups/*.gz | head -1'
docker cp <mongo-backup-container>:/backups/portfolio-2026-10-31T210000Z.gz .
```

To restore one, copy it into the `mongo` container and replace the database with it:

```sh
docker cp portfolio-2026-10-31T210000Z.gz <mongo-container>:/tmp/restore.gz
docker exec <mongo-container> sh -c 'mongorestore -u root -p "$MONGO_INITDB_ROOT_PASSWORD" --authenticationDatabase admin --gzip --archive=/tmp/restore.gz --nsInclude "portfolio.*" --drop'
```

Then restart the API.

**Offsite copies.** The dumps above sit on the same disk as the database, so a lost server loses both. The `mongo-offsite` container (`offsite/offsite.sh`) copies each finished dump every 6 hours to Cloudflare R2, or any S3-compatible storage. Each file is encrypted before it leaves the server, so the bucket only holds ciphertext. Copies older than 60 days are removed from the bucket. It stays idle until these are set in Coolify's environment variables:

| Variable | Value |
| --- | --- |
| `OFFSITE_ENDPOINT` | `https://<account id>.r2.cloudflarestorage.com` |
| `OFFSITE_BUCKET` | the bucket's name, e.g. `portfolio-backups` (create it first, private) |
| `OFFSITE_ACCESS_KEY_ID`, `OFFSITE_SECRET_ACCESS_KEY` | an R2 API token with Object Read & Write on that bucket only |
| `OFFSITE_ENCRYPTION_PASSWORD` | a long random password. **Keep a copy outside the server** (a password manager): without it the copies cannot be read. |
| `OFFSITE_KEEP_DAYS`, `OFFSITE_EVERY_HOURS` | optional, default `60` and `6` |

After each copy it runs `rclone cryptcheck`, which confirms every dump in the bucket decrypts to exactly the local file (by hash, without downloading), and records the result for the admin's backup line. Its log says "copied and verified, N dumps in the bucket" after each run. To restore from the bucket on any machine with rclone, set the same `RCLONE_CONFIG_*` values the script sets, then decrypt a dump while downloading it, and restore it as above:

```sh
rclone copy sealed:portfolio-2026-10-31T210000Z.gz .
```

**Moving from MongoDB Atlas.** Deploy once, so the empty database is seeded. Then replace it with your Atlas data, so admin users, passkeys, posts, comments, tickets and media come across:

```sh
# 1. From any machine Atlas allows (your laptop): dump the Atlas database
mongodump --uri "mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/portfolio" --gzip --archive=atlas.gz
# 2. Copy it to the server, then into the mongo container, and restore over the seed
docker cp atlas.gz <mongo-container>:/tmp/atlas.gz
docker exec <mongo-container> sh -c 'mongorestore -u root -p "$MONGO_INITDB_ROOT_PASSWORD" --authenticationDatabase admin --gzip --archive=/tmp/atlas.gz --nsInclude "portfolio.*" --drop'
# 3. Restart the API so it rebuilds caches and indexes
```

`--drop` replaces each collection with the Atlas copy. Once the site works on the new database, delete the Atlas cluster and its database user.

On first start the API creates its indexes and imports `seed/content.json` into any empty collection. It never overwrites existing data. Regenerate the seed from the site with `npx tsx --tsconfig tsconfig.json scripts/export-content.ts`.
