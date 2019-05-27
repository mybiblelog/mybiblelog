package com.mybiblelog.logentry;

import java.util.Optional;

import org.springframework.data.repository.CrudRepository;

import com.mybiblelog.user.User;

public interface LogEntryRepository extends CrudRepository<LogEntry, Long> {

	Iterable<LogEntry> findAllByUserOrderByDateAsc(User user);
	
	Optional<LogEntry> findByUserAndId(User user, Long id);
	
	Boolean deleteByUserAndId(User user, Long id);
}
