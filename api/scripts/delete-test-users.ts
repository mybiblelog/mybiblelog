/* eslint-disable no-console */

import useCollections, { closeConnection } from '../mongo/useCollections';
import deleteAccount from '../http/helpers/deleteAccount';

// Main
const main = async (): Promise<void> => {
  const { users } = await useCollections();

  const testUsers = await users.find({
    email: {
      $regex: '^test_user_.*@example\\.com$',
      $options: 'i',
    },
  }).toArray();

  console.log(`Found ${testUsers.length} test users.`);

  for (const user of testUsers) {
    console.log(`Deleting user ${user.email}...`);
    await deleteAccount(user.email);
  }

  console.log(`Deleted ${testUsers.length} test users.`);

  // close connection
  await closeConnection();
};

console.log('This is a destructive operation that will permanently delete data.');
console.log('You must uncomment the script manually to enable this script.');
// main();
