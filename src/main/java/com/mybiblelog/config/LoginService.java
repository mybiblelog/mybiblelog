package com.mybiblelog.config;

import javax.annotation.Resource;
import javax.persistence.EntityManager;
import javax.transaction.Transactional;

import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.oidc.user.DefaultOidcUser;
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
		
		String googleOAuth2ID = authentication.getName();
		DefaultOidcUser userPrincipal = (DefaultOidcUser) authentication.getPrincipal();
		String email = userPrincipal.getEmail();
		String name = userPrincipal.getName();
		
		return userRepo.findByEmail(email).orElseGet(() -> {
			userRepo.save(new User(email, name, googleOAuth2ID));
			entityManager.flush();
			entityManager.clear();
			return userRepo.findByEmail(email).get();
		});
	}
}
