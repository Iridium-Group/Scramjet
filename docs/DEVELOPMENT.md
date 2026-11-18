# Development guide

This guide covers the repository layout, the local development loop, public
configuration, and where to make common changes. For the user experience and
full transport deployment walkthrough, start with the [main README](../README.md).

## Requirements and first run

- Node.js 20 or newer
- pnpm (the lockfile is `pnpm-lock.yaml`)
- Chromium for Playwright browser tests

```sh
corepack enable
pnpm install
pnpm run dev
```

Open `http://127.0.0.1:3000`. `pnpm run dev` rebuilds the generated assets
before starting the local server. The server binds to loopback only. For a
build without starting the server, use `pnpm run build`.

## Common tasks

### Change the Bromine interface

The desktop shell lives in `public/desktop.html`, `public/desktop.css`, and
`public/desktop.js`. The browser UI and settings are in `public/browser.html`,
`public/app.css`, `frontend/app.js`, and `frontend/`. Shared browser-side
features such as storage, URL handling, caching and proxy frame communication
are in `shared/` and `frontend/`. `scripts/build.js` bundles app entry points
into ignored/generated files in `public/`.

Make edits in source files, not the generated bundles. Rebuild with
`pnpm run build`; generated outputs are ignored by Git.

### Change the Scramjet standalone frontend

The source app, runtime configuration and build are under `scramjet-host/`.
`pnpm run build` builds this as well as Bromine. Its deployment is intended to
run on a separate origin. Keep the origin separation and app-origin checks in
place: embedding remote pages on the app's own origin would weaken the browser
boundary.

The core/controller versions are pinned together in
`scramjet-host/package.json`. Update them only as a compatible pair and commit
the lockfile changes. The README's [transport setup](../README.md#scramjet-transport-setup)
explains the required build variables and separate-origin deployment.

### Update network filter lists

Source lists and local exception files live in `filters/`. To update the
EasyList and EasyPrivacy snapshots:

```sh
curl -fL https://easylist.to/easylist/easylist.txt -o filters/easylist.txt
curl -fL https://easylist.to/easylist/easyprivacy.txt -o filters/easyprivacy.txt
pnpm run build
```

The build compiles lists using the official `@gorhill/ubo-core` engine. Review
the generated behavior and licensing notes before changing list sources or
exceptions. The compiled JSON is generated and ignored.

### Configure local runtime values

The build reads these optional environment variables:

| Variable | Purpose |
| --- | --- |
| `PORT` | Local server port; defaults to `3000`. |
| `BROMINE_BUILD_COMMIT` | Version label override; Vercel's commit SHA is used when present. |
| `BROMINE_SCRAMJET_ORIGIN` | Public origin for the isolated Scramjet frontend. |
| `BROMINE_BARE_URL` | Public Bare endpoint; defaults to the value in Scramjet config. |
| `BROMINE_SUPABASE_URL` | Optional Supabase project URL for Classic WebSocket relay. |
| `BROMINE_SUPABASE_PUBLISHABLE_KEY` | Optional public Supabase publishable key. Never use a service-role key. |
| `BROMINE_TEST_WISP_URL` | Test-only loopback Wisp endpoint; non-loopback values are rejected by the build. |

These are build inputs and the resulting UI configuration is public. Do not put
credentials, private Wisp URLs, or secret keys in frontend build variables.
Set an operator's private Wisp URL in that browser's Settings instead.

## Tests and diagnostics

```sh
pnpm test
pnpm exec playwright install chromium
pnpm run test:browser
pnpm run lint:app
```

Node tests use `node:test`; browser tests use Playwright and local fixtures.
Fixture success only verifies the local supported flow, not compatibility with
any particular production website. For a browser failure, inspect the page's
Loading console and request details first. For a deployment failure, verify the
origins, endpoint, deployment logs, and health endpoint of the selected
transport.

Useful health checks after deployment:

- Bare Worker: `https://<worker-host>/healthz`
- Wisp Worker/Node service: `https://<service-host>/healthz`
- Classic app: open its home page, then check server deployment logs for
  `/api/proxy` errors.

## Repository map

| Path | Role |
| --- | --- |
| `frontend/`, `public/`, `shared/` | Bromine UI and shared browser runtime. |
| `scramjet-host/` | Isolated Scramjet frontend and standalone workspace. |
| `api/`, `proxy/` | Legacy Classic HTTP(S) proxy backend. |
| `tomphttp/` | Bare v3 Worker implementation. |
| `wisp/` | Cloudflare Wisp Worker; `wisp/node/` is a Node server. |
| `supabase/functions/` | Optional authenticated Classic WebSocket relay. |
| `tests/` | Node and Playwright fixtures and tests. |
| `vercel-front-door/` | Optional HTTP reverse proxy for an operator-owned origin. |
| `docs/` | Contributor and development notes. |

## Before opening a change

Keep application UI configuration public and free of secrets. Preserve the
Scramjet separate-origin model. For proxy or relay changes, retain explicit
destination validation, resource limits, clear failure behavior, and accurate
operator documentation. Update the relevant README when a setting, command,
deployment step, or limitation changes. Run the checks relevant to the files
changed and include the result in the pull request description.

This is a community project; changes should explain what they change, how to
use them, and any known compatibility limits. Do not claim a site works based
only on local fixture coverage.
