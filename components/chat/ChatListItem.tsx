"use client"

import { formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"
import { Users, User } from "lucide-react"

interface ChatListItemProps {
    room: any
    selected: boolean
    onClick: () => void
}

export function ChatListItem({ room, selected, onClick }: ChatListItemProps) {
    return (
        <div
            onClick={onClick}
            className={cn(
                "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200",
                selected
                    ? "bg-blue-600/20 border-l-4 border-blue-500"
                    : "hover:bg-gray-800/40 border-l-4 border-transparent"
            )}
        >
            {/* Avatar/Icon */}
            <div className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg text-white flex-shrink-0",
                room.isGroup
                    ? "bg-gradient-to-tr from-purple-500 to-pink-500"
                    : "bg-gradient-to-tr from-blue-500 to-cyan-500"
            )}>
                {room.isGroup ? (
                    <Users size={24} />
                ) : (
                    room.name?.[0]?.toUpperCase() || <User size={24} />
                )}
            </div>

            {/* Chat Info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-white truncate flex items-center gap-2">
                        {room.name}
                        {!room.isGroup && (
                            <span className="text-xs text-gray-500 font-normal">DM</span>
                        )}
                    </h3>
                    <span className="text-xs text-gray-500 flex-shrink-0">
                        {formatDistanceToNow(new Date(room.time), { addSuffix: true })}
                    </span>
                </div>
                <p className="text-sm text-gray-400 truncate">{room.lastMessage}</p>
            </div>
        </div>
    )
}
