"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { Play, Pause, FileIcon, Download, Check, CheckCheck } from "lucide-react"
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { format } from "date-fns"
import { parseMentionsForDisplay } from "@/lib/utils/mentions"
import { ReactionPicker } from "@/components/chat/ReactionPicker"
import { ReactionDisplay } from "@/components/chat/ReactionDisplay"

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

interface Message {
    id: string
    content: string
    senderId: string
    sender: {
        username: string
        image?: string
    }
    createdAt: string
    type?: string
    fileUrl?: string | null
    status?: string
    deliveredAt?: string
    readAt?: string
    reactions?: Reaction[]
    replyToId?: string | null
    replyTo?: {
        id: string
        content: string
        sender: {
            username: string
        }
        type?: string
    } | null
}

interface ChatMessageProps {
    message: Message
    isMe: boolean
    currentUserId: string
    onShowInfo?: (message: Message) => void
    onDelete?: (messageId: string) => void
    onReact?: (messageId: string, emoji: string) => void
    onReply?: (message: Message) => void
}

export function ChatMessage({ message, isMe, currentUserId, onShowInfo, onDelete, onReact, onReply }: ChatMessageProps) {
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const [showReactionPicker, setShowReactionPicker] = useState(false)
    const isAudio = message.type === "audio" && message.fileUrl
    const isImage = message.type === "image" && message.fileUrl
    const isFile = message.type === "file" && message.fileUrl

    const handleReact = (emoji: string) => {
        if (onReact) {
            onReact(message.id, emoji)
        }
        setShowReactionPicker(false)
    }

    const handleToggleReaction = (emoji: string) => {
        if (onReact) {
            onReact(message.id, emoji)
        }
    }

    return (
        <>
            <ContextMenu>
                <ContextMenuTrigger>
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.2 }}
                        className={cn("flex", isMe ? "justify-end" : "justify-start")}
                    >
                        <div
                            className={cn("max-w-[75%] relative")}
                            onMouseEnter={() => setShowReactionPicker(true)}
                            onMouseLeave={() => setShowReactionPicker(false)}
                        >
                            {/* Reaction Picker */}
                            <ReactionPicker
                                isVisible={showReactionPicker}
                                onReact={handleReact}
                            />

                            <div className={cn(
                                "rounded-2xl p-4 shadow-md relative group transition-all duration-200",
                                isMe
                                    ? "bg-blue-600 text-white rounded-br-none"
                                    : "bg-gray-800/80 backdrop-blur-sm text-gray-200 rounded-bl-none border border-white/5"
                            )}>
                                {/* Sender Name (only for others) */}
                                {!isMe && (
                                    <p className="text-xs text-blue-400 mb-1 font-semibold tracking-wide">
                                        {message.sender.username}
                                    </p>
                                )}

                                {/* Reply Preview */}
                                {message.replyTo && (
                                    <div className={cn(
                                        "mb-2 pl-3 border-l-2 py-1",
                                        isMe ? "border-blue-300" : "border-blue-500"
                                    )}>
                                        <p className={cn(
                                            "text-[10px] font-semibold mb-0.5",
                                            isMe ? "text-blue-200" : "text-blue-400"
                                        )}>
                                            {message.replyTo.sender.username}
                                        </p>
                                        <p className={cn(
                                            "text-xs opacity-70 truncate",
                                            isMe ? "text-blue-100" : "text-gray-400"
                                        )}>
                                            {message.replyTo.type === 'audio' ? '🎤 Voice message' :
                                                message.replyTo.type === 'image' ? '🖼️ Image' :
                                                    message.replyTo.type === 'file' ? '📎 File' :
                                                        message.replyTo.content}
                                        </p>
                                    </div>
                                )}

                                {/* Content */}
                                <div className="space-y-2">
                                    {isAudio && (
                                        <div className="flex items-center gap-2 min-w-[200px]">
                                            <audio controls src={message.fileUrl || ""} className="h-8 w-full accent-blue-500" />
                                        </div>
                                    )}

                                    {isImage && (
                                        <div className="max-w-[300px] overflow-hidden rounded-lg">
                                            <img
                                                src={message.fileUrl || ""}
                                                alt="Attached image"
                                                className="w-full h-auto object-cover hover:scale-105 transition-transform duration-300"
                                            />
                                        </div>
                                    )}

                                    {isFile && (
                                        <a
                                            href={message.fileUrl || "#"}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-3 p-2 bg-black/20 rounded-lg hover:bg-black/30 transition-colors group/file"
                                        >
                                            <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
                                                <FileIcon size={24} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate max-w-[150px]">{message.content}</p>
                                                <p className="text-xs opacity-70">Click to download</p>
                                            </div>
                                            <Download size={16} className="opacity-0 group-hover/file:opacity-100 transition-opacity" />
                                        </a>
                                    )}

                                    {/* Show text if it exists and is not just the filename (for files) OR if it is an image caption */}
                                    {(!isFile || (isFile && message.content !== message.fileUrl?.split('/').pop())) && message.content && !isAudio && (
                                        <div className={cn(
                                            "text-sm leading-relaxed whitespace-pre-wrap break-words",
                                            (isImage || isFile) && "mt-2 opacity-90"
                                        )}>
                                            {parseMentionsForDisplay(message.content).map((part, index) => {
                                                if (part.type === 'mention') {
                                                    return (
                                                        <span
                                                            key={index}
                                                            className="bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded font-semibold"
                                                        >
                                                            @{part.content}
                                                        </span>
                                                    )
                                                }
                                                return <span key={index}>{part.content}</span>
                                            })}
                                        </div>
                                    )}
                                </div>

                                {/* Timestamp & Status */}
                                <div className={cn(
                                    "flex items-center gap-1 mt-1",
                                    isMe ? "justify-end text-blue-200/70" : "justify-start text-gray-500"
                                )}>
                                    <span className="text-[10px]">
                                        {format(new Date(message.createdAt), "HH:mm")}
                                    </span>
                                    {isMe && (
                                        <span title={message.status || 'sent'}>
                                            {message.status === 'read' ? (
                                                <CheckCheck className="w-3.5 h-3.5 text-blue-300" />
                                            ) : message.status === 'delivered' ? (
                                                <CheckCheck className="w-3.5 h-3.5 text-gray-300" />
                                            ) : (
                                                <Check className="w-3.5 h-3.5 text-gray-300" />
                                            )}
                                        </span>
                                    )}
                                </div>

                                {/* Reactions Display */}
                                <ReactionDisplay
                                    reactions={message.reactions || []}
                                    currentUserId={currentUserId}
                                    onToggleReaction={handleToggleReaction}
                                />
                            </div>
                        </div>
                    </motion.div>
                </ContextMenuTrigger>
                <ContextMenuContent className="bg-gray-900 border-white/10 text-white">
                    <ContextMenuItem
                        className="focus:bg-blue-600 focus:text-white cursor-pointer"
                        onClick={() => onReply && onReply(message)}
                    >
                        Reply
                    </ContextMenuItem>
                    <ContextMenuItem
                        className="focus:bg-blue-600 focus:text-white cursor-pointer"
                        onClick={() => onShowInfo && onShowInfo(message)}
                    >
                        Message Info
                    </ContextMenuItem>
                    {isMe && (
                        <ContextMenuItem
                            className="focus:bg-red-600 focus:text-white cursor-pointer"
                            onClick={() => setShowDeleteDialog(true)}
                        >
                            Delete Message
                        </ContextMenuItem>
                    )}
                </ContextMenuContent>
            </ContextMenu>

            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent className="bg-gray-900 border-white/10 text-white">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Message</AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-400">
                            Are you sure you want to delete this message? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <button
                            onClick={() => setShowDeleteDialog(false)}
                            className="inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-gray-800 text-white hover:bg-gray-700 border border-white/10 h-9 px-4 py-2"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => {
                                onDelete && onDelete(message.id)
                                setShowDeleteDialog(false)
                            }}
                            className="inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-red-600 text-white hover:bg-red-700 h-9 px-4 py-2"
                        >
                            Delete
                        </button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
