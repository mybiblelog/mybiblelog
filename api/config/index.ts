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
    },
    helloao: { apiBaseUrl: result.data.HELLOAO_API_BASE_URL },
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
