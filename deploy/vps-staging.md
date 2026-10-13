# VPS staging release

The existing VPS runs Node 24.21.0 at `/opt/node-v24.21.0-linux-x64/bin/node`; Docker is a local Linux build tool only. The standalone Linux amd64 artifact contains the original React interface, local public images/fonts and Next.js runtime. Laravel owns catalogue data, enquiry snapshots, CRM routing and Brevo deliveries.

## Paths and runtime

Use `/var/www/go-pods-configurator/{releases,current,shared}` with immutable, root-owned releases and an atomic `current` symlink. Run `deploy/go-pods-configurator.service` under the dedicated non-login `gopods-configurator` account. Only `shared/cache` is runtime-writable; link each release's `.next/cache` there. The service binds only `127.0.0.1:3100`. Root owns `shared/runtime.env`, group `gopods-configurator`, mode 640.

The environment contains `CONFIGURATOR_API_URL=https://api.dev.go-pods.co.uk` and a private `CONFIGURATOR_API_TOKEN` scoped to `configurator:read` and `configurator:submit`. Issue it through the API service-client command and renew before its 90-day expiry. Never put credentials into a browser bundle or build argument. Preview mode stays unset.

Nginx preserves Host and forwarded protocol for Server Actions. Staging host is `configurator.dev.go-pods.co.uk`; add `X-Robots-Tag: noindex, nofollow` there. Access logs omit query strings and referrers because PDF links carry a reference. Use the normal webroot ACME flow after the Fasthosts A record points to `213.165.91.46`, then a separate Let's Encrypt certificate and the existing renewal timer. Keep production configurator DNS unchanged during review.

## Deployment sequence

1. Require reviewed source and successful tests; record full Git SHAs for frontend, API and CRM. Build Linux amd64 using the committed Dockerfile and extract `/app` from the runtime image. Record an artifact SHA-256 and verify it after transfer.
2. Deploy API and CRM with their existing exact-SHA CI-gated scripts, preserving the currently deployed owners/viewings work. Back up before migration. Enable configurator intake for staging but keep configurator notifications and live recipients disabled.
3. Import the private Supabase snapshot with `configurator:data import`. Check counts, reference preservation and zero generated mail intents. Do not expose the import under a public directory.
4. Install the immutable standalone release, private environment and dedicated service. Validate service health and authenticated catalogue rendering before exposing the staging hostname. Configure CRM's trusted configurator origin to the staging host for review.
5. After DNS resolves, install HTTPS and verify desktop/mobile, guided quiz, submission, PDF and CRM again. Keep test email recipients separate from real visitors; never enable delivery merely to check the page. Record every staging test configuration UUID. Before enabling delivery, explicitly suppress only its still-pending customer/sales intents (`status=suppressed`, `last_error_code=staging_verification`) in a transaction; preserve the test snapshot and audit evidence. Otherwise enabling recovery would deliver those queued test messages too.

## Cutover and rollback

After visual/functional acceptance, take a fresh source export during a controlled submission pause, import the delta, and reconcile all historical UUIDs/references/totals. Set the production configurator host and CRM PDF origin; configure the existing Brevo sender, sales recipient and optional reply-to, then enable intended notification routing. Point the production A record at the VPS only after the production certificate and final checks are ready. Retain the Vercel project and Supabase backup through the rollback window, then cancel services only after successful live acceptance.

Rollback switches `current` to a compatible prior release and restarts the service. Keep durable API enquiries and notification state; never run migration downs to undo this deployment. If rolling traffic back to Vercel, account explicitly for submissions already accepted on the VPS before changing DNS. Do not re-send accepted notifications.

## Artifact and service checks

After building the reviewed image, extract without starting its application:

```sh
docker create --platform linux/amd64 --name gopods-configurator-export go-pods-configurator
docker cp gopods-configurator-export:/app/. - > configurator-runtime.tar
docker rm gopods-configurator-export
shasum -a 256 configurator-runtime.tar
```

Record that digest with the full source SHA. Verify with `sha256sum` on the VPS before unpacking into a new root-owned release. Do not overwrite `current` in place. Create `shared/cache` owned by `gopods-configurator:gopods-configurator`, mode 750, and link the new release's `.next/cache` to it. Before activating, check the exact release path:

```sh
sudo -u gopods-configurator test -r /var/www/go-pods-configurator/current/server.js
sudo -u gopods-configurator test ! -w /var/www/go-pods-configurator/current/server.js
sudo -u gopods-configurator test -w /var/www/go-pods-configurator/shared/cache
readlink -f /var/www/go-pods-configurator/current/.next/cache
sudo systemd-analyze verify /etc/systemd/system/go-pods-configurator.service
sudo nginx -t
```

The resolved cache path must be `/var/www/go-pods-configurator/shared/cache`. After starting the service, both `curl --fail http://127.0.0.1:3100/api/health` and a rendered `/configurator` request must succeed. Verify an actual image route and PDF under Node24 too; process health alone does not prove API authentication or font/image packaging.

## Data evidence

Use the API's existing private `mariadb-dump` backup procedure immediately before import, retaining its SQL gzip outside every public directory. Full database restore was exercised in isolated local MariaDB during migration verification; do not restore an old backup over accepted live enquiries. The JSON export command preserves the original source archive and editable catalogue, not operational enquiries accepted since migration.

Before and after import record non-sensitive counts:

```sql
SELECT table_name, COUNT(*) FROM configurator_import_rows GROUP BY table_name;
SELECT COUNT(*) FROM configurator_configurations;
SELECT COUNT(*) FROM enquiries WHERE type = 'configurator';
SELECT purpose, status, COUNT(*) FROM notification_deliveries
WHERE purpose IN ('configurator_customer', 'configurator_sales') GROUP BY purpose, status;
```

For the 13 October rehearsal, expected archive counts were 54 configurations, 54 enquiries and 244 items, with 54 materialized configurations and enquiries and zero delivery intents. Refresh these expected counts from the final protected export at cutover. Compare private source/archive rows by UUID and canonical content; compare every saved reference, monetary and weight snapshot, and item quantities/grouping. Reimport the identical export and an equivalent row-reordered export; neither may change counts or create deliveries. Keep customer values out of shared logs and review artifacts.
