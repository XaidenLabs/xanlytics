import type {
  PrpcPodsResponse,
  PrpcVersionResponse,
  PrpcStatsResponse,
} from "./types";
import http from "http";

function getEndpoint(): { hostname: string; port: number; path: string } {
  const url = new URL(process.env.PRPC_ENDPOINT || "http://127.0.0.1:6000/rpc");
  return {
    hostname: url.hostname,
    port: parseInt(url.port) || 6000,
    path: url.pathname,
  };
}

async function callPrpc<T>(
  method: string,
  params: Record<string, unknown> = {},
  host?: string
): Promise<T> {
  const defaultEndpoint = getEndpoint();

  let hostname = defaultEndpoint.hostname;
  let port = defaultEndpoint.port;
  let path = defaultEndpoint.path;

  if (host) {
    hostname = host;
    port = 6000; // Assume default pRPC port for crawlers
    path = "/rpc";
  }

  console.log(`[pRPC] Calling ${method} at ${hostname}:${port}${path}`);

  const body = JSON.stringify({
    jsonrpc: "2.0",
    id: Date.now(),
    method,
    params,
  });

  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname,
        port,
        path,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body),
        },
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            const json = JSON.parse(data);
            if (json.error) {
              reject(
                new Error(
                  `pRPC error: ${
                    json.error.message || JSON.stringify(json.error)
                  }`
                )
              );
            } else {
              console.log(`[pRPC] ${method} success`);
              resolve(json.result as T);
            }
          } catch (e) {
            reject(new Error(`Failed to parse response: ${data}`));
          }
        });
      }
    );

    req.on("error", (e) => {
      const isLocalhost = hostname === "127.0.0.1" || hostname === "localhost";
      const isConnectionError =
        e.message.includes("ECONNREFUSED") || e.message.includes("ECONNRESET");

      console.error(`[pRPC] ${method} failed:`, e.message);

      if (isLocalhost && isConnectionError) {
        console.error(
          "[pRPC] HINT: Is the SSH tunnel running? Run: ssh -L 6000:localhost:6000 root@your-pnode-ip"
        );
      }

      reject(e);
    });

    req.write(body);
    req.end();
  });
}

export const prpcClient = {
  async getPodsWithStats(host?: string): Promise<PrpcPodsResponse> {
    return callPrpc<PrpcPodsResponse>("get-pods-with-stats", {}, host);
  },

  async getVersion(host?: string): Promise<PrpcVersionResponse> {
    return callPrpc<PrpcVersionResponse>("get-version", {}, host);
  },

  async getStats(host?: string): Promise<PrpcStatsResponse> {
    return callPrpc<PrpcStatsResponse>("get-stats", {}, host);
  },
};

export default prpcClient;
