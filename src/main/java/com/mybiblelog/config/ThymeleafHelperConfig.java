package com.mybiblelog.config;

import java.util.Arrays;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import com.mybiblelog.user.User;
import com.mybiblelog.user.UserRepository;

import nz.net.ultraq.thymeleaf.LayoutDialect;

@Configuration
public class ThymeleafHelperConfig {

	@Autowired
	UserRepository userRepo;
	
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

		public boolean loggedIn() {
			Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
			if (authentication == null) return false;
			if (!authentication.isAuthenticated()) return false;
			if (authentication instanceof AnonymousAuthenticationToken) return false;
			return true;
		}
		
		public boolean hasRole(String role) {
			if (!this.loggedIn()) return false;
			
			Optional<User> userOpt = userRepo.findByUsername(this.username());
			if (!userOpt.isPresent()) return false;
			
			User user = userOpt.get();
			return Arrays.asList(user.getRoles()).contains(role);
		}
		
		public String username() {
			Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
			return authentication.getName();
		}
	}
}
