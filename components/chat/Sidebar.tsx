"use client"

import { signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Plus, MoreVertical, LogOut, MessageCircle } from "lucide-react"
import { ChatListItem } from "@/components/chat/ChatListItem"
import { UserListModal } from "@/components/chat/UserListModal"

interface SidebarProps {
    currentUser: any
    rooms: any[]
    selectedRoom: string | null
    onSelectRoom: (roomId: string) => void
    onCreateRoom: () => void
    onStartDM: (userId: string) => void
    isNewChatOpen: boolean
    setIsNewChatOpen: (isOpen: boolean) => void
    newChatName: string
    setNewChatName: (name: string) => void
    isUserListOpen: boolean
    setIsUserListOpen: (isOpen: boolean) => void
}

export function Sidebar({
    currentUser,
    rooms,
    selectedRoom,
    onSelectRoom,
    onCreateRoom,
    onStartDM,
    isNewChatOpen,
    setIsNewChatOpen,
    newChatName,
    setNewChatName,
    isUserListOpen,
    setIsUserListOpen
}: SidebarProps) {
    return (
        <>
            <div className="w-80 border-r border-white/10 flex flex-col bg-gray-900/50 backdrop-blur-xl h-full">
                {/* User Header */}
                <div className="p-4 border-b border-white/10 flex justify-between items-center bg-gray-900/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center font-bold text-lg text-white">
                            {currentUser.username[0].toUpperCase()}
                        </div>
                        <div>
                            <h2 className="font-semibold text-sm text-white">{currentUser.username}</h2>
                            <span className="text-xs text-green-400 flex items-center gap-1">
                                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> Online
                            </span>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        onClick={() => signOut({ callbackUrl: '/' })}
                        title="Logout"
                    >
                        <LogOut size={20} />
                    </Button>
                </div>

                {/* Search / New Room Input */}
                <div className="p-4 space-y-2">
                    {!isNewChatOpen ? (
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                            <Input placeholder="Search chats..." className="pl-9 bg-gray-800/50 border-none focus:ring-blue-500/50 text-white" />
                        </div>
                    ) : (
                        <div className="flex gap-2">
                            <Input
                                placeholder="Room Name..."
                                value={newChatName}
                                onChange={e => setNewChatName(e.target.value)}
                                className="bg-gray-800/50 text-white"
                                autoFocus
                            />
                            <Button size="sm" onClick={onCreateRoom} className="bg-blue-600">Create</Button>
                            <Button size="sm" variant="ghost" onClick={() => setIsNewChatOpen(false)}>Cancel</Button>
                        </div>
                    )}
                </div>

                {/* Room List */}
                <div className="flex-1 overflow-y-auto px-2 space-y-1">
                    {rooms.map((room) => (
                        <ChatListItem
                            key={room.id}
                            room={room}
                            selected={selectedRoom === room.id}
                            onClick={() => onSelectRoom(room.id)}
                        />
                    ))}
                </div>

                {/* Bottom Actions */}
                <div className="p-4 border-t border-white/10 bg-gray-900/30 space-y-2">
                    <Button
                        className="w-full gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-900/20"
                        onClick={() => setIsUserListOpen(true)}
                    >
                        <MessageCircle size={18} /> New DM
                    </Button>
                    <Button
                        className="w-full gap-2 bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-900/20"
                        onClick={() => setIsNewChatOpen(true)}
                    >
                        <Plus size={18} /> New Room
                    </Button>
                </div>
            </div>

            {/* User List Modal */}
            <UserListModal
                isOpen={isUserListOpen}
                onClose={() => setIsUserListOpen(false)}
                onSelectUser={onStartDM}
                currentUserId={currentUser.id}
            />
        </>
    )
}
