"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { useState } from "react"

interface Reaction {
    id: string
    emoji: string
    userId: string
    user: {
        id: string
        username: string
        image?: string
    }
}

interface ReactionDisplayProps {
    reactions: Reaction[]
    currentUserId: string
    onToggleReaction: (emoji: string) => void
}

export function ReactionDisplay({ reactions, currentUserId, onToggleReaction }: ReactionDisplayProps) {
    const [hoveredEmoji, setHoveredEmoji] = useState<string | null>(null)

    if (!reactions || reactions.length === 0) return null

    // Group reactions by emoji
    const groupedReactions = reactions.reduce((acc, reaction) => {
        if (!acc[reaction.emoji]) {
            acc[reaction.emoji] = []
        }
        acc[reaction.emoji].push(reaction)
        return acc
    }, {} as Record<string, Reaction[]>)

    return (
        <div className="flex flex-wrap gap-1.5 mt-1.5">
            {Object.entries(groupedReactions).map(([emoji, reactionList]) => {
                const hasCurrentUser = reactionList.some(r => r.userId === currentUserId)
                const count = reactionList.length

                return (
                    <div key={emoji} className="relative">
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => onToggleReaction(emoji)}
                            onMouseEnter={() => setHoveredEmoji(emoji)}
                            onMouseLeave={() => setHoveredEmoji(null)}
                            className={cn(
                                "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium transition-all",
                                "border backdrop-blur-sm",
                                hasCurrentUser
                                    ? "bg-blue-500/20 border-blue-500/50 text-blue-300"
                                    : "bg-gray-700/50 border-white/10 text-gray-300 hover:bg-gray-700/70"
                            )}
                        >
                            <span className="text-sm">{emoji}</span>
                            <span className="text-[10px]">{count}</span>
                        </motion.button>

                        {/* Tooltip showing who reacted */}
                        {hoveredEmoji === emoji && (
                            <motion.div
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-50 whitespace-nowrap"
                            >
                                <div className="bg-gray-900 border border-white/10 rounded-lg px-3 py-2 shadow-xl">
                                    <div className="text-xs text-gray-300 space-y-1">
                                        {reactionList.map((reaction) => (
                                            <div key={reaction.id} className="flex items-center gap-2">
                                                {reaction.user.image ? (
                                                    <img
                                                        src={reaction.user.image}
                                                        alt={reaction.user.username}
                                                        className="w-4 h-4 rounded-full"
                                                    />
                                                ) : (
                                                    <div className="w-4 h-4 rounded-full bg-blue-600 flex items-center justify-center text-[8px] font-bold">
                                                        {reaction.user.username[0].toUpperCase()}
                                                    </div>
                                                )}
                                                <span>{reaction.user.username}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </div>
                )
            })}
        </div>
    )
}
