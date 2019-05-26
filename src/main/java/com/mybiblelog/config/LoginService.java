package com.mybiblelog.config;

import javax.annotation.Resource;
import javax.persistence.EntityManager;
import javax.transaction.Transactional;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import com.mybiblelog.user.User;
import com.mybiblelog.user.UserRepository;

@Service
public class LoginService {

	@Resource
	private UserRepository userRepo;

	@Resource
	private EntityManager entityManager;

	@Transactional
	public User resolveAuthUser(Authentication authentication) {
		
		// If user was authenticated via username/password strategy, we can
		// confidently look them up since they could only use that strategy if
		// they were already in the database
		if (authentication instanceof UsernamePasswordAuthenticationToken) {
			String email = authentication.getName();
			return userRepo.findByEmail(email).get();
		}
		
		OAuth2AuthenticationToken oauth2Auth = (OAuth2AuthenticationToken) authentication;
		OAuth2User oauth2User = oauth2Auth.getPrincipal();
		Object emailValue = oauth2User.getAttributes().get("email");
		
		String email = (String) emailValue;
		// Use an existing account (identified by email), or create one otherwise
		return userRepo.findByEmail(email).orElseGet(() -> {
			String[] roles = new String[] { "USER" };
			String name = authentication.getName();
			String googleOAuth2ID = authentication.getName();
			userRepo.save(new User(email, null, roles, name, googleOAuth2ID));
			entityManager.flush();
			entityManager.clear();
			return userRepo.findByEmail(email).get();
		});
	}
}
