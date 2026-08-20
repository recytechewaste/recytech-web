const axios = require('axios');
const dns = require('dns');
const nodemailer = require('nodemailer');
const { MailerSend, EmailParams, Sender, Recipient } = require('mailersend');
const { getPinEmailTemplate } = require('../utils/emailTemplates');

// Force Node.js to prioritize IPv4 addresses across the application
if (dns.setDefaultResultOrder) {
    dns.setDefaultResultOrder('ipv4first');
}

/**
 * Sends transactional email via Brevo's HTTPS REST API (Port 443)
 * Guaranteed to work on cloud servers (Render free tier) without SMTP firewall blocks.
 */
const sendViaBrevo = async (toEmail, toName, subject, htmlContent) => {
    try {
        if (!process.env.BREVO_API_KEY) {
            const err = 'BREVO_API_KEY is missing in environment variables';
            console.error(err);
            return { success: false, error: err };
        }

        const senderEmail = process.env.BREVO_SENDER_EMAIL || 'recytechewast@gmail.com';
        const senderName = process.env.BREVO_SENDER_NAME || 'RecyTech';

        const payload = {
            sender: { name: senderName, email: senderEmail },
            to: [{ email: toEmail, name: toName || 'User' }],
            subject,
            htmlContent
        };

        const response = await axios.post('https://api.brevo.com/v3/smtp/email', payload, {
            headers: {
                'api-key': process.env.BREVO_API_KEY.trim(),
                'content-type': 'application/json',
                'accept': 'application/json'
            },
            timeout: 10000
        });

        console.log(`[Brevo API] Email successfully sent to ${toEmail} (MessageId: ${response.data?.messageId})`);
        return { success: true, messageId: response.data?.messageId };
    } catch (error) {
        const errorDetail = error.response?.data?.message || error.message;
        console.error('[Brevo Error] Failed to send email:', errorDetail);
        return { success: false, error: errorDetail };
    }
};

/**
 * Creates and returns a Nodemailer transporter configured for Gmail or standard SMTP
 */
const createNodemailerTransporter = () => {
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS, // 16-character Google App Password
        },
    });
};

/**
 * Determines which email provider to use: 'brevo' (default), 'nodemailer', or 'mailersend'
 */
const getActiveProvider = () => {
    if (process.env.EMAIL_SERVICE_PROVIDER) {
        return process.env.EMAIL_SERVICE_PROVIDER.toLowerCase();
    }
    if (process.env.BREVO_API_KEY) {
        return 'brevo';
    }
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        return 'nodemailer';
    }
    return 'mailersend';
};

// ==========================================
// 1. PIN RESET EMAIL
// ==========================================
const sendPinEmail = async (email, firstName, pin) => {
    const provider = getActiveProvider();
    const recipientName = firstName || 'User';
    const subject = 'RecyTech - Password Reset PIN';
    const html = getPinEmailTemplate(recipientName, pin);

    // --- Provider A: Brevo (Recommended for Render) ---
    if (provider === 'brevo') {
        return await sendViaBrevo(email, recipientName, subject, html);
    }

    // --- Provider B: Nodemailer (Gmail) ---
    if (provider === 'nodemailer') {
        try {
            if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
                const err = 'Nodemailer Error: EMAIL_USER or EMAIL_PASS missing in environment variables';
                console.error(err);
                return { success: false, error: err };
            }

            const transporter = createNodemailerTransporter();
            const info = await transporter.sendMail({
                from: `"RecyTech" <${process.env.EMAIL_USER}>`,
                to: email,
                subject,
                html,
            });

            console.log(`[Nodemailer] PIN email sent successfully to ${email} (MessageId: ${info.messageId})`);
            return { success: true, messageId: info.messageId };
        } catch (error) {
            console.error('[Nodemailer Error] Failed to send PIN email:', error.message);
            return { success: false, error: error.message };
        }
    }

    // --- Provider C: MailerSend ---
    try {
        if (!process.env.MAILERSEND_API_KEY) {
            const err = 'MailerSend Error: MAILERSEND_API_KEY is missing in environment variables';
            console.error(err);
            return { success: false, error: err };
        }

        const mailer = new MailerSend({ apiKey: process.env.MAILERSEND_API_KEY });
        const sentFrom = new Sender(process.env.MAILERSEND_FROM_EMAIL || 'noreply@trial-k6nxvgwjd98z5q7e.mlsender.net', 'RecyTech');
        const recipients = [new Recipient(email, recipientName)];

        const emailParams = new EmailParams()
            .setFrom(sentFrom)
            .setTo(recipients)
            .setReplyTo(sentFrom)
            .setSubject(subject)
            .setHtml(html);

        await mailer.email.send(emailParams);
        console.log(`[MailerSend] PIN email sent successfully to ${email}`);
        return { success: true };
    } catch (error) {
        const detail = JSON.stringify(error?.body || error?.response?.data || error?.message || error);
        console.error('[MailerSend Error] Failed to send PIN email:', detail);
        return { success: false, error: detail };
    }
};

