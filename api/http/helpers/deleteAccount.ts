import useRepositories from '../../repositories/useRepositories';

const deleteAccount = async (email: string): Promise<boolean> => {
  try {
    const { users, logEntries, passageNotes, passageNoteTags, dailyReminders } = await useRepositories();
    const user = await users.findByEmail(email);
    if (!user) {
      return false;
    }
    await logEntries.deleteAllByOwner(user.id);
    await passageNotes.deleteAllByOwner(user.id);
    await passageNoteTags.deleteAllByOwner(user.id);
    await dailyReminders.deleteAllByOwner(user.id);
    await users.deleteById(user.id);
    return true;
  }
  catch (error) {
    return false;
  }
};

export default deleteAccount;
