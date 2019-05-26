package com.mybiblelog.config;

import java.io.IOException;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.DefaultRedirectStrategy;
import org.springframework.security.web.RedirectStrategy;
import org.springframework.security.web.WebAttributes;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;

public class OAuthSuccessHandler implements AuthenticationSuccessHandler {

	private RedirectStrategy redirectStrategy = new DefaultRedirectStrategy();
 
	@Override
	public void onAuthenticationSuccess(
		HttpServletRequest request,
		HttpServletResponse response,
		Authentication authentication
	) throws IOException, ServletException {
		System.out.println("The user SHOULD be authenticated by now...");
		System.out.println("It is necessary to double-check that OAuth2 users have provided an email address.");
		
		handle(request, response, authentication);
		clearAuthenticationAttributes(request);
	}
	
	protected void handle(
		HttpServletRequest request, 
		HttpServletResponse response,
		Authentication authentication
	) throws IOException, ServletException {
		
		String targetUrl = "/log";
		
		// Ensure any OAuth2 user data includes an email address
		OAuth2AuthenticationToken oauth2Auth = (OAuth2AuthenticationToken) authentication;
		OAuth2User oauth2User = oauth2Auth.getPrincipal();
		Object emailValue = oauth2User.getAttributes().get("email");

		// If the OAuth2 attributes don't include email, there is no authenticated user
		if (!(emailValue instanceof String)) {
			targetUrl = "/login?emailError";
			request.logout();
		}
		
		// TODO: at this point, a NEWLY registered user (first log in) needs to be entered into database...
		System.out.println("Should probably create a user account at this point...");

		if (response.isCommitted()) {
			System.out.println(
				"Response has already been committed. " +
				"Unable to redirect to " + targetUrl
				);
			return;
		}
 
		redirectStrategy.sendRedirect(request, response, targetUrl);
	}
	
	protected void clearAuthenticationAttributes(HttpServletRequest request) {
		HttpSession session = request.getSession(false);
		if (session == null) {
			return;
		}
		session.removeAttribute(WebAttributes.AUTHENTICATION_EXCEPTION);
	}
 
	public void setRedirectStrategy(RedirectStrategy redirectStrategy) {
		this.redirectStrategy = redirectStrategy;
	}
	protected RedirectStrategy getRedirectStrategy() {
		return redirectStrategy;
	}
}
