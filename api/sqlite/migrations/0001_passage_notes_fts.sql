-- Full-text index over passage note content, replacing the Mongo `$text`
-- index. The porter tokenizer stems English words the way `$text` does.
-- It is a standalone FTS5 table keyed by note id (not external-content on
-- rowid), because `passage_notes` has a text primary key and its implicit
-- rowids are not stable across VACUUM.
CREATE VIRTUAL TABLE `passage_notes_fts` USING fts5(`note_id` UNINDEXED, `content`, tokenize = 'porter unicode61');
--> statement-breakpoint
CREATE TRIGGER `passage_notes_fts_insert` AFTER INSERT ON `passage_notes` BEGIN
  INSERT INTO `passage_notes_fts` (`note_id`, `content`) VALUES (new.`id`, new.`content`);
END;
--> statement-breakpoint
CREATE TRIGGER `passage_notes_fts_update` AFTER UPDATE OF `content` ON `passage_notes` BEGIN
  UPDATE `passage_notes_fts` SET `content` = new.`content` WHERE `note_id` = old.`id`;
END;
--> statement-breakpoint
CREATE TRIGGER `passage_notes_fts_delete` AFTER DELETE ON `passage_notes` BEGIN
  DELETE FROM `passage_notes_fts` WHERE `note_id` = old.`id`;
END;
