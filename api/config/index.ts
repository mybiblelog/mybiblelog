import path from 'node:path';
import dotenv from 'dotenv';
import z from 'zod';

// __dirname is absent on edge runtimes (Cloudflare Workers). In those
// environments, secrets are injected via the platform's binding mechanism
// rather than a .env file, so skipping dotenv is correct.
if (typeof __dirname !== 'undefined') {
  const isCompiled = __dirname.includes('dist');
  const envPath = isCompiled ?
    path.resolve(__dirname, '../../../.env') :
    path.resolve(__dirname, '../../.env');
  dotenv.config({ path: envPath, quiet: true });
}

const booleanStringDefaultingToTrue = z.enum(['true', 'false']).transform((val) => val !== 'false');

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  SITE_URL: z.string().url(),
  API_PORT: z.string().default('8080'),
  TEST_BYPASS_SECRET: z.string().optional(),
  JWT_SECRET: z.string().min(10, 'JWT_SECRET must be at least 10 characters long'),
  REQUIRE_EMAIL_VERIFICATION: booleanStringDefaultingToTrue,
  EMAIL_SENDING_DOMAIN: z.string(),
  EMAIL_UNSUBSCRIBE_ADDRESS: z.email(),
  RESEND_API_KEY: z.string(),
  MONGODB_URI: z.string(),
  GOOGLE_CLIENT_ID: z.string(),
  GOOGLE_CLIENT_SECRET: z.string(),
  GOOGLE_REDIRECT: z.string(),
  // Comma-separated list of additional Google OAuth client IDs accepted as the
  // audience of a native-mobile id_token (e.g. iOS / Android / web client IDs).
  // GOOGLE_CLIENT_ID is always included.
  GOOGLE_ALLOWED_CLIENT_IDS: z.string().optional(),
  MOBILE_IOS_MIN_VERSION: z.string().default('0.0.0'),
  MOBILE_ANDROID_MIN_VERSION: z.string().default('0.0.0'),
  MOBILE_IOS_LATEST_VERSION: z.string().optional(),
  MOBILE_ANDROID_LATEST_VERSION: z.string().optional(),
  MOBILE_IOS_STORE_URL: z.string().optional(),
  MOBILE_ANDROID_STORE_URL: z.string().optional(),
  HELLOAO_API_BASE_URL: z.string().url().default('https://bible.helloao.org/api'),
});

const initConfig = () => {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    // process.exit is unavailable on edge runtimes; throw is the universal mechanism.
    const details = JSON.stringify(result.error.flatten().fieldErrors);
    throw new Error(`Invalid environment variables: ${details}`);
  }

  return {
    nodeEnv: result.data.NODE_ENV,
    siteUrl: result.data.SITE_URL,
    apiPort: result.data.API_PORT || '8080',
    testBypassSecret: result.data.TEST_BYPASS_SECRET,
    jwtSecret: result.data.NODE_ENV === 'production' ? result.data.JWT_SECRET : 'secret',
    requireEmailVerification: result.data.REQUIRE_EMAIL_VERIFICATION !== false,
    emailSendingDomain: result.data.EMAIL_SENDING_DOMAIN,
    emailUnsubscribeAddress: result.data.EMAIL_UNSUBSCRIBE_ADDRESS,
    resendApiKey: result.data.RESEND_API_KEY,
    mongo: { uri: result.data.MONGODB_URI },
    google: {
      clientId: result.data.GOOGLE_CLIENT_ID,
      clientSecret: result.data.GOOGLE_CLIENT_SECRET,
      redirectUri: result.data.GOOGLE_REDIRECT,
      // Audiences accepted on a verified Google id_token. Always includes the
      // primary client ID, plus any extra (mobile/web) IDs from the env var.
      allowedClientIds: [
        ...new Set(
          [
            result.data.GOOGLE_CLIENT_ID,
            ...(result.data.GOOGLE_ALLOWED_CLIENT_IDS ?? '')
              .split(',')
              .map((id) => id.trim()),
          ].filter((id) => id.length > 0),
        ),
      ],
    },
    mobileApp: {
      minVersion: {
        ios: result.data.MOBILE_IOS_MIN_VERSION,
        android: result.data.MOBILE_ANDROID_MIN_VERSION,
      },
      latestVersion: {
        ios: result.data.MOBILE_IOS_LATEST_VERSION ?? null,
        android: result.data.MOBILE_ANDROID_LATEST_VERSION ?? null,
      },
      storeUrl: {
        ios: result.data.MOBILE_IOS_STORE_URL ?? null,
        android: result.data.MOBILE_ANDROID_STORE_URL ?? null,
      },
    },
    helloao: {
      apiBaseUrl: result.data.HELLOAO_API_BASE_URL,
    },
  };
};

type Config = ReturnType<typeof initConfig>;

let _config: Config | null = null;

export function getConfig(): Config {
  if (_config) return _config;
  _config = initConfig();
  return _config;
}

export function resetConfig(): void {
  _config = null;
}
