package com.mybiblelog;

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
}
