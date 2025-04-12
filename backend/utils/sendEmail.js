import nodemailer from 'nodemailer';
import 'dotenv/config';

const transporter = nodemailer.createTransport({
  service: 'gmail', // or 'Outlook', 'smtp.udst.edu.qa' etc.
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function sendOtpEmail(to, otp) {
  const mailOptions = {
    from: "NexusPlus Security Team",
    to,
    subject: 'Your OTP Verification Code',
    text: `Your OTP is: ${otp}. It is valid for 10 minutes.`,
  };

  await transporter.sendMail(mailOptions);
}
