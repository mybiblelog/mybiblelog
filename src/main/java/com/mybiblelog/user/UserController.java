package com.mybiblelog.user;

import java.security.Principal;
import java.util.Optional;

import javax.servlet.http.HttpServletRequest;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
public class UserController {

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

}
