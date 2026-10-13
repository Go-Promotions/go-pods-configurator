# Configurator migration verification — 13 October 2026

Repository baseline: c11c91c on codex/configurator-vps-migration. Local implementation evidence below precedes deployment; the deployment record is maintained separately.

## Baseline

- npm ci succeeded.
- Original 11 test files / 31 tests passed.
- Original typecheck, ESLint and Next 16.2.2 production build passed.

## Migrated code

- Final 15 test files / 54 tests passed, including private API auth/no-cache/no-redirect transport, nested API validation errors, explicit preview, live-error fail-closed behavior, historical PDF snapshots, availability mapping, and stable submission attempt identity.
- npm run typecheck, npm run lint and git diff --check passed.
- Next 16.3.8 standalone production build passed, with request-time configurator and guided quiz routes.
- npm audit --omit=dev reports zero vulnerabilities. Full audit retains 13 development-only findings (1 low, 3 moderate, 9 high); no critical findings.
- Next/eslint-config-next changed 16.2.2 → 16.3.8. React/react-dom remain 19.2.4. Compatible nanoid, source-map-js and baseline-browser-mapping security patches updated in the lockfile.

## Standalone smoke

Ran the generated standalone server on loopback 3310 against a temporary authenticated API stub on 3311, populated only with the non-customer catalogue export. PDF input was synthetic customer data. Both temporary servers were stopped after verification.

- GET /api/health → 200 application/json.
- GET /configurator → 200, live exported Classic £14,995 present.
- GET /help-me-choose → 200.
- GET /api/configurations/smoke/pdf?reference=GP-SMOKE → 200 application/pdf, valid %PDF header, 16,743 bytes, actual bundled Geist font and logo rendered.
- Wrong PDF reference → 404.
- Smoke token absent from returned page HTML.

Local synthetic output: /tmp/configurator-standalone-smoke.pdf. Temporary test implementation: /tmp/configurator-mock-api.cjs. No historical customer data was used by the stub.

## Integrated verification

- Linux amd64 Docker production build passed.
- Actual private Supabase export imported into isolated MariaDB with latest validators: 54 configurations, 54 enquiries and 244 configuration items, plus all 13 catalogue tables. Import created no notifications.
- Standalone Next connected to actual local Laravel over the private service API. Classic + Bronze matched live: £16,690, 17 kg options, 597 kg MiRO, 153 kg payload.
- Browser submitted a synthetic quote request successfully; saved configuration generated a valid two-page PDF through the real API.
- Guided quiz matched the live baseline exactly: same six options, £17,975, 34 kg options, 614 kg MiRO, 136 kg payload, same Gold package suggestion and continuation URL.
- Authenticated CRM list contained the synthetic submission; detail preserved options, totals, notes, consent and trusted PDF link. Desktop and 390px mobile views verified; no horizontal overflow.
- API full suite: 184 tests / 1,949 assertions. Configurator final suite: 54 tests / 15 files. CRM full suite: 54 tests / 334 assertions.
- Mocked Brevo verifies original subject/text/HTML parity plus customer and sales names/tags/reply-to. Disabled deliveries remain pending without repeated queue dispatch.
- Historical PDF retrieval succeeded using the original UUID and reference; customer content stayed private.
- Full isolated MariaDB dump/restore preserved all 55 configuration snapshot hashes exactly (54 historical plus one synthetic); both test email intents remained pending.
- No live customer form submitted and no real emails sent during verification.

Staging deployment, DNS/TLS, production cutover and service retirement remain pending. Screenshots and synthetic PDF are held locally under `/private/tmp/gopods-configurator-migration/`.


## Review closure

Independent review completed (`20261013-211530-migration`, 12 lenses). Findings 2–8 are resolved: reload-safe retry identity, direct guided-loader coverage, full catalogue contract validation, order-independent import identities, populated historical snapshot assertions, one canonical systemd deployment guide and isolated request quotas. All final tests above pass. Fresh original and row-reordered exports both imported successfully without changing the 54/54/244 history counts or creating notifications.

Finding 1 proposed blocking migration teardown on populated tables. It is not an application rollback defect: the existing deployment script restores only the code symlink and explicitly retains the schema, and the migration runbook prohibits destructive downs. No supported deployment rollback invokes `down()`. The suggestion is closed without changing Laravel’s explicit schema-teardown operation.
