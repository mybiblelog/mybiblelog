package com.mybiblelog.user;

import java.util.Optional;

import org.springframework.data.repository.CrudRepository;

public interface UserRepository extends CrudRepository<User, Long> {

	Optional<User> findByUsername(String username);

}
