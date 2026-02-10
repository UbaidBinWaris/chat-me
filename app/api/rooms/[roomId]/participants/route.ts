import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'

// POST /api/rooms/[roomId]/participants - Add participants to a group
export async function POST(
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

        const { userIds } = await req.json()

        if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
            return NextResponse.json({ error: 'Invalid user IDs' }, { status: 400 })
        }

        // Check if current user is an admin
        const participant = await prisma.participant.findUnique({
            where: {
                userId_roomId: {
                    userId: currentUser.id,
                    roomId: roomId
                }
            }
        })

        if (!participant || participant.role !== 'admin') {
            return NextResponse.json({ error: 'Only admins can add participants' }, { status: 403 })
        }

        // Check if users are friends with the current user
        const friendships = await prisma.friendship.findMany({
            where: {
                status: 'accepted',
                OR: [
                    { requesterId: currentUser.id, addresseeId: { in: userIds } },
                    { addresseeId: currentUser.id, requesterId: { in: userIds } }
                ]
            }
        })

        const friendIds = new Set(
            friendships.map(f =>
                f.requesterId === currentUser.id ? f.addresseeId : f.requesterId
            )
        )

        // Filter to only add friends
        const validUserIds = userIds.filter(id => friendIds.has(id))

        if (validUserIds.length === 0) {
            return NextResponse.json({ error: 'No valid friends to add' }, { status: 400 })
        }

        // Add participants
        const newParticipants = await Promise.all(
            validUserIds.map(async (userId) => {
                // Check if already a participant
                const existing = await prisma.participant.findUnique({
                    where: {
                        userId_roomId: {
                            userId,
                            roomId: roomId
                        }
                    }
                })

                if (existing) return null

                return prisma.participant.create({
                    data: {
                        userId,
                        roomId: roomId,
                        role: 'member',
                        addedBy: currentUser.id
                    },
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
            })
        )

        const addedParticipants = newParticipants.filter(p => p !== null)

        // Emit socket event
        if (global.io && addedParticipants.length > 0) {
            // Notify existing room members
            global.io.to(roomId).emit('participant_added', {
                roomId: roomId,
                participants: addedParticipants,
                addedBy: currentUser.id
            })

            // Notify new participants
            addedParticipants.forEach(p => {
                if (p) {
                    global.io.emit('new_chat', {
                        id: roomId,
                        participants: [p.user]
                    })
                }
            })
        }

        return NextResponse.json({ addedParticipants })
    } catch (error) {
        console.error('Error adding participants:', error)
        return NextResponse.json({ error: 'Error adding participants' }, { status: 500 })
    }
}
