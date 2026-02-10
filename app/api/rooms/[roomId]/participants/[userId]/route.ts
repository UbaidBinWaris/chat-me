import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ roomId: string; userId: string }> }
) {
    try {
        const { roomId, userId } = await params
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

        // Check if current user is an admin
        const currentParticipant = await prisma.participant.findUnique({
            where: {
                userId_roomId: {
                    userId: currentUser.id,
                    roomId: roomId
                }
            }
        })

        if (!currentParticipant || currentParticipant.role !== 'admin') {
            return NextResponse.json({ error: 'Only admins can remove participants' }, { status: 403 })
        }

        // Check if target user is an admin
        const targetParticipant = await prisma.participant.findUnique({
            where: {
                userId_roomId: {
                    userId: userId,
                    roomId: roomId
                }
            }
        })

        if (!targetParticipant) {
            return NextResponse.json({ error: 'User is not a participant' }, { status: 404 })
        }

        if (targetParticipant.role === 'admin') {
            return NextResponse.json({ error: 'Cannot remove other admins' }, { status: 403 })
        }

        // Remove participant
        await prisma.participant.delete({
            where: {
                userId_roomId: {
                    userId: userId,
                    roomId: roomId
                }
            }
        })

        // Emit socket event
        if (global.io) {
            global.io.to(roomId).emit('participant_removed', {
                roomId: roomId,
                userId: userId,
                removedBy: currentUser.id
            })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error removing participant:', error)
        return NextResponse.json({ error: 'Error removing participant' }, { status: 500 })
    }
}

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ roomId: string; userId: string }> }
) {
    try {
        const { roomId, userId } = await params
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

        const { role } = await req.json()

        if (role !== 'admin' && role !== 'member') {
            return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
        }

        // Check if current user is the creator
        const room = await prisma.room.findUnique({
            where: { id: roomId }
        })

        if (!room) {
            return NextResponse.json({ error: 'Room not found' }, { status: 404 })
        }

        if (room.createdBy !== currentUser.id) {
            return NextResponse.json({ error: 'Only the creator can change roles' }, { status: 403 })
        }

        // Update participant role
        const updatedParticipant = await prisma.participant.update({
            where: {
                userId_roomId: {
                    userId: userId,
                    roomId: roomId
                }
            },
            data: { role },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        email: true,
                        image: true
                    }
                }
            }
        })

        // Emit socket event
        if (global.io) {
            global.io.to(roomId).emit('participant_role_changed', {
                roomId: roomId,
                userId: userId,
                role,
                changedBy: currentUser.id
            })
        }

        return NextResponse.json(updatedParticipant)
    } catch (error) {
        console.error('Error updating participant role:', error)
        return NextResponse.json({ error: 'Error updating participant role' }, { status: 500 })
    }
}
