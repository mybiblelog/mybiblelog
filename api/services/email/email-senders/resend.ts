import { Resend } from 'resend';
import { SendMail } from '../email-types';
import { getConfig } from '../../../config';

const sendEmail: SendMail = async ({ from, to, replyTo, subject, headers = {}, attachments = [], ...rest }) => {
  const resend = new Resend(getConfig().resendApiKey);
  const { data, error } = await resend.emails.send({
    from,
    to,
    replyTo,
    subject,
    headers,
    attachments,
    ...rest,
  });

  if (error) {
    throw error;
  }

  return data;
};

export default sendEmail;
