import mongoose from 'mongoose';

export const PassageNoteTagSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  label: {
    type: String,
    required: true,
    trim: true,
    minLength: 1,
    maxLength: 32,
  },
  color: {
    type: String,
    required: true,
    validate: {
      validator(value) {
        // require a hexadecimal color value like #FFF or #0099ff
        return /^#([a-fA-F0-9]{6}|[a-fA-F0-9]{3})$/.test(value);
      },
      message: (props) => `${props.value} is not a valid hexadecimal color`,
    },
  },
  description: {
    type: String,
    default: '',
    trim: true,
    maxLength: 1500, // an average double-spaced page
  },
  // This property is not stored in the database
  // it should be computed and added separately per request
  noteCount: {
    type: Number,
    required: false,
  },
}, {
  timestamps: true,
});

// Make sure labels are unique per user
PassageNoteTagSchema.index({ owner: 1, label: 1 }, { unique: true });

const PassageNoteTag = mongoose.model('PassageNoteTag', PassageNoteTagSchema);

export default PassageNoteTag;
