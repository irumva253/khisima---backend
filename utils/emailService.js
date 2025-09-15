import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create transporter with your domain's SMTP settings
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'mail.khisima.com', // Your Hostinger SMTP server
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: false, // Use TLS
  auth: {
    user: process.env.EMAIL_USER, // Your domain email (e.g., noreply@yourdomain.com)
    pass: process.env.EMAIL_PASS // Your email password
  },
  tls: {
    rejectUnauthorized: false // For self-signed certificates, remove if you have valid SSL
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

// Email templates (remain the same as your original code)
const getContactEmailTemplate = (data) => {
  const { firstName, lastName, email, phone, preferredLanguage, message, notificationId, submittedAt } = data;
  
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Contact Form Submission - Khisima</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                background-color: #f8fafc;
            }
            
            .container {
                max-width: 600px;
                margin: 0 auto;
                background-color: #ffffff;
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
            }
            
            .header {
                background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
                color: white;
                padding: 30px;
                text-align: center;
                position: relative;
            }
            
            .header::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="75" cy="75" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="50" cy="10" r="0.5" fill="rgba(255,255,255,0.1)"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
                opacity: 0.3;
            }
            
            .header-content {
                position: relative;
                z-index: 1;
            }
            
            .header h1 {
                font-size: 28px;
                margin-bottom: 8px;
                font-weight: 700;
            }
            
            .header p {
                font-size: 16px;
                opacity: 0.9;
            }
            
            .flag-emoji {
                font-size: 24px;
                margin: 0 8px;
            }
            
            .content {
                padding: 40px 30px;
            }
            
            .alert {
                background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                color: white;
                padding: 20px;
                border-radius: 8px;
                margin-bottom: 30px;
                text-align: center;
                font-weight: 600;
                font-size: 16px;
            }
            
            .person-card {
                background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
                border-radius: 10px;
                padding: 25px;
                margin-bottom: 25px;
                border-left: 5px solid #3b82f6;
            }
            
            .person-info {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 15px;
                margin-bottom: 20px;
            }
            
            .info-item {
                background: white;
                padding: 15px;
                border-radius: 8px;
                border: 1px solid #e5e7eb;
                transition: all 0.3s ease;
            }
            
            .info-item:hover {
                box-shadow: 0 2px 8px rgba(59, 130, 246, 0.15);
                border-color: #3b82f6;
            }
            
            .info-label {
                font-size: 12px;
                color: #6b7280;
                text-transform: uppercase;
                font-weight: 600;
                margin-bottom: 5px;
                letter-spacing: 0.5px;
            }
            
            .info-value {
                font-size: 14px;
                color: #111827;
                font-weight: 500;
            }
            
            .full-width {
                grid-column: 1 / -1;
            }
            
            .message-section {
                background: white;
                border: 2px solid #e5e7eb;
                border-radius: 10px;
                padding: 25px;
                margin: 25px 0;
            }
            
            .message-header {
                display: flex;
                align-items: center;
                margin-bottom: 15px;
                padding-bottom: 10px;
                border-bottom: 2px solid #f3f4f6;
            }
            
            .message-icon {
                background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
                color: white;
                width: 40px;
                height: 40px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                margin-right: 12px;
                font-weight: bold;
            }
            
            .message-title {
                font-size: 18px;
                font-weight: 700;
                color: #111827;
            }
            
            .message-content {
                background: #f8fafc;
                padding: 20px;
                border-radius: 8px;
                border-left: 4px solid #f59e0b;
                font-size: 15px;
                line-height: 1.7;
                color: #374151;
                white-space: pre-wrap;
            }
            
            .metadata {
                background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
                border-radius: 10px;
                padding: 20px;
                margin: 25px 0;
            }
            
            .metadata h3 {
                color: #374151;
                font-size: 16px;
                margin-bottom: 15px;
                font-weight: 600;
            }
            
            .metadata-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 10px;
            }
            
            .metadata-item {
                display: flex;
                justify-content: space-between;
                padding: 8px 0;
                border-bottom: 1px solid #d1d5db;
            }
            
            .metadata-item:last-child {
                border-bottom: none;
            }
            
            .metadata-label {
                font-weight: 600;
                color: #6b7280;
                font-size: 13px;
            }
            
            .metadata-value {
                color: #111827;
                font-size: 13px;
                font-family: 'Courier New', monospace;
            }
            
            .actions {
                background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
                color: white;
                padding: 25px;
                text-align: center;
                margin: 25px 0;
                border-radius: 10px;
            }
            
            .actions h3 {
                margin-bottom: 15px;
                font-size: 18px;
            }
            
            .action-buttons {
                display: flex;
                gap: 15px;
                justify-content: center;
                flex-wrap: wrap;
            }
            
            .action-btn {
                display: inline-block;
                padding: 12px 24px;
                border-radius: 6px;
                text-decoration: none;
                font-weight: 600;
                font-size: 14px;
                transition: all 0.3s ease;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            
            .btn-primary {
                background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
                color: white;
            }
            
            .btn-secondary {
                background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                color: white;
            }
            
            .btn-danger {
                background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
                color: white;
            }
            
            .action-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
            }
            
            .footer {
                background: #f9fafb;
                padding: 25px;
                text-align: center;
                border-top: 1px solid #e5e7eb;
            }
            
            .footer p {
                color: #6b7280;
                font-size: 14px;
                margin-bottom: 10px;
            }
            
            .footer-links {
                display: flex;
                justify-content: center;
                gap: 20px;
                margin-top: 15px;
            }
            
            .footer-link {
                color: #3b82f6;
                text-decoration: none;
                font-size: 13px;
                font-weight: 500;
            }
            
            .footer-link:hover {
                text-decoration: underline;
            }
            
            .language-badge {
                display: inline-block;
                background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
                color: white;
                padding: 6px 12px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                margin-left: 8px;
            }
            
            .priority-indicator {
                width: 12px;
                height: 12px;
                border-radius: 50%;
                display: inline-block;
                margin-right: 8px;
                background: #10b981;
            }
            
            @media (max-width: 600px) {
                .container {
                    margin: 10px;
                    border-radius: 8px;
                }
                
                .person-info,
                .metadata-grid {
                    grid-template-columns: 1fr;
                }
                
                .action-buttons {
                    flex-direction: column;
                }
                
                .footer-links {
                    flex-direction: column;
                    gap: 10px;
                }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <!-- Header -->
            <div class="header">
                <div class="header-content">
                    <h1>🌍 New Contact Message</h1>
                    <p>Khisima - Bridging Cultures Through Language</p>
                    <div style="margin-top: 10px;">
                        <span class="flag-emoji">🇷🇼</span>
                        <span class="flag-emoji">💬</span>
                        <span class="flag-emoji">🌐</span>
                    </div>
                </div>
            </div>

            <!-- Content -->
            <div class="content">
                <!-- Alert -->
                <div class="alert">
                    <div class="priority-indicator"></div>
                    New message received from your website contact form
                </div>

                <!-- Person Information -->
                <div class="person-card">
                    <h2 style="color: #1f2937; margin-bottom: 20px; font-size: 20px;">
                        👤 Contact Information
                    </h2>
                    <div class="person-info">
                        <div class="info-item">
                            <div class="info-label">First Name</div>
                            <div class="info-value">${firstName}</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">Last Name</div>
                            <div class="info-value">${lastName}</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">📧 Email Address</div>
                            <div class="info-value">
                                <a href="mailto:${email}" style="color: #3b82f6; text-decoration: none;">${email}</a>
                            </div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">📱 Phone Number</div>
                            <div class="info-value">
                                <a href="tel:${phone}" style="color: #3b82f6; text-decoration: none;">${phone}</a>
                            </div>
                        </div>
                        <div class="info-item full-width">
                            <div class="info-label">🌐 Preferred Language</div>
                            <div class="info-value">
                                ${preferredLanguage}
                                <span class="language-badge">${preferredLanguage}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Message Section -->
                <div class="message-section">
                    <div class="message-header">
                        <div class="message-icon">💬</div>
                        <div class="message-title">Their Message</div>
                    </div>
                    <div class="message-content">${message}</div>
                </div>

                <!-- Metadata -->
                <div class="metadata">
                    <h3>📊 Submission Details</h3>
                    <div class="metadata-grid">
                        <div class="metadata-item">
                            <span class="metadata-label">Notification ID:</span>
                            <span class="metadata-value">${notificationId}</span>
                        </div>
                        <div class="metadata-item">
                            <span class="metadata-label">Submitted At:</span>
                            <span class="metadata-value">${new Date(submittedAt).toLocaleString('en-US', {
                              timeZone: 'Africa/Kigali',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })} CAT</span>
                        </div>
                        <div class="metadata-item">
                            <span class="metadata-label">Status:</span>
                            <span class="metadata-value">New/Unread</span>
                        </div>
                        <div class="metadata-item">
                            <span class="metadata-label">Source:</span>
                            <span class="metadata-value">Website Contact Form</span>
                        </div>
                    </div>
                </div>

                <!-- Action Buttons -->
                <div class="actions">
                    <h3>🚀 Quick Actions</h3>
                    <p style="margin-bottom: 20px; opacity: 0.9;">Manage this contact directly from your dashboard</p>
                    <div class="action-buttons">
                        <a href="${process.env.ADMIN_DASHBOARD_URL}/notifications/${notificationId}" class="action-btn btn-primary">
                            View in Dashboard
                        </a>
                        <a href="mailto:${email}?subject=Re: Your message to Khisima&body=Hi ${firstName},%0A%0AThank you for contacting Khisima. " class="action-btn btn-secondary">
                            Reply via Email
                        </a>
                        <a href="tel:${phone}" class="action-btn btn-danger">
                            Call ${firstName}
                        </a>
                    </div>
                </div>
            </div>

            <!-- Footer -->
            <div class="footer">
                <p><strong>Khisima</strong> - Connecting Africa to the World Through Language</p>
                <p>This is an automated notification from your website contact form.</p>
                <div class="footer-links">
                    <a href="${process.env.ADMIN_DASHBOARD_URL}" class="footer-link">Admin Dashboard</a>
                    <a href="${process.env.WEBSITE_URL}" class="footer-link">Visit Website</a>
                    <a href="mailto:${process.env.SUPPORT_EMAIL}" class="footer-link">Support</a>
                </div>
                <p style="margin-top: 15px; font-size: 12px;">
                    🏢 Kigali, Rwanda | 🌍 Bridging Cultures Through Technology
                </p>
            </div>
        </div>
    </body>
    </html>
  `;
};

// Auto-reply email template for the person who submitted the form
const getAutoReplyTemplate = (data) => {
  const { firstName, lastName, preferredLanguage } = data;
  
  // Greeting in different languages
  const greetings = {
    'English': 'Hello',
    'Kinyarwanda': 'Muraho',
    'French': 'Bonjour',
    'Swahili': 'Hujambo'
  };
  
  const greeting = greetings[preferredLanguage] || greetings['English'];
  
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Thank You for Contacting Khisima</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f8fafc;
            }
            
            .container {
                background: white;
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
            }
            
            .header {
                background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
                color: white;
                padding: 40px 30px;
                text-align: center;
            }
            
            .header h1 {
                font-size: 32px;
                margin-bottom: 10px;
                font-weight: 700;
            }
            
            .header p {
                font-size: 18px;
                opacity: 0.9;
            }
            
            .content {
                padding: 40px 30px;
            }
            
            .greeting {
                font-size: 24px;
                font-weight: 600;
                color: #1f2937;
                margin-bottom: 20px;
                text-align: center;
            }
            
            .message-box {
                background: linear-gradient(135deg, #e0f2fe 0%, 'b3e5fc 100%');
                padding: 30px;
                border-radius: 10px;
                margin: 25px 0;
                border-left: 5px solid #3b82f6;
            }
            
            .feature-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 20px;
                margin: 30px 0;
            }
            
            .feature-card {
                background: #f8fafc;
                padding: 25px;
                border-radius: 10px;
                text-align: center;
                border: 2px solid #e5e7eb;
                transition: all 0.3s ease;
            }
            
            .feature-card:hover {
                border-color: #3b82f6;
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
            }
            
            .feature-icon {
                font-size: 48px;
                margin-bottom: 15px;
            }
            
            .feature-title {
                font-size: 18px;
                font-weight: 600;
                color: #1f2937;
                margin-bottom: 10px;
            }
            
            .feature-desc {
                color: #6b7280;
                font-size: 14px;
            }
            
            .cta-section {
                background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
                color: white;
                padding: 30px;
                text-align: center;
                border-radius: 10px;
                margin: 30px 0;
            }
            
            .cta-button {
                display: inline-block;
                background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
                color: white;
                padding: 15px 30px;
                border-radius: 8px;
                text-decoration: none;
                font-weight: 600;
                margin: 15px 10px;
                transition: all 0.3s ease;
            }
            
            .cta-button:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4);
            }
            
            .footer {
                background: #f9fafb;
                padding: 25px;
                text-align: center;
                border-top: 1px solid #e5e7eb;
                color: #6b7280;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>${greeting} ${firstName}! 🌟</h1>
                <p>Your message has reached us safely</p>
                <div style="margin-top: 15px; font-size: 24px;">
                    🇷🇼 🤝 🌍
                </div>
            </div>
            
            <div class="content">
                <div class="greeting">
                    Thank you for contacting Khisima!
                </div>
                
                <div class="message-box">
                    <p><strong>Dear ${firstName} ${lastName},</strong></p>
                    <p>We have received your message and we're excited to connect with you! Our team will review your inquiry and get back to you shortly.</p>
                    <p>At Khisima, we believe in the power of language to bridge cultures and create meaningful connections across Africa and beyond.</p>
                </div>
                
                <div class="feature-grid">
                    <div class="feature-card">
                        <div class="feature-icon">⚡</div>
                        <div class="feature-title">Fast Response</div>
                        <div class="feature-desc">We respond to all inquiries within 24 hours</div>
                    </div>
                    <div class="feature-card">
                        <div class="feature-icon">🌐</div>
                        <div class="feature-title">Multilingual Support</div>
                        <div class="feature-desc">We communicate in your preferred language</div>
                    </div>
                    <div class="feature-card">
                        <div class="feature-icon">🤝</div>
                        <div class="feature-title">Personal Touch</div>
                        <div class="feature-desc">Every conversation matters to us</div>
                    </div>
                
                <div class="cta-section">
                    <h3>While you wait, explore more about Khisima</h3>
                    <a href="${process.env.WEBSITE_URL}/about" class="cta-button">Learn About Us</a>
                    <a href="${process.env.WEBSITE_URL}/services" class="cta-button">Our Services</a>
                </div>
                
                <p style="text-align: center; margin: 30px 0; color: #6b7280;">
                    Have an urgent question? Reach us directly at 
                    <a href="tel:+250788123456" style="color: #3b82f6;">+250 788 123 456</a>
                </p>
            </div>
            
            <div class="footer">
                <p><strong>Khisima</strong></p>
                <p>Bridging Cultures Through Language | Kigali, Rwanda</p>
                <p>
                    <a href="${process.env.WEBSITE_URL}" style="color: #3b82f6;">Visit our website</a> | 
                    <a href="mailto:${process.env.EMAIL_USER}" style="color: #3b82f6;">Contact us</a>
                </p>
            </div>
        </div>
    </body>
    </html>
  `;
};

