package com.mybiblelog.config;

import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.DefaultRedirectStrategy;
import org.springframework.security.web.RedirectStrategy;
import org.springframework.web.servlet.handler.HandlerInterceptorAdapter;

public class FacebookEmailInterceptor extends HandlerInterceptorAdapter {
	
	private RedirectStrategy redirectStrategy = new DefaultRedirectStrategy();
	 
	@Override
	public boolean preHandle(
		HttpServletRequest request,
		HttpServletResponse response, 
		Object handler
	) throws Exception {
		
		// Ensure any OAuth2 user data includes an email address
		Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
		if (authentication instanceof OAuth2AuthenticationToken) {
			OAuth2AuthenticationToken oauth2Auth = (OAuth2AuthenticationToken) authentication;
			OAuth2User oauth2User = oauth2Auth.getPrincipal();
			Object emailValue = oauth2User.getAttributes().get("email");
			if (!(emailValue instanceof String)) {

				HttpSession session = request.getSession(false);
				SecurityContextHolder.clearContext();
				session = request.getSession(false);
				 if(session != null) {
		            session.invalidate();
		        }
		        for(Cookie cookie : request.getCookies()) {
		            cookie.setMaxAge(0);
		        }
				String targetUrl = "/login?emailError";
				redirectStrategy.sendRedirect(request, response, targetUrl);
				return false;
			}
		}
		
		return true;
	}
}
