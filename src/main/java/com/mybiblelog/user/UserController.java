package com.mybiblelog.user;

import java.security.Principal;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;

import javax.servlet.http.HttpServletRequest;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.oauth2.core.oidc.user.DefaultOidcUser;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

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
	
	@GetMapping("/demo")
	public String demoPage(HttpServletRequest request, Model model, Principal principal, Authentication authentication) {
		
		System.out.println("Made it into the controller...");
		
		String googleOauth2ID = authentication.getName();
		
		DefaultOidcUser userPrincipal = (DefaultOidcUser) authentication.getPrincipal();
		String email = userPrincipal.getEmail();
		String name = userPrincipal.getName();
//		
//		// SEE: http://www.baeldung.com/get-user-in-spring-security
//		// ANY of these methods will work to retrieve the username
//		
//		// String username = request.getRemoteUser();
//		// String username = principal.getName();
		String username = authentication.getName();
//		Optional<User> userOpt = userRepo.findByEmail(email);
//		if (!userOpt.isPresent()) {
//			throw new UsernameNotFoundException("User not found.");
//		}
//		model.addAttribute("user", userOpt.get());

		System.out.println("Made it to the end of the controller...");
		
		model.addAttribute("user", new User());
		
		return "demo";
	}
	
	@GetMapping("/oauth")
	public String oauthPage(Model model, @AuthenticationPrincipal OAuth2User googleId) {
		model.addAttribute("googleId", googleId);
		return "oauth-test";
	}

}
