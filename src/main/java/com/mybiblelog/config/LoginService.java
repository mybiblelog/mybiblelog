package com.mybiblelog.config;

import javax.annotation.Resource;
import javax.persistence.EntityManager;
import javax.transaction.Transactional;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.oidc.user.DefaultOidcUser;
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
		
		// If user was not authenticated via username/password stragety, they used OAuth2
		// Since Google is currently the only OAuth2 provider set up, we know we can use
		// Google's user details
		DefaultOidcUser userPrincipal = (DefaultOidcUser) authentication.getPrincipal();
		String email = userPrincipal.getEmail();
		
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
