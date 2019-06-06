package com.mybiblelog;

import javax.annotation.Resource;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import com.mybiblelog.logentry.LogEntryRepository;

@Component
public class Populator implements CommandLineRunner {

	@Resource
	private LogEntryRepository logEntryRepo;

	@Override
	public void run(String... args) throws Exception {}
}
