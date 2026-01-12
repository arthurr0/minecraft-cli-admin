import { z } from 'zod';

export const ServerConfigSchema = z.object({
  type: z.string(),
  path: z.string(),
  port: z.number().optional(),
});

export const ServerTypeConfigSchema = z.object({
  memory: z.string(),
  min_memory: z.string(),
  jvm_flags: z.array(z.string()),
});

export const ConfigSchema = z.object({
  servers: z.record(z.string(), ServerConfigSchema),
  server_types: z.record(z.string(), ServerTypeConfigSchema),
});

export type ServerConfig = z.infer<typeof ServerConfigSchema>;
export type ServerTypeConfig = z.infer<typeof ServerTypeConfigSchema>;
export type Config = z.infer<typeof ConfigSchema>;
