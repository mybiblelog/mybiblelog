import { parseServerUserSettings } from './settingsApi';

describe('parseServerUserSettings', () => {
  it('passes through valid fields', () => {
    expect(
      parseServerUserSettings({
        dailyVerseCountGoal: 100,
        lookBackDate: '2020-01-01',
        preferredBibleVersion: 'ESV',
        startPage: 'today',
        locale: 'en',
      }),
    ).toEqual({
      dailyVerseCountGoal: 100,
      lookBackDate: '2020-01-01',
      preferredBibleVersion: 'ESV',
      startPage: 'today',
      locale: 'en',
    });
  });

  it('coerces a numeric goal that arrives as a string', () => {
    expect(parseServerUserSettings({ dailyVerseCountGoal: '42' })?.dailyVerseCountGoal).toBe(42);
  });

  it('drops a non-numeric goal', () => {
    expect(parseServerUserSettings({ dailyVerseCountGoal: 'abc' })?.dailyVerseCountGoal).toBeUndefined();
  });

  it('returns null for non-object input', () => {
    expect(parseServerUserSettings(null)).toBeNull();
    expect(parseServerUserSettings('x')).toBeNull();
  });
});
