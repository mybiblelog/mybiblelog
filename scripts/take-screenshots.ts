/**
 * Locale-specific marketing screenshot generator.
 *
 * Creates a fresh screenshot user, seeds locale-specific notes and tags for
 * each locale, captures screenshots, then deletes the user.
 *
 * Prerequisites:
 *  1. `npm run dev` is running (Nuxt at SITE_URL, API at API_BASE_URL)
 *  2. SCREENSHOT_EMAIL and SCREENSHOT_PASSWORD set in .env (or uses defaults)
 *
 * Usage:
 *   npm run screenshots
 */

/* eslint-disable no-console */
import { chromium, type BrowserContext, type Page } from 'playwright';
import sharp from 'sharp';
import fs from 'node:fs/promises';
import path from 'node:path';
import dotenv from 'dotenv';
import { Bible } from '@mybiblelog/shared';
import { closeConnection } from '../api/mongo/useCollections';
import useRepositories from '../api/repositories/useRepositories';
import deleteAccount from '../api/http/helpers/deleteAccount';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const SCREENSHOT_EMAIL = process.env.SCREENSHOT_EMAIL ?? 'demo@example.com';
const SCREENSHOT_PASSWORD = process.env.SCREENSHOT_PASSWORD ?? 'password';
const BASE_URL = process.env.SITE_URL ?? 'http://localhost:3000';

const LOCALES = ['en', 'de', 'es', 'fr', 'ko', 'pt', 'uk'] as const;
type Locale = typeof LOCALES[number];

// Mobile viewport matching existing screenshots (750×1334 logical → physical)
const MOBILE_VIEWPORT = { width: 375, height: 667 };
const MOBILE_SCALE = 2;

// Desktop viewport for sc8-install-anywhere
const DESKTOP_VIEWPORT = { width: 1069, height: 690 };

type Screen = {
  slug: string;
  path: string;
  /** Use desktop viewport instead of mobile for this screen. */
  desktop?: boolean;
  /** Called after navigation + initial wait, before CSS injection. */
  prepare?: (page: Page) => Promise<void>;
  /** Called after the screenshot is saved. */
  cleanup?: () => Promise<void>;
};

// CSS injected into every page to hide chrome that shouldn't appear in screenshots
const HIDE_UI_CSS = `
  /* Hide the feedback button */
  .floating-action-button { display: none !important; }
`;

// Active reading days over a 30-day window. Intentionally skips some days to look like a real
// user. Counts are higher than the original so most active days exceed the 86-verse daily goal.
// Today (daysAgo: 0) is omitted — today's entries are seeded per-screenshot for sc4.
const DAY_PLANS: { daysAgo: number; count: number }[] = [
  { daysAgo: 30, count: 3 },
  { daysAgo: 29, count: 3 },
  { daysAgo: 28, count: 3 },
  { daysAgo: 27, count: 4 },
  // skip 26
  { daysAgo: 25, count: 3 },
  { daysAgo: 24, count: 3 },
  { daysAgo: 23, count: 3 },
  { daysAgo: 22, count: 4 },
  // skip 21
  { daysAgo: 20, count: 3 },
  { daysAgo: 19, count: 3 },
  { daysAgo: 18, count: 3 },
  { daysAgo: 17, count: 3 },
  { daysAgo: 16, count: 3 },
  // skip 15
  { daysAgo: 14, count: 3 },
  { daysAgo: 13, count: 3 },
  { daysAgo: 12, count: 4 },
  { daysAgo: 11, count: 3 },
  // skip 10
  { daysAgo: 9, count: 3 },
  { daysAgo: 8, count: 3 },
  { daysAgo: 7, count: 3 },
  { daysAgo: 6, count: 4 },
  // skip 5
  { daysAgo: 4, count: 3 },
  { daysAgo: 3, count: 3 },
  { daysAgo: 2, count: 3 },
  // skip 1 and 0
];

