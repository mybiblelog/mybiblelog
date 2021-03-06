package com.mybiblelog.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import com.mybiblelog.user.User;

import nz.net.ultraq.thymeleaf.LayoutDialect;

@Configuration
public class ThymeleafHelperConfig {

	@Autowired
	LoginService loginService;
	
	// Enables Thymeleaf layouts (must be manually included since Spring Boot 2)
	@Bean
	public LayoutDialect layoutDialect() {
		return new LayoutDialect();
	}
	
	// This class is for calling Java functionality from within a Thymeleaf template
	// It could be used to test authentication/authorization,
	// or to load data within a partial so that each controller
	// doesn't have to provide the same contextual data to the model
	@Bean("identity")
	public ThymeIdentity identity() {
		return new ThymeIdentity();
	}
	
	public class ThymeIdentity {
		
		public User user() {
			return loginService.resolveAuthUser();
		}

		public boolean loggedIn() {
			Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
			if (authentication == null) return false;
			if (!authentication.isAuthenticated()) return false;
			if (authentication instanceof AnonymousAuthenticationToken) return false;
			return true;
		}
		
		public String email() {
			return this.user().getEmail();
		}
	}
}
