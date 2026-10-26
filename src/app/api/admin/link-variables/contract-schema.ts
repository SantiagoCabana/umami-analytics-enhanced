import { z } from 'zod';

export const variableRequestSchema = z.object({
  name: z
    .string()
    .min(1)
    .max(64)
    .describe(
      'Trimmed and normalized to lowercase; must match [a-z][a-z0-9_]* after normalization.',
    ),
  value: z.string().min(1).max(2000),
});

export const variableResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  value: z.string(),
  createdAt: z.string().datetime().nullable(),
  updatedAt: z.string().datetime().nullable(),
});

export const variablePathSchema = z.object({ variableId: z.string().uuid() });

export const variableRequestBody = {
  required: true,
  content: { 'application/json': { schema: variableRequestSchema } },
};
