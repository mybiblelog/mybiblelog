import crypto from 'node:crypto';
import mongoose, { HydratedDocument, InferSchemaType } from 'mongoose';
import bcrypt from 'bcrypt';
import { UserSettingsSchema } from './UserSettings';

const SALT_WORK_FACTOR = 10;

// bcrypt only uses the first 72 bytes of a password; longer values would be
// silently truncated, so we reject them at validation time instead.
const BCRYPT_MAX_PASSWORD_BYTES = 72;

export const UserSchema = new mongoose.Schema({
  email: { type: String, lowercase: true, unique: true, required: [true, 'required'], match: [/^\S+@\S+\.\S+$/, 'is invalid'], index: true },
  isAdmin: { type: Boolean, default: false },
  password: {
    type: String,
    minlength: 8,
    maxlength: BCRYPT_MAX_PASSWORD_BYTES,
    validate: {
      // maxlength counts characters; multibyte characters can exceed the
      // bcrypt byte limit with fewer characters, so also check byte length
      validator: (value: string) => Buffer.byteLength(value, 'utf8') <= BCRYPT_MAX_PASSWORD_BYTES,
      message: 'maxlength',
      type: 'maxlength',
    },
  },
  googleId: { type: String, default: null },

  // email verification flow
  emailVerificationCode: { type: String, default: () => crypto.randomBytes(64).toString('hex') },
  emailVerificationExpires: { type: Date, default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) }, // 24 hours
  emailVerificationCodeLastSentAt: { type: Date, default: () => new Date(0) },

  // change email flow
  newEmail: { type: String, lowercase: true, trim: true, required: false, match: [/^\S+@\S+\.\S+$/, 'is invalid'] },
  newEmailVerificationCode: { type: String, default: '' },
  newEmailVerificationExpires: { type: Date, default: () => new Date(0) },
  oldEmails: { type: [String], default: () => [] },

  // password reset flow
  passwordResetCode: { type: String, default: '' },
  passwordResetExpires: { type: Date, default: () => new Date(0) },

  settings: {
    type: UserSettingsSchema,
    required: true,
    default: () => ({}),
  },
}, {
  timestamps: true,
});

// Email uniqueness is enforced by the unique index (declared on the `email`
// field above) plus an explicit pre-insert check in the user repository.

UserSchema.pre('save', function() {
  // eslint-disable-next-line @typescript-eslint/no-this-alias
  const user = this;
  return new Promise((resolve, reject) => {
    // only hash the password if it has been modified (or is new)
    if (user.password === null || !user.isModified('password')) {
      return resolve();
    }
    bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt) {
      if (err) { return reject(err); }
      bcrypt.hash(String(user.password), salt, function(err, hash) {
        if (err) { return reject(err); }
        user.password = hash;
        resolve();
      });
    });
  });
});

const User = mongoose.model('User', UserSchema);

export type UserDoc = HydratedDocument<
  ReturnType<typeof User['hydrate']>
>;
export type IUser = InferSchemaType<typeof UserSchema>;

export default User;

// Helpers (in place of virtuals, which are not compatible with type inference)

export const isEmailVerified = (user: IUser) => {
  return user.emailVerificationCode === '';
};
