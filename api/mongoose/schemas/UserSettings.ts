import mongoose, { Schema } from 'mongoose';
import dayjs from 'dayjs';
import { BibleVersions, getLocaleCodes, defaultLocaleBibleVersions } from '@mybiblelog/shared';

const siteLocales = getLocaleCodes();

export const StartPages = ['start', 'today', 'books', 'checklist', 'calendar', 'notes'] as const;

export const PassageNoteTagSortOrders = [
  'label:ascending',
  'createdAt:descending',
  'createdAt:ascending',
  'noteCount:descending',
  'noteCount:ascending',
  'color:hue',
] as const;

/**
 * @swagger
 * components:
 *   schemas:
 *     UserSettings:
 *       type: object
 *       properties:
 *         dailyVerseCountGoal:
 *           type: number
 *           description: The user's daily verse count goal
 *         lookBackDate:
 *           type: string
 *           format: date
 *           description: The date to look back to for statistics
 *         preferredBibleVersion:
 *           type: string
 *           description: The user's preferred Bible version
 *         startPage:
 *           type: string
 *           description: The user's preferred start page
 *         passageNoteTagSortOrder:
 *           type: string
 *           description: The user's preferred sort order for passage note tags
 *         locale:
 *           type: string
 *           description: The user's preferred locale
 */

export const UserSettingsSchema = new Schema({
  dailyVerseCountGoal: {
    type: Number,
    default: 86,
    required: true,
    min: 1,
    max: 1111,
  },
  lookBackDate: {
    type: String,
    required: true,
    default: () => dayjs().format('YYYY-MM-DD'),
    validate: {
      validator: (date: string) => dayjs(date, 'YYYY-MM-DD', true).isValid(),
      message: (props: { value: string }) => `${props.value} is not a valid date string`,
    },
  },
  preferredBibleVersion: {
    type: String,
    required: true,
    default: function() {
      const locale = this.locale || 'en';
      return defaultLocaleBibleVersions[locale];
    },
    validate: {
      validator: (version: string) => Object.keys(BibleVersions).includes(version),
      message: (props: { value: string }) => `${props.value} is not a recognized Bible translation`,
    },
  },
  startPage: {
    type: String,
    required: true,
    default: 'start',
    validate: {
      validator: (page: string) => StartPages.includes(page as (typeof StartPages)[number]),
      message: (props: { value: string }) => `${props.value} is not a valid start page`,
    },
  },
  passageNoteTagSortOrder: {
    type: String,
    required: true,
    default: 'label:ascending',
    validate: {
      validator: (sortOrder: string) => PassageNoteTagSortOrders.includes(sortOrder as (typeof PassageNoteTagSortOrders)[number]),
      message: (props: { value: string }) => `${props.value} is not a valid tag sort order`,
    },
  },
  locale: {
    type: String,
    required: true,
    validate: {
      validator: (locale: string) => (siteLocales as string[]).includes(locale),
      message: (props: { value: string }) => `${props.value} is not a supported locale`,
    },
  },
}, { _id: false });

const UserSettings = mongoose.model('UserSettings', UserSettingsSchema);

export default UserSettings;
