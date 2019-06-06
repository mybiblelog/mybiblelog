package com.mybiblelog.logentry;

import javax.annotation.Resource;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

import com.mybiblelog.config.LoginService;

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
}
