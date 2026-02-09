import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
    try {
        const rooms = await prisma.room.findMany({
            include: {
                participants: {
                    include: { user: true }
                },
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            },
            orderBy: { createdAt: 'desc' },
        })

        const formattedRooms = rooms.map(room => ({
            id: room.id,
            name: room.name || room.participants.map(p => p.user.username).join(', '),
            isGroup: room.isGroup,
            participants: room.participants.map(p => p.user),
            lastMessage: room.messages[0]?.content || "No messages yet",
            time: room.messages[0]?.createdAt || room.createdAt,
        }))

        return NextResponse.json(formattedRooms)
    } catch (error) {
        return NextResponse.json({ error: 'Error fetching rooms' }, { status: 500 })
    }
}

export async function POST(req: Request) {
    try {
        const { name, isGroup, participantIds } = await req.json()

        const room = await prisma.room.create({
            data: {
                name,
                isGroup,
                participants: {
                    create: participantIds.map((id: string) => ({ user: { connect: { id } } }))
                }
            },
            include: {
                participants: {
                    include: { user: true }
                }
            }
        })

        return NextResponse.json(room)
    } catch (error) {
        return NextResponse.json({ error: 'Error creating room' }, { status: 500 })
    }
}
