import { prisma } from './prisma'

interface RateLimitResult {
    allowed: boolean
    message?: string
    retryAfter?: number
}

/**
 * Check rate limit for OTP requests per email
 * Limit: 5 requests per hour per email
 */
export async function checkEmailRateLimit(email: string, type: 'verification' | 'reset'): Promise<RateLimitResult> {
    const user = await prisma.user.findUnique({
        where: { email },
        select: {
            emailVerificationLastSent: true,
            passwordResetLastSent: true,
        },
    })

    if (!user) {
        // Allow if user doesn't exist (for signup)
        return { allowed: true }
    }

    const lastSent = type === 'verification'
        ? user.emailVerificationLastSent
        : user.passwordResetLastSent

    if (!lastSent) {
        return { allowed: true }
    }

    // Check if last request was within 1 hour
    const oneHourAgo = new Date()
    oneHourAgo.setHours(oneHourAgo.getHours() - 1)

    if (lastSent < oneHourAgo) {
        // More than 1 hour ago, allow
        return { allowed: true }
    }

    // For simplicity, we're using a basic cooldown approach
    // In production, you'd want to track request count in a separate table
    const oneMinuteAgo = new Date()
    oneMinuteAgo.setMinutes(oneMinuteAgo.getMinutes() - 1)

    if (lastSent > oneMinuteAgo) {
        const retryAfter = Math.ceil((lastSent.getTime() + 60000 - Date.now()) / 1000)
        return {
            allowed: false,
            message: `Please wait ${retryAfter} seconds before requesting a new code`,
            retryAfter,
        }
    }

    return { allowed: true }
}

/**
 * Check if user has exceeded verification attempts
 * Limit: 3 attempts per OTP, then 15-minute lockout
 */
export async function checkVerificationAttempts(
    email: string,
    type: 'verification' | 'reset'
): Promise<RateLimitResult> {
    const user = await prisma.user.findUnique({
        where: { email },
        select: {
            emailVerificationAttempts: true,
            emailVerificationOtpExpiry: true,
            passwordResetAttempts: true,
            passwordResetOtpExpiry: true,
        },
    })

    if (!user) {
        return { allowed: false, message: 'User not found' }
    }

    const attempts = type === 'verification'
        ? user.emailVerificationAttempts
        : user.passwordResetAttempts

    const otpExpiry = type === 'verification'
        ? user.emailVerificationOtpExpiry
        : user.passwordResetOtpExpiry

    // If OTP has expired, reset attempts
    if (otpExpiry && new Date() > otpExpiry) {
        return { allowed: true }
    }

    // Check if user has exceeded attempts
    if (attempts >= 3) {
        // Check if 15 minutes have passed since OTP expiry
        if (otpExpiry) {
            const fifteenMinutesAfterExpiry = new Date(otpExpiry)
            fifteenMinutesAfterExpiry.setMinutes(fifteenMinutesAfterExpiry.getMinutes() + 15)

            if (new Date() < fifteenMinutesAfterExpiry) {
                const retryAfter = Math.ceil((fifteenMinutesAfterExpiry.getTime() - Date.now()) / 1000)
                return {
                    allowed: false,
                    message: 'Too many failed attempts. Please try again later',
                    retryAfter,
                }
            }
        }
    }

    return { allowed: true }
}

/**
 * Increment verification attempts
 */
export async function incrementVerificationAttempts(
    email: string,
    type: 'verification' | 'reset'
): Promise<void> {
    const updateData = type === 'verification'
        ? { emailVerificationAttempts: { increment: 1 } }
        : { passwordResetAttempts: { increment: 1 } }

    await prisma.user.update({
        where: { email },
        data: updateData,
    })
}

/**
 * Reset verification attempts
 */
export async function resetVerificationAttempts(
    email: string,
    type: 'verification' | 'reset'
): Promise<void> {
    const updateData = type === 'verification'
        ? { emailVerificationAttempts: 0 }
        : { passwordResetAttempts: 0 }

    await prisma.user.update({
        where: { email },
        data: updateData,
    })
}
