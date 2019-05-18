package com.mybiblelog.logentry;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.Id;

@Entity
public class LogEntry {

	@Id
	@GeneratedValue
	@Column(name = "ID")
	private Long id;
	
	// User
	
	// Date
	
	private int startVerseId;
	private int endVerseId;
	
	public LogEntry(int startVerseId, int endVerseId) {
		this.startVerseId = startVerseId;
		this.endVerseId = endVerseId;
	}
	
	protected LogEntry() {} // JPA

	public int getStartVerseId() {
		return startVerseId;
	}

	public int getEndVerseId() {
		return endVerseId;
	}
}
