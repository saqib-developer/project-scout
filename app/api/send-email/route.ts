// app/api/send-email/route.ts
import { NextRequest, NextResponse } from "next/server";
import sendgrid from "@sendgrid/mail";

console.log("→ [send-email] Process ENV Key:", Boolean(process.env.SENDGRID_API_KEY));
sendgrid.setApiKey(process.env.SENDGRID_API_KEY as string);

export async function POST(req: NextRequest) {
  console.log("→ [send-email] POST handler hit");
  try {
    const { userEmail, subject, message } = await req.json();
    console.log("→ [send-email] Payload:", { userEmail, subject, message });

    const msg = {
      to: userEmail,
      from: "muhammadsaqib8379@gmail.com", // must be a Verified Sender
      subject,
      text: message,
    };

    const result = await sendgrid.send(msg);
    console.log("→ [send-email] SendGrid send() result:", result);

    return NextResponse.json({ message: "Email sent successfully!", result });
  } catch (error: any) {
    console.error("→ [send-email] Caught Exception:", error);
    if (error.response && error.response.body) {
      console.error("→ [send-email] SendGrid response body:", error.response.body);
    }
    return NextResponse.json(
      {
        message: "Error sending email",
        error: error?.message,
        sendGridError: error.response?.body,
      },
      { status: 500 }
    );
  }
}
