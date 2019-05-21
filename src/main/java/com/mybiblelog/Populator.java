package com.mybiblelog;

import java.util.Date;

import javax.annotation.Resource;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import com.mybiblelog.logentry.LogEntry;
import com.mybiblelog.logentry.LogEntryRepository;

@Component
public class Populator implements CommandLineRunner {

	@Resource
	private LogEntryRepository logEntryRepo;

	@Override
	public void run(String... args) throws Exception {
		
		// Add 2 entries if there are none yet
		if (logEntryRepo.count() == 0) {
			LogEntry entry1 = new LogEntry(null, 1, 20, new Date());
			LogEntry entry2 = new LogEntry(null, 1001, 1220, new Date());
			logEntryRepo.save(entry1);
			logEntryRepo.save(entry2);
		}

	}
}
