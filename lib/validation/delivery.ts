import { z } from "zod";

export const dropoffLocationSchema = z.enum([
  "front_door",
  "delivery_box",
  "gas_meter_box",
  "bicycle_basket",
  "building_reception",
  "other",
]);

export const deliveryMethodRequestSchema = z.discriminatedUnion("method", [
  z.object({
    method: z.literal("handoff"),
    dropoffLocation: z.null().optional(),
    version: z.number().int().positive(),
  }),
  z.object({
    method: z.literal("dropoff"),
    dropoffLocation: dropoffLocationSchema,
    version: z.number().int().positive(),
  }),
]);

const deliveryDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const parsed = new Date(`${value}T00:00:00Z`);
    return (
      !Number.isNaN(parsed.getTime()) && parsed.toISOString().startsWith(value)
    );
  });

export const deliveryDateRequestSchema = z.object({
  deliveryDate: deliveryDateSchema,
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

export const reattemptRequestSchema = z.object({
  deliveryDate: deliveryDateSchema,
  windowCode: z.string().min(1).max(20),
  version: z.number().int().positive(),
});

export const deliveryWindowRequestSchema = z.object({
  deliveryDate: deliveryDateSchema,
  windowCode: z.string().min(1).max(20),
  version: z.number().int().positive(),
});

export const optimizeRunRequestSchema = z.object({
  reason: z.string().min(1).max(120).optional(),
});

export const methodResultSchema = z.object({
  deliveryId: z.string().uuid(),
  deliveryMethod: z.enum(["handoff", "dropoff"]),
  dropoffLocation: dropoffLocationSchema.nullable(),
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
