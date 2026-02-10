import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcrypt'
import { logOTP } from '@/lib/logger'
import { jwtVerify } from 'jose'

export async function POST(req: Request) {
    try {
        const { signupToken, username, password } = await req.json()

        if (!signupToken || !username || !password) {
            return NextResponse.json({ error: 'Signup token, username, and password are required' }, { status: 400 })
        }

        // Verify signup token
        let email: string
        try {
            const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || 'secret')
            const { payload } = await jwtVerify(signupToken, secret)
            email = payload.email as string

            if (!email) throw new Error('Invalid token payload')
        } catch (error) {
            console.error('Signup token verification failed:', error)
            return NextResponse.json({ error: 'Invalid or expired signup session' }, { status: 401 })
        }

        // Validate password length
        if (password.length < 6) {
            return NextResponse.json({ error: 'Password must be at least 6 characters long' }, { status: 400 })
        }

        // Check availability
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
                return NextResponse.json({ error: 'Email already registered' }, { status: 400 })
            }
            return NextResponse.json({ error: 'Username already taken' }, { status: 400 })
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10)

        // Create user
        // We mark email as verified since they passed the OTP check
        const user = await prisma.user.create({
            data: {
                username,
                email,
                password: hashedPassword,
                emailVerified: new Date(),
                emailVerificationAttempts: 0,
            },
        })

        return NextResponse.json({
            success: true,
            message: 'Account created successfully',
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                emailVerified: true,
            },
        })
    } catch (error) {
        console.error('Error in SIGNUP:', error)
        return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
    }
}
