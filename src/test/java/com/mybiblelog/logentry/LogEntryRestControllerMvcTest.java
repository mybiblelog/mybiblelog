package com.mybiblelog.logentry;

import static org.hamcrest.CoreMatchers.is;
import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertThat;
import static org.junit.Assert.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.io.IOException;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collection;
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
import org.springframework.test.web.servlet.MvcResult;

import com.fasterxml.jackson.core.JsonParseException;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonMappingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mybiblelog.config.LoginService;
import com.mybiblelog.logentry.LogEntryRestController.LogEntryCreateRequest;
import com.mybiblelog.logentry.LogEntryRestController.LogEntryUpdateRequest;
import com.mybiblelog.user.User;
import com.mybiblelog.user.UserRepository;

@RunWith(SpringRunner.class)
@WebMvcTest(LogEntryRestController.class)
public class LogEntryRestControllerMvcTest {

	// This class doesn't need to test responses.
	// Those are tested in LogEntryRestControllerTest.

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
	
	@Autowired
	ObjectMapper mapper;
	
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
	
	private String mapToJson(Object object) throws JsonProcessingException {
		return mapper.writeValueAsString(object);
	}
	
	private <T> T mapFromJson(String json, Class<T> type)
		throws JsonParseException, JsonMappingException, IOException {
		return mapper.readValue(json, type);
	}
	
	// READ ALL

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
    public void shouldReturnArrayOfLogEntries() throws Exception {
		Collection<LogEntry> logEntries = new ArrayList<LogEntry>();
		logEntries.add(new LogEntry());
		logEntries.add(new LogEntry());
		when(logEntryRepo.findAllByUserOrderByDateAsc(mockUser)).thenReturn(logEntries);
		
        MvcResult result = mvc
    		.perform(get("/api/log-entries")
    		.accept(MediaType.APPLICATION_JSON_VALUE))
    		.andReturn();
        
        String content = result.getResponse().getContentAsString();
        LogEntry[] logEntryList = this.mapFromJson(content, LogEntry[].class);
        assertTrue(logEntryList.length > 0);
    }
	
	
	@Test
	public void shouldReturn302IfNotAuthorizedToGetAll() throws Exception {
		mvc
			.perform(get("/api/log-entries"))
	    	.andExpect(status().is(302));
	}
	
	// READ ONE
	
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
	
	@Test
	public void shouldReturn302IfNotAuthenticated() throws Exception {
		when(logEntryRepo.findByUserAndId(mockUser, 1L)).thenReturn(Optional.of(mockLogEntry));
		mvc
			.perform(get("/api/log-entries/1"))
	    	.andExpect(status().is(302));

	}
	
	// CREATE

	@WithMockUser("test@example.com")
	@Test
	public void shouldCreateLogEntryWithStatus201() throws Exception {
		LogEntryCreateRequest body = new LogEntryCreateRequest();
		body.startVerseId = 101001001;
		body.endVerseId = 101001001;
		body.date = null;
		String bodyJson = this.mapToJson(body);
		
		MvcResult result = mvc
			.perform(post("/api/log-entries")
			.contentType(MediaType.APPLICATION_JSON)
			.content(bodyJson)).andReturn();
		
		int status = result.getResponse().getStatus();
		assertEquals(201, status);
	}

	@WithMockUser("test@example.com")
	@Test
	public void shouldCreateLogEntryAndReturnIt() throws Exception {
		LocalDate testDate = LocalDate.of(2020, 1, 1);
		
		LogEntryCreateRequest body = new LogEntryCreateRequest();
		body.startVerseId = 101001001;
		body.endVerseId = 101001002;
		body.date = testDate;
		String bodyJson = this.mapToJson(body);
		
		LogEntry createdEntry = new LogEntry(null, 101001001, 101001002, testDate);
		
		when(logEntryRepo.save(any(LogEntry.class)))
			.thenReturn(createdEntry);

		MvcResult result = mvc
			.perform(post("/api/log-entries")
			.contentType(MediaType.APPLICATION_JSON)
			.content(bodyJson))
			.andExpect(jsonPath("$.date", "2020-01-01").exists())
			.andReturn();

		String content = result.getResponse().getContentAsString();
		LogEntry resultEntry = this.mapFromJson(content, LogEntry.class);
		assertThat(resultEntry.getStartVerseId(), is(101001001));
		assertThat(resultEntry.getEndVerseId(), is(101001002));
	}
	
	@WithMockUser("test@example.com")
	@Test
	public void shouldReturn400ForInvalidCreatePayload() throws Exception {
		LogEntryCreateRequest body = new LogEntryCreateRequest();
		
		// end verse before start verse
		body.startVerseId = 101001002;
		body.endVerseId = 101001001;
		body.date = null;
		String bodyJson = this.mapToJson(body);
		
		MvcResult result = mvc
			.perform(post("/api/log-entries")
			.contentType(MediaType.APPLICATION_JSON)
			.content(bodyJson)).andReturn();
		
		int status = result.getResponse().getStatus();
		assertEquals(400, status);
	}
	