// ==========================================
// 2. WELCOME / ACCOUNT CREATED EMAIL
// ==========================================
const sendWelcomeEmail = async (email, firstName, role = 'User') => {
    const provider = getActiveProvider();
    const recipientName = firstName || 'User';
    const subject = 'Welcome to RecyTech - Account Setup';
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
            <h2 style="color: #059669;">Welcome to RecyTech, ${recipientName}!</h2>
            <p>An administrator has successfully created a new <strong>${role}</strong> account for you.</p>
            <p>To ensure maximum security, your account requires a private password before you can log in.</p>
            <div style="background: #f3f4f6; padding: 15px; border-left: 4px solid #059669; margin: 20px 0;">
                <strong>Next Steps:</strong>
                <ol>
                    <li>Go to the RecyTech portal.</li>
                    <li>Click on <strong>"Forgot Password"</strong>.</li>
                    <li>Enter this email address (<strong>${email}</strong>) to receive your secure setup PIN.</li>
                </ol>
            </div>
            <p>If you need assistance, please contact your Super Admin.</p>
        </div>
    `;

    if (provider === 'brevo') {
        return await sendViaBrevo(email, recipientName, subject, html);
    }

    if (provider === 'nodemailer') {
        try {
            if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) return { success: false };
            const transporter = createNodemailerTransporter();
            await transporter.sendMail({
                from: `"RecyTech" <${process.env.EMAIL_USER}>`,
                to: email,
                subject,
                html,
            });
            return { success: true };
        } catch (error) {
            console.error('[Nodemailer Error] Welcome email error:', error.message);
            return { success: false, error: error.message };
        }
    }

    try {
        if (!process.env.MAILERSEND_API_KEY) return { success: false };
        const mailer = new MailerSend({ apiKey: process.env.MAILERSEND_API_KEY });
        const sentFrom = new Sender(process.env.MAILERSEND_FROM_EMAIL || 'noreply@trial-k6nxvgwjd98z5q7e.mlsender.net', 'RecyTech');
        const recipients = [new Recipient(email, recipientName)];

        const emailParams = new EmailParams()
            .setFrom(sentFrom)
            .setTo(recipients)
            .setReplyTo(sentFrom)
            .setSubject(subject)
            .setHtml(html);

        await mailer.email.send(emailParams);
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

// ==========================================
// 3. ACCOUNT APPROVED EMAIL
// ==========================================
const sendAccountApprovedEmail = async (email, firstName) => {
    const provider = getActiveProvider();
    const recipientName = firstName || 'User';
    const subject = 'Your RecyTech Account is Approved';
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
            <h2 style="color: #059669;">Account Approved!</h2>
            <p>Hello ${recipientName},</p>
            <p>Good news! Your RecyTech account has been successfully reviewed and approved by an administrator.</p>
            <p>You can now log in to the portal using your email address and the password you created during registration.</p>
            <div style="margin: 30px 0;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Log In Now</a>
            </div>
            <p>Welcome to the team!</p>
        </div>
    `;

    if (provider === 'brevo') {
        return await sendViaBrevo(email, recipientName, subject, html);
    }

    if (provider === 'nodemailer') {
        try {
            if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) return { success: false };
            const transporter = createNodemailerTransporter();
            await transporter.sendMail({
                from: `"RecyTech" <${process.env.EMAIL_USER}>`,
                to: email,
                subject,
                html,
            });
            return { success: true };
        } catch (error) {
            console.error('[Nodemailer Error] Approval email error:', error.message);
            return { success: false, error: error.message };
        }
    }

    try {
        if (!process.env.MAILERSEND_API_KEY) return { success: false };
        const mailer = new MailerSend({ apiKey: process.env.MAILERSEND_API_KEY });
        const sentFrom = new Sender(process.env.MAILERSEND_FROM_EMAIL || 'noreply@trial-k6nxvgwjd98z5q7e.mlsender.net', 'RecyTech');
        const recipients = [new Recipient(email, recipientName)];

        const emailParams = new EmailParams()
            .setFrom(sentFrom)
            .setTo(recipients)
            .setReplyTo(sentFrom)
            .setSubject(subject)
            .setHtml(html);

        await mailer.email.send(emailParams);
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

module.exports = { sendPinEmail, sendWelcomeEmail, sendAccountApprovedEmail };