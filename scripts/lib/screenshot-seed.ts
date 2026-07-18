/**
 * Shared seed logic for the marketing screenshot generators.
 *
 * Both the web script (`scripts/take-screenshots.ts`, Playwright) and the mobile
 * script (`scripts/take-mobile-screenshots.ts`, Maestro/Android) drive the app
 * against an identical demo dataset: a screenshot user with a 30-day reading
 * history plus locale-translated notes and tags. This module owns the DB side of
 * that dataset so the two entry scripts stay in sync.
 *
 * dotenv runs here at module top: this file's imports (`useRepositories`,
 * `closeConnection`) read Mongo config at import time, and static-import hoisting
 * would otherwise evaluate them before an entry script's own dotenv call runs.
 */

/* eslint-disable no-console */
import path from 'node:path';
import dotenv from 'dotenv';
import { Bible } from '@mybiblelog/shared';
import { closeConnection } from '../../api/mongo/useCollections';
import useRepositories from '../../api/repositories/useRepositories';
import deleteAccount from '../../api/http/helpers/delete-account';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const SCREENSHOT_EMAIL = process.env.SCREENSHOT_EMAIL ?? 'demo@example.com';
export const SCREENSHOT_PASSWORD = process.env.SCREENSHOT_PASSWORD ?? 'password';

export const LOCALES = ['en', 'de', 'es', 'fr', 'ko', 'pt', 'uk'] as const;
export type Locale = typeof LOCALES[number];

// Active reading days over a 30-day window. Intentionally skips some days to look like a real
// user. Counts are higher than the original so most active days exceed the 86-verse daily goal.
// Today (daysAgo: 0) is omitted — today's entries are seeded per-screenshot for sc4.
export const DAY_PLANS: { daysAgo: number; count: number }[] = [
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

export function dateString(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// --- Locale seed data ---

export type TagSeed = { label: string; color: string; description: string };
export type NoteSeed = {
  passages: { startVerseId: number; endVerseId: number }[];
  content: string;
  tagIndices: number[];
};
export type LocaleSeedData = { tags: TagSeed[]; notes: NoteSeed[] };

export const NOTE_PASSAGES = [
  [{ startVerseId: 101001001, endVerseId: 101001002 }], // Gen 1:1-2
  [{ startVerseId: 101001026, endVerseId: 101001028 }], // Gen 1:26-28
  [{ startVerseId: 101003015, endVerseId: 101003015 }], // Gen 3:15
  [{ startVerseId: 101012001, endVerseId: 101012003 }], // Gen 12:1-3
  [{ startVerseId: 101022001, endVerseId: 101022014 }], // Gen 22:1-14
  [{ startVerseId: 101050020, endVerseId: 101050020 }], // Gen 50:20
];

// Tag index assignments: [Creation=0, Prophecy=1, Faith=2, History=3]
export const NOTE_TAG_INDICES: number[][] = [[0], [0, 2], [1], [1, 2], [1, 2], [3, 2]];

export const LOCALE_SEED_DATA: Record<Locale, LocaleSeedData> = {
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

// --- Module-level state (set during setupUser, reused by seed/delete helpers) ---

let repositories: Awaited<ReturnType<typeof useRepositories>>;
let screenshotUserId: string;

/** The screenshot user's id, valid after `setupUser()` has run. */
export function getScreenshotUserId(): string {
  return screenshotUserId;
}

// --- DB helpers ---

export async function setupUser(): Promise<void> {
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

export async function resetLocaleData(): Promise<void> {
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

export async function seedLocaleContent(locale: Locale): Promise<void> {
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

export async function teardownUser(): Promise<void> {
  await deleteAccount(SCREENSHOT_EMAIL);
  await closeConnection();
  console.log(`Deleted screenshot user: ${SCREENSHOT_EMAIL}`);
}

// --- Daily-goal (today) entries — DB half of the web script's sc4 hooks ---

// Exo 27 (21 v) + Exo 28 (43 v) + Exo 29 (46 v) = 110 new verses → 100% of the 86-verse default goal
export async function seedTodayGoalEntries(): Promise<void> {
  const today = dateString(0);
  const dailyGoalChapters: [number, number][] = [[2, 27], [2, 28], [2, 29]];
  for (const [book, chapter] of dailyGoalChapters) {
    await repositories.logEntries.create(screenshotUserId, {
      date: today,
      startVerseId: Bible.makeVerseId(book, chapter, 1),
      endVerseId: Bible.makeVerseId(book, chapter, Bible.getChapterVerseCount(book, chapter)),
    });
  }
}

export async function deleteTodayEntries(): Promise<void> {
  // Remove today's entries so reading-suggestions screens show no today reading
  // in subsequent locales.
  const today = dateString(0);
  const entries = await repositories.logEntries.listByOwner(screenshotUserId, { startDate: today, endDate: today });
  for (const entry of entries) {
    await repositories.logEntries.deleteByIdForOwner(screenshotUserId, entry.id);
  }
}
