"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { Play, Pause, FileIcon, Download, Check, CheckCheck } from "lucide-react"
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu"
import { format } from "date-fns"

interface Message {
    id: string
    content: string
    senderId: string
    sender: {
        username: string
    }
    createdAt: string
    type?: string
    fileUrl?: string | null
    status?: string
    deliveredAt?: string
    readAt?: string
}

interface ChatMessageProps {
    message: Message
    isMe: boolean
    onShowInfo?: (message: Message) => void
}

export function ChatMessage({ message, isMe, onShowInfo }: ChatMessageProps) {
    const isAudio = message.type === "audio" && message.fileUrl
    const isImage = message.type === "image" && message.fileUrl
    const isFile = message.type === "file" && message.fileUrl

    return (
        <ContextMenu>
            <ContextMenuTrigger>
                <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.2 }}
                    className={cn("flex", isMe ? "justify-end" : "justify-start")}
                >
                    <div className={cn(
                        "max-w-[75%] rounded-2xl p-4 shadow-md relative group transition-all duration-200",
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
                                <p className={cn(
                                    "text-sm leading-relaxed whitespace-pre-wrap break-words",
                                     (isImage || isFile) && "mt-2 opacity-90"
                                )}>
                                    {message.content}
                                </p>
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
                    </div>
                </motion.div>
            </ContextMenuTrigger>
            <ContextMenuContent className="bg-gray-900 border-white/10 text-white">
                <ContextMenuItem 
                    className="focus:bg-blue-600 focus:text-white cursor-pointer"
                    onClick={() => onShowInfo && onShowInfo(message)}
                >
                    Message Info
                </ContextMenuItem>
                <ContextMenuItem className="focus:bg-red-600 focus:text-white cursor-pointer">
                    Delete Message
                </ContextMenuItem>
            </ContextMenuContent>
        </ContextMenu>
    )
}
