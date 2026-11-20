import path from 'node:path';
import dotenv from 'dotenv';

// config/index.ts validates every variable on first load. Real .env values win;
// these placeholders only let in-process tests run where no .env exists (CI).
dotenv.config({
  path: path.resolve(__dirname, '../../.env'),
  quiet: true,
});

const placeholders: Record<string, string> = {
  SITE_URL: 'http://localhost:3000',
  JWT_SECRET: 'test-jwt-secret',
  REQUIRE_EMAIL_VERIFICATION: 'true',
  EMAIL_SENDING_DOMAIN: 'example.com',
  EMAIL_UNSUBSCRIBE_ADDRESS: 'unsubscribe@example.com',
  RESEND_API_KEY: 'test-resend-api-key',
  MONGODB_URI: 'mongodb://localhost:27017/mybiblelog_test',
  GOOGLE_CLIENT_ID: 'test-google-client-id',
  GOOGLE_CLIENT_SECRET: 'test-google-client-secret',
  GOOGLE_REDIRECT: 'http://localhost:3000/auth/google',
};

for (const [key, value] of Object.entries(placeholders)) {
  if (process.env[key] === undefined) {
    process.env[key] = value;
  }
}