// Main function to send contact email
export const sendContactEmail = async (contactData) => {
  try {
    const adminEmail = {
      from: `"Khisima Contact Form" <${process.env.EMAIL_USER}>`, // This will now show your domain
      to: process.env.ADMIN_EMAIL || process.env.EMAIL_USER,
      subject: `🚨 New Contact: ${contactData.firstName} ${contactData.lastName} - ${contactData.preferredLanguage}`,
      html: getContactEmailTemplate(contactData),
      priority: 'high'
    };

    const autoReply = {
      from: `"Khisima Team" <${process.env.EMAIL_USER}>`, // This will now show your domain
      to: contactData.email,
      subject: `Thank you for contacting Khisima, ${contactData.firstName}! 🌍`,
      html: getAutoReplyTemplate(contactData)
    };

    // Send both emails
    const [adminResult, autoReplyResult] = await Promise.all([
      transporter.sendMail(adminEmail),
      transporter.sendMail(autoReply)
    ]);

    console.log('Emails sent successfully:', {
      admin: adminResult.messageId,
      autoReply: autoReplyResult.messageId
    });

    return {
      success: true,
      adminMessageId: adminResult.messageId,
      autoReplyMessageId: autoReplyResult.messageId
    };

  } catch (error) {
    console.error('Email sending error:', error);
    throw error;
  }
};

