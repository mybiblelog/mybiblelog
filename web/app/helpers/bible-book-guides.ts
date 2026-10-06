// Language-neutral data for the public Books of the Bible pages
// (pages/books-of-the-bible). Index 0 = Genesis (bibleOrder 1).
// The per-locale overview prose lives in ./bible-book-overviews/<locale>.ts;
// passage references are built per locale from Bible.getBookName(book, locale).

export type BibleBookSection =
  | 'law'
  | 'history'
  | 'poetry_wisdom'
  | 'major_prophets'
  | 'minor_prophets'
  | 'gospels'
  | 'letters_of_paul'
  | 'general_letters'
  | 'prophecy';

export type BibleBookGuide = {
  section: BibleBookSection;
  /** Chapter/verse references within this book, e.g. "1:1–2:3". */
  keyPassages: string[];
};

const bibleBookGuides: readonly BibleBookGuide[] = [
  { section: 'law', keyPassages: ['1:1–2:3', '12:1–3', '50:20'] },
  { section: 'law', keyPassages: ['3:1–15', '14', '20:1–17'] },
  { section: 'law', keyPassages: ['16', '19:18', '23'] },
  { section: 'law', keyPassages: ['6:24–26', '13–14', '21:4–9'] },
  { section: 'law', keyPassages: ['6:4–9', '30:15–20', '34'] },
  { section: 'history', keyPassages: ['1:1–9', '6', '24:14–15'] },
  { section: 'history', keyPassages: ['2:10–19', '4–5', '21:25'] },
  { section: 'history', keyPassages: ['1:16–17', '4:13–22'] },
  { section: 'history', keyPassages: ['3', '16:7', '17'] },
  { section: 'history', keyPassages: ['7', '11–12', '22'] },
  { section: 'history', keyPassages: ['3', '8', '18–19'] },
  { section: 'history', keyPassages: ['2', '5', '17', '25'] },
  { section: 'history', keyPassages: ['16:8–36', '17', '29:10–13'] },
  { section: 'history', keyPassages: ['7:14', '34', '36:22–23'] },
  { section: 'history', keyPassages: ['1', '3:10–13', '7:10'] },
  { section: 'history', keyPassages: ['1', '4', '8'] },
  { section: 'history', keyPassages: ['4:14', '7', '9:20–28'] },
  { section: 'poetry_wisdom', keyPassages: ['1–2', '19:25–27', '38–42'] },
  { section: 'poetry_wisdom', keyPassages: ['1', '23', '51', '119'] },
  { section: 'poetry_wisdom', keyPassages: ['1:7', '3:5–6', '31:10–31'] },
  { section: 'poetry_wisdom', keyPassages: ['1:1–11', '3:1–8', '12:13–14'] },
  { section: 'poetry_wisdom', keyPassages: ['2:10–13', '8:6–7'] },
  { section: 'major_prophets', keyPassages: ['6', '9:6–7', '40', '53'] },
  { section: 'major_prophets', keyPassages: ['1:4–10', '29:11', '31:31–34'] },
  { section: 'major_prophets', keyPassages: ['3:21–26'] },
  { section: 'major_prophets', keyPassages: ['1', '36:26–27', '37:1–14'] },
  { section: 'major_prophets', keyPassages: ['3', '6', '7:13–14'] },
  { section: 'minor_prophets', keyPassages: ['3:1', '6:6', '11:1–9'] },
  { section: 'minor_prophets', keyPassages: ['2:12–13', '2:28–32'] },
  { section: 'minor_prophets', keyPassages: ['5:21–24', '9:11–15'] },
  { section: 'minor_prophets', keyPassages: ['1:15', '1:21'] },
  { section: 'minor_prophets', keyPassages: ['1–2', '4:2', '4:10–11'] },
  { section: 'minor_prophets', keyPassages: ['5:2', '6:8'] },
  { section: 'minor_prophets', keyPassages: ['1:7', '1:15'] },
  { section: 'minor_prophets', keyPassages: ['1:2–4', '2:4', '3:17–19'] },
  { section: 'minor_prophets', keyPassages: ['1:14–18', '3:17'] },
  { section: 'minor_prophets', keyPassages: ['1:3–8', '2:4–9'] },
  { section: 'minor_prophets', keyPassages: ['4:6', '9:9'] },
  { section: 'minor_prophets', keyPassages: ['3:1', '3:10', '4:5–6'] },
  { section: 'gospels', keyPassages: ['5–7', '16:13–20', '28:18–20'] },
  { section: 'gospels', keyPassages: ['1:14–15', '8:27–38', '10:45'] },
  { section: 'gospels', keyPassages: ['2:1–20', '10:25–37', '15'] },
  { section: 'gospels', keyPassages: ['1:1–18', '3:16', '20:30–31'] },
  { section: 'history', keyPassages: ['1:8', '2', '9:1–19'] },
  { section: 'letters_of_paul', keyPassages: ['3:21–26', '8', '12:1–2'] },
  { section: 'letters_of_paul', keyPassages: ['13', '15:1–8'] },
  { section: 'letters_of_paul', keyPassages: ['4:7–18', '5:17–21', '12:9'] },
  { section: 'letters_of_paul', keyPassages: ['2:20', '5:1', '5:22–23'] },
  { section: 'letters_of_paul', keyPassages: ['2:8–10', '4:1–6', '6:10–18'] },
  { section: 'letters_of_paul', keyPassages: ['2:5–11', '4:4–7', '4:13'] },
  { section: 'letters_of_paul', keyPassages: ['1:15–20', '3:1–17'] },
  { section: 'letters_of_paul', keyPassages: ['4:13–18', '5:16–18'] },
  { section: 'letters_of_paul', keyPassages: ['2:15', '3:6–13'] },
  { section: 'letters_of_paul', keyPassages: ['1:15', '3:1–13', '6:6–12'] },
  { section: 'letters_of_paul', keyPassages: ['3:16–17', '4:7'] },
  { section: 'letters_of_paul', keyPassages: ['2:11–14', '3:4–7'] },
  { section: 'letters_of_paul', keyPassages: ['1:15–16'] },
  { section: 'general_letters', keyPassages: ['4:12–16', '11', '12:1–2'] },
  { section: 'general_letters', keyPassages: ['1:2–5', '1:22', '2:14–26'] },
  { section: 'general_letters', keyPassages: ['1:3–9', '2:9–10', '5:6–7'] },
  { section: 'general_letters', keyPassages: ['1:3–11', '3:8–9'] },
  { section: 'general_letters', keyPassages: ['1:9', '4:7–21'] },
  { section: 'general_letters', keyPassages: ['1:6'] },
  { section: 'general_letters', keyPassages: ['1:4', '1:11'] },
  { section: 'general_letters', keyPassages: ['1:3', '1:24–25'] },
  { section: 'prophecy', keyPassages: ['1:4–8', '5', '21:1–5'] },
];

export default bibleBookGuides;
