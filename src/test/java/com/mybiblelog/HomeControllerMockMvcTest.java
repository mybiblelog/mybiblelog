package com.mybiblelog;

import static org.hamcrest.CoreMatchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.view;

import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.test.context.junit4.SpringRunner;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import com.mybiblelog.config.LoginService;
import com.mybiblelog.config.ThymeleafHelperConfig;
import com.mybiblelog.user.UserRepository;

@RunWith(SpringRunner.class)
@WebMvcTest(HomeController.class)
@Import(ThymeleafHelperConfig.class)
public class HomeControllerMockMvcTest {

	@Autowired
	private WebApplicationContext context;
	
	private MockMvc mvc;

	@MockBean
	private ClientRegistrationRepository clientRegistrationRepository;

	@MockBean
	private UserRepository userRepo;

	@MockBean
	private LoginService loginService;
	
	@Before
	public void setup() {
		mvc = MockMvcBuilders.webAppContextSetup(context).build();
	}

	@Test
	public void shouldRouteToIndex() throws Exception {
		mvc.perform(get("/")).andExpect(view().name(is("index")));
	}

	@Test
	public void shouldBeOkForIndex() throws Exception {
		mvc.perform(get("/")).andExpect(status().isOk());
	}

	@Test
	public void shouldRouteToTerms() throws Exception {
		mvc.perform(get("/terms")).andExpect(view().name(is("policy/terms")));
	}

	@Test
	public void shouldBeOkForTerms() throws Exception {
		mvc.perform(get("/terms")).andExpect(status().isOk());
	}

	@Test
	public void shouldRouteToPrivacy() throws Exception {
		mvc.perform(get("/privacy")).andExpect(view().name(is("policy/privacy")));
	}

	@Test
	public void shouldBeOkForPrivacy() throws Exception {
		mvc.perform(get("/privacy")).andExpect(status().isOk());
	}

}
