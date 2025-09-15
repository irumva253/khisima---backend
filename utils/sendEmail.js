import nodemailer from 'nodemailer';

// Create transporter with your domain's SMTP settings (same as contact form)
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.hostinger.com',
  port: parseInt(process.env.EMAIL_PORT) || 465,
  secure: true, // Use SSL (required for port 465)
  auth: {
    user: process.env.EMAIL_USER, // Hostinger email (e.g., noreply@khisima.com)
    pass: process.env.EMAIL_PASS // email password
  }
});

// Verify connection configuration
transporter.verify((error, success) => {
  if (error) {
    console.error('Email transporter configuration error:', error);
  } else {
    console.log('Email server is ready to take our messages');
  }
});

const sendEmail = async ({ to, subject, html }) => {
  try {
    const message = {
      from: `"Khisima Careers" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    };

    const result = await transporter.sendMail(message);
    console.log(`Email sent to ${to}:`, result.messageId);
    return result;
  } catch (err) {
    console.error('Email sending failed:', err);
    throw new Error('Email could not be sent');
  }
};

export default sendEmail;