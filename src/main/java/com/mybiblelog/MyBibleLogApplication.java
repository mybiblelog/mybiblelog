package com.mybiblelog;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import com.mybiblelog.bible.BibleIndex;

@SpringBootApplication
public class MyBibleLogApplication {

	public static void main(String[] args) {
		
		BibleIndex bible = BibleIndex.getInstance();
		System.out.println("Loading books:");
		System.out.println(bible.getBooks());
		System.out.println("Loading chapter verses:");
		System.out.println(bible.getChapterVerses());
		
		SpringApplication.run(MyBibleLogApplication.class, args);
	}

}
