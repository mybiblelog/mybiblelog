package com.mybiblelog.user;

import java.util.Optional;

import javax.annotation.Resource;

import org.springframework.security.core.userdetails.User.UserBuilder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

public class UserDetailsServiceImp implements UserDetailsService {

	@Resource
	UserRepository userRepo;
	
	@Override
	public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {

		// Get existing user from database
		User user;
		Optional<User> existingUser = userRepo.findByUsername(username);
		if (!existingUser.isPresent()) {
			throw new UsernameNotFoundException("User not found.");
		}
		user = existingUser.get();
		
		// Build UserDetails object from user's username and password
		UserBuilder builder = null;
		builder = org.springframework.security.core.userdetails.User.withUsername(username);
		builder.password(user.getPassword());
		builder.roles(user.getRoles());
		
		// TESTING
		// String[] roles = user.getRoles();
		// for (String role : roles) System.out.println(role);

		return builder.build();
	}

}
