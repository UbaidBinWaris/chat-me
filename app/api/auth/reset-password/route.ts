import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcrypt'

export async function POST(req: Request) {
    try {
        const { token, password } = await req.json()

        if (!token || !password) {
            return NextResponse.json({ error: 'Token and password are required' }, { status: 400 })
        }

        // Validate password strength
        if (password.length < 6) {
            return NextResponse.json({ error: 'Password must be at least 6 characters long' }, { status: 400 })
        }

        // Find user by reset token
        const user = await prisma.user.findUnique({
            where: { resetToken: token },
        })

        if (!user) {
            return NextResponse.json({ error: 'Invalid or expired reset token' }, { status: 400 })
        }

        // Check if token is expired
        if (!user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
            return NextResponse.json({ error: 'Reset token has expired' }, { status: 400 })
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(password, 10)

        // Update user password and clear reset token
        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                resetToken: null,
                resetTokenExpiry: null,
            },
        })

        return NextResponse.json({
            success: true,
            message: 'Password has been reset successfully'
        })
    } catch (error) {
        console.error('Error in RESET PASSWORD:', error)
        return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
    }
}
