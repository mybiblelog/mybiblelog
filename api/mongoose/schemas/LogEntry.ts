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

LogEntrySchema.pre('validate', async function() {
  if (!Bible.validateRange(this.startVerseId, this.endVerseId)) {
    throw new Error('Invalid Verse Range');
  }
});

const LogEntry = mongoose.model('LogEntry', LogEntrySchema);

export default LogEntry;
