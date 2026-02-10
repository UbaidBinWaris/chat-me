import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
    try {
        const session = await getServerSession()

        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { roomId } = await req.json()

        if (!roomId) {
            return NextResponse.json({ error: 'Room ID is required' }, { status: 400 })
        }

        const currentUser = await prisma.user.findUnique({
            where: { email: session.user.email }
        })

        if (!currentUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // Update the lastReadAt timestamp for this participant
        await prisma.participant.updateMany({
            where: {
                userId: currentUser.id,
                roomId: roomId
            },
            data: {
                lastReadAt: new Date()
            }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error updating read status:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
