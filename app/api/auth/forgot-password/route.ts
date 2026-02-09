import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendPasswordResetEmail } from '@/lib/email'
import crypto from 'crypto'

export async function POST(req: Request) {
    try {
        const { email } = await req.json()

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 })
        }

        // Find user by email
        const user = await prisma.user.findUnique({
            where: { email },
        })

        // Always return success to prevent email enumeration
        // (Don't reveal whether the email exists or not)
        if (!user) {
            return NextResponse.json({
                success: true,
                message: 'If an account with that email exists, a password reset link has been sent.'
            })
        }

        // Generate secure reset token
        const resetToken = crypto.randomBytes(32).toString('hex')
        const resetTokenExpiry = new Date(Date.now() + 3600000) // 1 hour from now

        // Save reset token to database
        await prisma.user.update({
            where: { id: user.id },
            data: {
                resetToken,
                resetTokenExpiry,
            },
        })

        // Send password reset email
        try {
            await sendPasswordResetEmail(user.email, resetToken)
        } catch (emailError) {
            console.error('Failed to send password reset email:', emailError)
            return NextResponse.json({
                error: 'Failed to send password reset email. Please try again later.'
            }, { status: 500 })
        }

        return NextResponse.json({
            success: true,
            message: 'If an account with that email exists, a password reset link has been sent.'
        })
    } catch (error) {
        console.error('Error in FORGOT PASSWORD:', error)
        return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
    }
}
