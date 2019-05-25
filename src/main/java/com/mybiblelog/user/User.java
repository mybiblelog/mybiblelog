package com.mybiblelog.user;

import java.util.Collection;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.Id;
import javax.persistence.OneToMany;
import javax.persistence.Table;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.mybiblelog.logentry.LogEntry;

@Entity
@Table(name = "appuser")
public class User {
	
	@Id
	@GeneratedValue
	@Column(name = "UID")
	private Long id;
	
	private String email;
	
	@JsonIgnore
	private String password;
	
	private String name;
	
	private String[] roles;
	
	private String googleOAuth2ID;
	
	@OneToMany(mappedBy="user")
	private Collection<LogEntry> logEntries;
	
	public User(String email, String password, String[] roles, String name, String googleOAuth2ID) {
		this.email = email;
		this.password = password != null ? new BCryptPasswordEncoder().encode(password) : null;
		this.roles = roles;
		this.name = name;
		this.googleOAuth2ID = googleOAuth2ID;
	}

	protected User() {} // JPA

	public Long getId() {
		return id;
	}

	public String getEmail() {
		return email;
	}
	
	public String getPassword() {
		return password;
	}

	public String[] getRoles() {
		return roles;
	}
	
	public String getName() {
		return name;
	}

	public String getGoogleOAuth2ID() {
		return googleOAuth2ID;
	}

	public Iterable<LogEntry> getLogEntries() {
		return this.logEntries;
	}

}
