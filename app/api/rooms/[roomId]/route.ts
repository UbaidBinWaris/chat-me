import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'

// GET /api/rooms/[roomId] - Get room details with participants
export async function GET(
    req: Request,
    { params }: { params: Promise<{ roomId: string }> }
) {
    try {
        const { roomId } = await params
        const session = await getServerSession()

        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const currentUser = await prisma.user.findUnique({
            where: { email: session.user.email }
        })

        if (!currentUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        const room = await prisma.room.findUnique({
            where: { id: roomId },
            include: {
                participants: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                username: true,
                                email: true,
                                image: true,
                                bio: true
                            }
                        },
                        addedByUser: {
                            select: {
                                id: true,
                                username: true
                            }
                        }
                    }
                },
                createdByUser: {
                    select: {
                        id: true,
                        username: true,
                        email: true,
                        image: true
                    }
                }
            }
        })

        if (!room) {
            return NextResponse.json({ error: 'Room not found' }, { status: 404 })
        }

        // Check if user is a participant
        const isParticipant = room.participants.some(p => p.userId === currentUser.id)
        if (!isParticipant) {
            return NextResponse.json({ error: 'Not a participant' }, { status: 403 })
        }

        return NextResponse.json(room)
    } catch (error) {
        console.error('Error fetching room:', error)
        return NextResponse.json({ error: 'Error fetching room' }, { status: 500 })
    }
}

// PATCH /api/rooms/[roomId] - Update group settings (admin only)
export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ roomId: string }> }
) {
    try {
        const { roomId } = await params
        const session = await getServerSession()

        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const currentUser = await prisma.user.findUnique({
            where: { email: session.user.email }
        })

        if (!currentUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        const { name, description, image } = await req.json()

        // Check if user is an admin
        const participant = await prisma.participant.findUnique({
            where: {
                userId_roomId: {
                    userId: currentUser.id,
                    roomId: roomId
                }
            }
        })

        if (!participant || participant.role !== 'admin') {
            return NextResponse.json({ error: 'Only admins can update group settings' }, { status: 403 })
        }

        const updatedRoom = await prisma.room.update({
            where: { id: roomId },
            data: {
                name,
                description,
                image
            },
            include: {
                participants: {
                    include: {
                        user: true
                    }
                }
            }
        })

        // Emit socket event for real-time update
        if (global.io) {
            global.io.to(roomId).emit('group_updated', {
                roomId: roomId,
                name,
                description,
                image,
                updatedBy: currentUser.id
            })
        }

        return NextResponse.json(updatedRoom)
    } catch (error) {
        console.error('Error updating room:', error)
        return NextResponse.json({ error: 'Error updating room' }, { status: 500 })
    }
}

// DELETE /api/rooms/[roomId] - Delete a group (creator only)
export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ roomId: string }> }
) {
    try {
        const { roomId } = await params
        const session = await getServerSession()

        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const currentUser = await prisma.user.findUnique({
            where: { email: session.user.email }
        })

        if (!currentUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // Check if user is the creator
        const room = await prisma.room.findUnique({
            where: { id: roomId },
            include: {
                participants: true
            }
        })

        if (!room) {
            return NextResponse.json({ error: 'Room not found' }, { status: 404 })
        }

        if (room.createdBy !== currentUser.id) {
            return NextResponse.json({ error: 'Only the creator can delete the group' }, { status: 403 })
        }

        // Delete the room (cascade will delete participants and messages)
        await prisma.room.delete({
            where: { id: roomId }
        })

        // Emit socket event
        if (global.io) {
            global.io.to(roomId).emit('group_deleted', {
                roomId: roomId,
                deletedBy: currentUser.id
            })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting room:', error)
        return NextResponse.json({ error: 'Error deleting room' }, { status: 500 })
    }
}
