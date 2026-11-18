const http = require("node:http");
const https = require("node:https");

const HOP_BY_HOP = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
]);

module.exports = (request, response) => {
  let origin;

  try {
    origin = new URL(process.env.ORIGIN_URL);
    if (origin.protocol !== "http:" && origin.protocol !== "https:") {
      throw new Error("ORIGIN_URL must use http:// or https://");
    }
  } catch {
    response.statusCode = 500;
    response.end("Set ORIGIN_URL to an http:// or https:// origin.\n");
    return;
  }

  const incoming = new URL(request.url, "https://vercel.invalid");
  const routePath = request.query.path;
  const path = Array.isArray(routePath)
    ? `/${routePath.join("/")}`
    : typeof routePath === "string"
      ? `/${routePath}`
      : "/";
  const upstreamUrl = new URL(`${path}${incoming.search}`, origin);
  const transport = upstreamUrl.protocol === "https:" ? https : http;
  const headers = {};

  for (const [name, value] of Object.entries(request.headers)) {
    if (value !== undefined && name !== "host" && !HOP_BY_HOP.has(name)) {
      headers[name] = value;
    }
  }

  headers.host = upstreamUrl.host;

  const upstream = transport.request(
    upstreamUrl,
    { method: request.method, headers },
    (upstreamResponse) => {
      response.statusCode = upstreamResponse.statusCode || 502;

      for (const [name, value] of Object.entries(upstreamResponse.headers)) {
        if (value !== undefined && !HOP_BY_HOP.has(name.toLowerCase())) {
          response.setHeader(name, value);
        }
      }

      upstreamResponse.pipe(response);
    },
  );

  upstream.on("error", () => {
    if (!response.headersSent) {
      response.statusCode = 502;
      response.end("Could not connect to the configured origin.\n");
    } else {
      response.destroy();
    }
  });

  request.pipe(upstream);
};
