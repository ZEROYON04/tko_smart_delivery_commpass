import { MockRoutingProvider } from "./mock-provider";
import { OsrmRoutingProvider } from "./osrm-provider";
import type { RoutingProvider } from "./types";

export function getRoutingProvider(): RoutingProvider {
  const provider = process.env.ROUTING_PROVIDER ?? "osrm";

  if (provider === "osrm") {
    return new OsrmRoutingProvider(process.env.OSRM_BASE_URL);
  }
  if (provider === "mock") return new MockRoutingProvider();
  throw new Error(`Unsupported routing provider: ${provider}`);
}

export * from "./mock-provider";
export * from "./optimize-route";
export * from "./osrm-provider";
export * from "./types";
