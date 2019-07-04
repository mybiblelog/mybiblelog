package com.mybiblelog.logentry;

import java.time.LocalDate;
import java.util.Optional;

import org.springframework.data.repository.CrudRepository;

import com.mybiblelog.user.User;

public interface LogEntryRepository extends CrudRepository<LogEntry, Long> {

	Iterable<LogEntry> findAllByUserOrderByDateAsc(User user);
	
	Optional<LogEntry> findByUserAndId(User user, Long id);
	
	Integer deleteByUserAndId(User user, Long id);

	Iterable<LogEntry> findAllByUserAndDateGreaterThanEqualOrderByDateAsc(User user, LocalDate startDateInclusive);
	
	Iterable<LogEntry> findAllByUserAndDateBetweenOrderByDateAsc(User user, LocalDate startDateInclusive, LocalDate endDateInclusive);
}
