package com.mybiblelog.config;

import static org.hamcrest.CoreMatchers.is;
import static org.junit.Assert.assertThat;
import static org.mockito.Mockito.when;

import java.util.Optional;

import javax.persistence.EntityManager;

import org.junit.Before;
import org.junit.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.oidc.user.DefaultOidcUser;

import com.mybiblelog.user.User;
import com.mybiblelog.user.UserRepository;

public class LoginServiceTest {

	@InjectMocks
	private LoginService loginService;
	
	@Mock
	private Authentication authentication;
	
	@Mock
	private DefaultOidcUser googleId;
	
	@Mock
	private UserRepository userRepo;
	
	@Mock
	private User user;
	
	@Mock
	private EntityManager entityManager;
	
	@Before
	public void setup() {
		MockitoAnnotations.initMocks(this);
		String googleEmail = "test@gmail.com";
		
		when(googleId.getEmail()).thenReturn(googleEmail);
		when(authentication.getPrincipal()).thenReturn(googleId);
		when(userRepo.findByEmail(googleEmail)).thenReturn(Optional.of(user));
	}
	
	@Test
	public void shouldRetrieveUser() {
		User result = loginService.resolveAuthUser(authentication);
		assertThat(result, is(user));
	}
}
