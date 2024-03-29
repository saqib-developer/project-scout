import sendgrid from "@sendgrid/mail";

sendgrid.setApiKey(process.env.SENDGRID_API_KEY);

export default async function handler(req, res) {
  const { userEmail, subject, message } = req.body;

  const msg = {
    to: userEmail,
    from: "muhammadsaqib8379@gmail.com",
    subject: subject,
    text: message,
  };

  try {
    await sendgrid.send(msg);
    res.status(200).json({ message: "Email sent successfully!" });
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).json({ message: "Error sending email" });
  }
}
