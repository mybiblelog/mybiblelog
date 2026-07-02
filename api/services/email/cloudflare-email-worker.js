/**
 * REFERENCE FILE
 * A Cloudflare Worker that unsubscribes users from daily reminders.
 * Console output is the Worker's logging mechanism (visible in the Cloudflare dashboard).
 */
export default {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Cloudflare email handler signature
  async email(message, env, ctx) {
    // TODO: Replace with the actual domain name
    const appDomain = 'https://mail.domain.com';

    try {
      /*
        Example recipients:
        unsubscribe@mybiblelog.com
        unsubscribe+fad5c63f4b9923e275@mybiblelog.com
      */

      const toAddress = message.to || '<missing_recipient>';

      // Only process emails sent to the "unsubscribe" mailbox
      // This matches "unsubscribe" or "unsubscribe+TOKEN"
      const match = toAddress.match(/^unsubscribe(?:\+([^@]+))?@/i);

      if (!match) {
        // Email not intended for the unsubscribe worker
        console.log('Ignoring email not sent to unsubscribe:', toAddress);
        return;
      }

      // Extract the token if present
      const token = match[1];

      if (!token) {
        console.log('No token provided in unsubscribe email:', toAddress);
        return;
      }

      // Call backend unsubscribe endpoint
      const response = await fetch(
        `${appDomain}/api/reminders/daily-reminder/unsubscribe/${token}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        },
      );

      if (response.ok) {
        console.log('Successfully unsubscribed token:', token);
      }
      else {
        console.log(
          'Failed to unsubscribe token:',
          token,
          'status:',
          response.status,
        );
      }
    }
    catch (err) {
      console.error('Error processing unsubscribe email:', err);
    }
  },
};
