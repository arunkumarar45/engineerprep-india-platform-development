/**
 * Environment variable validation for EngineerPrep India.
 *
 * In production, the application will refuse to start if any required
 * variable is missing or uses a known-insecure default value.
 *
 * Usage: import "@/lib/env" at the top of server entry points.
 */

const DEFAULT_SECRETS = new Set([
  "engineerprep-dev-access-secret-change-me",
  "engineerprep-dev-refresh-secret-change-me",
  "CHANGE_ME_USE_A_STRONG_RANDOM_64_BYTE_HEX_SECRET",
  "CHANGE_ME_USE_A_DIFFERENT_STRONG_RANDOM_64_BYTE_HEX_SECRET",
]);

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === "") {
    throw new Error(
      `[env] Required environment variable "${name}" is not set. ` +
        `Copy .env.example to .env and fill in all required values.`,
    );
  }
  return value.trim();
}

function requireSecret(name: string): string {
  const value = requireEnv(name);
  if (DEFAULT_SECRETS.has(value)) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        `[env] FATAL: "${name}" is set to an insecure default value in production. ` +
          `Generate a strong random secret: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`,
      );
    }
    console.warn(
      `[env] WARNING: "${name}" is using a default development secret. ` +
        `Never use this in production.`,
    );
  }
  return value;
}

function optionalEnv(name: string, defaultValue = ""): string {
  return (process.env[name] ?? defaultValue).trim();
}

/** Validated and typed environment configuration. */
export const env = {
  nodeEnv: optionalEnv("NODE_ENV", "development") as
    | "development"
    | "production"
    | "test",

  isProduction: process.env.NODE_ENV === "production",
  isTest: process.env.NODE_ENV === "test",
  isDevelopment:
    !process.env.NODE_ENV ||
    process.env.NODE_ENV === "development" ||
    process.env.NODE_ENV === "test",

  // URLs
  frontendUrl: optionalEnv("FRONTEND_URL", "http://localhost:3000"),
  backendUrl: optionalEnv("BACKEND_URL", "http://localhost:4000"),

  // Database
  get databaseUrl(): string {
    return process.env.NODE_ENV === "production"
      ? requireEnv("DATABASE_URL")
      : optionalEnv(
          "DATABASE_URL",
          "postgresql://postgres:postgres@127.0.0.1:5432/app_db",
        );
  },

  // Redis
  get redisUrl(): string {
    return optionalEnv("REDIS_URL", "redis://127.0.0.1:6379");
  },

  // JWT
  get jwtAccessSecret(): string {
    return requireSecret("JWT_ACCESS_SECRET");
  },
  get jwtRefreshSecret(): string {
    return requireSecret("JWT_REFRESH_SECRET");
  },
  jwtAccessExpiresIn: optionalEnv("JWT_ACCESS_EXPIRES_IN", "15m"),
  jwtRefreshExpiresIn: optionalEnv("JWT_REFRESH_EXPIRES_IN", "7d"),

  // Email
  smtp: {
    host: optionalEnv("SMTP_HOST", ""),
    port: parseInt(optionalEnv("SMTP_PORT", "587"), 10),
    secure: optionalEnv("SMTP_SECURE", "false") === "true",
    user: optionalEnv("SMTP_USER", ""),
    password: optionalEnv("SMTP_PASSWORD", ""),
    from: optionalEnv("EMAIL_FROM", "EngineerPrep India <noreply@engineerprep.in>"),
    configured: !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD),
  },

  // File storage
  storage: {
    type: optionalEnv("STORAGE_TYPE", "local") as "local" | "s3",
    localDir: optionalEnv("STORAGE_LOCAL_DIR", "./uploads"),
    bucket: optionalEnv("STORAGE_BUCKET", ""),
    region: optionalEnv("STORAGE_REGION", ""),
    accessKey: optionalEnv("STORAGE_ACCESS_KEY", ""),
    secretKey: optionalEnv("STORAGE_SECRET_KEY", ""),
    endpoint: optionalEnv("STORAGE_ENDPOINT", ""),
  },

  // Logging
  logLevel: optionalEnv("LOG_LEVEL", "info"),

  // CORS
  corsOrigins: optionalEnv("CORS_ORIGINS", "http://localhost:3000")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean),

  // Rate limiting
  rateLimitLoginMax: parseInt(optionalEnv("RATE_LIMIT_LOGIN_MAX", "5"), 10),
  rateLimitWindowSeconds: parseInt(optionalEnv("RATE_LIMIT_WINDOW_SECONDS", "900"), 10),
} as const;

/** Call this once at server startup to validate all required env vars. */
export function validateEnvironment(): void {
  if (process.env.NODE_ENV === "production") {
    // These will throw if missing or using default secrets
    env.jwtAccessSecret;
    env.jwtRefreshSecret;
    env.databaseUrl;
    console.info("[env] Production environment validated successfully.");
  }
}

