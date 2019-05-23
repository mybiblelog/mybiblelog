package com.mybiblelog.logentry;

import java.util.Date;

import javax.annotation.Resource;

import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

import com.mybiblelog.config.LoginService;
import com.mybiblelog.user.User;

@Controller
public class LogEntryController {

	@Resource
	LoginService loginService;

	@Resource
	LogEntryRepository logEntryRepo;

	@GetMapping("/log")
	public String getLog() {
		return "log";
	}
	
	@GetMapping("/logEntries")
	@ResponseBody
	public Iterable<LogEntry> getLogEntries(Authentication authentication) {
		User user = loginService.resolveAuthUser(authentication);
		Iterable<LogEntry> logEntries = user.getLogEntries();
		return logEntries;
	}
	
	@GetMapping("/add")
	@ResponseBody
	public LogEntry addLogEntry(Authentication authentication, @RequestParam int startVerseId, @RequestParam int endVerseId) {
		User user = loginService.resolveAuthUser(authentication);
		
		// TODO: validate that verses are in same (existing) book
		// TODO: validate that chapters/verses actually exist
		// TODO: validate that verses are in correct order
		
		Date date = new Date();
		System.out.println(date);
		
		LogEntry entry = new LogEntry(user, startVerseId, endVerseId, date);
		entry = logEntryRepo.save(entry);
		
		return entry;
	}
}
