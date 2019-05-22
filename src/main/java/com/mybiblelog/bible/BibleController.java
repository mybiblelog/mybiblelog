package com.mybiblelog.bible;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class BibleController {

	@GetMapping("/countBookChapters")
	public int countBookChapters(@RequestParam int bookIndex) {
		BibleIndex bible = BibleIndex.getInstance();
		return bible.getBookChapterCount(bookIndex);
	}
	
	@GetMapping("/countBookChapterVerses")
	public int countChapterVerses(@RequestParam int bookIndex, @RequestParam int chapterIndex) {
		BibleIndex bible = BibleIndex.getInstance();
		return bible.getChapterVerseCount(bookIndex, chapterIndex);
	}
	
}
