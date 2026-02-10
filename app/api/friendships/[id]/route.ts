import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'

// PATCH /api/friendships/[id] - Update friendship status
export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const session = await getServerSession()

        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { status } = await req.json()

        if (!status || !['accepted', 'declined', 'blocked'].includes(status)) {
            return NextResponse.json({
                error: 'Invalid status. Must be: accepted, declined, or blocked'
            }, { status: 400 })
        }

        const currentUser = await prisma.user.findUnique({
            where: { email: session.user.email }
        })

        if (!currentUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // Get the friendship
        const friendship = await prisma.friendship.findUnique({
            where: { id }
        })

        if (!friendship) {
            return NextResponse.json({ error: 'Friendship not found' }, { status: 404 })
        }

        // Only the addressee can accept/decline a pending request
        if (friendship.status === 'pending' && friendship.addresseeId !== currentUser.id) {
            return NextResponse.json({
                error: 'Only the recipient can accept or decline a friend request'
            }, { status: 403 })
        }

        // Update the friendship
        const updatedFriendship = await prisma.friendship.update({
            where: { id },
            data: { status },
            include: {
                requester: {
                    select: {
                        id: true,
                        username: true,
                        email: true,
                        image: true // Include image for avatar
                    }
                },
                addressee: {
                    select: {
                        id: true,
                        username: true,
                        email: true,
                        image: true // Include image for avatar
                    }
                }
            }
        })

        if (global.io) {
            // Notify the requester about the status change
            global.io.to(`notification:${updatedFriendship.requesterId}`).emit(
                status === 'accepted' ? 'friend_request_accepted' : 'friend_request_declined',
                {
                    id: updatedFriendship.id,
                    status: updatedFriendship.status,
                    otherUser: updatedFriendship.addressee
                }
            )

            // If accepted, find or create DM room and notify BOTH users
            if (status === 'accepted') {
                // Find or create DM room
                let room = await prisma.room.findFirst({
                    where: {
                        isGroup: false,
                        AND: [
                            { participants: { some: { userId: updatedFriendship.requesterId } } },
                            { participants: { some: { userId: updatedFriendship.addresseeId } } }
                        ]
                    }
                })

                if (!room) {
                    room = await prisma.room.create({
                        data: {
                            isGroup: false,
                            participants: {
                                create: [
                                    { userId: updatedFriendship.requesterId },
                                    { userId: updatedFriendship.addresseeId }
                                ]
                            }
                        }
                    })
                }

                // Helper to format room for specific user
                const getFormattedRoom = (room: any, meId: string, otherUser: any) => ({
                    id: room.id,
                    name: otherUser.username,
                    isGroup: false,
                    image: otherUser.image, // Include image if available
                    participants: [{ id: meId }, { id: otherUser.id }], // Simplified participants
                    otherUser: otherUser,
                    lastMessage: "New connection",
                    time: new Date().toISOString(),
                    unreadCount: 0
                })

                // Notify Requester
                global.io.to(`notification:${updatedFriendship.requesterId}`).emit(
                    'new_chat',
                    getFormattedRoom(room, updatedFriendship.requesterId, updatedFriendship.addressee)
                )

                // Notify Addressee (Current User)
                global.io.to(`notification:${updatedFriendship.addresseeId}`).emit(
                    'new_chat',
                    getFormattedRoom(room, updatedFriendship.addresseeId, updatedFriendship.requester)
                )
            }
        }

        return NextResponse.json(updatedFriendship)
    } catch (error) {
        console.error('Error updating friendship:', error)
        return NextResponse.json({ error: 'Error updating friendship' }, { status: 500 })
    }
}

// DELETE /api/friendships/[id] - Delete friendship or cancel request
export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
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

        // Get the friendship
        const friendship = await prisma.friendship.findUnique({
            where: { id }
        })

        if (!friendship) {
            return NextResponse.json({ error: 'Friendship not found' }, { status: 404 })
        }

        // Verify user is part of this friendship
        if (friendship.requesterId !== currentUser.id && friendship.addresseeId !== currentUser.id) {
            return NextResponse.json({
                error: 'You are not part of this friendship'
            }, { status: 403 })
        }

        // Delete the friendship
        await prisma.friendship.delete({
            where: { id }
        })

        return NextResponse.json({ message: 'Friendship deleted successfully' })
    } catch (error) {
        console.error('Error deleting friendship:', error)
        return NextResponse.json({ error: 'Error deleting friendship' }, { status: 500 })
    }
}
