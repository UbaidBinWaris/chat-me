"use client"

import { useState, useEffect } from "react"
import { signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Plus, LogOut, MessageCircle, UserPlus, Bell, MoreVertical, Settings } from "lucide-react"
import { ChatListItem } from "@/components/chat/ChatListItem"
import { UserListModal } from "@/components/chat/UserListModal"
import { NotificationCenter } from "@/components/chat/NotificationCenter"
import { motion, AnimatePresence } from "framer-motion"

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
                    <div className="flex items-center gap-1">
                        <NotificationCenter currentUserId={currentUser.id} />
                        <SidebarMenu
                            onLogout={() => signOut({ callbackUrl: '/' })}
                            onFindFriends={() => setIsUserListOpen(true)}
                            onCreateRoom={() => setIsNewChatOpen(true)}
                        />
                    </div>
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
                <div className="flex-1 overflow-y-auto px-2 space-y-4">
                    {/* Groups Section */}
                    {rooms.filter(r => r.isGroup).length > 0 && (
                        <div>
                            <h3 className="px-2 mb-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">Groups</h3>
                            <div className="space-y-1">
                                {rooms.filter(r => r.isGroup).map((room) => (
                                    <ChatListItem
                                        key={room.id}
                                        room={room}
                                        selected={selectedRoom === room.id}
                                        onClick={() => onSelectRoom(room.id)}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Direct Messages Section */}
                    {rooms.filter(r => !r.isGroup).length > 0 && (
                        <div>
                            <h3 className="px-2 mb-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">Messages</h3>
                            <div className="space-y-1">
                                {rooms.filter(r => !r.isGroup).map((room) => (
                                    <ChatListItem
                                        key={room.id}
                                        room={room}
                                        selected={selectedRoom === room.id}
                                        onClick={() => onSelectRoom(room.id)}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {rooms.length === 0 && (
                        <div className="p-4 text-center text-gray-500 text-sm">
                            No chats yet
                        </div>
                    )}
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

function SidebarMenu({ onLogout, onFindFriends, onCreateRoom }: { onLogout: () => void, onFindFriends: () => void, onCreateRoom: () => void }) {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <div className="relative">
            <Button
                variant="ghost"
                size="icon"
                className="text-gray-400 hover:text-white hover:bg-white/10"
                onClick={() => setIsOpen(!isOpen)}
            >
                <MoreVertical size={20} />
            </Button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        <div
                            className="fixed inset-0 z-40"
                            onClick={() => setIsOpen(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            transition={{ duration: 0.1 }}
                            className="absolute right-0 mt-2 w-48 bg-gray-900 border border-white/10 rounded-xl shadow-xl overflow-hidden z-50 ring-1 ring-black/5 py-1"
                        >
                            <button
                                onClick={() => { onFindFriends(); setIsOpen(false) }}
                                className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-white/10 hover:text-white flex items-center gap-2"
                            >
                                <UserPlus size={16} /> Find Friends
                            </button>
                            <button
                                onClick={() => { onCreateRoom(); setIsOpen(false) }}
                                className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-white/10 hover:text-white flex items-center gap-2"
                            >
                                <Plus size={16} /> Create Room
                            </button>
                            <div className="my-1 border-t border-white/10" />
                            <button
                                onClick={() => { onLogout(); setIsOpen(false) }}
                                className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2"
                            >
                                <LogOut size={16} /> Logout
                            </button>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    )
}
