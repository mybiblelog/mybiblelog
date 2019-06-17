package com.mybiblelog.bible;

import static org.hamcrest.CoreMatchers.is;
import static org.junit.Assert.assertThat;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.HashMap;

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

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mybiblelog.config.LoginService;
import com.mybiblelog.logentry.LogEntryRepository;
import com.mybiblelog.user.User;
import com.mybiblelog.user.UserRepository;

@RunWith(SpringRunner.class)
@WebMvcTest(BibleController.class)
public class BibleControllerTest {

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
	User mockUser;
	String testUserEmail = "test@example.com";

	@Before
	public void setup() {
		MockitoAnnotations.initMocks(this);

		when(mockUser.getEmail()).thenReturn(testUserEmail);
		when(loginService.resolveAuthUser()).thenReturn(mockUser);
	}

	@WithMockUser("test@example.com")
	@Test
	public void shouldGetAllBibleBooksWithStatus200() throws Exception {
		 mvc
	     	.perform(get("/bible-books.json")
	     	.contentType(MediaType.APPLICATION_JSON))
	     	.andExpect(status().isOk());
	}

	@WithMockUser("test@example.com")
	@Test
	public void shouldReturnArrayOfBibleBooks() throws Exception {
		MvcResult result = mvc
    		.perform(get("/bible-books.json")
    		.accept(MediaType.APPLICATION_JSON_VALUE))
    		.andReturn();
		
		String content = result.getResponse().getContentAsString();
        BibleBook[] bibleBookList = mapper.readValue(content, BibleBook[].class);
        assertThat(bibleBookList.length, is(66));
	}
	
	@Test
	public void shouldReturn302IfNotAuthorizedToGetAllBibleBooks() throws Exception {
		mvc
			.perform(get("/bible-books.json"))
	    	.andExpect(status().is(302));
	}

	@WithMockUser("test@example.com")
	@Test
	public void shouldGetAllChapterVerseCountsWithStatus200() throws Exception {
		mvc
	     	.perform(get("/chapter-verses.json")
	     	.contentType(MediaType.APPLICATION_JSON))
	     	.andExpect(status().isOk());
	}

	@WithMockUser("test@example.com")
	@Test
	public void shouldReturnMapOfChapterVerseCounts() throws Exception {
		MvcResult result = mvc
    		.perform(get("/chapter-verses.json")
    		.accept(MediaType.APPLICATION_JSON_VALUE))
    		.andReturn();
		
		String content = result.getResponse().getContentAsString();
        HashMap<Integer, Integer> chapterVerseCounts = mapper.readValue(content, new TypeReference<HashMap<Integer, Integer>>(){});
        assertThat(chapterVerseCounts.size(), is(1189));
	}
	
	@Test
	public void shouldReturn302IfNotAuthorizedToGetAllChapterVerses() throws Exception {
		mvc
			.perform(get("/chapter-verses.json"))
	    	.andExpect(status().is(302));
	}
}
