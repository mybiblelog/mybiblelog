package com.mybiblelog.user;

import javax.annotation.Resource;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class UserPopulator implements CommandLineRunner {

	@Resource
	private UserRepository userRepo;

	@Override
	public void run(String... args) throws Exception {
		
		// If there are no users, create an admin and a regular user
		if (userRepo.count() == 0) {
			userRepo.save(new User("admin", "password", "admin@example.com", "ADMIN"));
			userRepo.save(new User("user", "password", "user@example.com", "USER"));
		}

	}

}
