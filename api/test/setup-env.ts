import path from 'node:path';
import dotenv from 'dotenv';

// config/index.ts validates every variable on first load. Real .env values win;
// .env.example fills the gaps where no .env exists (CI). Email verification
// defaults on (as in production) rather than to .env.example's local-dev value.
dotenv.config({ path: path.resolve(__dirname, '../../.env'), quiet: true });
process.env.REQUIRE_EMAIL_VERIFICATION ??= 'true';
dotenv.config({ path: path.resolve(__dirname, '../../.env.example'), quiet: true });
