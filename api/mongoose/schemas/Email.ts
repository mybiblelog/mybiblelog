import mongoose from 'mongoose';

export const EmailSchema = new mongoose.Schema({
  from: { type: String, required: true },
  to: { type: String, required: true },
  replyTo: { type: String },
  headers: {
    type: Map,
    of: String,
    default: {},
  },
  subject: { type: String, required: true },
  text: { type: String },
  html: { type: String },
  status: { type: String, enum: ['pending', 'sent', 'failed', 'log_only'], default: 'pending' },
}, { timestamps: true });

// The "text or html required" check lives in the email repository, not a hook.

const Email = mongoose.model('Email', EmailSchema);

export default Email;
