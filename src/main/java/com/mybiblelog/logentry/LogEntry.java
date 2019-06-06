package com.mybiblelog.logentry;

import java.time.LocalDate;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.Id;
import javax.persistence.ManyToOne;

import com.fasterxml.jackson.annotation.JsonAutoDetect;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.mybiblelog.user.User;

@Entity
@JsonAutoDetect(
	getterVisibility = JsonAutoDetect.Visibility.NONE,
	isGetterVisibility = JsonAutoDetect.Visibility.NONE
)
public class LogEntry {

	@Id
	@GeneratedValue
	@Column(name = "ID")
	private Long id;
	
	@JsonIgnore
	@ManyToOne
	private User user;
	
	private LocalDate date;
	private int startVerseId;
	private int endVerseId;
	
	public LogEntry(User user, int startVerseId, int endVerseId, LocalDate date) {
		this.user = user;
		this.startVerseId = startVerseId;
		this.endVerseId = endVerseId;
		this.date = date;
	}
	
	@JsonProperty
	public Long getId() {
		return id;
	}
	
	@JsonProperty
	public LocalDate getDate() {
		return date;
	}

	public void setDate(LocalDate date) {
		this.date = date;
	}

	@JsonProperty
	public int getStartVerseId() {
		return startVerseId;
	}

	public void setStartVerseId(int startVerseId) {
		this.startVerseId = startVerseId;
	}

	@JsonProperty
	public int getEndVerseId() {
		return endVerseId;
	}

	public void setEndVerseId(int endVerseId) {
		this.endVerseId = endVerseId;
	}

	protected LogEntry() {} // JPA

}
