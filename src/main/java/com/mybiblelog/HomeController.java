package com.mybiblelog;

import java.util.Random;

import javax.annotation.Resource;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class HomeController {
	
	@Resource
	LogEntryRepository logEntryRepo;

	@GetMapping("/")
	public String getIndex() {
		return "index";
	}

	@GetMapping("/log")
	public String getLog(Model model) {
		Iterable<LogEntry> logEntries = logEntryRepo.findAll();
		model.addAttribute("logEntries", logEntries);
		return "log";
	}
	
	@GetMapping("/add")
	public String addLogEntry(Model model) {
		
		Random rand = new Random();
		
		int startVerseId = rand.nextInt(300);
		int endVerseId = startVerseId + rand.nextInt(150);
		
		LogEntry entry = new LogEntry(startVerseId, endVerseId);
		logEntryRepo.save(entry);
		
		return "redirect:/log";
	}

	@GetMapping("/secure")
	public String getSecure() {
		return "secure";
	}

	@GetMapping("/login")
	public String getLogin() {
		return "login";
	}

}
