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
| `Portfolio__Mongo__ConnectionString` | Use a MongoDB user limited to this database. |
| `Portfolio__Security__JwtSigningKey` | `openssl rand -base64 48` |
| `Portfolio__Security__EncryptionKey` | exactly 32 bytes: `openssl rand -base64 32` |
| `Portfolio__Security__SetupToken` | `openssl rand -hex 32`, only until the admin is enrolled |
| `Portfolio__Security__AllowedOrigins__0` | `https://dhucar.in` |
| `Portfolio__Security__IsCloudflareTrusted` | `true` only when the API is reachable solely through Cloudflare (Tunnel). It then uses `CF-Connecting-IP` and `CF-IPCountry`. |
| `Portfolio__Passkeys__RpId` / `Portfolio__Passkeys__Origins__0` | `dhucar.in` / `https://dhucar.in` |
| `Portfolio__Site__RevalidateUrl` / `Portfolio__Site__RevalidateSecret` | Next.js revalidation endpoint and a shared secret of 32+ characters |

## First-time setup

1. Deploy the API with `SETUP_TOKEN` set, and the site with `NEXT_PUBLIC_API_URL` pointing at it.
2. Open `https://dhucar.in/admin/setup` and enter the setup token, your email and a password of 12+ characters.
3. Scan the QR code with an authenticator app and confirm with a code. Save the 10 recovery codes offline.
4. Remove `SETUP_TOKEN` from the API and redeploy it.
5. Sign in at `/admin/login` and add a passkey under **Security**. From then on, sign in with the passkey.

## The admin pages

`/admin` is part of the Next.js site. It is a static shell that loads everything from this API after sign-in. It is never indexed and never tracked, and it can't be framed.

- **Traffic:** page views and visitors for the last 7, 30 or 90 days, top pages and referrers, devices and countries.
- **Posts** and **Projects:** create, edit, hide or delete. Saving refreshes the live site within seconds. Post HTML is previewed in a sandboxed frame with scripts off, and sanitised by the API on save.
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

Content is cached in Next's data cache under the tags `posts`, `projects` and `profile`. After every change the API calls `/api/revalidate`, which checks the signature and timestamp and refreshes only those tags, so edits appear on the next request. The cache also refreshes hourly in case a webhook is missed. If the API can't be reached, pages keep their last good content, or fall back to the built-in content.

## Run and test

```bash
# Tests (start a real mongod through Mongo2Go; no Docker needed)
dotnet test tests/Dhucar.Portfolio.Tests

# Local API (Development settings expect MongoDB on localhost:27017)
ASPNETCORE_ENVIRONMENT=Development dotnet run --project src/Dhucar.Portfolio.Api
```

Swagger UI is available at `/swagger` in Development only.

## Deploy (Coolify)

`docker-compose.yml` runs the API and MongoDB 7. MongoDB is on the private network only, with authentication on. Set `MONGO_APP_USER`, `MONGO_APP_PASSWORD`, `JWT_SIGNING_KEY`, `ENCRYPTION_KEY`, `REVALIDATE_SECRET` (and `SETUP_TOKEN` for the first run) in Coolify's environment variables. In Coolify, set the API service's domain to `https://api.dhucar.in` (container port 8080) so the tunnel reaches it through Coolify's proxy. No host port is published: the API must be reachable only through Cloudflare.

On first start the API creates its indexes and imports `seed/content.json` into any empty collection. It never overwrites existing data. Regenerate the seed from the site with `npx tsx --tsconfig tsconfig.json scripts/export-content.ts`.
