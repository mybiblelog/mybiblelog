package com.mybiblelog;

import javax.annotation.Resource;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class Populator implements CommandLineRunner {

	@Resource
	private LogEntryRepository logEntryRepo;

	@Override
	public void run(String... args) throws Exception {
		
		// Add 2 entries if there are none yet
		if (logEntryRepo.count() == 0) {
			LogEntry entry1 = new LogEntry(1, 20);
			LogEntry entry2 = new LogEntry(1001, 1220);
			logEntryRepo.save(entry1);
			logEntryRepo.save(entry2);
		}

	}
}
