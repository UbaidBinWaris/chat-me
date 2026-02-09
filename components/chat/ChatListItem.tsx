"use client"

import { cn } from "@/lib/utils"

interface ChatListItemProps {
    room: any
    selected: boolean
    onClick: () => void
}

export function ChatListItem({ room, selected, onClick }: ChatListItemProps) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "w-full p-3 rounded-xl flex items-center gap-3 transition-all duration-200 hover:bg-white/5",
                selected ? "bg-white/10 shadow-lg border border-white/5" : "text-gray-400"
            )}
        >
            <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center text-lg font-medium text-gray-300">
                {room.name ? room.name[0].toUpperCase() : "?"}
            </div>
            <div className="flex-1 text-left">
                <div className="flex justify-between items-center mb-1">
                    <span className={cn("font-medium", selected ? "text-white" : "text-gray-300")}>
                        {room.name || "Unnamed Room"}
                    </span>
                    <span className="text-xs text-gray-500">
                        {room.time ? new Date(room.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                </div>
                <div className="flex justify-between items-center">
                    <p className="text-xs text-gray-500 truncate max-w-[140px]">{room.lastMessage}</p>
                </div>
            </div>
        </button>
    )
}
