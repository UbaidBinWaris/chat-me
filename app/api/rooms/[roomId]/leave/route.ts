import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth.config'

// POST /api/rooms/[roomId]/leave - Leave a group
export async function POST(
    req: Request,
    { params }: { params: Promise<{ roomId: string }> }
) {
    try {
        const { roomId } = await params
        const session = await getServerSession(authOptions)

        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const currentUser = await prisma.user.findUnique({
            where: { email: session.user.email }
        })

        if (!currentUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // Check if room exists and is a group
        const room = await prisma.room.findUnique({
            where: { id: roomId },
            include: {
                participants: true
            }
        })

        if (!room) {
            return NextResponse.json({ error: 'Room not found' }, { status: 404 })
        }

        if (!room.isGroup) {
            return NextResponse.json({ error: 'Cannot leave a direct message' }, { status: 400 })
        }

        // Check if user is the creator
        if (room.createdBy === currentUser.id) {
            return NextResponse.json({ error: 'Group creator cannot leave. Delete the group instead.' }, { status: 403 })
        }

        // Remove the participant
        await prisma.participant.delete({
            where: {
                userId_roomId: {
                    userId: currentUser.id,
                    roomId: roomId
                }
            }
        })

        // Emit socket event
        if (global.io) {
            global.io.to(roomId).emit('user_left_group', {
                roomId: roomId,
                userId: currentUser.id,
                username: currentUser.username
            })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error leaving group:', error)
        return NextResponse.json({ error: 'Error leaving group' }, { status: 500 })
    }
}
