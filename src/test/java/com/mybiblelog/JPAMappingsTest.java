package com.mybiblelog;

import static org.hamcrest.CoreMatchers.is;
import static org.hamcrest.Matchers.containsInAnyOrder;
import static org.junit.Assert.assertThat;

import java.time.LocalDate;
import java.util.Optional;

import javax.persistence.EntityManager;

import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.junit4.SpringRunner;

import com.mybiblelog.logentry.LogEntry;
import com.mybiblelog.logentry.LogEntryRepository;
import com.mybiblelog.user.User;
import com.mybiblelog.user.UserRepository;

@RunWith(SpringRunner.class)
@DataJpaTest
public class JPAMappingsTest {

	@Autowired
	LogEntryRepository logEntryRepo;
	
	@Autowired
	UserRepository userRepo;
	
	@Autowired
	private EntityManager entityManager;

	@Test
	public void shouldSaveAndLoadUser() {
		User unsavedUser = new User("test@example.com", "password", new String[] {}, null, null);
		User savedUser = userRepo.save(unsavedUser);
		Long userId = savedUser.getId();
		
		entityManager.flush();
		entityManager.clear();

		Optional<User> result = userRepo.findById(userId);
		User resultUser = result.get();
		assertThat(resultUser.getEmail(), is("test@example.com"));
	}
	
	@Test
	public void shouldSaveAndLoadLogEntry() {
		LogEntry unsavedLogEntry = new LogEntry(null, 101001001, 101001002, LocalDate.of(2020, 1, 1));
		LogEntry savedLogEntry = logEntryRepo.save(unsavedLogEntry);
		Long logEntryId = savedLogEntry.getId();
		
		entityManager.flush();
		entityManager.clear();

		Optional<LogEntry> result = logEntryRepo.findById(logEntryId);
		LogEntry resultLogEntry = result.get();
		assertThat(resultLogEntry.getStartVerseId(), is(101001001));
	}
	
	@Test
	public void shouldEstablishUserLogEntryRelationship() {
		User user = userRepo.save(new User("test@example.com", "password", new String[] {}, null, null));
		LogEntry logEntry1 = logEntryRepo.save(new LogEntry(user, 101001001, 101001002, LocalDate.of(2020, 1, 1)));
		LogEntry logEntry2 = logEntryRepo.save(new LogEntry(user, 101001003, 101001004, LocalDate.of(2020, 1, 1)));
		Long userId = user.getId();
		Long logEntryId1 = logEntry1.getId();
		Long logEntryId2 = logEntry2.getId();

		entityManager.flush();
		entityManager.clear();

		User userResult = userRepo.findById(userId).get();
		LogEntry logEntryResult1 = logEntryRepo.findById(logEntryId1).get();
		LogEntry logEntryResult2 = logEntryRepo.findById(logEntryId2).get();
		assertThat(logEntryResult1.getUser().getEmail(), is("test@example.com"));
		assertThat(userResult.getLogEntries(), containsInAnyOrder(logEntryResult1, logEntryResult2));
	}
}
