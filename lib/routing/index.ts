import { MockRoutingProvider } from "./mock-provider";
import type { RoutingProvider } from "./types";

export function getRoutingProvider(): RoutingProvider {
  const provider = process.env.ROUTING_PROVIDER ?? "mock";

  if (provider !== "mock") {
    throw new Error(`Unsupported routing provider: ${provider}`);
  }

  return new MockRoutingProvider();
}

export * from "./mock-provider";
export * from "./types";
