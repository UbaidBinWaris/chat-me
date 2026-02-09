import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcrypt'

export async function POST(req: Request) {
    try {
        const { username, password } = await req.json()

        if (!username || !password) {
            return NextResponse.json({ error: 'Username and password are required' }, { status: 400 })
        }

        // Check if user exists
        const user = await prisma.user.findUnique({
            where: { username },
        })

        if (!user) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
        }

        // Check password
        if (!user.password) {
            // Handle legacy users or invalid state
            return NextResponse.json({ error: 'Invalid credentials (legacy account)' }, { status: 401 })
        }

        const isPasswordValid = await bcrypt.compare(password, user.password)

        if (!isPasswordValid) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
        }

        return NextResponse.json(user)
    } catch (error) {
        console.error('Error in LOGIN:', error)
        return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
    }
}
