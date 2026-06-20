import mongoose, { Schema } from 'mongoose';
import dayjs from 'dayjs';
import { BibleVersions, getLocaleCodes, defaultLocaleBibleVersions } from '@mybiblelog/shared';
import { StartPages, PassageNoteTagSortOrders } from '../../validation/constants';

const siteLocales = getLocaleCodes();

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
