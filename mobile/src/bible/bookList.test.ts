import { filterAndSortBooks } from "./bookList";

const books = Array.from({ length: 66 }, (_, i) => ({ bookIndex: i + 1 }));
const indices = (items: { bookIndex: number }[]) => items.map((b) => b.bookIndex);

describe("filterAndSortBooks", () => {
  it("keeps canonical order for the default prefs", () => {
    expect(
      indices(filterAndSortBooks(books, { testament: "all", sortOrder: "numerical" }, "en"))
    ).toEqual(indices(books));
  });

  it("filters to a testament", () => {
    const nt = filterAndSortBooks(books, { testament: "new", sortOrder: "numerical" }, "en");
    expect(nt).toHaveLength(27);
    expect(nt[0].bookIndex).toBe(40);
  });

  it("sorts alphabetically by localized name", () => {
    const en = filterAndSortBooks(books, { testament: "all", sortOrder: "alphabetical" }, "en");
    expect(en).toHaveLength(66);
    expect(en[0].bookIndex).toBe(44); // Acts
    const de = filterAndSortBooks(books, { testament: "all", sortOrder: "alphabetical" }, "de");
    expect(de[0].bookIndex).toBe(30); // Amos ("Apostelgeschichte" follows)
  });

  it("returns the caller's items, not copies", () => {
    const [first] = filterAndSortBooks(books, { testament: "all", sortOrder: "numerical" }, "en");
    expect(first).toBe(books[0]);
  });
});
