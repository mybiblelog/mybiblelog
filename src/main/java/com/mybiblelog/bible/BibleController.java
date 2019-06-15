package com.mybiblelog.bible;

import java.util.HashMap;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class BibleController {

	@GetMapping("/bible-books.json")
	public Iterable<BibleBook> getBibleBooks() {
		BibleIndex bible = BibleIndex.getInstance();
		return bible.getBooks();
	}
	
	@GetMapping("/chapter-verses.json")
	public HashMap<Integer, Integer> getChapterVerses() {
		BibleIndex bible = BibleIndex.getInstance();
		return bible.getChapterVerses();
	}
}
