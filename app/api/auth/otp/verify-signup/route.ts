import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyOTP, isOTPExpired } from '@/lib/otp'
import { SignJWT } from 'jose'

export async function POST(request: NextRequest) {
    try {
        const { email, otp } = await request.json()

        if (!email || !otp) {
            return NextResponse.json(
                { error: 'Email and OTP are required' },
                { status: 400 }
            )
        }

        // Find verification token for this email
        const tokenRecord = await prisma.verificationToken.findFirst({
            where: { identifier: email },
        })

        if (!tokenRecord) {
            return NextResponse.json(
                { error: 'Invalid or expired verification code' },
                { status: 400 }
            )
        }

        // Verify OTP
        const isValid = await verifyOTP(otp, tokenRecord.token)

        if (!isValid) {
            return NextResponse.json(
                { error: 'Invalid verification code' },
                { status: 400 }
            )
        }

        // Check expiry
        if (isOTPExpired(tokenRecord.expires)) {
            // Delete expired token
            await prisma.verificationToken.delete({
                where: {
                    identifier_token: {
                        identifier: tokenRecord.identifier,
                        token: tokenRecord.token,
                    },
                },
            })
            return NextResponse.json(
                { error: 'Verification code expired' },
                { status: 400 }
            )
        }

        // Valid OTP - Delete the token
        await prisma.verificationToken.delete({
            where: {
                identifier_token: {
                    identifier: tokenRecord.identifier,
                    token: tokenRecord.token,
                },
            },
        })

        // Generate Signup Token (JWT)
        const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || 'secret')
        const signupToken = await new SignJWT({ email, type: 'signup' })
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .setExpirationTime('15m') // 15 minutes to complete signup
            .sign(secret)

        return NextResponse.json({
            success: true,
            message: 'Email verified',
            signupToken,
        })
    } catch (error) {
        console.error('Error verifying signup OTP:', error)
        return NextResponse.json(
            { error: 'Failed to verify code' },
            { status: 500 }
        )
    }
}
