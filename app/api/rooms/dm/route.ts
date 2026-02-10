import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
    try {
        const session = await getServerSession()

        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { otherUserId } = await req.json()

        if (!otherUserId) {
            return NextResponse.json({ error: 'Other user ID is required' }, { status: 400 })
        }

        // Get current user
        const currentUser = await prisma.user.findUnique({
            where: { email: session.user.email }
        })

        if (!currentUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // Check if users are friends
        const friendship = await prisma.friendship.findFirst({
            where: {
                OR: [
                    { requesterId: currentUser.id, addresseeId: otherUserId },
                    { requesterId: otherUserId, addresseeId: currentUser.id }
                ],
                status: 'accepted'
            }
        })

        if (!friendship) {
            return NextResponse.json({
                error: 'You must be friends to start a DM. Please send a friend request first.'
            }, { status: 403 })
        }

        // Check if DM room already exists between these two users
        const existingRoom = await prisma.room.findFirst({
            where: {
                isGroup: false,
                AND: [
                    {
                        participants: {
                            some: { userId: currentUser.id }
                        }
                    },
                    {
                        participants: {
                            some: { userId: otherUserId }
                        }
                    }
                ]
            },
            include: {
                participants: {
                    include: { user: true }
                },
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            }
        })

        if (existingRoom) {
            // Format and return existing room
            const formattedRoom = {
                id: existingRoom.id,
                name: existingRoom.participants.find(p => p.userId !== currentUser.id)?.user.username || 'Unknown',
                isGroup: existingRoom.isGroup,
                participants: existingRoom.participants.map(p => p.user),
                lastMessage: existingRoom.messages[0]?.content || "No messages yet",
                time: existingRoom.messages[0]?.createdAt || existingRoom.createdAt,
            }
            return NextResponse.json(formattedRoom)
        }

        // Create new DM room
        const newRoom = await prisma.room.create({
            data: {
                isGroup: false,
                participants: {
                    create: [
                        { userId: currentUser.id },
                        { userId: otherUserId }
                    ]
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
            }
        })

        // Format and return new room
        const formattedRoom = {
            id: newRoom.id,
            name: newRoom.participants.find(p => p.userId !== currentUser.id)?.user.username || 'Unknown',
            isGroup: newRoom.isGroup,
            participants: newRoom.participants.map(p => p.user),
            lastMessage: "No messages yet",
            time: newRoom.createdAt,
        }

        return NextResponse.json(formattedRoom)
    } catch (error) {
        console.error('Error creating/finding DM room:', error)
        return NextResponse.json({ error: 'Error creating DM room' }, { status: 500 })
    }
}
