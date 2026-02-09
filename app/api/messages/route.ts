import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url)
    const roomId = searchParams.get('roomId')

    if (!roomId) {
        return NextResponse.json({ error: 'Room ID required' }, { status: 400 })
    }

    try {
        const messages = await prisma.message.findMany({
            where: { roomId },
            include: { sender: true },
            orderBy: { createdAt: 'asc' },
        })

        return NextResponse.json(messages)
    } catch (error) {
        return NextResponse.json({ error: 'Error fetching messages' }, { status: 500 })
    }
}

export async function POST(req: Request) {
    try {
        const { content, roomId, senderId, type, fileUrl } = await req.json()

        if ((!content && type === 'text') || !roomId || !senderId) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
        }

        const message = await prisma.message.create({
            data: {
                content,
                roomId,
                senderId,
                type: type || 'text',
                fileUrl
            },
            include: {
                sender: true
            }
        })

        // TODO: Trigger Pusher event here
        // await pusherServer.trigger(`room-${roomId}`, 'new-message', message)

        return NextResponse.json(message)
    } catch (error) {
        return NextResponse.json({ error: 'Error sending message' }, { status: 500 })
    }
}
