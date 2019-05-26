package com.mybiblelog.bible;

import static org.hamcrest.CoreMatchers.is;
import static org.junit.Assert.assertThat;

import org.junit.Test;

public class BibleIntegrationTest {
	
	BibleIndex bibleIndex = BibleIndex.getInstance();
	
	int genesis_1_1 = 101001001;
	
	@Test
	public void shouldMakeBibleVerse() {
		BibleVerse verse = new BibleVerse(genesis_1_1);
		assertThat(verse.getId(), is(genesis_1_1));
	}
	
	@Test
	public void shouldParseBibleVerse() {
		BibleVerse verse = new BibleVerse(genesis_1_1);
		assertThat(verse.getBookIndex(), is(1));
		assertThat(verse.getChapterIndex(), is(1));
		assertThat(verse.getVerseIndex(), is(1));
	}
	
	@Test
	public void shouldMakeVerseId() {
		int revelationIndex = 66;
		int revelation_7_22_id = BibleVerse.makeId(revelationIndex, 7, 22);
		BibleVerse revelation_7_22 = new BibleVerse(revelation_7_22_id);
		assertThat(revelation_7_22.getBookIndex(), is(revelationIndex));
		assertThat(revelation_7_22.getChapterIndex(), is(7));
		assertThat(revelation_7_22.getVerseIndex(), is(22));
	}
	
	@Test
	public void shouldGetBibleBookCount() {
		int bibleBookCount = bibleIndex.getBibleBookCount();
		assertThat(bibleBookCount, is(66));
	}
	
	@Test
	public void shouldGetBookNames() {
		String genesisName = bibleIndex.getBookName(1);
		String revelationName = bibleIndex.getBookName(66);
		
		assertThat(genesisName, is("Genesis"));
		assertThat(revelationName, is("Revelation"));
	}
	
	@Test
	public void shouldGetEmptyStringForNonexistentBookNames() {
		String bookName0 = bibleIndex.getBookName(0);
		String bookName67 = bibleIndex.getBookName(67);
		
		assertThat(bookName0, is(""));
		assertThat(bookName67, is(""));
	}
	
	@Test
	public void shouldGetBookChapterCounts() {
		int genesisChapterCount = bibleIndex.getBookChapterCount(1);
		int judeChapterCount = bibleIndex.getBookChapterCount(65);
		
		assertThat(genesisChapterCount, is(50));
		assertThat(judeChapterCount, is(1));
	}
	
	@Test
	public void shouldGetZeroForNonexistentBookChapterCounts() {
		int bookChapterCount0 = bibleIndex.getBookChapterCount(0);
		int bookChapterCount67 = bibleIndex.getBookChapterCount(67);
		
		assertThat(bookChapterCount0, is(0));
		assertThat(bookChapterCount67, is(0));
	}
	
	@Test
	public void shouldGetChapterVerseCounts() {
		int genesis1verses = bibleIndex.getChapterVerseCount(1, 1);
		int revelation22verses = bibleIndex.getChapterVerseCount(66, 22);
		
		assertThat(genesis1verses, is(31));
		assertThat(revelation22verses, is(21));		
	}
	
	@Test
	public void shouldGetZeroForNonexistentChapterVerseCounts() {
		
		// book < count
		int nonChapterVerses1 = bibleIndex.getChapterVerseCount(0, 1);
		
		// chapter < count 
		int nonChapterVerses2 = bibleIndex.getChapterVerseCount(1, 0);
		
		// book > count
		int nonChapterVerses3 = bibleIndex.getChapterVerseCount(67, 1);
		
		// chapter > count
		int nonChapterVerses4 = bibleIndex.getChapterVerseCount(66, 23);

		assertThat(nonChapterVerses1, is(0));
		assertThat(nonChapterVerses2, is(0));
		assertThat(nonChapterVerses3, is(0));
		assertThat(nonChapterVerses4, is(0));
	}
}
