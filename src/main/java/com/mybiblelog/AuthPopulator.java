package com.mybiblelog;

import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import com.mybiblelog.user.User;
import com.mybiblelog.user.UserRepository;

@Component
public class AuthPopulator implements CommandLineRunner {

	@Autowired
	private UserRepository userRepo;

	@Override
	public void run(String... args) throws Exception {
		
		// Check if test user exists
		Optional<User> testUser = userRepo.findByEmail("test@example.com");
		if (!testUser.isPresent()) {
			
			// If not, create a test user
			String[] roles = new String[] { "USER" };
			userRepo.save(new User("test@example.com", "password", roles, "Test User", null));
		}

	}

}

