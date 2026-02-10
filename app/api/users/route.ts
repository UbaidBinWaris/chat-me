import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
    try {
        const session = await getServerSession()

        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get current user to exclude them from the list
        const currentUser = await prisma.user.findUnique({
            where: { email: session.user.email }
        })

        if (!currentUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // Fetch all users except the current user
        const users = await prisma.user.findMany({
            where: {
                id: { not: currentUser.id }
            },
            select: {
                id: true,
                username: true,
                email: true,
                createdAt: true,
                lastLoginAt: true
            },
            orderBy: { username: 'asc' }
        })

        // Get all friendships involving current user
        const friendships = await prisma.friendship.findMany({
            where: {
                OR: [
                    { requesterId: currentUser.id },
                    { addresseeId: currentUser.id }
                ]
            }
        })

        // Add friendship status to each user
        const usersWithFriendshipStatus = users.map(user => {
            const friendship = friendships.find(f =>
                f.requesterId === user.id || f.addresseeId === user.id
            )

            let friendshipStatus = 'none'
            let friendshipId = null

            if (friendship) {
                friendshipId = friendship.id
                if (friendship.status === 'accepted') {
                    friendshipStatus = 'accepted'
                } else if (friendship.status === 'pending') {
                    friendshipStatus = friendship.requesterId === currentUser.id
                        ? 'pending_sent'
                        : 'pending_received'
                } else if (friendship.status === 'declined') {
                    friendshipStatus = 'declined'
                } else if (friendship.status === 'blocked') {
                    friendshipStatus = 'blocked'
                }
            }

            return {
                ...user,
                friendshipStatus,
                friendshipId
            }
        })

        return NextResponse.json(usersWithFriendshipStatus)
    } catch (error) {
        console.error('Error fetching users:', error)
        return NextResponse.json({ error: 'Error fetching users' }, { status: 500 })
    }
}
