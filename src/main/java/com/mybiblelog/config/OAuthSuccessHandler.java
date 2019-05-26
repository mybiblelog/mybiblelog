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
		
		handle(request, response, authentication);
		clearAuthenticationAttributes(request);
	}
	
	protected void handle(
		HttpServletRequest request, 
		HttpServletResponse response,
		Authentication authentication
	) throws IOException, ServletException {
		
		// The primary problem this method solves is that it is possible for Facebook OAuth2 users
		// to withhold their email addresses. Since all data in the app is tied to user email address,
		// this creates an error state - there cannot be an authenticated user without an email.
		
		// When a user first authenticates with OAuth2, this handler executes.
		// If they didn't provide an email address, they will be redirected to the login form,
		// which will display an error and explanation of how to provide their Facebook email.
		
		String targetUrl = "/log";
		
		// Ensure any OAuth2 user data includes an email address
		OAuth2AuthenticationToken oauth2Auth = (OAuth2AuthenticationToken) authentication;
		OAuth2User oauth2User = oauth2Auth.getPrincipal();
		Object emailValue = oauth2User.getAttributes().get("email");

		// If the OAuth2 attributes don't include email, there is no authenticated user
		if (!(emailValue instanceof String)) {
			targetUrl = "/login?emailError";
			redirectStrategy.sendRedirect(request, response, targetUrl);
			return;
		}
		
		// TODO: at this point, any newly registered user (first log in) should be entered into database

		if (response.isCommitted()) {
			// If the response is already committed, we can't redirect
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
