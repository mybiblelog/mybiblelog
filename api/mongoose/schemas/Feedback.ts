import mongoose from 'mongoose';

const FeedbackSchema = new mongoose.Schema({
  ip: {
    type: String,
    required: true,
  },
  owner: {
    // Can be null if the user is not logged in
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  email: {
    type: String,
    lowercase: true,
    trim: true,
    required: [true, 'required'],
    match: [/^\S+@\S+\.\S+$/, 'is invalid'],
  },
  kind: {
    type: String,
    enum: ['bug', 'feature', 'comment'],
    required: true,
  },
  message: {
    type: String,
    trim: true,
    maxLength: 1500, // an average double-spaced page
    required: true,
  },
}, { timestamps: true });

const Feedback = mongoose.model('Feedback', FeedbackSchema);

export default Feedback;
