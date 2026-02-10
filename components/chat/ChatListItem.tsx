"use client"

import { formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"
import { Users, User } from "lucide-react"
import { GroupContextMenu } from "@/components/chat/GroupContextMenu"

interface ChatListItemProps {
    room: any
    selected: boolean
    onClick: () => void
    isOnline?: boolean
    unreadCount?: number
    onShowInfo?: () => void
    onAddParticipants?: () => void
    onLeaveGroup?: () => void
    onDeleteGroup?: () => void
}

export function ChatListItem({
    room,
    selected,
    onClick,
    isOnline,
    unreadCount,
    onShowInfo,
    onAddParticipants,
    onLeaveGroup,
    onDeleteGroup
}: ChatListItemProps) {
    const chatItem = (
        <div
            onClick={onClick}
            className={cn(
                "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200 relative",
                selected
                    ? "bg-blue-600/20 border-l-4 border-blue-500"
                    : "hover:bg-gray-800/40 border-l-4 border-transparent"
            )}
        >
            {/* Avatar/Icon */}
            <div className="relative">
                <div className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg text-white flex-shrink-0 overflow-hidden relative",
                    room.isGroup
                        ? "bg-gradient-to-tr from-purple-500 to-pink-500"
                        : (room.image ? "bg-transparent" : "bg-gradient-to-tr from-blue-500 to-cyan-500")
                )}>
                    {room.isGroup ? (
                        <Users size={24} />
                    ) : (
                        room.image ? (
                            <img
                                src={room.image}
                                alt={room.name}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            room.name?.[0]?.toUpperCase() || <User size={24} />
                        )
                    )}
                </div>

                {/* Online Status Indicator */}
                {!room.isGroup && isOnline && (
                    <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-gray-900 rounded-full z-10"></div>
                )}
            </div>

            {/* Chat Info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-white truncate flex items-center gap-2">
                        {room.name}
                    </h3>
                    {unreadCount && unreadCount > 0 ? (
                        <div className="bg-blue-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[1.2rem] text-center">
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </div>
                    ) : null}
                </div>
                <div className="flex items-center justify-between">
                    <p className={cn(
                        "text-sm truncate max-w-[180px]",
                        unreadCount && unreadCount > 0 ? "text-white font-semibold" : "text-gray-400"
                    )}>
                        {room.lastMessage}
                    </p>
                </div>
            </div>
        </div>
    )

    if (room.isGroup) {
        return (
            <GroupContextMenu
                isGroup={room.isGroup}
                isAdmin={room.currentUserRole === 'admin'}
                isCreator={room.createdBy?.id === room.currentUserId}
                onShowInfo={onShowInfo}
                onAddParticipants={onAddParticipants}
                onLeaveGroup={onLeaveGroup}
                onDeleteGroup={onDeleteGroup}
            >
                {chatItem}
            </GroupContextMenu>
        )
    }

    return chatItem
}
