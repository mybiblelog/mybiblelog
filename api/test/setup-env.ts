import path from 'node:path';
import dotenv from 'dotenv';

// config/index.ts validates every variable on first load. Real .env values win;
// .env.example fills the gaps where no .env exists (CI).
dotenv.config({
  path: [path.resolve(__dirname, '../../.env'), path.resolve(__dirname, '../../.env.example')],
  quiet: true,
});
