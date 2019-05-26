package com.mybiblelog.bible;

public class BibleVerse {
	private int id;
	private int bookIndex;
	private int chapterIndex;
	private int verseIndex;

	public BibleVerse(int id) {
		this.id = id;
		id -= 100000000;
		this.bookIndex = id / 1000000;
		id -= this.bookIndex * 1000000;
		this.chapterIndex = id / 1000;
		id -= this.chapterIndex * 1000;
		this.verseIndex = id;
	}

	public static int makeId(int book, int chapter, int verse) {
		int verseId = 100000000;
		verseId += (book * 1000000);
		verseId += (chapter * 1000);
		verseId += verse;
		return verseId;
	}

	public int getId() {
		return id;
	}

	public int getBookIndex() {
		return bookIndex;
	}

	public int getChapterIndex() {
		return chapterIndex;
	}

	public int getVerseIndex() {
		return verseIndex;
	}

}
