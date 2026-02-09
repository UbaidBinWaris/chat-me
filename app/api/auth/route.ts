import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
    try {
        const { username } = await req.json()

        if (!username) {
            return NextResponse.json({ error: 'Username is required' }, { status: 400 })
        }

        // Check if user exists
        let user = await prisma.user.findUnique({
            where: { username },
        })

        // If not, create user
        if (!user) {
            user = await prisma.user.create({
                data: { username },
            })
        }

        return NextResponse.json(user)
    } catch (error) {
        console.error('Error in AUTH:', error)
        return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
    }
}
