# Go-Pods configurator

The original Next.js/React configurator, hosted as a standalone Node service on the VPS. Models, prices, options, guided quiz, submissions and historical PDF data come from the Go-Pods API. The API owns database writes, authoritative price/availability validation, CRM creation and queued Brevo delivery. The frontend no longer needs Supabase, Vercel or Brevo credentials.

## Development

Use Node 22. Run `npm ci`, copy `.env.example` to `.env.local`, set the API origin and server-only token, then run `npm run dev`. The API origin does not include `/api/v1`. HTTPS is required except for loopback development. Never use `NEXT_PUBLIC_` for the token.

For an explicit non-submitting visual demo, leave both API values empty and set `CONFIGURATOR_PREVIEW=true`. Partial API credentials and API failures raise errors; they never fall back to sample prices. Live catalogue pages are rendered at request time, so the same build can use runtime credentials and current catalogue data.

`npm test`, `npm run typecheck`, `npm run lint`, and `npm run build` verify the app. All existing styling, quiz scoring, option/package rules and PDF layout are retained. `src/types/supabase.ts` is retained solely as the historical catalogue row schema; there is no Supabase runtime client. `email-templates.ts` remains a migration reference; only the API sends mail.

## API contract

Requests use `Authorization: Bearer CONFIGURATOR_API_TOKEN` from server code only. Responses use a `{data: ...}` envelope.

- `GET /api/v1/configurator/catalogue`: original snake-case row arrays for models, model_specs, model_images, option_categories, options, option_images, option_model_compatibility, option_model_inclusions, option_package_inclusions, quiz_questions, quiz_answers, quiz_answer_option_suggestions, quiz_answer_model_scores.
- `POST /api/v1/configurator/submissions`: original submission payload plus `submission_id`, with matching `Idempotency-Key` UUID. The browser keeps the same UUID after an uncertain failure and creates a new one when the payload changes or a submission succeeds. The API must atomically enforce uniqueness and reject a reused UUID with changed data. Success includes status, reference, configurationId, and emailDelivery.status=`queued`.
- `GET /api/v1/configurator/configurations/{uuid}?reference=...`: original `SubmissionPdfData`, preserving historical snapshots. Missing or mismatched references return 404. The public download URL remains `/api/configurations/{uuid}/pdf?reference=...`.

## VPS deployment

Follow [the VPS staging and cutover runbook](deploy/vps-staging.md). The VPS runs the standalone Linux build under [systemd](deploy/go-pods-configurator.service) using its existing Node 24.21.0 installation. Docker is used locally to build the Linux amd64 artifact; Docker Compose is not the VPS deployment path.

Build with `docker build --platform linux/amd64 -t go-pods-configurator .`, then extract `/app` from the runtime image as described in the runbook. No runtime credentials are required during the build. Next.js downloads the current Google web fonts at build time and serves them locally at runtime. The existing PDF Geist font is vendored under `public/fonts` with its OFL license.

Runtime credentials belong in `/var/www/go-pods-configurator/shared/runtime.env`, owned by root with group `gopods-configurator` and mode 640. The dedicated service binds to loopback port 3100 behind Nginx; preserve Host and forwarded headers for Server Actions. Releases are immutable and only the shared image cache is runtime-writable.

`GET /api/health` is a non-sensitive process liveness check. Verify API catalogue access and a controlled submission separately before DNS cutover. Monitor API email jobs, CRM records and PDF downloads. Retain the former deployment and database backup until desktop/mobile parity, historical record migration and delivery have been verified; cancellation of old services is a separate cutover step.

For local container verification only, `deploy/compose.yml` can run a loopback instance with a private `/etc/go-pods/configurator.env` file. This alternative does not provision the VPS service.

## Security baseline

The migration updates Next.js and its matching ESLint configuration from 16.2.2 to 16.3.8, the minimum patched release covering the audited remote execution and self-hosting cache advisories, while retaining React/React DOM 19.2.4. Compatible nanoid, source-map-js and baseline-browser-mapping patches are locked. See [Next.js 16.3.8 release](https://github.com/vercel/next.js/releases/tag/v16.3.8), [AVIF image advisory](https://github.com/vercel/next.js/security/advisories/GHSA-2xp9-vwfh-vxw4), and [upstream security update](https://nextjs.org/blog/nextjs-security-update-september-22-2026). Production dependency audit passed with zero findings on 13 October 2026; development-only dependency findings remain outside this runtime migration.
