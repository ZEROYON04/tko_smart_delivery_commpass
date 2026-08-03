import { z } from "zod";

export const deliveryMethodRequestSchema = z.object({
  method: z.enum(["handoff", "dropoff"]),
  version: z.number().int().positive(),
});

export const deliveryStatusRequestSchema = z.object({
  status: z.enum([
    "pending",
    "out_for_delivery",
    "delivered",
    "absent",
    "cancelled",
  ]),
  version: z.number().int().positive(),
});

export const locationRequestSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export const methodResultSchema = z.object({
  deliveryId: z.string().uuid(),
  deliveryMethod: z.enum(["handoff", "dropoff"]),
  serviceSeconds: z.number().int().nonnegative(),
  version: z.number().int().positive(),
});

export const statusResultSchema = z.object({
  deliveryId: z.string().uuid(),
  status: z.enum([
    "pending",
    "out_for_delivery",
    "delivered",
    "absent",
    "cancelled",
  ]),
  version: z.number().int().positive(),
});
