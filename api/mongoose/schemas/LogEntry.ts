import mongoose from 'mongoose';

import dayjs from 'dayjs';
import { Bible } from '@mybiblelog/shared';

export const LogEntrySchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  date: {
    type: String,
    required: true,
    validate: {
      validator: (v: string) => dayjs(v, 'YYYY-MM-DD', true).isValid(),
      message: (props) => `${props.value} is not a valid date string`,
    },
  },
  startVerseId: {
    type: Number,
    required: true,
    validate: {
      validator: Bible.verseExists,
      message: (props) => `${props.value} is not a valid verse`,
    },
  },
  endVerseId: {
    type: Number,
    required: true,
    validate: {
      validator: Bible.verseExists,
      message: (props) => `${props.value} is not a valid verse`,
    },
  },
}, {
  timestamps: true,
});

// Verse-range validation lives in the log-entry repository, not a hook.

const LogEntry = mongoose.model('LogEntry', LogEntrySchema);

export default LogEntry;
