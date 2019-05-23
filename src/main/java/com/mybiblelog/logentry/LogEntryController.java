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
	public String addLogEntry(Authentication authentication, @RequestParam int startVerseId, @RequestParam int endVerseId) {
		User user = loginService.resolveAuthUser(authentication);
		
		LogEntry entry = new LogEntry(user, startVerseId, endVerseId, new Date());
		logEntryRepo.save(entry);
		
		return "redirect:/log";
	}
}
