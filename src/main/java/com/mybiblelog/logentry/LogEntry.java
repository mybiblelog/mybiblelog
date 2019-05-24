package com.mybiblelog.logentry;

import java.util.Date;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.Id;
import javax.persistence.ManyToOne;
import javax.persistence.Temporal;
import javax.persistence.TemporalType;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.mybiblelog.user.User;

@Entity
public class LogEntry {

	@Id
	@GeneratedValue
	@Column(name = "ID")
	private Long id;
	
	@JsonIgnore
	@ManyToOne
	private User user;
	
	@Temporal(TemporalType.DATE)
	@JsonFormat(pattern="yyyy-MM-dd")
    Date date;
	
	private int startVerseId;
	private int endVerseId;
	
	public LogEntry(User user, int startVerseId, int endVerseId, Date date) {
		this.user = user;
		this.startVerseId = startVerseId;
		this.endVerseId = endVerseId;
		this.date = date;
	}
	
	public Date getDate() {
		return date;
	}

	public void setDate(Date date) {
		this.date = date;
	}

	public int getStartVerseId() {
		return startVerseId;
	}

	public void setStartVerseId(int startVerseId) {
		this.startVerseId = startVerseId;
	}

	public int getEndVerseId() {
		return endVerseId;
	}

	public void setEndVerseId(int endVerseId) {
		this.endVerseId = endVerseId;
	}

	protected LogEntry() {} // JPA

}
