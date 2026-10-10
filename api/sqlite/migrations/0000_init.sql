CREATE TABLE `daily_reminders` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`hour` integer NOT NULL,
	`minute` integer NOT NULL,
	`timezone_offset` integer NOT NULL,
	`active` integer NOT NULL,
	`public_token` text NOT NULL,
	`emails_sent_since_last_engagement` integer NOT NULL,
	`next_occurrence` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `daily_reminders_owner_idx` ON `daily_reminders` (`owner_id`);--> statement-breakpoint
CREATE INDEX `daily_reminders_public_token_idx` ON `daily_reminders` (`public_token`);--> statement-breakpoint
CREATE INDEX `daily_reminders_due_idx` ON `daily_reminders` (`active`,`next_occurrence`);--> statement-breakpoint
CREATE TABLE `emails` (
	`id` text PRIMARY KEY NOT NULL,
	`from_address` text NOT NULL,
	`to_address` text NOT NULL,
	`reply_to` text,
	`headers` text NOT NULL,
	`subject` text NOT NULL,
	`text` text,
	`html` text,
	`status` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `emails_to_created_at_idx` ON `emails` (`to_address`,`created_at`);--> statement-breakpoint
CREATE TABLE `feedback` (
	`id` text PRIMARY KEY NOT NULL,
	`ip` text NOT NULL,
	`owner_id` text,
	`email` text NOT NULL,
	`kind` text NOT NULL,
	`message` text NOT NULL,
	`status` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `feedback_status_created_at_idx` ON `feedback` (`status`,`created_at`);--> statement-breakpoint
CREATE INDEX `feedback_created_at_idx` ON `feedback` (`created_at`);--> statement-breakpoint
CREATE INDEX `feedback_owner_idx` ON `feedback` (`owner_id`);--> statement-breakpoint
CREATE TABLE `log_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`date` text NOT NULL,
	`start_verse_id` integer NOT NULL,
	`end_verse_id` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `log_entries_owner_date_idx` ON `log_entries` (`owner_id`,`date`);--> statement-breakpoint
CREATE INDEX `log_entries_date_idx` ON `log_entries` (`date`);--> statement-breakpoint
CREATE TABLE `passage_note_passages` (
	`id` text PRIMARY KEY NOT NULL,
	`note_id` text NOT NULL,
	`position` integer NOT NULL,
	`start_verse_id` integer NOT NULL,
	`end_verse_id` integer NOT NULL,
	FOREIGN KEY (`note_id`) REFERENCES `passage_notes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `passage_note_passages_note_idx` ON `passage_note_passages` (`note_id`,`position`);--> statement-breakpoint
CREATE TABLE `passage_note_tag_links` (
	`note_id` text NOT NULL,
	`tag_id` text NOT NULL,
	`position` integer NOT NULL,
	PRIMARY KEY(`note_id`, `position`),
	FOREIGN KEY (`note_id`) REFERENCES `passage_notes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `passage_note_tag_links_tag_idx` ON `passage_note_tag_links` (`tag_id`);--> statement-breakpoint
CREATE TABLE `passage_note_tags` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`label` text NOT NULL,
	`color` text NOT NULL,
	`description` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `passage_note_tags_owner_label_unique` ON `passage_note_tags` (`owner_id`,`label`);--> statement-breakpoint
CREATE TABLE `passage_notes` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`content` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `passage_notes_owner_created_at_idx` ON `passage_notes` (`owner_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `passage_notes_created_at_idx` ON `passage_notes` (`created_at`);--> statement-breakpoint
CREATE TABLE `user_platforms` (
	`user_id` text NOT NULL,
	`platform` text NOT NULL,
	`first_seen_at` integer NOT NULL,
	`last_seen_at` integer NOT NULL,
	`app_version` text,
	PRIMARY KEY(`user_id`, `platform`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`is_admin` integer NOT NULL,
	`password` text,
	`google_id` text,
	`email_verification_code` text NOT NULL,
	`email_verification_expires` integer NOT NULL,
	`email_verification_code_last_sent_at` integer NOT NULL,
	`email_verification_attempts` integer NOT NULL,
	`existing_account_notice_last_sent_at` integer NOT NULL,
	`new_email` text,
	`new_email_verification_code` text NOT NULL,
	`new_email_verification_expires` integer NOT NULL,
	`new_email_verification_attempts` integer NOT NULL,
	`old_emails` text NOT NULL,
	`password_reset_code` text NOT NULL,
	`password_reset_expires` integer NOT NULL,
	`password_reset_attempts` integer NOT NULL,
	`token_version` integer NOT NULL,
	`settings` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE INDEX `users_created_at_idx` ON `users` (`created_at`);