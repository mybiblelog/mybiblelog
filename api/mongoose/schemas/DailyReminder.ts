import mongoose from 'mongoose';
import crypto from 'node:crypto';

export const DailyReminderSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  hour: { // UTC
    type: Number,
    required: true,
    min: 0,
    max: 23,
  },
  minute: { // UTC
    type: Number,
    required: true,
    min: 0,
    max: 59,
  },
  timezoneOffset: { // number of minutes difference between UTC and user timezone
    type: Number,
    required: true,
    min: -12 * 60,
    max: 14 * 60,
  },
  active: {
    type: Boolean,
    default: false,
  },
  publicToken: {
    type: String,
    default: () => crypto.randomBytes(16).toString('base64url'),
  },
  lastEmailEngagementAt: {
    type: Date,
    default: null,
  },
  nextOccurrence: {
    type: Number,
    default: () => Date.now(),
  },
}, {
  timestamps: true,
});

// nextOccurrence recomputation and public-token rotation on activation live in
// the daily-reminder repository, not in a schema hook.

const DailyReminder = mongoose.model('DailyReminder', DailyReminderSchema);

export default DailyReminder;
