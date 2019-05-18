package com.mybiblelog.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.config.annotation.method.configuration.EnableGlobalMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityConfigurerAdapter;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.mybiblelog.user.UserDetailsServiceImp;

@Configuration
@EnableWebSecurity
@EnableGlobalMethodSecurity(prePostEnabled=true) // Enables @PreAuthorize, etc.
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
		.authorizeRequests()
			// To allow access to index, static resources, and H2 console
			.antMatchers("/", "/privacy", "/terms", "/h2-console/**", "/css/**", "/js/**", "/favicon.png").permitAll()
			// Ensure only the admin can access the user administration routes
			// Alternatively, we could use controller annotations
			// .antMatchers("/admin", "/saveUser").hasRole("ADMIN")
			// Example of how to require a permission/authority instead of a role
			// .antMatchers("/protectedbyauthority").hasAuthority("READ_PRIVILEGE")
			.anyRequest().authenticated()
			.and()
		.oauth2Login()
			.and()
		.formLogin().loginPage("/login").permitAll()
			.and()
		.logout().permitAll().logoutSuccessUrl("/login")
			.and()
		.csrf().disable();
		
		http.csrf().disable();
		http.headers().frameOptions().disable();
	}

	@Override
	protected void configure(AuthenticationManagerBuilder auth) throws Exception {
		auth.userDetailsService(userDetailsService()).passwordEncoder(passwordEncoder());

	}

}