import http from "node:http";
import { loadEnvFile } from "node:process";

try {
  loadEnvFile(".env");
} catch {
  // Environment variables may already be supplied by the runtime.
}

const listenHost = "127.0.0.1";
const listenPort = 3002;
const upstreamOrigin = "http://127.0.0.1:3001";
const exposeRecipientPages = process.env.EXPOSE_RECIPIENT_PAGES === "true";

function isAllowedPath(pathname, method) {
  if (pathname === "/api/line/webhook" && method === "POST") return true;
  if (!exposeRecipientPages) return false;
  if (/^\/recipient\/[0-9a-f-]+$/.test(pathname) && method === "GET")
    return true;
  if (pathname.startsWith("/_next/") && method === "GET") return true;
  if (/^\/api\/deliveries\/[0-9a-f-]+$/.test(pathname) && method === "GET") {
    return true;
  }
  if (
    /^\/api\/deliveries\/[0-9a-f-]+\/(method|window|reattempt)$/.test(
      pathname,
    ) &&
    (method === "PATCH" || method === "POST")
  ) {
    return true;
  }
  return false;
}

const server = http.createServer((request, response) => {
  const requestUrl = new URL(
    request.url ?? "/",
    `http://${request.headers.host}`,
  );

  if (!isAllowedPath(requestUrl.pathname, request.method ?? "GET")) {
    response.writeHead(404, { "Content-Type": "application/json" });
    response.end(JSON.stringify({ message: "Not found" }));
    return;
  }

  const upstreamUrl = new URL(
    `${requestUrl.pathname}${requestUrl.search}`,
    upstreamOrigin,
  );
  const isPublicRecipientRoute = requestUrl.pathname !== "/api/line/webhook";
  const upstreamRequest = http.request(
    upstreamUrl,
    {
      method: request.method,
      headers: {
        ...request.headers,
        host: upstreamUrl.host,
        "x-smart-delivery-public": isPublicRecipientRoute ? "1" : "0",
      },
    },
    (upstreamResponse) => {
      response.writeHead(
        upstreamResponse.statusCode ?? 502,
        upstreamResponse.headers,
      );
      upstreamResponse.pipe(response);
    },
  );

  upstreamRequest.on("error", (error) => {
    console.error("Webhook proxy error", error);
    if (!response.headersSent) {
      response.writeHead(502, { "Content-Type": "application/json" });
    }
    response.end(JSON.stringify({ message: "Upstream unavailable" }));
  });

  request.pipe(upstreamRequest);
});

server.listen(listenPort, listenHost, () => {
  console.log(`LINE webhook proxy: http://${listenHost}:${listenPort}`);
});
