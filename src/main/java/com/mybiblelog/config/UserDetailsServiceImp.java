package com.mybiblelog.config;

import java.util.Optional;

import javax.annotation.Resource;

import org.springframework.security.core.userdetails.User.UserBuilder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import com.mybiblelog.user.User;
import com.mybiblelog.user.UserRepository;

public class UserDetailsServiceImp implements UserDetailsService {
	
	@Resource
	UserRepository userRepo;
	
	@Override
	public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {

		// Get existing user from database
		User user;
		Optional<User> existingUser = userRepo.findByEmail(email);
		if (!existingUser.isPresent()) {
			throw new UsernameNotFoundException("User not found.");
		}
		user = existingUser.get();
		
		// Build UserDetails object from user's username and password
		UserBuilder builder = null;
		builder = org.springframework.security.core.userdetails.User.withUsername(email);
		builder.password(user.getPassword());
		builder.roles(user.getRoles());
		
		// TESTING
		// String[] roles = user.getRoles();
		// for (String role : roles) System.out.println(role);

		return builder.build();
	}
}
