package com.mybiblelog;

import java.security.Principal;
import java.util.Optional;
import java.util.Random;

import javax.annotation.Resource;
import javax.servlet.http.HttpServletRequest;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
public class HomeController {
	
	@Resource
	LogEntryRepository logEntryRepo;

	@Autowired
	UserRepository userRepo;

	@GetMapping("/")
	public String getIndex() {
		return "index";
	}

	@GetMapping("/hello")
	public String getHello() {
		return "hello";
	}

	@RequestMapping("/demo")
	public String demoPage(HttpServletRequest request, Model model, Principal principal, Authentication authentication) {
		
		// SEE: http://www.baeldung.com/get-user-in-spring-security
		// ANY of these methods will work to retrieve the username
		
		// String username = request.getRemoteUser();
		// String username = principal.getName();
		String username = authentication.getName();
		Optional<User> userOpt = userRepo.findByUsername(username);
		if (!userOpt.isPresent()) {
			throw new UsernameNotFoundException("User not found.");
		}
		model.addAttribute("user", userOpt.get());
		
		return "demo";
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
