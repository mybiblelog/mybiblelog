package com.mybiblelog.logentry;

import static org.hamcrest.CoreMatchers.is;
import static org.junit.Assert.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.ArrayList;
import java.util.Optional;

import org.junit.Before;
import org.junit.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.MockitoAnnotations;

import com.mybiblelog.config.LoginService;
import com.mybiblelog.logentry.LogEntryRestController.LogEntryCreateRequest;
import com.mybiblelog.logentry.LogEntryRestController.LogEntryUpdateRequest;
import com.mybiblelog.user.User;

public class LogEntryRestControllerTest {
	
	@Mock User testUser;
	LogEntry entry1;
	LogEntry entry2;
	
	@Mock LoginService loginService;
	@Mock LogEntryRepository logEntryRepo;
	
	@InjectMocks
	LogEntryRestController underTest;	
	
	@Before
	public void setup() {
		MockitoAnnotations.initMocks(this);
		
		when(testUser.getEmail()).thenReturn("test@example.com");
		when(loginService.resolveAuthUser()).thenReturn(testUser);
		
		entry1 = Mockito.spy(new LogEntry(testUser, 101001001, 101001001, null));
		entry2 = Mockito.spy(new LogEntry(testUser, 101001002, 101001002, null));
	}
	
	@Test
	public void shouldGetAllLogEntries() {
		// Arrange;
		ArrayList<LogEntry> logEntries = new ArrayList<LogEntry>();
		logEntries.add(entry1);
		logEntries.add(entry2);
		when(logEntryRepo.findAllByUserOrderByDateAsc(testUser))
			.thenReturn(logEntries);
		
		// Act
		Iterable<LogEntry> result = underTest.getAllLogEntries();
		
		// Assert
		long size = result.spliterator().getExactSizeIfKnown();
		assertThat(size, is(2L));
	}
	
	@Test
	public void shouldGetOneLogEntry() throws Exception {
		// Arrange
		Long id = 77L;
		when(entry1.getId()).thenReturn(id);
		when(logEntryRepo.findByUserAndId(testUser, id))
			.thenReturn(Optional.of(entry1));
		
		// Act
		LogEntry result = underTest.getLogEntryById(id);
		
		// Assert
		assertThat(result, is(entry1));
	}
	
	@Test
	public void shouldCreateLogEntry() throws Exception {
		// Arrange
		LogEntryCreateRequest requestBody = new LogEntryCreateRequest();
		requestBody.startVerseId = 101001001;
		requestBody.endVerseId = 101001001;
		when(logEntryRepo.save(any(LogEntry.class))).thenReturn(entry1);
		
		// Act
		LogEntry result = underTest.createLogEntry(requestBody);
		System.out.println("RESULT: " + result);
		
		// Assert
		verify(logEntryRepo, times(1)).save(any(LogEntry.class));
		assertThat(result, is(entry1));
	}
	
	@Test
	public void shouldUpdateLogEntry() throws Exception {
		// Arrange
		Long testId = 7L;
		LogEntryUpdateRequest requestBody = new LogEntryUpdateRequest();
		requestBody.id = testId;
		requestBody.startVerseId = 101001002;
		requestBody.endVerseId = 101001003;
		
		when(logEntryRepo.findByUserAndId(testUser, testId))
			.thenReturn(Optional.of(entry1));
		
		// Act
		underTest.updateLogEntry(testId, requestBody);
		
		// Assert
		verify(entry1, times(1)).setStartVerseId(101001002);
		verify(entry1, times(1)).setEndVerseId(101001003);
		verify(logEntryRepo, times(1)).save(entry1);
	}
	
	@Test
	public void shouldDeleteLogEntry() throws Exception {
		// Arrange
		Long testId = 13L;
		when(logEntryRepo.findByUserAndId(testUser, testId)).thenReturn(Optional.of(entry1));
		when(logEntryRepo.deleteByUserAndId(testUser, testId)).thenReturn(1);
		
		// Act
		Boolean result = underTest.deleteLogEntry(testId);
		
		// Assert
		assertThat(result, is(true));
	}
}
