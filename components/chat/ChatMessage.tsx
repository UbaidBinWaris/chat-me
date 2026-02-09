"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar" // We can add this later if we want actual avatars

interface Message {
    id: string
    content: string
    senderId: string
    sender: {
        username: string
    }
    createdAt: string
}

interface ChatMessageProps {
    message: Message
    isMe: boolean
}

export function ChatMessage({ message, isMe }: ChatMessageProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.2 }}
            className={cn("flex", isMe ? "justify-end" : "justify-start")}
        >
            <div className={cn(
                "max-w-[75%] rounded-2xl p-4 shadow-md relative group transition-all duration-200",
                isMe
                    ? "bg-blue-600 text-white rounded-br-sm"
                    : "bg-gray-800/80 backdrop-blur-sm text-gray-200 rounded-bl-sm border border-white/5"
            )}>
                {/* Sender Name (only for others) */}
                {!isMe && (
                    <p className="text-xs text-blue-400 mb-1 font-semibold tracking-wide">
                        {message.sender.username}
                    </p>
                )}

                {/* Message Content */}
                <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                    {message.content}
                </p>

                {/* Timestamp & Status */}
                <div className={cn(
                    "flex items-center gap-1 mt-1",
                    isMe ? "justify-end text-blue-200/70" : "justify-start text-gray-500"
                )}>
                    <span className="text-[10px]">
                        {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>
            </div>
        </motion.div>
    )
}
