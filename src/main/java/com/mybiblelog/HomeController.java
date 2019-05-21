package com.mybiblelog;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class HomeController {

	@GetMapping("/")
	public String getIndex() {
		return "index";
	}

	@GetMapping("/privacy")
	public String getPrivacyPolicy() {
		return "policy/privacy";
	}

	@GetMapping("/terms")
	public String getTermsOfService() {
		return "policy/terms";
	}

}
