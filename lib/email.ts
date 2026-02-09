import nodemailer from 'nodemailer'
import { logOTP, logError } from './logger'

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: parseInt(process.env.MAIL_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.MAIL_USERNAME,
    pass: process.env.MAIL_PASSWORD,
  },
})

/**
 * Send email verification OTP
 */
export async function sendVerificationOTP(email: string, otp: string) {
  const mailOptions = {
    from: process.env.MAIL_FROM_ADDRESS,
    to: email,
    subject: 'Verify Your Email - ChatMe',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .container {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              border-radius: 10px;
              padding: 40px;
              text-align: center;
            }
            .content {
              background: white;
              border-radius: 8px;
              padding: 30px;
              margin-top: 20px;
            }
            h1 {
              color: white;
              margin: 0 0 20px 0;
            }
            .otp-code {
              font-size: 36px;
              font-weight: bold;
              letter-spacing: 8px;
              color: #667eea;
              background: #f0f0f0;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
              font-family: 'Courier New', monospace;
            }
            .warning {
              background: #fff3cd;
              border: 1px solid #ffc107;
              border-radius: 5px;
              padding: 10px;
              margin: 15px 0;
              font-size: 14px;
            }
            .security-note {
              background: #f8d7da;
              border: 1px solid #f5c6cb;
              border-radius: 5px;
              padding: 10px;
              margin: 15px 0;
              font-size: 14px;
              color: #721c24;
            }
            .footer {
              margin-top: 20px;
              font-size: 12px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>✉️ Verify Your Email</h1>
            <div class="content">
              <p>Welcome to ChatMe!</p>
              <p>Please use the following verification code to complete your registration:</p>
              <div class="otp-code">${otp}</div>
              <div class="warning">
                ⏰ This code will expire in 2 minutes for security reasons.
              </div>
              <div class="security-note">
                🔒 <strong>Security Notice:</strong> Never share this code with anyone. ChatMe will never ask for your verification code.
              </div>
              <div class="footer">
                <p>If you didn't request this code, please ignore this email.</p>
                <p>Need help? Contact our support team.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
      Verify Your Email - ChatMe
      
      Welcome to ChatMe!
      
      Your verification code is: ${otp}
      
      This code will expire in 2 minutes for security reasons.
      
      Security Notice: Never share this code with anyone. ChatMe will never ask for your verification code.
      
      If you didn't request this code, please ignore this email.
    `,
  }

  try {
    await transporter.sendMail(mailOptions)
    logOTP('sent verification code', email)
    return { success: true }
  } catch (error) {
    logError(error as Error, 'sendVerificationOTP')
    throw new Error('Failed to send verification email')
  }
}

/**
 * Send password reset OTP
 */
export async function sendPasswordResetOTP(email: string, otp: string) {
  const mailOptions = {
    from: process.env.MAIL_FROM_ADDRESS,
    to: email,
    subject: 'Password Reset Code - ChatMe',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .container {
              background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
              border-radius: 10px;
              padding: 40px;
              text-align: center;
            }
            .content {
              background: white;
              border-radius: 8px;
              padding: 30px;
              margin-top: 20px;
            }
            h1 {
              color: white;
              margin: 0 0 20px 0;
            }
            .otp-code {
              font-size: 36px;
              font-weight: bold;
              letter-spacing: 8px;
              color: #f5576c;
              background: #f0f0f0;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
              font-family: 'Courier New', monospace;
            }
            .warning {
              background: #fff3cd;
              border: 1px solid #ffc107;
              border-radius: 5px;
              padding: 10px;
              margin: 15px 0;
              font-size: 14px;
            }
            .security-note {
              background: #f8d7da;
              border: 1px solid #f5c6cb;
              border-radius: 5px;
              padding: 10px;
              margin: 15px 0;
              font-size: 14px;
              color: #721c24;
            }
            .footer {
              margin-top: 20px;
              font-size: 12px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🔐 Password Reset Request</h1>
            <div class="content">
              <p>Hello,</p>
              <p>We received a request to reset your password for your ChatMe account.</p>
              <p>Use the following code to reset your password:</p>
              <div class="otp-code">${otp}</div>
              <div class="warning">
                ⏰ This code will expire in 2 minutes for security reasons.
              </div>
              <div class="security-note">
                🔒 <strong>Security Notice:</strong> Never share this code with anyone. ChatMe will never ask for your reset code.
              </div>
              <p><strong>Didn't request this?</strong> If you didn't request a password reset, please ignore this email. Your password will remain unchanged.</p>
              <div class="footer">
                <p>Need help? Contact our support team.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
      Password Reset Request - ChatMe
      
      Hello,
      
      We received a request to reset your password for your ChatMe account.
      
      Your password reset code is: ${otp}
      
      This code will expire in 2 minutes for security reasons.
      
      Security Notice: Never share this code with anyone. ChatMe will never ask for your reset code.
      
      If you didn't request this password reset, you can safely ignore this email.
    `,
  }

  try {
    await transporter.sendMail(mailOptions)
    logOTP('sent password reset code', email)
    return { success: true }
  } catch (error) {
    logError(error as Error, 'sendPasswordResetOTP')
    throw new Error('Failed to send password reset email')
  }
}

// Keep old function for backward compatibility (will be removed later)
export async function sendPasswordResetEmail(email: string, resetToken: string) {
  const resetUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`

  const mailOptions = {
    from: process.env.MAIL_FROM_ADDRESS,
    to: email,
    subject: 'Password Reset Request - ChatMe',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .container {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              border-radius: 10px;
              padding: 40px;
              text-align: center;
            }
            .content {
              background: white;
              border-radius: 8px;
              padding: 30px;
              margin-top: 20px;
            }
            h1 {
              color: white;
              margin: 0 0 20px 0;
            }
            .button {
              display: inline-block;
              padding: 12px 30px;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              text-decoration: none;
              border-radius: 5px;
              font-weight: bold;
              margin: 20px 0;
            }
            .footer {
              margin-top: 20px;
              font-size: 12px;
              color: #666;
            }
            .warning {
              background: #fff3cd;
              border: 1px solid #ffc107;
              border-radius: 5px;
              padding: 10px;
              margin: 15px 0;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🔐 Password Reset Request</h1>
            <div class="content">
              <p>Hello,</p>
              <p>We received a request to reset your password for your ChatMe account.</p>
              <p>Click the button below to reset your password:</p>
              <a href="${resetUrl}" class="button">Reset Password</a>
              <div class="warning">
                ⚠️ This link will expire in 1 hour for security reasons.
              </div>
              <p>If you didn't request this password reset, you can safely ignore this email. Your password will remain unchanged.</p>
              <div class="footer">
                <p>If the button doesn't work, copy and paste this link into your browser:</p>
                <p style="word-break: break-all; color: #667eea;">${resetUrl}</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
      Password Reset Request
      
      Hello,
      
      We received a request to reset your password for your ChatMe account.
      
      Click the link below to reset your password:
      ${resetUrl}
      
      This link will expire in 1 hour for security reasons.
      
      If you didn't request this password reset, you can safely ignore this email.
    `,
  }

  try {
    await transporter.sendMail(mailOptions)
    console.log('Password reset email sent to:', email)
    return { success: true }
  } catch (error) {
    console.error('Error sending password reset email:', error)
    throw new Error('Failed to send password reset email')
  }
}
