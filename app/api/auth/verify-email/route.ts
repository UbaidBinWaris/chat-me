import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyOTP, isOTPExpired, isValidOTPFormat } from '@/lib/otp'
import { checkVerificationAttempts, incrementVerificationAttempts, resetVerificationAttempts } from '@/lib/rateLimit'
import { logOTP, logSecurity } from '@/lib/logger'

export async function POST(request: NextRequest) {
    try {
        const { email, otp } = await request.json()

        // Validate input
        if (!email || !otp) {
            return NextResponse.json(
                { error: 'Email and OTP are required' },
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

        // Check verification attempts
        const attemptsCheck = await checkVerificationAttempts(email, 'verification')
        if (!attemptsCheck.allowed) {
            logSecurity('Too many verification attempts', { email })
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
                emailVerified: true,
                emailVerificationOtp: true,
                emailVerificationOtpExpiry: true,
                emailVerificationAttempts: true,
            },
        })

        if (!user) {
            return NextResponse.json(
                { error: 'Invalid verification code' },
                { status: 400 }
            )
        }

        // Check if already verified
        if (user.emailVerified) {
            return NextResponse.json(
                { error: 'Email is already verified' },
                { status: 400 }
            )
        }

        // Check if OTP exists
        if (!user.emailVerificationOtp || !user.emailVerificationOtpExpiry) {
            return NextResponse.json(
                { error: 'No verification code found. Please request a new one' },
                { status: 400 }
            )
        }

        // Check if OTP has expired
        if (isOTPExpired(user.emailVerificationOtpExpiry)) {
            logOTP('expired', email)
            return NextResponse.json(
                { error: 'Verification code has expired. Please request a new one' },
                { status: 400 }
            )
        }

        // Verify OTP
        const isValid = await verifyOTP(otp, user.emailVerificationOtp)

        if (!isValid) {
            // Increment failed attempts
            await incrementVerificationAttempts(email, 'verification')
            logSecurity('Invalid OTP attempt', { email, attempts: user.emailVerificationAttempts + 1 })

            const remainingAttempts = 3 - (user.emailVerificationAttempts + 1)
            if (remainingAttempts > 0) {
                return NextResponse.json(
                    {
                        error: `Invalid verification code. ${remainingAttempts} attempt${remainingAttempts > 1 ? 's' : ''} remaining`
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

        // OTP is valid - verify email and clear OTP
        await prisma.user.update({
            where: { email },
            data: {
                emailVerified: new Date(),
                emailVerificationOtp: null,
                emailVerificationOtpExpiry: null,
                emailVerificationAttempts: 0,
            },
        })

        // Reset attempts counter
        await resetVerificationAttempts(email, 'verification')

        logOTP('verified successfully', email)

        return NextResponse.json({
            success: true,
            message: 'Email verified successfully',
        })
    } catch (error) {
        console.error('Error verifying email:', error)
        return NextResponse.json(
            { error: 'Failed to verify email' },
            { status: 500 }
        )
    }
}
