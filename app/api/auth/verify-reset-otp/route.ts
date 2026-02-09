import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyOTP, isOTPExpired, isValidOTPFormat } from '@/lib/otp'
import { checkVerificationAttempts, incrementVerificationAttempts, resetVerificationAttempts } from '@/lib/rateLimit'
import { logOTP, logSecurity } from '@/lib/logger'
import bcrypt from 'bcrypt'

export async function POST(request: NextRequest) {
    try {
        const { email, otp, newPassword } = await request.json()

        // Validate input
        if (!email || !otp || !newPassword) {
            return NextResponse.json(
                { error: 'Email, OTP, and new password are required' },
                { status: 400 }
            )
        }

        // Validate OTP format
        if (!isValidOTPFormat(otp)) {
            return NextResponse.json(
                { error: 'Invalid OTP format' },
                { status: 400 }
            )
        }

        // Validate password
        if (newPassword.length < 6) {
            return NextResponse.json(
                { error: 'Password must be at least 6 characters long' },
                { status: 400 }
            )
        }

        // Check verification attempts
        const attemptsCheck = await checkVerificationAttempts(email, 'reset')
        if (!attemptsCheck.allowed) {
            logSecurity('Too many password reset attempts', { email })
            return NextResponse.json(
                {
                    error: attemptsCheck.message || 'Too many attempts',
                    retryAfter: attemptsCheck.retryAfter
                },
                { status: 429 }
            )
        }

        // Find user
        const user = await prisma.user.findUnique({
            where: { email },
            select: {
                id: true,
                email: true,
                passwordResetOtp: true,
                passwordResetOtpExpiry: true,
                passwordResetAttempts: true,
            },
        })

        if (!user) {
            return NextResponse.json(
                { error: 'Invalid reset code' },
                { status: 400 }
            )
        }

        // Check if OTP exists
        if (!user.passwordResetOtp || !user.passwordResetOtpExpiry) {
            return NextResponse.json(
                { error: 'No reset code found. Please request a new one' },
                { status: 400 }
            )
        }

        // Check if OTP has expired
        if (isOTPExpired(user.passwordResetOtpExpiry)) {
            logOTP('password reset code expired', email)
            return NextResponse.json(
                { error: 'Reset code has expired. Please request a new one' },
                { status: 400 }
            )
        }

        // Verify OTP
        const isValid = await verifyOTP(otp, user.passwordResetOtp)

        if (!isValid) {
            // Increment failed attempts
            await incrementVerificationAttempts(email, 'reset')
            logSecurity('Invalid password reset OTP attempt', { email, attempts: user.passwordResetAttempts + 1 })

            const remainingAttempts = 3 - (user.passwordResetAttempts + 1)
            if (remainingAttempts > 0) {
                return NextResponse.json(
                    {
                        error: `Invalid reset code. ${remainingAttempts} attempt${remainingAttempts > 1 ? 's' : ''} remaining`
                    },
                    { status: 400 }
                )
            } else {
                return NextResponse.json(
                    { error: 'Too many failed attempts. Please request a new code' },
                    { status: 429 }
                )
            }
        }

        // OTP is valid - hash new password and update
        const hashedPassword = await bcrypt.hash(newPassword, 10)

        await prisma.user.update({
            where: { email },
            data: {
                password: hashedPassword,
                passwordResetOtp: null,
                passwordResetOtpExpiry: null,
                passwordResetAttempts: 0,
            },
        })

        // Reset attempts counter
        await resetVerificationAttempts(email, 'reset')

        logOTP('password reset successfully', email)

        return NextResponse.json({
            success: true,
            message: 'Password reset successfully',
        })
    } catch (error) {
        console.error('Error resetting password:', error)
        return NextResponse.json(
            { error: 'Failed to reset password' },
            { status: 500 }
        )
    }
}
