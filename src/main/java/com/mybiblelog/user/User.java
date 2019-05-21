package com.mybiblelog.user;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.Id;
import javax.persistence.Table;

@Entity
@Table(name = "appuser")
public class User {
	
	@Id
	@GeneratedValue
	@Column(name = "UID")
	private Long id;
	
	private String email;
	private String name;
	private String googleOAuth2ID;
	
	public User(String email, String name, String googleOAuth2ID) {
		this.email = email;
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

	public String getName() {
		return name;
	}

	public String getGoogleOAuth2ID() {
		return googleOAuth2ID;
	}

}
