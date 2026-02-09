import crypto from 'crypto'
import bcrypt from 'bcrypt'

/**
 * Generate a cryptographically secure 6-digit OTP
 * @returns {string} 6-digit OTP (100000-999999)
 */
export function generateOTP(): string {
    // Use crypto.randomInt for cryptographically secure random number
    const otp = crypto.randomInt(100000, 1000000)
    return otp.toString()
}

/**
 * Hash OTP using bcrypt before storing in database
 * @param otp - Plain text OTP
 * @returns {Promise<string>} Hashed OTP
 */
export async function hashOTP(otp: string): Promise<string> {
    const saltRounds = 10
    return await bcrypt.hash(otp, saltRounds)
}

/**
 * Verify OTP using constant-time comparison to prevent timing attacks
 * @param plainOTP - Plain text OTP from user input
 * @param hashedOTP - Hashed OTP from database
 * @returns {Promise<boolean>} True if OTP matches
 */
export async function verifyOTP(plainOTP: string, hashedOTP: string): Promise<boolean> {
    try {
        return await bcrypt.compare(plainOTP, hashedOTP)
    } catch (error) {
        console.error('OTP verification error:', error)
        return false
    }
}

/**
 * Check if OTP has expired
 * @param expiryDate - OTP expiry date from database
 * @returns {boolean} True if OTP has expired
 */
export function isOTPExpired(expiryDate: Date | null): boolean {
    if (!expiryDate) return true
    return new Date() > expiryDate
}

/**
 * Get OTP expiry date (2 minutes from now)
 * @returns {Date} Expiry date
 */
export function getOTPExpiry(): Date {
    const expiry = new Date()
    expiry.setMinutes(expiry.getMinutes() + 2) // 2 minutes
    return expiry
}

/**
 * Check if user can resend OTP (1 minute cooldown)
 * @param lastSentDate - Last OTP sent date from database
 * @returns {boolean} True if user can resend
 */
export function canResendOTP(lastSentDate: Date | null): boolean {
    if (!lastSentDate) return true
    const oneMinuteAgo = new Date()
    oneMinuteAgo.setMinutes(oneMinuteAgo.getMinutes() - 1)
    return lastSentDate < oneMinuteAgo
}

/**
 * Get time remaining until user can resend OTP
 * @param lastSentDate - Last OTP sent date from database
 * @returns {number} Seconds remaining, or 0 if can resend
 */
export function getResendCooldown(lastSentDate: Date | null): number {
    if (!lastSentDate) return 0
    const oneMinuteFromSent = new Date(lastSentDate)
    oneMinuteFromSent.setMinutes(oneMinuteFromSent.getMinutes() + 1)
    const now = new Date()
    const diff = Math.ceil((oneMinuteFromSent.getTime() - now.getTime()) / 1000)
    return diff > 0 ? diff : 0
}

/**
 * Validate OTP format (6 digits)
 * @param otp - OTP to validate
 * @returns {boolean} True if valid format
 */
export function isValidOTPFormat(otp: string): boolean {
    return /^\d{6}$/.test(otp)
}
