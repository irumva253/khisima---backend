const generateResetPasswordEmail = (userName, resetUrl) => {
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Password Reset</title>
    <style>
      body {
        font-family: 'Arial', sans-serif;
        background-color: #f4f6f8;
        margin: 0;
        padding: 0;
      }
      .container {
        max-width: 600px;
        margin: 40px auto;
        background-color: #ffffff;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 6px 20px rgba(0,0,0,0.15);
        border-top: 5px solid #6c99ff;
      }
      .header {
        background-color: #14205d;
        color: white;
        padding: 25px;
        text-align: center;
      }
      .header h1 {
        margin: 0;
        font-size: 26px;
        letter-spacing: 1px;
      }
      .content {
        padding: 35px 25px;
        color: #333333;
        line-height: 1.7;
      }
      .content h2 {
        font-size: 22px;
        color: #14205d;
        margin-top: 0;
      }
      .content p {
        margin: 15px 0;
      }
      .btn {
        display: inline-block;
        padding: 14px 28px;
        margin: 25px 0;
        background-color: #6c99ff;
        color: white !important;
        text-decoration: none;
        border-radius: 8px;
        font-weight: bold;
        font-size: 16px;
      }
      .footer {
        background-color: #f0f0f0;
        color: #666666;
        text-align: center;
        padding: 18px;
        font-size: 13px;
      }
      .footer a {
        color: #6c99ff;
        text-decoration: none;
      }
      @media only screen and (max-width: 600px) {
        .container {
          margin: 20px;
        }
        .content {
          padding: 25px 15px;
        }
        .header h1 {
          font-size: 22px;
        }
        .content h2 {
          font-size: 20px;
        }
        .btn {
          width: 100%;
          text-align: center;
          padding: 14px 0;
        }
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>Khisima</h1>
      </div>
      <div class="content">
        <h2>Hello ${userName},</h2>
        <p>You requested a password reset for your Khisima account. Click the button below to set a new password. This link is valid for <strong>5 minutes</strong> and can only be used once.</p>
        <a href="${resetUrl}" class="btn">Reset Password</a>
        <p>If you did not request this password reset, you can safely ignore this email. Your account remains secure.</p>
        <p>Thanks,<br/>The Khisima Team</p>
      </div>
      <div class="footer">
        &copy; ${new Date().getFullYear()} Khisima. All rights reserved. | 
        <a href="https://khisima.com">Visit our website</a>
      </div>
    </div>
  </body>
  </html>
  `;
};

export default generateResetPasswordEmail;
