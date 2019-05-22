package com.mybiblelog.logentry;

import java.util.Date;
import java.util.Random;

import javax.annotation.Resource;

import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

import com.mybiblelog.config.LoginService;
import com.mybiblelog.user.User;

@Controller
public class LogEntryController {

	@Resource
	LoginService loginService;

	@Resource
	LogEntryRepository logEntryRepo;

	@GetMapping("/log")
	public String getLog(Model model, Authentication authentication) {
		User user = loginService.resolveAuthUser(authentication);
		
		Iterable<LogEntry> logEntries = user.getLogEntries();
		model.addAttribute("logEntries", logEntries);
		return "log";
	}
	
	@GetMapping("/add")
	public String addLogEntry(Model model, Authentication authentication) {
		User user = loginService.resolveAuthUser(authentication);
		
		Random rand = new Random();
		
		int startVerseId = rand.nextInt(300);
		int endVerseId = startVerseId + rand.nextInt(150);
		
		LogEntry entry = new LogEntry(user, startVerseId, endVerseId, new Date());
		logEntryRepo.save(entry);
		
		return "redirect:/log";
	}
}
