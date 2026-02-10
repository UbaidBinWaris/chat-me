import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
    try {
        const { messageId, emoji, userId, roomId } = await req.json()

        if (!messageId || !emoji || !userId || !roomId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        // Verify user is in the room
        const participant = await prisma.participant.findFirst({
            where: {
                userId,
                roomId
            }
        })

        if (!participant) {
            return NextResponse.json({ error: 'User not in room' }, { status: 403 })
        }

        // Check if reaction already exists
        const existingReaction = await prisma.reaction.findUnique({
            where: {
                userId_messageId_emoji: {
                    userId,
                    messageId,
                    emoji
                }
            }
        })

        if (existingReaction) {
            return NextResponse.json({ error: 'Reaction already exists' }, { status: 400 })
        }

        // Create reaction
        const reaction = await prisma.reaction.create({
            data: {
                messageId,
                emoji,
                userId
            },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        image: true
                    }
                }
            }
        })

        return NextResponse.json(reaction)
    } catch (error) {
        console.error('Error creating reaction:', error)
        return NextResponse.json({ error: 'Error creating reaction' }, { status: 500 })
    }
}

export async function DELETE(req: Request) {
    try {
        const { messageId, emoji, userId, roomId } = await req.json()

        if (!messageId || !emoji || !userId || !roomId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        // Verify user is in the room
        const participant = await prisma.participant.findFirst({
            where: {
                userId,
                roomId
            }
        })

        if (!participant) {
            return NextResponse.json({ error: 'User not in room' }, { status: 403 })
        }

        // Delete reaction
        await prisma.reaction.delete({
            where: {
                userId_messageId_emoji: {
                    userId,
                    messageId,
                    emoji
                }
            }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting reaction:', error)
        return NextResponse.json({ error: 'Error deleting reaction' }, { status: 500 })
    }
}
