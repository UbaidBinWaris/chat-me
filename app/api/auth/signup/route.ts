import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcrypt'
import { generateOTP, hashOTP, getOTPExpiry } from '@/lib/otp'
import { sendVerificationOTP } from '@/lib/email'
import { logOTP } from '@/lib/logger'

export async function POST(req: Request) {
    try {
        const { username, email, password } = await req.json()

        if (!username || !email || !password) {
            return NextResponse.json({ error: 'Username, email, and password are required' }, { status: 400 })
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
            return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
        }

        // Validate password length
        if (password.length < 6) {
            return NextResponse.json({ error: 'Password must be at least 6 characters long' }, { status: 400 })
        }

        // Check if user exists by username or email
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { username },
                    { email }
                ]
            },
        })

        if (existingUser) {
            if (existingUser.email === email) {
                return NextResponse.json({ error: 'Email already taken' }, { status: 400 })
            }
            return NextResponse.json({ error: 'Username already taken' }, { status: 400 })
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10)

        // Generate OTP for email verification
        const otp = generateOTP()
        const hashedOTP = await hashOTP(otp)
        const otpExpiry = getOTPExpiry()

        // Create user with OTP
        const user = await prisma.user.create({
            data: {
                username,
                email,
                password: hashedPassword,
                emailVerified: null, // Not verified yet
                emailVerificationOtp: hashedOTP,
                emailVerificationOtpExpiry: otpExpiry,
                emailVerificationLastSent: new Date(),
            },
        })

        // Send verification OTP
        await sendVerificationOTP(email, otp)

        logOTP('sent verification code on signup', email, { expiresAt: otpExpiry })

        return NextResponse.json({
            success: true,
            message: 'Account created. Please check your email for verification code',
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                emailVerified: false,
            },
            expiresIn: 120, // 2 minutes
            canResendAt: Date.now() + 60000, // 1 minute from now
        })
    } catch (error) {
        console.error('Error in SIGNUP:', error)
        return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
    }
}
