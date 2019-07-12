package com.mybiblelog.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.PropertySource;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityConfigurerAdapter;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import com.mybiblelog.jwt.JwtAuthenticationFilter;
import com.mybiblelog.jwt.JwtAuthorizationFilter;

@Configuration
@EnableWebSecurity
@PropertySource("classpath:application.yml")
public class WebSecurityConfig extends WebSecurityConfigurerAdapter {

	@Bean
	public UserDetailsService userDetailsService() {
		return new UserDetailsServiceImp();
	}

	@Bean
	public PasswordEncoder passwordEncoder() {
		return new BCryptPasswordEncoder();
	}

	@Override
	protected void configure(HttpSecurity http) throws Exception {
		http
			.csrf().disable()
			.headers().frameOptions().disable()
			.and()
				.authorizeRequests()
					.antMatchers(
						"/",
						"/login",
						"/oauth2/authorization/google",
						"/oauth2/authorization/facebook",
						"/privacy", "/terms",
						"/h2-console/**",
						"/css/**", "/js/**", "/icons/**", "/favicon.png"
					).permitAll()
					.anyRequest().authenticated()
			.and()
	            .addFilter(new JwtAuthenticationFilter(authenticationManager()))
	            .addFilter(new JwtAuthorizationFilter(authenticationManager()))
	            // We COULD disable sessions and make the app entirely stateless, but we need
	            // the session to allow users to generate a JWT in the browser via social sign in
//	            .sessionManagement()
//	            	.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
//			.and()
				.formLogin()
				.loginPage("/login")
				.loginProcessingUrl("/login")
				.defaultSuccessUrl("/log", true)
			.and()
				.oauth2Login()
				.loginPage("/oauth2/authorization") // just redirects to regular login page
				.successHandler(successHandler())
			.and()
				.logout().permitAll()
				.logoutUrl("/logout")
				.logoutSuccessUrl("/")
			.and()
				.sessionManagement()
				.invalidSessionUrl("/login?invalidSession")
				.maximumSessions(1)
					.expiredUrl("/login?expired")
					.and()
			.and()
				.requiresChannel() // Forces Heroku traffic to HTTPS
				.requestMatchers(r -> r.getHeader("X-Forwarded-Proto") != null)
				.requiresSecure();
	}

	@Override
	protected void configure(AuthenticationManagerBuilder auth) throws Exception {
		auth.userDetailsService(userDetailsService()).passwordEncoder(passwordEncoder());
	}
	
	@Bean
	public AuthenticationSuccessHandler successHandler() {
		return new OAuthSuccessHandler();
	}
	
	@Bean
    public CorsConfigurationSource corsConfigurationSource() {
        final UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", new CorsConfiguration().applyPermitDefaultValues());

        return source;
    }
}
