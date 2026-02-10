import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateOTP, hashOTP, getOTPExpiry } from '@/lib/otp'
import { checkEmailRateLimit } from '@/lib/rateLimit'
import { sendVerificationOTP } from '@/lib/email'
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
        const rateLimit = await checkEmailRateLimit(email, 'verification')
        if (!rateLimit.allowed) {
            logSecurity('Rate limit exceeded for signup verification', { email })
            return NextResponse.json(
                {
                    error: rateLimit.message || 'Too many requests',
                    retryAfter: rateLimit.retryAfter
                },
                { status: 429 }
            )
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        })

        if (existingUser) {
            return NextResponse.json(
                { error: 'Email is already registered' },
                { status: 400 }
            )
        }

        // Generate OTP
        const otp = generateOTP()
        const hashedOTP = await hashOTP(otp)
        const expiry = getOTPExpiry()

        // Store OTP in VerificationToken table
        // We delete any existing tokens for this email first to keep it clean
        await prisma.verificationToken.deleteMany({
            where: { identifier: email },
        })

        await prisma.verificationToken.create({
            data: {
                identifier: email,
                token: hashedOTP,
                expires: expiry,
            },
        })

        // Send OTP email
        await sendVerificationOTP(email, otp)

        logOTP('generated and sent for signup', email, { expiresAt: expiry })

        return NextResponse.json({
            success: true,
            message: 'Verification code sent to your email',
            expiresIn: 120, // 2 minutes in seconds
        })
    } catch (error) {
        console.error('Error sending signup OTP:', error)
        return NextResponse.json(
            { error: 'Failed to send verification code' },
            { status: 500 }
        )
    }
}