function dateString(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// --- Locale seed data ---

type TagSeed = { label: string; color: string; description: string };
type NoteSeed = {
  passages: { startVerseId: number; endVerseId: number }[];
  content: string;
  tagIndices: number[];
};
type LocaleSeedData = { tags: TagSeed[]; notes: NoteSeed[] };

const NOTE_PASSAGES = [
  [{ startVerseId: 101001001, endVerseId: 101001002 }], // Gen 1:1-2
  [{ startVerseId: 101001026, endVerseId: 101001028 }], // Gen 1:26-28
  [{ startVerseId: 101003015, endVerseId: 101003015 }], // Gen 3:15
  [{ startVerseId: 101012001, endVerseId: 101012003 }], // Gen 12:1-3
  [{ startVerseId: 101022001, endVerseId: 101022014 }], // Gen 22:1-14
  [{ startVerseId: 101050020, endVerseId: 101050020 }], // Gen 50:20
];

// Tag index assignments: [Creation=0, Prophecy=1, Faith=2, History=3]
const NOTE_TAG_INDICES: number[][] = [[0], [0, 2], [1], [1, 2], [1, 2], [3, 2]];

const LOCALE_SEED_DATA: Record<Locale, LocaleSeedData> = {
  en: {
    tags: [
      { label: 'Creation', color: '#16A34A', description: "God's work in creating the world" },
      { label: 'Prophecy', color: '#7C3AED', description: 'Messianic and prophetic passages' },
      { label: 'Faith', color: '#0284C7', description: 'Verses about trust and belief' },
      { label: 'History', color: '#B45309', description: 'Historical narratives and genealogies' },
    ],
    notes: [
      { passages: NOTE_PASSAGES[0], tagIndices: NOTE_TAG_INDICES[0], content: "In the beginning God created the heavens and the earth. The Spirit hovering over the formless void — a picture of God's active presence at the very moment creation begins." },
      { passages: NOTE_PASSAGES[1], tagIndices: NOTE_TAG_INDICES[1], content: "The imago Dei — humans created in God's image and likeness. Unlike anything else in creation. This is the foundation for human dignity, purpose, and our calling to steward the earth." },
      { passages: NOTE_PASSAGES[2], tagIndices: NOTE_TAG_INDICES[2], content: "The protoevangelium: the very first hint of the gospel. The seed of the woman will crush the serpent's head — a promise pointing forward to Christ's victory over sin and death." },
      { passages: NOTE_PASSAGES[3], tagIndices: NOTE_TAG_INDICES[3], content: 'God\'s call to Abram and the Abrahamic covenant. "All peoples on earth will be blessed through you" — the scope of redemption is global from the very start. Not just one nation, but all nations.' },
      { passages: NOTE_PASSAGES[4], tagIndices: NOTE_TAG_INDICES[4], content: 'The binding of Isaac (Akedah). Abraham\'s faith is tested to its absolute limit. "God himself will provide the lamb" — prophetic words fulfilled centuries later at Calvary.' },
      { passages: NOTE_PASSAGES[5], tagIndices: NOTE_TAG_INDICES[5], content: 'Joseph to his brothers: "You intended to harm me, but God intended it for good." A profound statement on providence — God weaves even the worst human actions into his redemptive plan.' },
    ],
  },
  de: {
    tags: [
      { label: 'Schöpfung', color: '#16A34A', description: 'Gottes Werk bei der Erschaffung der Welt' },
      { label: 'Prophetie', color: '#7C3AED', description: 'Messianische und prophetische Textstellen' },
      { label: 'Glaube', color: '#0284C7', description: 'Verse über Vertrauen und Glauben' },
      { label: 'Geschichte', color: '#B45309', description: 'Historische Erzählungen und Genealogien' },
    ],
    notes: [
      { passages: NOTE_PASSAGES[0], tagIndices: NOTE_TAG_INDICES[0], content: 'Im Anfang schuf Gott die Himmel und die Erde. Der Geist schwebte über dem formlosen Chaos — ein Bild von Gottes aktivem Wirken genau in dem Moment, als die Schöpfung beginnt.' },
      { passages: NOTE_PASSAGES[1], tagIndices: NOTE_TAG_INDICES[1], content: 'Die Imago Dei — der Mensch als Abbild und Gleichnis Gottes. Einzigartig in der gesamten Schöpfung. Dies ist das Fundament der Menschenwürde, unseres Zwecks und unserer Berufung, die Erde zu hüten.' },
      { passages: NOTE_PASSAGES[2], tagIndices: NOTE_TAG_INDICES[2], content: 'Das Protoevangelium: der allererste Hinweis auf das Evangelium. Der Same der Frau wird der Schlange den Kopf zertreten — eine Verheißung, die auf Christi Sieg über Sünde und Tod vorausweist.' },
      { passages: NOTE_PASSAGES[3], tagIndices: NOTE_TAG_INDICES[3], content: 'Gottes Ruf an Abram und der Abrahamsbund. „In dir sollen alle Völker der Erde gesegnet werden" — der Umfang der Erlösung ist von Anfang an global. Nicht nur ein Volk, sondern alle Völker.' },
      { passages: NOTE_PASSAGES[4], tagIndices: NOTE_TAG_INDICES[4], content: 'Die Bindung Isaaks (Akedah). Abrahams Glaube wird aufs Äußerste geprüft. „Gott selbst wird das Lamm bereiten" — prophetische Worte, die Jahrhunderte später am Kreuz erfüllt wurden.' },
      { passages: NOTE_PASSAGES[5], tagIndices: NOTE_TAG_INDICES[5], content: 'Josef zu seinen Brüdern: „Ihr gedachtet es böse mit mir, aber Gott gedachte es gut zu machen." Eine tiefe Aussage über die Vorsehung — Gott webt sogar die schlimmsten menschlichen Handlungen in seinen Erlösungsplan ein.' },
    ],
  },
  es: {
    tags: [
      { label: 'Creación', color: '#16A34A', description: 'La obra de Dios en la creación del mundo' },
      { label: 'Profecía', color: '#7C3AED', description: 'Pasajes mesiánicos y proféticos' },
      { label: 'Fe', color: '#0284C7', description: 'Versículos sobre la confianza y la creencia' },
      { label: 'Historia', color: '#B45309', description: 'Narrativas históricas y genealogías' },
    ],
    notes: [
      { passages: NOTE_PASSAGES[0], tagIndices: NOTE_TAG_INDICES[0], content: 'En el principio Dios creó los cielos y la tierra. El Espíritu se cernía sobre el caos informe — una imagen de la presencia activa de Dios en el preciso momento en que comienza la creación.' },
      { passages: NOTE_PASSAGES[1], tagIndices: NOTE_TAG_INDICES[1], content: 'La imago Dei — el ser humano creado a imagen y semejanza de Dios. Diferente a todo lo demás en la creación. Este es el fundamento de la dignidad humana, nuestro propósito y nuestro llamado a administrar la tierra.' },
      { passages: NOTE_PASSAGES[2], tagIndices: NOTE_TAG_INDICES[2], content: 'El protoevangelio: el primer indicio del evangelio. La simiente de la mujer aplastará la cabeza de la serpiente — una promesa que apunta a la victoria de Cristo sobre el pecado y la muerte.' },
      { passages: NOTE_PASSAGES[3], tagIndices: NOTE_TAG_INDICES[3], content: 'El llamado de Dios a Abram y el pacto abrahámico. "En ti serán benditas todas las familias de la tierra" — el alcance de la redención es global desde el principio. No solo una nación, sino todas las naciones.' },
      { passages: NOTE_PASSAGES[4], tagIndices: NOTE_TAG_INDICES[4], content: 'El sacrificio de Isaac (Akedá). La fe de Abraham es puesta a prueba hasta su límite absoluto. "Dios proveerá el cordero" — palabras proféticas cumplidas siglos después en el Calvario.' },
      { passages: NOTE_PASSAGES[5], tagIndices: NOTE_TAG_INDICES[5], content: 'José a sus hermanos: "Vosotros pensasteis hacerme mal, pero Dios lo encaminó a bien." Una profunda declaración sobre la providencia — Dios teje incluso las peores acciones humanas en su plan redentor.' },
    ],
  },
  fr: {
    tags: [
      { label: 'Création', color: '#16A34A', description: "L'œuvre de Dieu dans la création du monde" },
      { label: 'Prophétie', color: '#7C3AED', description: 'Passages messianiques et prophétiques' },
      { label: 'Foi', color: '#0284C7', description: 'Versets sur la confiance et la croyance' },
      { label: 'Histoire', color: '#B45309', description: 'Récits historiques et généalogies' },
    ],
    notes: [
      { passages: NOTE_PASSAGES[0], tagIndices: NOTE_TAG_INDICES[0], content: "Au commencement Dieu créa les cieux et la terre. L'Esprit planait sur le chaos informe — une image de la présence active de Dieu au moment même où la création commence." },
      { passages: NOTE_PASSAGES[1], tagIndices: NOTE_TAG_INDICES[1], content: "L'imago Dei — l'être humain créé à l'image et à la ressemblance de Dieu. Différent de tout le reste dans la création. C'est le fondement de la dignité humaine, de notre vocation et de notre appel à prendre soin de la terre." },
      { passages: NOTE_PASSAGES[2], tagIndices: NOTE_TAG_INDICES[2], content: 'Le protévangile : le tout premier signe de la bonne nouvelle. La semence de la femme écrasera la tête du serpent — une promesse qui pointe vers la victoire du Christ sur le péché et la mort.' },
      { passages: NOTE_PASSAGES[3], tagIndices: NOTE_TAG_INDICES[3], content: "L'appel de Dieu à Abram et l'alliance abrahamique. « En toi seront bénies toutes les familles de la terre » — la portée de la rédemption est mondiale dès le début. Pas seulement une nation, mais toutes les nations." },
      { passages: NOTE_PASSAGES[4], tagIndices: NOTE_TAG_INDICES[4], content: "Le sacrifice d'Isaac (Akéda). La foi d'Abraham est mise à l'épreuve jusqu'à sa limite absolue. « Dieu lui-même pourvoira l'agneau » — des paroles prophétiques accomplies des siècles plus tard au Calvaire." },
      { passages: NOTE_PASSAGES[5], tagIndices: NOTE_TAG_INDICES[5], content: "Joseph à ses frères : « Vous aviez médité de me faire du mal, mais Dieu l'a voulu pour mon bien. » Une profonde déclaration sur la providence — Dieu tisse même les pires actions humaines dans son plan rédempteur." },
    ],
  },
  ko: {
    tags: [
      { label: '창조', color: '#16A34A', description: '세상을 창조하신 하나님의 역사' },
      { label: '예언', color: '#7C3AED', description: '메시아적이고 예언적인 구절들' },
      { label: '믿음', color: '#0284C7', description: '신뢰와 믿음에 관한 구절들' },
      { label: '역사', color: '#B45309', description: '역사적 이야기와 족보' },
    ],
    notes: [
      { passages: NOTE_PASSAGES[0], tagIndices: NOTE_TAG_INDICES[0], content: '태초에 하나님이 천지를 창조하시니라. 성령께서 형체 없는 혼돈 위에 운행하심 — 창조가 시작되는 바로 그 순간 하나님의 능동적인 임재를 보여주는 그림입니다.' },
      { passages: NOTE_PASSAGES[1], tagIndices: NOTE_TAG_INDICES[1], content: '하나님의 형상(Imago Dei) — 인간은 하나님의 형상과 모양대로 창조되었습니다. 창조물 중 그 어느 것과도 다릅니다. 이것이 인간 존엄성과 목적, 그리고 땅을 다스리라는 우리 소명의 기초입니다.' },
      { passages: NOTE_PASSAGES[2], tagIndices: NOTE_TAG_INDICES[2], content: '원시복음: 복음의 가장 첫 번째 암시. 여자의 후손이 뱀의 머리를 상하게 하리라 — 그리스도의 죄와 사망에 대한 승리를 예언하는 약속입니다.' },
      { passages: NOTE_PASSAGES[3], tagIndices: NOTE_TAG_INDICES[3], content: '하나님이 아브람을 부르심과 아브라함 언약. "땅의 모든 족속이 너로 말미암아 복을 얻을 것이라" — 구속의 범위는 처음부터 전 세계적입니다. 한 민족뿐만 아니라 모든 민족을 위한 것입니다.' },
      { passages: NOTE_PASSAGES[4], tagIndices: NOTE_TAG_INDICES[4], content: '이삭의 결박(아케다). 아브라함의 믿음이 극한까지 시험받습니다. "하나님이 친히 번제할 어린 양을 준비하시리라" — 수 세기 후 갈보리에서 이루어진 예언적인 말씀입니다.' },
      { passages: NOTE_PASSAGES[5], tagIndices: NOTE_TAG_INDICES[5], content: '요셉이 형제들에게: "당신들은 나를 해하려 하였으나 하나님은 그것을 선으로 바꾸셨습니다." 하나님의 섭리에 대한 깊은 고백 — 하나님은 인간의 가장 나쁜 행동조차도 그분의 구속 계획 속에 엮으십니다.' },
    ],
  },
  pt: {
    tags: [
      { label: 'Criação', color: '#16A34A', description: 'A obra de Deus na criação do mundo' },
      { label: 'Profecia', color: '#7C3AED', description: 'Passagens messiânicas e proféticas' },
      { label: 'Fé', color: '#0284C7', description: 'Versículos sobre confiança e crença' },
      { label: 'História', color: '#B45309', description: 'Narrativas históricas e genealogias' },
    ],
    notes: [
      { passages: NOTE_PASSAGES[0], tagIndices: NOTE_TAG_INDICES[0], content: 'No princípio Deus criou os céus e a terra. O Espírito pairava sobre o caos informe — uma imagem da presença ativa de Deus no exato momento em que a criação começa.' },
      { passages: NOTE_PASSAGES[1], tagIndices: NOTE_TAG_INDICES[1], content: 'A imago Dei — o ser humano criado à imagem e semelhança de Deus. Diferente de tudo o mais na criação. Este é o fundamento da dignidade humana, do nosso propósito e da nossa vocação de cuidar da terra.' },
      { passages: NOTE_PASSAGES[2], tagIndices: NOTE_TAG_INDICES[2], content: 'O protoevangelho: o primeiro indício do evangelho. A semente da mulher esmagará a cabeça da serpente — uma promessa que aponta para a vitória de Cristo sobre o pecado e a morte.' },
      { passages: NOTE_PASSAGES[3], tagIndices: NOTE_TAG_INDICES[3], content: 'O chamado de Deus a Abrão e a aliança abraâmica. "Em ti serão abençoadas todas as famílias da terra" — o alcance da redenção é global desde o início. Não só uma nação, mas todas as nações.' },
      { passages: NOTE_PASSAGES[4], tagIndices: NOTE_TAG_INDICES[4], content: 'O sacrifício de Isaque (Akedá). A fé de Abraão é testada até o seu limite absoluto. "Deus mesmo proverá o cordeiro" — palavras proféticas cumplidas séculos depois no Calvário.' },
      { passages: NOTE_PASSAGES[5], tagIndices: NOTE_TAG_INDICES[5], content: 'José a seus irmãos: "Vocês planejaram o mal contra mim, mas Deus o transformou em bem." Uma profunda declaração sobre a providência — Deus entrelaça até as piores ações humanas em seu plano redentor.' },
    ],
  },
  uk: {
    tags: [
      { label: 'Творіння', color: '#16A34A', description: 'Творчий задум Бога у створенні світу' },
      { label: 'Пророцтво', color: '#7C3AED', description: 'Месіанські та пророчі уривки' },
      { label: 'Віра', color: '#0284C7', description: 'Вірші про довіру та віру' },
      { label: 'Історія', color: '#B45309', description: 'Історичні оповіді та родоводи' },
    ],
    notes: [
      { passages: NOTE_PASSAGES[0], tagIndices: NOTE_TAG_INDICES[0], content: 'На початку Бог створив небо і землю. Дух ширяв над безформним хаосом — образ активної присутності Бога в той самий момент, коли починається творіння.' },
      { passages: NOTE_PASSAGES[1], tagIndices: NOTE_TAG_INDICES[1], content: 'Imago Dei — людина, створена за образом і подобою Бога. Ні з чим іншим у творінні не зрівнятися. Це основа людської гідності, нашого призначення і покликання бути охоронцями землі.' },
      { passages: NOTE_PASSAGES[2], tagIndices: NOTE_TAG_INDICES[2], content: 'Першоєвангеліє: перший натяк на Євангеліє. Насіння жінки зітре голову змія — обіцянка, що вказує вперед на перемогу Христа над гріхом і смертю.' },
      { passages: NOTE_PASSAGES[3], tagIndices: NOTE_TAG_INDICES[3], content: 'Покликання Бога до Аврама та Авраамів завіт. «У тобі благословляться всі племена землі» — масштаб спасіння є всесвітнім від самого початку. Не лише один народ, а всі народи.' },
      { passages: NOTE_PASSAGES[4], tagIndices: NOTE_TAG_INDICES[4], content: 'Жертвоприношення Ісаака (Акеда). Авраамова віра піддається абсолютному випробуванню. «Бог сам призначить собі агнця для жертвопалення» — пророчі слова, що виповнилися через кілька століть на Голгофі.' },
      { passages: NOTE_PASSAGES[5], tagIndices: NOTE_TAG_INDICES[5], content: 'Йосип братам: «Ви задумали зле проти мене, та Бог задумав це на добро». Глибоке висловлювання про провидіння — Бог вплітає навіть найгірші людські вчинки у свій план спасіння.' },
    ],
  },
};

// --- Module-level state (set during setupUser, reused by seed/delete/prepare helpers) ---

let repositories: Awaited<ReturnType<typeof useRepositories>>;
let screenshotUserId: string;

// --- DB helpers ---

async function setupUser(): Promise<void> {
  const deleted = await deleteAccount(SCREENSHOT_EMAIL);
  if (deleted) {
    console.log(`Removed existing screenshot user: ${SCREENSHOT_EMAIL}`);
  }

  repositories = await useRepositories();

  const user = await repositories.users.create({
    email: SCREENSHOT_EMAIL,
    password: SCREENSHOT_PASSWORD,
    locale: 'en',
    emailVerificationCode: '', // empty code marks the account as already verified
  });
  // Backdate the look-back window so calendar/progress views show history.
  await repositories.users.updateSettings(user.id, { lookBackDate: dateString(30) });
  screenshotUserId = user.id;
  console.log(`Created screenshot user: ${SCREENSHOT_EMAIL}`);

  // Sequential chapter readings: Genesis 1-50, then Exodus 1-26 (76 chapters total)
  const chapters: [number, number][] = [];
  for (let ch = 1; ch <= 50; ch++) chapters.push([1, ch]);
  for (let ch = 1; ch <= 26; ch++) chapters.push([2, ch]);

  let chapterIdx = 0;
  let logEntryCount = 0;
  for (const { daysAgo, count } of DAY_PLANS) {
    const date = dateString(daysAgo);
    for (let i = 0; i < count && chapterIdx < chapters.length; i++) {
      const [book, chapter] = chapters[chapterIdx++];
      const startVerseId = Bible.makeVerseId(book, chapter, 1);
      const endVerseId = Bible.makeVerseId(book, chapter, Bible.getChapterVerseCount(book, chapter));
      await repositories.logEntries.create(screenshotUserId, { date, startVerseId, endVerseId });
      logEntryCount++;
    }
  }

  console.log(`Created ${logEntryCount} log entries across ${DAY_PLANS.length} active days`);
}

async function resetLocaleData(): Promise<void> {
  await repositories.passageNotes.deleteAllByOwner(screenshotUserId);
  await repositories.passageNoteTags.deleteAllByOwner(screenshotUserId);
  // Delete any Jude log entry so sc2 can click it fresh for the achievement modal
  const judeStart = Bible.makeVerseId(65, 1, 1);
  const entries = await repositories.logEntries.listByOwner(screenshotUserId);
  for (const entry of entries) {
    if (entry.startVerseId === judeStart) {
      await repositories.logEntries.deleteByIdForOwner(screenshotUserId, entry.id);
    }
  }
}

async function seedLocaleContent(locale: Locale): Promise<void> {
  const { tags: tagSeeds, notes: noteSeeds } = LOCALE_SEED_DATA[locale];
  // Create tags first so their ids can be referenced by the notes below.
  const tagRecords = await Promise.all(
    tagSeeds.map(tag => repositories.passageNoteTags.create(screenshotUserId, tag)),
  );
  await Promise.all(
    noteSeeds.map(note => repositories.passageNotes.create(screenshotUserId, {
      passages: note.passages,
      content: note.content,
      tags: note.tagIndices.map(i => tagRecords[i].id),
    })),
  );
  console.log(`  Seeded ${tagRecords.length} tags and ${noteSeeds.length} notes for ${locale}`);
}

async function teardownUser(): Promise<void> {
  await deleteAccount(SCREENSHOT_EMAIL);
  await closeConnection();
  console.log(`Deleted screenshot user: ${SCREENSHOT_EMAIL}`);
}

// --- Per-screen prepare / cleanup functions ---

async function prepareReadingSuggestions(page: Page): Promise<void> {
  // Reading suggestions load async — wait until at least one action button is visible
  await page.waitForSelector(
    '[data-testid="reading-suggestions"] .action-menu-button',
    { timeout: 10000 },
  );
  const firstButton = page
    .locator('[data-testid="reading-suggestions"] .action-menu-button')
    .first();
  await firstButton.click();
  await page.waitForSelector('.action-menu', { timeout: 2000 });
  await page.waitForTimeout(200);
}

async function prepareAchievements(page: Page): Promise<void> {
  // Wait for all 66 book cards to finish rendering (computed async with setImmediate yields)
  await page.waitForFunction(
    () => document.querySelectorAll('.book-card').length >= 66,
    { timeout: 30000 },
  );
  // Jude is book 65 — 0-indexed position 64 in the book list
  const judeCard = page.locator('.book-card').nth(64);
  await judeCard.scrollIntoViewIfNeeded();
  await judeCard.locator('.book-card--chapter-toggle').click();
  await page.waitForSelector('.book-card:nth-child(65) .chapter-card', { timeout: 3000 });
  await judeCard.locator('.chapter-card').first().click();
  // Wait for the achievement modal to appear and the star animation to begin
  await page.waitForSelector('.popup-modal', { timeout: 5000 });
  await page.waitForTimeout(500);
}

// Exo 27 (21 v) + Exo 28 (43 v) + Exo 29 (46 v) = 110 new verses → 100% of the 86-verse default goal
async function prepareDailyGoal(page: Page): Promise<void> {
  const today = dateString(0);
  const dailyGoalChapters: [number, number][] = [[2, 27], [2, 28], [2, 29]];
  for (const [book, chapter] of dailyGoalChapters) {
    await repositories.logEntries.create(screenshotUserId, {
      date: today,
      startVerseId: Bible.makeVerseId(book, chapter, 1),
      endVerseId: Bible.makeVerseId(book, chapter, Bible.getChapterVerseCount(book, chapter)),
    });
  }
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForSelector('[data-screenshot="daily-goal"]', { timeout: 5000 });
  await page.waitForTimeout(800);
}

async function cleanupDailyGoal(): Promise<void> {
  // Remove today's entries so sc1 (reading suggestions) shows no today reading in subsequent locales
  const today = dateString(0);
  const entries = await repositories.logEntries.listByOwner(screenshotUserId, { startDate: today, endDate: today });
  for (const entry of entries) {
    await repositories.logEntries.deleteByIdForOwner(screenshotUserId, entry.id);
  }
}

async function prepareChecklist(page: Page): Promise<void> {
  await page.waitForFunction(
    () => document.querySelectorAll('.book-card').length >= 66,
    { timeout: 30000 },
  );
  // Exodus is book 2 — 0-indexed position 1
  const exodusCard = page.locator('.book-card').nth(1);
  await exodusCard.scrollIntoViewIfNeeded();
  await exodusCard.locator('.book-card--chapter-toggle').click();
  await page.waitForSelector('.book-card:nth-child(2) .chapter-card', { timeout: 3000 });
  await page.waitForTimeout(400);
}

// --- Screen list ---

const SCREENS: Screen[] = [
  // Today page — reading suggestions heading + list, with first suggestion's action menu open
  { slug: 'sc1-reading-suggestions', path: '/today', prepare: prepareReadingSuggestions },
  // Checklist page — Jude clicked to trigger achievement modal
  { slug: 'sc2-achievements', path: '/checklist', prepare: prepareAchievements },
  // Today page — daily goal progress bar at 100%
  { slug: 'sc4-daily-goal', path: '/today', prepare: prepareDailyGoal, cleanup: cleanupDailyGoal },
  // Individual book (Genesis) — chapter-by-chapter progress grid
  { slug: 'sc6-book-chapter-progress', path: '/books/1' },
  // Bible Books page — segmented progress bar plaque (shows whole-Bible progress)
  { slug: 'sc7-bible-progress', path: '/books' },
  // Today page at desktop viewport — shows app running in a browser window
  { slug: 'sc8-install-anywhere', path: '/today', desktop: true },
  // Calendar page — full page
  { slug: 'sc9-calendar', path: '/calendar' },
  // Notes page — full page
  { slug: 'sc10-notes', path: '/notes' },
  // Tags page — tag list with sidebar
  { slug: 'sc11-note-tags', path: '/tags' },
  // Checklist page — Exodus accordion expanded to show chapter checkboxes
  { slug: 'sc12-checklist', path: '/checklist', prepare: prepareChecklist },
  // Reading progress stats page — full page
  { slug: 'sc13-progress', path: '/progress' },
];

// --- Screenshot helpers ---

function localeUrlPath(locale: Locale, appPath: string): string {
  return locale === 'en' ? appPath : `/${locale}${appPath}`;
}

async function login(page: Page, locale: Locale): Promise<void> {
  const loginPath = localeUrlPath(locale, '/login');
  console.log(`   Logging in at ${loginPath}`);
  await page.goto(`${BASE_URL}${loginPath}`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(500);
  await page.waitForSelector('form', { timeout: 2000 });
  await page.waitForSelector('main', { timeout: 2000 });

  const emailLocator = page.locator('form input[type="text"]');
  const passwordLocator = page.locator('form input[type="password"]');
  const submitButton = page.locator('form button').first();

  await emailLocator.waitFor({ state: 'visible', timeout: 2000 });
  await passwordLocator.waitFor({ state: 'visible', timeout: 2000 });
  await submitButton.waitFor({ state: 'visible', timeout: 2000 });

  if (!(await emailLocator.count())) {
    throw new Error('Login page email input was not found');
  }
  if (!(await passwordLocator.count())) {
    throw new Error('Login page password input was not found');
  }
  if (!(await submitButton.count())) {
    throw new Error('Login page submit button was not found');
  }

  console.log('   Filling login form');
  await emailLocator.fill(SCREENSHOT_EMAIL);
  await passwordLocator.fill(SCREENSHOT_PASSWORD);

  console.log('   Submitting login form');
  await submitButton.click({ force: true });
  await page.waitForTimeout(1200);

  try {
    await page.waitForURL(url => !url.pathname.includes('/login'), { timeout: 15000 });
  }
  catch (error) {
    const failurePath = path.join('scripts', `login-failure-${locale}.png`);
    console.error(`   Login did not navigate away from /login, saving ${failurePath}`);
    await page.screenshot({ path: failurePath, fullPage: true });
    throw error;
  }
}

async function savePngAndWebp(pngPath: string): Promise<void> {
  const webpPath = pngPath.replace(/\.png$/, '.webp');
  await fs.mkdir(path.dirname(pngPath), { recursive: true });
  await sharp(pngPath).webp({ quality: 85 }).toFile(webpPath);
  await fs.unlink(pngPath);
  console.log(`  ✓ ${webpPath}`);
}

async function screenshotLocale(locale: Locale, page: Page): Promise<void> {
  console.log(`\n📸 Locale: ${locale}`);

  const outDir = path.join('nuxt/static/screenshots', locale);
  await page.context().addCookies([
    {
      name: 'i18n_redirected',
      value: locale,
      domain: 'localhost',
      path: '/',
    },
  ]);

  for (const screen of SCREENS) {
    const viewport = screen.desktop ? DESKTOP_VIEWPORT : MOBILE_VIEWPORT;
    await page.setViewportSize(viewport);

    const localizedPath = localeUrlPath(locale, screen.path);
    const targetUrl = `${BASE_URL}${localizedPath}`;
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded' });
    console.log(`    Navigated to ${page.url()}`);

    await page.waitForSelector('body', { state: 'visible', timeout: 5000 });
    await page.waitForTimeout(500);

    if (screen.prepare) {
      await screen.prepare(page);
    }

    await page.addStyleTag({ content: HIDE_UI_CSS });
    await page.waitForTimeout(300);

    const pngPath = path.join(outDir, `${screen.slug}.png`);
    await fs.mkdir(outDir, { recursive: true });
    await page.screenshot({ path: pngPath, type: 'png' });
    await savePngAndWebp(pngPath);

    if (screen.cleanup) {
      await screen.cleanup();
    }
  }
}

async function main(): Promise<void> {
  const headlessEnv = process.env.SCREENSHOT_HEADLESS?.toLowerCase();
  const headless = headlessEnv !== null
    ? headlessEnv !== 'false' && headlessEnv !== '0'
    : process.env.CI === 'true';

  console.log('🚀 Starting locale screenshot generation');
  console.log(`   Base URL: ${BASE_URL}`);
  console.log(`   Account:  ${SCREENSHOT_EMAIL}`);
  console.log(`   Locales:  ${LOCALES.join(', ')}`);
  console.log(`   Headless: ${headless}`);

  await setupUser();

  const browser = await chromium.launch({ headless });
  const context: BrowserContext = await browser.newContext({
    viewport: MOBILE_VIEWPORT,
    deviceScaleFactor: MOBILE_SCALE,
  });
  const page: Page = await context.newPage();

  await login(page, 'en');

  try {
    for (const locale of LOCALES) {
      await resetLocaleData();
      await seedLocaleContent(locale);
      await screenshotLocale(locale, page);
    }
  }
  finally {
    await context.close();
    await browser.close();
    await teardownUser();
  }

  console.log('\n✅ Done. Screenshots saved to nuxt/static/screenshots/{locale}/');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
