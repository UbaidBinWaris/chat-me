import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
    try {
        const session = await getServerSession()

        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get current user
        const currentUser = await prisma.user.findUnique({
            where: { email: session.user.email }
        })

        if (!currentUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // Fetch only rooms where the current user is a participant
        const rooms = await prisma.room.findMany({
            where: {
                participants: {
                    some: { userId: currentUser.id }
                }
            },
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

        const formattedRooms = rooms.map(room => {
            // For DMs, show the other user's name and image
            let roomName = room.name
            let roomImage = null
            let otherUser = null

            if (!room.isGroup) {
                otherUser = room.participants.find(p => p.userId !== currentUser.id)?.user
                roomName = otherUser?.username || 'Unknown User'
                roomImage = otherUser?.image || null
            } else if (!roomName) {
                // For groups without a name, show participant names
                roomName = room.participants.map(p => p.user.username).join(', ')
            }

            return {
                id: room.id,
                name: roomName,
                image: roomImage,
                isGroup: room.isGroup,
                participants: room.participants.map(p => p.user),
                lastMessage: room.messages[0]?.content || "No messages yet",
                time: room.messages[0]?.createdAt || room.createdAt,
                otherUser: otherUser // Pass the full other user object for the info panel
            }
        })

        return NextResponse.json(formattedRooms)
    } catch (error) {
        console.error('Error fetching rooms:', error)
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
