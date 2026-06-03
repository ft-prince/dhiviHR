// src/lib/mail.ts
import nodemailer from 'nodemailer';
import type { SentMessageInfo } from 'nodemailer';

// Create the transporter using your fixed env variables
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_HOST_USER,
    pass: process.env.EMAIL_HOST_PASSWORD,
  },
});

interface SendEmailOptions {
  to: string;
  subject: string;
  htmlContent: string;
  // Accept both types, but we will safely coerce it below
  pdfBuffer: Buffer | Uint8Array; 
  pdfFilename: string;
}

export async function sendReceiptEmail({
  to,
  subject,
  htmlContent,
  pdfBuffer,
  pdfFilename,
}: SendEmailOptions) {
  try {
    const mailOptions = {
      from: `"Your Business Name" <${process.env.EMAIL_HOST_USER}>`,
      to,
      subject,
      html: htmlContent,
      attachments: [
        {
          filename: pdfFilename,
          // Fix 1: Wrap in Buffer.from to satisfy Nodemailer's strict type definition
          content: Buffer.from(pdfBuffer), 
          contentType: 'application/pdf',
        },
      ],
    };

    // Fix 2: Cast the resolved promise to SentMessageInfo so TypeScript recognizes 'messageId'
    const info = (await transporter.sendMail(mailOptions)) as SentMessageInfo;
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email error caught:', error);
    throw new Error('Email delivery failed');
  }
}