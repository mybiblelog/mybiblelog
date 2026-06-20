/* eslint-disable no-console */

import mongoose from 'mongoose';
import useMongooseModels, { closeConnection } from '../mongoose/useMongooseModels';

// Main
const main = async (): Promise<void> => {
  const {
    DailyReminder,
    Email,
    LogEntry,
    PassageNote,
    PassageNoteTag,
    User,
    // UserSettings, // Embedded in "User",
    Feedback,
  } = await useMongooseModels();

  // delete all documents
  await DailyReminder.deleteMany({});
  await Email.deleteMany({});
  await LogEntry.deleteMany({});
  await PassageNote.deleteMany({});
  await PassageNoteTag.deleteMany({});
  await User.deleteMany({});
  await Feedback.deleteMany({});

  // seed users
  const adminUser = await new User({
    _id: new mongoose.Types.ObjectId(),
    email: 'admin@example.com',
    isAdmin: true,
    password: 'password',
    emailVerificationCode: null,
  });
  await adminUser.save();

  const user = await new User({
    _id: new mongoose.Types.ObjectId(),
    email: 'user@example.com',
    isAdmin: false,
    password: 'password',
    emailVerificationCode: null,
  });
  await user.save();

  // close connection
  await closeConnection();
};

console.log('This is a destructive operation that will permanently delete data.');
console.log('You must uncomment the script manually to enable this script.');
// main();
