package com.mybiblelog.logentry;

import static org.hamcrest.CoreMatchers.is;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.Optional;

import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.junit4.SpringRunner;
import org.springframework.test.web.servlet.MockMvc;

import com.mybiblelog.config.LoginService;
import com.mybiblelog.user.User;
import com.mybiblelog.user.UserRepository;

@RunWith(SpringRunner.class)
@WebMvcTest(LogEntryRestController.class)
public class LogEntryRestControllerTest {

	@Autowired
    private MockMvc mvc;

	@MockBean
	private ClientRegistrationRepository clientRegistrationRepository;

	@MockBean
	UserRepository userRepo;

	@MockBean
	private LoginService loginService;

	@MockBean
	LogEntryRepository logEntryRepo;
	
	@Mock
	LogEntry mockLogEntry;
	
	@Mock
	User mockUser;
	String testUserEmail = "test@example.com";

	@Before
	public void setup() {
		MockitoAnnotations.initMocks(this);

		when(mockUser.getEmail()).thenReturn(testUserEmail);
		when(loginService.resolveAuthUser()).thenReturn(mockUser);
		
		when(mockLogEntry.getId()).thenReturn(1L);
	}
	
	@WithMockUser("test@example.com")
    @Test
    public void shouldGetAllLogEntriesWithStatus200() throws Exception {
        mvc
        	.perform(get("/api/log-entries")
        	.contentType(MediaType.APPLICATION_JSON))
        	.andExpect(status().isOk());
    }
	
	@WithMockUser("test@example.com")
    @Test
    public void shouldGetOneLogEntryWithStatus200() throws Exception {
		when(logEntryRepo.findByUserAndId(mockUser, 1L)).thenReturn(Optional.of(mockLogEntry));
        mvc
        	.perform(get("/api/log-entries/1")
        	.contentType(MediaType.APPLICATION_JSON))
        	.andExpect(status().isOk());
    }
	
	@WithMockUser("test@example.com")
    @Test
    public void shouldGetOneLogEntryWithProvidedId() throws Exception {
		when(logEntryRepo.findByUserAndId(mockUser, 1L)).thenReturn(Optional.of(mockLogEntry));
        mvc
        	.perform(get("/api/log-entries/1")
        	.contentType(MediaType.APPLICATION_JSON))
        	.andExpect(status().isOk())
        	.andExpect(jsonPath("$.id", is(1)));
    }
	
	@WithMockUser("test@example.com")
	@Test
	public void shouldReturn404IfOneLogEntryNotFoundById() throws Exception {
		mvc
			.perform(get("/api/log-entries/1"))
        	.andExpect(status().is(404));
	}
}
