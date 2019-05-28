package com.mybiblelog.config;

import static org.hamcrest.CoreMatchers.is;
import static org.junit.Assert.assertThat;
import static org.mockito.Mockito.when;

import java.util.HashMap;
import java.util.Optional;

import javax.persistence.EntityManager;

import org.junit.Before;
import org.junit.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.OAuth2User;

import com.mybiblelog.user.User;
import com.mybiblelog.user.UserRepository;

public class LoginServiceTest {

	@InjectMocks
	private LoginService loginService;
	
	@Mock
	private OAuth2AuthenticationToken authentication;
	
	@Mock
	private OAuth2User oauth2User;
	
	@Mock
	private UserRepository userRepo;
	
	@Mock
	private User user;
	
	@Mock
	SecurityContext securityContext;
	
	@Mock
	private HashMap<String, Object> attributes;
	
	@Mock
	private EntityManager entityManager;
	
	@Before
	public void setup() {
		MockitoAnnotations.initMocks(this);
		
		when(securityContext.getAuthentication()).thenReturn(authentication);
		SecurityContextHolder.setContext(securityContext);
		
		String testEmail = "test@example.com";

		when(attributes.get("email")).thenReturn(testEmail);
		when(oauth2User.getAttributes()).thenReturn(attributes);
		when(authentication.getPrincipal()).thenReturn(oauth2User);
		when(userRepo.findByEmail(testEmail)).thenReturn(Optional.of(user));
	}
	
	@Test
	public void shouldRetrieveUser() {
		User result = loginService.resolveAuthUser();
		assertThat(result, is(user));
	}
}
