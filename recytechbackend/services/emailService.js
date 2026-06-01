const { MailerSend, EmailParams, Sender, Recipient } = require('mailersend');
const { getPinEmailTemplate, getWelcomeEmailTemplate } = require('../utils/emailTemplates');

const mailersend = new MailerSend({
    apiKey: process.env.MAILERSEND_API_KEY || '',
});

const sendPinEmail = async (email, firstName, pin) => {
    try {
        if (!process.env.MAILERSEND_API_KEY) {
            console.error('MailerSend Error: MAILERSEND_API_KEY is missing in .env');
            return false;
        }

        const sentFrom = new Sender(process.env.MAILERSEND_FROM_EMAIL || 'noreply@trial-k6nxvgwjd98z5q7e.mlsender.net', 'RecyTech');
        const recipients = [new Recipient(email, firstName)];

        const emailParams = new EmailParams()
            .setFrom(sentFrom)
            .setTo(recipients)
            .setReplyTo(sentFrom)
            .setSubject('RecyTech - Password Reset PIN')
            .setHtml(getPinEmailTemplate(firstName, pin));

        await mailersend.email.send(emailParams);
        return true;
    } catch (error) {
        console.error('MailerSend PIN Email Error:', error.body || error.message);
        return false;
    }
};

const sendWelcomeEmail = async (email, firstName, role = 'User') => {
    try {
        if (!process.env.MAILERSEND_API_KEY) return false;
        const sentFrom = new Sender(process.env.MAILERSEND_FROM_EMAIL || 'noreply@trial-k6nxvgwjd98z5q7e.mlsender.net', 'RecyTech');
        const recipients = [new Recipient(email, firstName)];
        
        const htmlContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
                <h2 style="color: #059669;">Welcome to RecyTech, ${firstName}!</h2>
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

        const emailParams = new EmailParams()
            .setFrom(sentFrom)
            .setTo(recipients)
            .setReplyTo(sentFrom)
            .setSubject('Welcome to RecyTech - Account Setup')
            .setHtml(htmlContent);

        await mailersend.email.send(emailParams);
        return true;
    } catch (error) { 
        console.error('MailerSend Welcome Email Error:', error.body || error.message);
        return false; 
    }
};

const sendAccountApprovedEmail = async (email, firstName) => {
    try {
        if (!process.env.MAILERSEND_API_KEY) return false;
        const sentFrom = new Sender(process.env.MAILERSEND_FROM_EMAIL || 'noreply@trial-k6nxvgwjd98z5q7e.mlsender.net', 'RecyTech');
        const recipients = [new Recipient(email, firstName)];
        
        const htmlContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
                <h2 style="color: #059669;">Account Approved!</h2>
                <p>Hello ${firstName},</p>
                <p>Good news! Your RecyTech account has been successfully reviewed and approved by an administrator.</p>
                <p>You can now log in to the portal using your email address and the password you created during registration.</p>
                <div style="margin: 30px 0;">
                    <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Log In Now</a>
                </div>
                <p>Welcome to the team!</p>
            </div>
        `;

        const emailParams = new EmailParams()
            .setFrom(sentFrom)
            .setTo(recipients)
            .setReplyTo(sentFrom)
            .setSubject('Your RecyTech Account is Approved')
            .setHtml(htmlContent);

        await mailersend.email.send(emailParams);
        return true;
    } catch (error) { 
        console.error('MailerSend Approval Email Error:', error.body || error.message);
        return false; 
    }
};

module.exports = { sendPinEmail, sendWelcomeEmail, sendAccountApprovedEmail };