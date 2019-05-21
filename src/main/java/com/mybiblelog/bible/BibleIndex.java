package com.mybiblelog.bible;

import java.io.File;
import java.util.ArrayList;

import org.assertj.core.util.Arrays;

import com.fasterxml.jackson.databind.ObjectMapper;

public class BibleIndex {
	
	private ArrayList<BibleBook> books = new ArrayList();
	
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
			File directory = new File("./");
		    System.out.println(directory.getAbsolutePath());
		    
			File file = new File("./src/main/java/com/mybiblelog/bible/bible-books.json");
			BibleBook[] bookArray = mapper.readValue(file, BibleBook[].class);
			this.books = new ArrayList(Arrays.asList(bookArray));
		}
		catch (Exception e) {
			System.out.println("Unable to load bible books.");
			System.out.println(e);
		}
	}
	
	public ArrayList<BibleBook> getBooks() {
		return this.books;
	}
	
	public int getBibleBookCount() {
		return 66;
	}

	public String getBookName(int bookIndex) {
		return "";
	}
	
	public int getBookChapterCount(int bookIndex) {
		return 0;
	}
	
	public int getChapterVerseCount(int bookIndex, int chapterIndex) {
		return 0;
	}
}
