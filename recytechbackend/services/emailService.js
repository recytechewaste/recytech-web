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

const sendWelcomeEmail = async (email, firstName, pin) => {
    try {
        if (!process.env.MAILERSEND_API_KEY) return false;
        const sentFrom = new Sender(process.env.MAILERSEND_FROM_EMAIL || 'noreply@trial-k6nxvgwjd98z5q7e.mlsender.net', 'RecyTech');
        const recipients = [new Recipient(email, firstName)];
        
        const emailParams = new EmailParams()
            .setFrom(sentFrom)
            .setTo(recipients)
            .setReplyTo(sentFrom)
            .setSubject('Welcome to RecyTech - Account Setup')
            .setHtml(getWelcomeEmailTemplate(firstName, pin));

        await mailersend.email.send(emailParams);
        return true;
    } catch (error) { return false; }
};

module.exports = { sendPinEmail, sendWelcomeEmail };