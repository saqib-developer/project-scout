import type { NextApiRequest, NextApiResponse } from 'next';
import sendgrid from '@sendgrid/mail';

sendgrid.setApiKey(process.env.SENDGRID_API_KEY as string);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { userEmail, subject, message } = req.body;

  const msg = {
    to: userEmail,
    from: 'muhammadsaqib8379@gmail.com', // This must be a verified sender in your SendGrid account
    subject,
    text: message,
  };

  try {
    await sendgrid.send(msg);
    res.status(200).json({ message: 'Email sent successfully!' });
  } catch (error: any) {
    console.error('Error sending email:', error);
    res.status(500).json({
      message: 'Error sending email',
      error: error?.response?.body || error.message,
    });
  }
}
