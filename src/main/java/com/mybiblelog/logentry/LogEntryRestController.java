package com.mybiblelog.logentry;

import java.time.LocalDate;
import java.util.Optional;

import javax.transaction.Transactional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.mybiblelog.bible.BibleIndex;
import com.mybiblelog.bible.BibleVerse;
import com.mybiblelog.config.LoginService;
import com.mybiblelog.user.User;

@RestController
@RequestMapping("/api/log-entries")
public class LogEntryRestController {

	@Autowired
	private LoginService loginService;

	@Autowired
	private LogEntryRepository logEntryRepo;
	
	private BibleIndex bibleIndex = BibleIndex.getInstance();
	
	@GetMapping("")
	public Iterable<LogEntry> getAllLogEntries() {
		User user = loginService.resolveAuthUser();
		return logEntryRepo.findAllByUserOrderByDateAsc(user);
	}
	
	@GetMapping("/{id}")
	public LogEntry getLogEntryById(@PathVariable long id) throws Exception {
		User user = loginService.resolveAuthUser();
		Optional<LogEntry> logEntry = logEntryRepo.findByUserAndId(user, id);
		if (logEntry.isPresent()) {
			return logEntry.get();
		}
		throw new LogEntryNotFoundException();
	}
	
	@PostMapping(value = "", consumes = MediaType.APPLICATION_JSON_VALUE)
	@ResponseStatus(HttpStatus.CREATED)
	public LogEntry createLogEntry(@RequestBody LogEntryCreateRequest logEntryBody) throws Exception {
		User user = loginService.resolveAuthUser();
		
		int startVerseId = logEntryBody.startVerseId;
		int endVerseId = logEntryBody.endVerseId;
		LocalDate date = logEntryBody.date;
		
		this.validateVerseRange(startVerseId, endVerseId);

		LogEntry newLogEntry = new LogEntry(user, startVerseId, endVerseId, date);
		newLogEntry = logEntryRepo.save(newLogEntry);
		return newLogEntry;
	}
	
	@PutMapping(value = "/{id}", consumes = MediaType.APPLICATION_JSON_VALUE)
	public LogEntry updateLogEntry(@PathVariable long id, @RequestBody LogEntryUpdateRequest logEntryBody) throws Exception {
		User user = loginService.resolveAuthUser();
		
		Long bodyId = logEntryBody.id;
		if (id != bodyId) {
			throw new PathBodyIdMismatchException();
		}
		int startVerseId = logEntryBody.startVerseId;
		int endVerseId = logEntryBody.endVerseId;
		LocalDate date = logEntryBody.date;
		
		this.validateVerseRange(startVerseId, endVerseId);
		
		Optional<LogEntry> existingLogEntry = logEntryRepo.findByUserAndId(user, id);
		if (!existingLogEntry.isPresent()) {
			throw new LogEntryNotFoundException();
		}
		LogEntry updatedLogEntry = existingLogEntry.get();
		
		updatedLogEntry.setStartVerseId(startVerseId);
		updatedLogEntry.setEndVerseId(endVerseId);
		updatedLogEntry.setDate(date);
		
		updatedLogEntry = logEntryRepo.save(updatedLogEntry);
		return updatedLogEntry;
	}
	
	@DeleteMapping("/{id}")
	@Transactional
	public boolean deleteLogEntry(@PathVariable long id) throws LogEntryNotFoundException {
		User user = loginService.resolveAuthUser();
		Optional<LogEntry> optional = logEntryRepo.findByUserAndId(user, id);
		if (!optional.isPresent()) throw new LogEntryNotFoundException();
		int result = logEntryRepo.deleteByUserAndId(user, id);
		return (result > 0);
	}
	
	// @RequestBody Mapping Objects
	
	public static class LogEntryCreateRequest {
		public LocalDate date;
		public int startVerseId;
		public int endVerseId;
		
		public LogEntryCreateRequest() {} // Jackson
	}
	
	public static class LogEntryUpdateRequest {
		public Long id;
		public LocalDate date;
		public int startVerseId;
		public int endVerseId;
		
		public LogEntryUpdateRequest() {} // Jackson
	}
	
	// Request Validation
	
	public void validateVerseRange(int startVerseId, int endVerseId) throws Exception {

		BibleVerse startVerse = new BibleVerse(startVerseId);
		BibleVerse endVerse = new BibleVerse(endVerseId);

		if (!bibleIndex.verseExists(startVerse)) {
			throw new InvalidStartVerseException();
		}
		
		if (!bibleIndex.verseExists(endVerse)) {
			throw new InvalidEndVerseException();
		}
		
		if (startVerse.getBookIndex() != endVerse.getBookIndex()) {
			throw new InvalidVerseRangeException();
		}
		
		if (startVerse.getId() > endVerse.getId()) {
			throw new InvalidVerseRangeException();
		}
	}
	
	// Custom Errors
	
	@ResponseStatus(HttpStatus.BAD_REQUEST)
	public class PathBodyIdMismatchException extends Exception {
		private static final long serialVersionUID = 1L;
	}

	@ResponseStatus(HttpStatus.NOT_FOUND)
	public class LogEntryNotFoundException extends Exception {
		private static final long serialVersionUID = 1L;
	}

	@ResponseStatus(HttpStatus.BAD_REQUEST)
	public class InvalidStartVerseException extends Exception {
		private static final long serialVersionUID = 1L;
	}

	@ResponseStatus(HttpStatus.BAD_REQUEST)
	public class InvalidEndVerseException extends Exception {
		private static final long serialVersionUID = 1L;
	}

	@ResponseStatus(HttpStatus.BAD_REQUEST)
	public class InvalidVerseRangeException extends Exception {
		private static final long serialVersionUID = 1L;
	}
}
