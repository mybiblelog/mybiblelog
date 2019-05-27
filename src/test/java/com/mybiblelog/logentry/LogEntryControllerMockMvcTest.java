package com.mybiblelog.logentry;

import static org.hamcrest.CoreMatchers.is;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.view;

import java.util.Optional;

import javax.annotation.Resource;

import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.Mock;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.core.oidc.user.DefaultOidcUser;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.junit4.SpringRunner;
import org.springframework.test.web.servlet.MockMvc;

import com.mybiblelog.config.LoginService;
import com.mybiblelog.config.ThymeleafHelperConfig;
import com.mybiblelog.config.ThymeleafHelperConfig.ThymeIdentity;
import com.mybiblelog.user.User;
import com.mybiblelog.user.UserRepository;

@RunWith(SpringRunner.class)
@WebMvcTest(LogEntryController.class)
@Import(ThymeleafHelperConfig.class)
@ContextConfiguration
public class LogEntryControllerMockMvcTest {

	@Resource
	private MockMvc mvc;

	@MockBean
	private ClientRegistrationRepository clientRegistrationRepository;

	@MockBean
	LoginService loginService;

	@MockBean
	LogEntryRepository logEntryRepo;

	@Mock
	private LogEntry logEntry;

	@Mock
	private User user;
	String testUserEmail = "test@example.com";

	@MockBean
	ThymeIdentity thymeIdentity;
	
	@Mock
	private DefaultOidcUser googleId;

	@MockBean
	private UserRepository userRepo;

	@Before
	public void setup() {
		when(thymeIdentity.user()).thenReturn(user);
		when(user.getEmail()).thenReturn(testUserEmail);
		when(userRepo.findByEmail(testUserEmail)).thenReturn(Optional.of(user));
	}

	@Test
	public void shouldRedirectFromLogIfNotAuthenticated() throws Exception {
		mvc.perform(get("/log")).andExpect(status().is3xxRedirection());
	}
	
	@Test
	@WithMockUser("test@example.com")
	public void shouldRouteToLogIfAuthenticated() throws Exception {
		mvc.perform(get("/log")).andExpect(view().name(is("log")));
	}
	
	@Test
	@WithMockUser("test@example.com")
	public void shouldBeOkForLogIfAuthenticated() throws Exception {
		mvc.perform(get("/log")).andExpect(status().isOk());
	}
}