// Function to send notification emails to team members
export const sendTeamNotification = async (contactData, teamEmails = []) => {
  if (teamEmails.length === 0) return;

  try {
    const teamNotifications = teamEmails.map(email => ({
      from: `"Khisima Notifications" <${process.env.EMAIL_USER}>`, // This will now show your domain
      to: email,
      subject: `📢 Team Alert: New ${contactData.preferredLanguage} Contact - ${contactData.firstName} ${contactData.lastName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #3b82f6; color: white; padding: 20px; text-align: center;">
            <h2>🔔 New Contact Alert</h2>
          </div>
          <div style="padding: 20px; background: #f8fafc;">
            <p><strong>Quick Summary:</strong></p>
            <ul>
              <li><strong>Name:</strong> ${contactData.firstName} ${contactData.lastName}</li>
              <li><strong>Language:</strong> ${contactData.preferredLanguage}</li>
              <li><strong>Email:</strong> ${contactData.email}</li>
              <li><strong>Phone:</strong> ${contactData.phone}</li>
            </ul>
            <p><strong>Message Preview:</strong></p>
            <p style="background: white; padding: 15px; border-left: 4px solid #3b82f6;">
              ${contactData.message.substring(0, 150)}${contactData.message.length > 150 ? '...' : ''}
            </p>
            <div style="text-align: center; margin-top: 20px;">
              <a href="${process.env.ADMIN_DASHBOARD_URL}/notifications/${contactData.notificationId}" 
                 style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">
                View Full Details
              </a>
            </div>
          </div>
        </div>
      `
    }));

    const results = await Promise.all(
      teamNotifications.map(email => transporter.sendMail(email))
    );

    console.log(`Team notifications sent to ${teamEmails.length} members`);
    return results;

  } catch (error) {
    console.error('Team notification error:', error);
    throw error;
  }
};

export default { sendContactEmail, sendTeamNotification };