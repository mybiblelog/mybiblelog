package com.mybiblelog.user;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.Id;
import javax.persistence.Table;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "appuser")
public class User {
	
	@Id
	@GeneratedValue
	@Column(name = "UID")
	private Long id;
	
	private String username;
	@JsonIgnore
	private String password;
	private String email;
	private String[] roles;
	
	public User(String username, String password, String email, String... roles) {
		this.username = username;
		this.password = new BCryptPasswordEncoder().encode(password);
		this.email = email;
		this.roles = roles;
	}

	protected User() {} // JPA

	public String getUsername() {
		return username;
	}

	public String getPassword() {
		return password;
	}

	public String getEmail() {
		return email;
	}
	
	public String[] getRoles() {
		return roles;
	}

}
