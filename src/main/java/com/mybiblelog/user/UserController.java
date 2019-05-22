package com.mybiblelog.user;

import java.security.Principal;

import javax.annotation.Resource;
import javax.servlet.http.HttpServletRequest;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

import com.mybiblelog.config.LoginService;

@Controller
public class UserController {

	@Resource
	private LoginService loginService;

	@Autowired
	UserRepository userRepo;

	@GetMapping("/secure")
	public String getSecure() {
		return "secure";
	}

	@GetMapping("/login")
	public String getLogin() {
		return "login";
	}
	
	@GetMapping("/demo")
	public String demoPage(HttpServletRequest request, Model model, Principal principal, Authentication authentication) {
		User user = loginService.resolveAuthUser(authentication);
		model.addAttribute("user", user);
		return "demo";
	}
	
	@GetMapping("/oauth")
	public String oauthPage(Model model, @AuthenticationPrincipal OAuth2User googleId) {
		model.addAttribute("googleId", googleId);
		return "oauth-test";
	}

}
