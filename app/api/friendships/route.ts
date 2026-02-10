import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'

// GET /api/friendships - Get user's friendships
export async function GET(req: Request) {
    try {
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

        const { searchParams } = new URL(req.url)
        const status = searchParams.get('status')

        // Build where clause
        const whereClause: any = {
            OR: [
                { requesterId: currentUser.id },
                { addresseeId: currentUser.id }
            ]
        }

        if (status) {
            whereClause.status = status
        }

        const friendships = await prisma.friendship.findMany({
            where: whereClause,
            include: {
                requester: {
                    select: {
                        id: true,
                        username: true,
                        email: true,
                        lastLoginAt: true
                    }
                },
                addressee: {
                    select: {
                        id: true,
                        username: true,
                        email: true,
                        lastLoginAt: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        })

        // Format response to include the "other" user
        const formattedFriendships = friendships.map(friendship => ({
            id: friendship.id,
            status: friendship.status,
            createdAt: friendship.createdAt,
            updatedAt: friendship.updatedAt,
            isRequester: friendship.requesterId === currentUser.id,
            otherUser: friendship.requesterId === currentUser.id
                ? friendship.addressee
                : friendship.requester
        }))

        return NextResponse.json(formattedFriendships)
    } catch (error) {
        console.error('Error fetching friendships:', error)
        return NextResponse.json({ error: 'Error fetching friendships' }, { status: 500 })
    }
}

// POST /api/friendships - Send friend request
export async function POST(req: Request) {
    try {
        const session = await getServerSession()

        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { addresseeId } = await req.json()

        if (!addresseeId) {
            return NextResponse.json({ error: 'Addressee ID is required' }, { status: 400 })
        }

        const currentUser = await prisma.user.findUnique({
            where: { email: session.user.email }
        })

        if (!currentUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // Prevent sending request to self
        if (currentUser.id === addresseeId) {
            return NextResponse.json({ error: 'Cannot send friend request to yourself' }, { status: 400 })
        }

        // Check if friendship already exists (in either direction)
        const existingFriendship = await prisma.friendship.findFirst({
            where: {
                OR: [
                    { requesterId: currentUser.id, addresseeId: addresseeId },
                    { requesterId: addresseeId, addresseeId: currentUser.id }
                ]
            }
        })

        if (existingFriendship) {
            return NextResponse.json({
                error: 'Friendship already exists',
                friendship: existingFriendship
            }, { status: 400 })
        }

        // Create new friend request
        const friendship = await prisma.friendship.create({
            data: {
                requesterId: currentUser.id,
                addresseeId: addresseeId,
                status: 'pending'
            },
            include: {
                requester: {
                    select: {
                        id: true,
                        username: true,
                        email: true
                    }
                },
                addressee: {
                    select: {
                        id: true,
                        username: true,
                        email: true
                    }
                }
            }
        })

        // Format for socket payload (same as in GET /api/friendships)
        const socketPayload = {
            id: friendship.id,
            status: friendship.status,
            createdAt: friendship.createdAt,
            isRequester: false, // For the receiver, they are not the requester
            otherUser: friendship.requester
        }

        // Emit socket event
        if (global.io) {
            global.io.to(`notification:${addresseeId}`).emit('new_friend_request', socketPayload)
        }

        return NextResponse.json(friendship, { status: 201 })
    } catch (error) {
        console.error('Error creating friendship:', error)
        return NextResponse.json({ error: 'Error creating friend request' }, { status: 500 })
    }
}
