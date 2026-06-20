import mongoose, { InferSchemaType } from 'mongoose';
import { Bible } from '@mybiblelog/shared';

const PassageSchema = new mongoose.Schema({
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
}, { timestamps: false });

export const PassageNoteSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  passages: {
    type: [PassageSchema],
  },
  content: {
    type: String,
    trim: true,
    maxLength: 3000, // an average single-spaced page
    default: '',
    index: 'text',
  },
  tags: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PassageNoteTag',
  }],
}, {
  timestamps: true,
});

// Per-passage verse-range validation and the content-or-passages requirement
// live in the passage-note repository, not in schema hooks.

const PassageNote = mongoose.model('PassageNote', PassageNoteSchema);

export type IPassageNote = InferSchemaType<typeof PassageNoteSchema>;

export default PassageNote;
