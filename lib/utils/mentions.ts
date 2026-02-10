import { prisma } from '@/lib/prisma'

/**
 * Extract usernames from message content using @mention pattern
 * @param content - The message content to parse
 * @returns Array of unique usernames mentioned (without @ symbol)
 */
export function extractMentions(content: string): string[] {
    if (!content) return []

    // Match @username pattern (alphanumeric and underscore)
    const mentionRegex = /@(\w+)/g
    const matches = content.matchAll(mentionRegex)

    // Extract unique usernames
    const usernames = new Set<string>()
    for (const match of matches) {
        usernames.add(match[1])
    }

    return Array.from(usernames)
}

/**
 * Validate mentioned usernames and convert to user IDs
 * @param usernames - Array of usernames to validate
 * @param roomId - The room ID to check if users are participants
 * @returns Array of valid user IDs
 */
export async function validateMentions(
    usernames: string[],
    roomId: string
): Promise<string[]> {
    if (usernames.length === 0) return []

    try {
        // Get all participants in the room
        const participants = await prisma.participant.findMany({
            where: { roomId },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true
                    }
                }
            }
        })

        // Create a map of username -> userId for quick lookup
        const usernameToId = new Map<string, string>()
        participants.forEach(p => {
            usernameToId.set(p.user.username.toLowerCase(), p.user.id)
        })

        // Validate and convert usernames to IDs
        const validUserIds: string[] = []
        for (const username of usernames) {
            const userId = usernameToId.get(username.toLowerCase())
            if (userId) {
                validUserIds.push(userId)
            }
        }

        return validUserIds
    } catch (error) {
        console.error('Error validating mentions:', error)
        return []
    }
}

/**
 * Parse message content and return array of React nodes with highlighted mentions
 * This is used on the frontend to render mentions with special styling
 * @param content - The message content to parse
 * @param currentUserId - The current user's ID (to highlight if they are mentioned)
 * @returns Parsed content with mention metadata
 */
export function parseMentionsForDisplay(content: string) {
    if (!content) return []

    const mentionRegex = /@(\w+)/g
    const parts: Array<{ type: 'text' | 'mention', content: string }> = []
    let lastIndex = 0

    const matches = content.matchAll(mentionRegex)
    for (const match of matches) {
        // Add text before mention
        if (match.index! > lastIndex) {
            parts.push({
                type: 'text',
                content: content.slice(lastIndex, match.index)
            })
        }

        // Add mention
        parts.push({
            type: 'mention',
            content: match[1] // username without @
        })

        lastIndex = match.index! + match[0].length
    }

    // Add remaining text
    if (lastIndex < content.length) {
        parts.push({
            type: 'text',
            content: content.slice(lastIndex)
        })
    }

    return parts
}
