import nodemailer from 'nodemailer';

const sendEmail = async ({ to, subject, html }) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT),
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    const message = {
      from: `"Khisima" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    };

    await transporter.sendMail(message);
    console.log(`Email sent to ${to}`);
  } catch (err) {
    console.error('Email sending failed:', err);
    throw new Error('Email could not be sent');
  }
};

export default sendEmail;
