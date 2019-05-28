package com.mybiblelog.logentry;

import java.util.Date;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
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
	LoginService loginService;

	@Autowired
	private LogEntryRepository logEntryRepo;
	
	BibleIndex bibleIndex = BibleIndex.getInstance();
	
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
	
	@PostMapping("")
	public LogEntry createLogEntry(@RequestBody LogEntryCreateRequest logEntryBody) throws Exception {
		User user = loginService.resolveAuthUser();
		
		int startVerseId = logEntryBody.startVerseId;
		int endVerseId = logEntryBody.endVerseId;
		Date date = logEntryBody.date;
		
		this.validateVerseRange(startVerseId, endVerseId);

		LogEntry newLogEntry = new LogEntry(user, startVerseId, endVerseId, date);
		newLogEntry = logEntryRepo.save(newLogEntry);
		return newLogEntry;
	}
	
	@PutMapping("/{id}")
	public LogEntry updateLogEntry(@PathVariable long id, @RequestBody LogEntryUpdateRequest logEntryBody) throws Exception {
		User user = loginService.resolveAuthUser();
		
		Long bodyId = logEntryBody.id;
		if (id != bodyId) {
			throw new PathBodyIdMismatchException();
		}
		int startVerseId = logEntryBody.startVerseId;
		int endVerseId = logEntryBody.endVerseId;
		Date date = logEntryBody.date;
		
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
	public boolean deleteLogEntry(@PathVariable long id) {
		User user = loginService.resolveAuthUser();
		return logEntryRepo.deleteByUserAndId(user, id);
	}
	
	// @RequestBody Mapping Objects
	
	public static class LogEntryCreateRequest {
		@DateTimeFormat(pattern="yyyy-MM-dd") Date date;
		int startVerseId;
		int endVerseId;
	}
	
	public static class LogEntryUpdateRequest {
		Long id;
		@DateTimeFormat(pattern="yyyy-MM-dd") Date date;
		int startVerseId;
		int endVerseId;
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
	public class PathBodyIdMismatchException extends Exception {}

	@ResponseStatus(HttpStatus.NOT_FOUND)
	public class LogEntryNotFoundException extends Exception {}

	@ResponseStatus(HttpStatus.BAD_REQUEST)
	public class InvalidStartVerseException extends Exception {}

	@ResponseStatus(HttpStatus.BAD_REQUEST)
	public class InvalidEndVerseException extends Exception {}

	@ResponseStatus(HttpStatus.BAD_REQUEST)
	public class InvalidVerseRangeException extends Exception {}
}
