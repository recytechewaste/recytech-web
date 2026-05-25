const getPinEmailTemplate = (firstName, pin) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #10b981; padding: 20px; text-align: center; color: white; border-radius: 8px 8px 0 0;">
            <h2 style="margin: 0;">RecyTech Password Reset</h2>
        </div>
        <div style="padding: 20px; background-color: #f9fafb; border: 1px solid #e5e7eb;">
            <p>Hi ${firstName},</p>
            <p>We received a request to reset your password. Use the PIN below to verify your identity:</p>
            <div style="background-color: #dbeafe; padding: 15px; border-radius: 6px; text-align: center; margin: 20px 0;">
                <p style="margin: 0; font-size: 24px; font-weight: bold; color: #1e40af; letter-spacing: 2px;">${pin}</p>
            </div>
            <p style="color: #6b7280; font-size: 14px;">This PIN will expire in 15 minutes.</p>
            <p style="color: #6b7280; font-size: 14px;">If you did not request a password reset, please ignore this email.</p>
        </div>
        <div style="padding: 15px; background-color: #111827; color: #9ca3af; text-align: center; font-size: 12px; border-radius: 0 0 8px 8px;">
            <p>© 2025 RecyTech. All rights reserved.</p>
        </div>
    </div>
`;

const getWelcomeEmailTemplate = (firstName, pin) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #0f766e; padding: 20px; text-align: center; color: white; border-radius: 8px 8px 0 0;">
            <h2 style="margin: 0;">Welcome to RecyTech</h2>
        </div>
        <div style="padding: 20px; background-color: #f9fafb; border: 1px solid #e5e7eb;">
            <p>Hi ${firstName},</p>
            <p>An administrative account has been created for you. To get started, please use the PIN below to set up your password and access the dashboard:</p>
            <div style="background-color: #f0fdf4; padding: 15px; border-radius: 6px; text-align: center; margin: 20px 0; border: 1px solid #bbf7d0;">
                <p style="margin: 0; font-size: 24px; font-weight: bold; color: #0f766e; letter-spacing: 2px;">${pin}</p>
            </div>
            <p style="color: #6b7280; font-size: 14px;">Please go to the login page and use the "Forgot Password" flow with this PIN to set your password.</p>
        </div>
        <div style="padding: 15px; background-color: #111827; color: #9ca3af; text-align: center; font-size: 12px; border-radius: 0 0 8px 8px;">
            <p>© 2025 RecyTech. All rights reserved.</p>
        </div>
    </div>
`;

module.exports = { getPinEmailTemplate, getWelcomeEmailTemplate };