	@Test
	public void shouldReturn302IfNotAuthorizedToCreate() throws Exception {
		LogEntryCreateRequest body = new LogEntryCreateRequest();
		String bodyJson = this.mapToJson(body);
		
		MvcResult result = mvc
			.perform(post("/api/log-entries")
			.contentType(MediaType.APPLICATION_JSON)
			.content(bodyJson)).andReturn();
		
		int status = result.getResponse().getStatus();
		assertEquals(302, status);
	}
	
	// UPDATE
	
	@WithMockUser("test@example.com")
	@Test
	public void shouldUpdateExistingLogEntryWithStatus200() throws Exception {
		LogEntryUpdateRequest body = new LogEntryUpdateRequest();
		body.id = 1L;
		body.startVerseId = 101001001;
		body.endVerseId = 101001001;
		body.date = null;
		String bodyJson = this.mapToJson(body);

		when(logEntryRepo.findByUserAndId(mockUser, 1L)).thenReturn(Optional.of(mockLogEntry));
		
		MvcResult result = mvc
			.perform(put("/api/log-entries/1")
			.contentType(MediaType.APPLICATION_JSON)
			.content(bodyJson)).andReturn();
		
		int status = result.getResponse().getStatus();
		assertEquals(200, status);
	}
	
	@WithMockUser("test@example.com")
	@Test
	public void shouldReturn400ForInvalidUpdatePayload() throws Exception {
		LogEntryUpdateRequest body = new LogEntryUpdateRequest();
		body.id = 1L;
		body.startVerseId = 101001002; // start before end
		body.endVerseId = 101001001;
		body.date = null;
		String bodyJson = this.mapToJson(body);

		when(logEntryRepo.findByUserAndId(mockUser, 1L)).thenReturn(Optional.of(mockLogEntry));
		
		MvcResult result = mvc
			.perform(put("/api/log-entries/1")
			.contentType(MediaType.APPLICATION_JSON)
			.content(bodyJson)).andReturn();
		
		int status = result.getResponse().getStatus();
		assertEquals(400, status);
	}
	
	@WithMockUser("test@example.com")
	@Test
	public void shouldReturn404IfLogEntryToUpdateNotFound() throws Exception {
		LogEntryUpdateRequest body = new LogEntryUpdateRequest();
		body.id = 7L;
		body.startVerseId = 101001001;
		body.endVerseId = 101001001;
		body.date = null;
		String bodyJson = this.mapToJson(body);

		MvcResult result = mvc
			.perform(put("/api/log-entries/7")
			.contentType(MediaType.APPLICATION_JSON)
			.content(bodyJson)).andReturn();
		
		int status = result.getResponse().getStatus();
		assertEquals(404, status);
	}

	@Test
	public void shouldReturn302IfNotAuthorizedToUpdate() throws Exception {
		LogEntryUpdateRequest body = new LogEntryUpdateRequest();
		body.id = 1L;
		body.startVerseId = 101001001;
		body.endVerseId = 101001001;
		body.date = null;
		String bodyJson = this.mapToJson(body);

		when(logEntryRepo.findByUserAndId(mockUser, 1L)).thenReturn(Optional.of(mockLogEntry));
		
		MvcResult result = mvc
			.perform(put("/api/log-entries/7")
			.contentType(MediaType.APPLICATION_JSON)
			.content(bodyJson)).andReturn();
		
		int status = result.getResponse().getStatus();
		assertEquals(302, status);
	}
	
	// DELETE
	
	@WithMockUser("test@example.com")
	@Test
	public void shouldDeleteExistingLogEntryWithStatus200() throws Exception {
		when(logEntryRepo.findByUserAndId(mockUser, 1L)).thenReturn(Optional.of(mockLogEntry));
		when(logEntryRepo.deleteByUserAndId(mockUser, 1L)).thenReturn(1);
		
		MvcResult result = mvc
			.perform(delete("/api/log-entries/1")
			.contentType(MediaType.APPLICATION_JSON))
			.andReturn();
		
		String content = result.getResponse().getContentAsString();
		assertThat(content, is("true"));
		
		int status = result.getResponse().getStatus();
		assertEquals(200, status);
	}
	
	@WithMockUser("test@example.com")
	@Test
	public void shouldReturn404IfLogEntryToDeleteNotFound() throws Exception {
		
		MvcResult result = mvc
			.perform(delete("/api/log-entries/1")
			.contentType(MediaType.APPLICATION_JSON))
			.andReturn();

		int status = result.getResponse().getStatus();
		assertEquals(404, status);
	}
	
	@Test
	public void shouldReturn302IfNotAuthorizedToDelete() throws Exception {
		when(logEntryRepo.findByUserAndId(mockUser, 1L)).thenReturn(Optional.of(mockLogEntry));
		when(logEntryRepo.deleteByUserAndId(mockUser, 1L)).thenReturn(1);
		
		MvcResult result = mvc
			.perform(delete("/api/log-entries/1")
			.contentType(MediaType.APPLICATION_JSON))
			.andReturn();
		
		int status = result.getResponse().getStatus();
		assertEquals(302, status);
	}
}
