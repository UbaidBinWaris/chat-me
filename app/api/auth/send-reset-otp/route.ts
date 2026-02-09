import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateOTP, hashOTP, getOTPExpiry } from '@/lib/otp'
import { checkEmailRateLimit } from '@/lib/rateLimit'
import { sendPasswordResetOTP } from '@/lib/email'
import { logOTP, logSecurity } from '@/lib/logger'

export async function POST(request: NextRequest) {
    try {
        const { email } = await request.json()

        // Validate email
        if (!email || typeof email !== 'string') {
            return NextResponse.json(
                { error: 'Email is required' },
                { status: 400 }
            )
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { error: 'Invalid email format' },
                { status: 400 }
            )
        }

        // Check rate limit
        const rateLimit = await checkEmailRateLimit(email, 'reset')
        if (!rateLimit.allowed) {
            logSecurity('Rate limit exceeded for password reset', { email })
            return NextResponse.json(
                {
                    error: rateLimit.message || 'Too many requests',
                    retryAfter: rateLimit.retryAfter
                },
                { status: 429 }
            )
        }

        // Find user by email
        const user = await prisma.user.findUnique({
            where: { email },
        })

        // Don't reveal if email exists (prevent enumeration)
        if (!user) {
            logSecurity('Password reset requested for non-existent email', { email })
            return NextResponse.json({
                success: true,
                message: 'If this email is registered, a reset code has been sent',
                expiresIn: 120,
            })
        }

        // Generate OTP
        const otp = generateOTP()
        const hashedOTP = await hashOTP(otp)
        const expiry = getOTPExpiry()

        // Update user with OTP
        await prisma.user.update({
            where: { email },
            data: {
                passwordResetOtp: hashedOTP,
                passwordResetOtpExpiry: expiry,
                passwordResetAttempts: 0, // Reset attempts
                passwordResetLastSent: new Date(),
            },
        })

        // Send OTP email
        await sendPasswordResetOTP(email, otp)

        logOTP('password reset code generated and sent', email, { expiresAt: expiry })

        return NextResponse.json({
            success: true,
            message: 'Reset code sent to your email',
            expiresIn: 120, // 2 minutes in seconds
            canResendAt: Date.now() + 60000, // 1 minute from now
        })
    } catch (error) {
        console.error('Error sending reset OTP:', error)
        return NextResponse.json(
            { error: 'Failed to send reset code' },
            { status: 500 }
        )
    }
}
