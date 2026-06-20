import mongoose from 'mongoose';
import crypto from 'node:crypto';
import { getNextOccurrence } from '../../repositories/helpers/reminder-schedule';

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

DailyReminderSchema.pre('save', async function() {
  const nextOccurrence = getNextOccurrence({
    hour: this.hour,
    minute: this.minute,
    timezoneOffset: this.timezoneOffset,
  });
  this.nextOccurrence = nextOccurrence.getTime();

  // If the daily reminder was just activated,
  // rotate the public token (email links, tracking, unsubscribe)
  if (this.isModified('active') && this.active) {
    this.publicToken = crypto.randomBytes(16).toString('base64url');
    this.lastEmailEngagementAt = new Date();
  }
});

const DailyReminder = mongoose.model('DailyReminder', DailyReminderSchema);

export default DailyReminder;
