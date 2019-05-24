package com.mybiblelog.logentry;

import org.springframework.data.repository.CrudRepository;

import com.mybiblelog.user.User;

public interface LogEntryRepository extends CrudRepository<LogEntry, Long> {

	Iterable<LogEntry> findAllByUserOrderByDateAsc(User user);
}
