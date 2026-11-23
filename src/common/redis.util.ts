import { ConfigService } from "@nestjs/config";
import type { RedisOptions } from "ioredis";

function optionalString(
  config: ConfigService,
  key: string,
): string | undefined {
  const value = config.get<string>(key);
  return value ? value : undefined;
}

function redisTls(config: ConfigService): Record<string, never> | undefined {
  const value = String(config.get<string>("REDIS_TLS", "")).toLowerCase();
  return value === "true" || value === "1" ? {} : undefined;
}

export function redisConnectionOptions(config: ConfigService): RedisOptions {
  return {
    host: config.get<string>("REDIS_HOST", "localhost"),
    port: config.get<number>("REDIS_PORT", 6379),
    username: optionalString(config, "REDIS_USERNAME"),
    password: optionalString(config, "REDIS_PASSWORD"),
    tls: redisTls(config),
  };
}
