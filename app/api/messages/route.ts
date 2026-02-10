import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { extractMentions, validateMentions } from '@/lib/utils/mentions'

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url)
    const roomId = searchParams.get('roomId')

    if (!roomId) {
        return NextResponse.json({ error: 'Room ID required' }, { status: 400 })
    }

    try {
        const messages = await prisma.message.findMany({
            where: { roomId },
            include: {
                sender: true,
                reactions: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                username: true,
                                image: true
                            }
                        }
                    }
                },
                replyTo: {
                    include: {
                        sender: {
                            select: {
                                id: true,
                                username: true,
                                image: true
                            }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'asc' },
        })

        return NextResponse.json(messages)
    } catch (error) {
        return NextResponse.json({ error: 'Error fetching messages' }, { status: 500 })
    }
}

export async function POST(req: Request) {
    try {
        const { content, roomId, senderId, type, fileUrl, replyToId } = await req.json()

        if ((!content && type === 'text') || !roomId || !senderId) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
        }

        // Extract and validate mentions from message content
        let mentions: string[] = []
        if (content && type === 'text') {
            const mentionedUsernames = extractMentions(content)
            mentions = await validateMentions(mentionedUsernames, roomId)
        }

        const message = await prisma.message.create({
            data: {
                content,
                roomId,
                senderId,
                type: type || 'text',
                fileUrl,
                mentions,
                replyToId
            },
            include: {
                sender: true,
                reactions: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                username: true,
                                image: true
                            }
                        }
                    }
                },
                replyTo: {
                    include: {
                        sender: {
                            select: {
                                id: true,
                                username: true,
                                image: true
                            }
                        }
                    }
                }
            }
        })

        // TODO: Trigger Pusher event here
        // await pusherServer.trigger(`room-${roomId}`, 'new-message', message)

        return NextResponse.json(message)
    } catch (error) {
        return NextResponse.json({ error: 'Error sending message' }, { status: 500 })
    }
}
