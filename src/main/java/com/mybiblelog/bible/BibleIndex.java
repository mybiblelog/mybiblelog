package com.mybiblelog.bible;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.util.ResourceUtils;

import com.fasterxml.jackson.databind.ObjectMapper;

public class BibleIndex {

	private ArrayList<BibleBook> books = new ArrayList<BibleBook>();
	private HashMap<Integer, Integer> chapterVerses = new HashMap<Integer, Integer>();

	// Singleton Pattern
	private static BibleIndex instance = null;

	public static BibleIndex getInstance() {
		if (instance == null) {
			instance = new BibleIndex();
		}
		return instance;
	}

	private BibleIndex() {
		ObjectMapper mapper = new ObjectMapper();
		try {
			InputStream bibleBooksFileStream = ResourceUtils.getURL("src/main/java/com/mybiblelog/bible/bible-books.json").openStream();
			BibleBook[] bookArray = mapper.readValue(bibleBooksFileStream, BibleBook[].class);
			this.books = new ArrayList<BibleBook>(Arrays.asList(bookArray));
			
			InputStream chapterVersesFileStream = ResourceUtils.getURL("src/main/java/com/mybiblelog/bible/chapter-verses.json").openStream();
			ChapterVerseCount[] chapterVerseCounts = mapper.readValue(chapterVersesFileStream, ChapterVerseCount[].class);
			HashMap<Integer, Integer> chapterVerses = new HashMap<Integer, Integer>();
			for (ChapterVerseCount chapterVerseCount : chapterVerseCounts) {
				chapterVerses.put(chapterVerseCount.chapterId, chapterVerseCount.verseCount);
			}
			this.chapterVerses = chapterVerses;
		} catch (Exception e) {
			System.out.println("Unable to load bible data.");
			System.out.println(e);
		}
	}

	public ArrayList<BibleBook> getBooks() {
		return this.books;
	}
	
	public HashMap<Integer, Integer> getChapterVerses() {
		return this.chapterVerses;
	}

	public int getBibleBookCount() {
		return this.books.size();
	}

	public String getBookName(int bookIndex) {
		BibleBook book = this.books.get(bookIndex);
		if (book == null) return "";
		return book.name;
	}

	public int getBookChapterCount(int bookIndex) {
		List<BibleBook> resultBook = this.books.stream()
			.filter(b -> b.bibleOrder == bookIndex)
			.collect(Collectors.toList());
		if (resultBook.size() == 0) return 0;
		BibleBook book = resultBook.get(0);
		if (book == null) return 0;
		return book.chapterCount;
	}

	public int getChapterVerseCount(int bookIndex, int chapterIndex) {
		int chapterId = BibleVerse.makeId(bookIndex, chapterIndex, 0);
		Integer chapterVerseCount = this.chapterVerses.get(chapterId);
		if (chapterVerseCount == null) return 0;
		return chapterVerseCount;
	}
	
	static private class ChapterVerseCount {
		public int chapterId;
		public int verseCount;
	}
}
