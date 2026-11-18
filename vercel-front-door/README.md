# Vercel reverse-proxy front door

A minimal Vercel Node.js function that forwards HTTP and HTTPS requests to an origin you control. The origin is configured with the server-side `ORIGIN_URL` environment variable; it is not included in browser code.

The proxy preserves the incoming path, query string, method, request body, response status, and ordinary headers. Set `ORIGIN_URL` to the origin only (scheme, host, and optional port), for example `https://vm.example.com` or `http://203.0.113.10:8080`. Do not include a path, query string, or fragment in the origin. The Oracle VM must accept connections from Vercel and serve the requested paths.

## 1. Set `ORIGIN_URL` in Vercel

In the Vercel dashboard, open the project and go to **Settings → Environment Variables**. Add `ORIGIN_URL` with the full origin URL and select **Production** (and **Preview** if you want preview deployments to use it). Save the value.

Or, after linking the project with the CLI as described below:

```sh
vercel env add ORIGIN_URL production
```

Enter the origin URL when prompted. Add it separately for `preview` or `development` if needed. Do not commit a real `.env` file.

## 2. Deploy

Install the Vercel CLI if needed and authenticate:

```sh
npm install --global vercel
vercel login
```

From this directory, link this folder to a new Vercel project (or to the intended existing project):

```sh
cd vercel-front-door
vercel link
```

After setting `ORIGIN_URL`, deploy a preview and then production:

```sh
vercel
vercel --prod
```

The production URL will be the project's normal `*.vercel.app` deployment URL. No framework, build step, frontend, or third-party runtime dependency is required.

## 3. Test the connection

Use your deployed URL and an endpoint that the Oracle service provides:

```sh
curl -i 'https://YOUR-PROJECT.vercel.app/health?check=1'
```

Replace `/health?check=1` with a valid origin path and query. The response should match what the origin returns. A `502` usually means the origin is unreachable from Vercel or the URL/port is incorrect; a `500` means `ORIGIN_URL` is missing or invalid. The VM firewall must allow inbound traffic on the origin port.

## 4. Change the origin later

Edit `ORIGIN_URL` under **Settings → Environment Variables** in Vercel, save, and redeploy. Environment changes apply to new deployments, not deployments that already exist.

## WebSockets and WISP

This project forwards ordinary HTTP and HTTPS only. It does not implement a WebSocket tunnel or a WISP relay, and the rewrite configuration is not WebSocket support. Vercel announced WebSocket support for Vercel Functions as generally available in October 2026, but this small HTTP proxy does not use that capability. A service that requires WebSockets/WISP will not work through this project; it needs a separately implemented WebSocket-capable relay and must comply with the applicable Vercel plan limits and usage terms.

## Scope

Use this only for an origin you own or are authorized to operate. This is a basic reverse proxy, not an access-control layer. Do not use it to evade authentication or network/content restrictions.
