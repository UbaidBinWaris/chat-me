"use client"

import { useState, useEffect } from "react"
import { signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Plus, LogOut, MessageCircle, UserPlus, Bell, MoreVertical, Settings, ChevronDown, ChevronRight } from "lucide-react"
import { ChatListItem } from "@/components/chat/ChatListItem"
import { UserListModal } from "@/components/chat/UserListModal"
import { NotificationCenter } from "@/components/chat/NotificationCenter"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import { useRef } from "react"
import { toast } from "sonner"
import { SettingsModal } from "./settings/SettingsModal"
import { getAvatar } from "@/lib/avatar"
import { CreateGroupModal } from "@/components/chat/CreateGroupModal"

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
    onlineUsers: Set<string>
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
    setIsUserListOpen,
    onlineUsers,
    isLoading = false // Optional prop for loading state
}: SidebarProps & { isLoading?: boolean }) {
    const [searchQuery, setSearchQuery] = useState("")
    const [isGroupsOpen, setIsGroupsOpen] = useState(true)
    const [isMessagesOpen, setIsMessagesOpen] = useState(true)
    const [isSettingsOpen, setIsSettingsOpen] = useState(false)
    const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false)

    const filteredRooms = rooms.filter(room =>
        room.name?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const groupRooms = filteredRooms.filter(r => r.isGroup)
    const dmRooms = filteredRooms.filter(r => !r.isGroup)

    return (
        <>
            <div className="w-80 border-r border-white/10 flex flex-col bg-gray-900/50 backdrop-blur-xl h-full">
                {/* Brand Header */}
                <div className="p-4 border-b border-white/10 flex items-center gap-3 bg-gray-900/50">
                    <div className="relative w-8 h-8">
                        <Image
                            src="/logo.png"
                            alt="Gixiai Chats"
                            fill
                            className="object-contain"
                        />
                    </div>
                    <h1 className="font-bold text-xl text-white tracking-tight">Gixiai Chats</h1>
                </div>

                {/* Search / New Room Input */}
                <div className="p-4 space-y-2">
                    {!isNewChatOpen ? (
                        <div className="relative group">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500 group-focus-within:text-blue-400 transition-colors" />
                            <Input
                                placeholder="Search chats..."
                                className="pl-9 bg-gray-800/50 border-white/5 focus:border-blue-500/50 focus:ring-blue-500/20 text-white transition-all"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
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
                <div className="flex-1 overflow-y-auto px-2 space-y-4 custom-scrollbar">
                    {/* Loading Skeleton */}
                    {isLoading && (
                        <div className="space-y-3 p-2">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="flex items-center gap-3 animate-pulse">
                                    <div className="w-12 h-12 rounded-full bg-gray-800" />
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 bg-gray-800 rounded w-1/2" />
                                        <div className="h-3 bg-gray-800 rounded w-3/4" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {!isLoading && (
                        <>
                            {/* Groups Section */}
                            {(groupRooms.length > 0 || (isGroupsOpen && filteredRooms.length === 0 && searchQuery)) && (
                                <div className="space-y-1">
                                    <button
                                        onClick={() => setIsGroupsOpen(!isGroupsOpen)}
                                        className="flex items-center gap-1 w-full px-2 py-1 text-xs font-semibold text-gray-500 hover:text-gray-300 uppercase tracking-wider transition-colors"
                                    >
                                        {isGroupsOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                        Groups
                                        <span className="ml-auto text-[10px] bg-gray-800 px-1.5 py-0.5 rounded-full">{groupRooms.length}</span>
                                    </button>

                                    <AnimatePresence>
                                        {isGroupsOpen && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: "auto", opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.2 }}
                                                className="overflow-hidden"
                                            >
                                                {groupRooms.map((room) => (
                                                    <ChatListItem
                                                        key={room.id}
                                                        room={room}
                                                        selected={selectedRoom === room.id}
                                                        onClick={() => onSelectRoom(room.id)}
                                                        unreadCount={room.unreadCount}
                                                        isOnline={!room.isGroup && room.otherUser && onlineUsers.has(room.otherUser.id)}
                                                    />
                                                ))}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            )}

                            {/* Direct Messages Section */}
                            {(dmRooms.length > 0 || (isMessagesOpen && filteredRooms.length === 0 && searchQuery)) && (
                                <div className="space-y-1">
                                    <button
                                        onClick={() => setIsMessagesOpen(!isMessagesOpen)}
                                        className="flex items-center gap-1 w-full px-2 py-1 text-xs font-semibold text-gray-500 hover:text-gray-300 uppercase tracking-wider transition-colors"
                                    >
                                        {isMessagesOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                        Messages
                                        <span className="ml-auto text-[10px] bg-gray-800 px-1.5 py-0.5 rounded-full">{dmRooms.length}</span>
                                    </button>

                                    <AnimatePresence>
                                        {isMessagesOpen && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: "auto", opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.2 }}
                                                className="overflow-hidden"
                                            >
                                                {dmRooms.map((room) => (
                                                    <ChatListItem
                                                        key={room.id}
                                                        room={room}
                                                        selected={selectedRoom === room.id}
                                                        onClick={() => onSelectRoom(room.id)}
                                                        unreadCount={room.unreadCount}
                                                        isOnline={!room.isGroup && room.otherUser && onlineUsers.has(room.otherUser.id)}
                                                    />
                                                ))}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            )}

                            {filteredRooms.length === 0 && searchQuery && (
                                <div className="p-4 text-center text-gray-500 text-sm">
                                    No chats found
                                </div>
                            )}

                            {rooms.length === 0 && !searchQuery && (
                                <div className="p-4 text-center text-gray-500 text-sm">
                                    No chats yet. Start a conversation!
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* User Footer (Moved from Top) */}
                <div className="p-4 border-t border-white/10 flex justify-between items-center bg-gray-900/80">
                    <div className="flex items-center gap-3">
                        <div
                            className="relative w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center font-bold text-lg text-white overflow-hidden border border-white/10"
                        >
                            <Image
                                src={getAvatar(currentUser.username, currentUser.image)}
                                alt={currentUser.username}
                                fill
                                className="object-cover"
                            />
                        </div>

                        <div className="flex-1 min-w-0">
                            <h2 className="font-semibold text-sm text-white truncate">{currentUser.username}</h2>
                            <p className="text-xs text-gray-400 truncate max-w-[120px]" title={currentUser.bio || "No bio set"}>
                                {currentUser.bio || "Available"}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        <NotificationCenter currentUserId={currentUser.id} side="top" />
                        <SidebarMenu
                            onLogout={() => signOut({ callbackUrl: '/' })}
                            onFindFriends={() => setIsUserListOpen(true)}
                            onCreateRoom={() => setIsNewChatOpen(true)}
                            onOpenSettings={() => setIsSettingsOpen(true)}
                            onCreateGroup={() => setIsCreateGroupOpen(true)}
                        />
                    </div>
                </div>
            </div>

            {/* User List Modal */}
            <UserListModal
                isOpen={isUserListOpen}
                onClose={() => setIsUserListOpen(false)}
                onSelectUser={onStartDM}
                currentUserId={currentUser.id}
            />

            {/* Settings Modal */}
            <SettingsModal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                currentUser={currentUser}
            />

            {/* Create Group Modal */}
            <CreateGroupModal
                isOpen={isCreateGroupOpen}
                onClose={() => setIsCreateGroupOpen(false)}
                currentUserId={currentUser.id}
                onSuccess={(roomId) => {
                    onSelectRoom(roomId)
                }}
            />
        </>
    )
}

function SidebarMenu({ onLogout, onFindFriends, onCreateRoom, onOpenSettings, onCreateGroup }: {
    onLogout: () => void,
    onFindFriends: () => void,
    onCreateRoom: () => void,
    onOpenSettings: () => void,
    onCreateGroup: () => void
}) {
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
                            className="absolute right-0 bottom-full mb-2 w-48 bg-gray-900 border border-white/10 rounded-xl shadow-xl overflow-hidden z-50 ring-1 ring-black/5 py-1"
                        >
                            <button
                                onClick={() => { onFindFriends(); setIsOpen(false) }}
                                className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-white/10 hover:text-white flex items-center gap-2"
                            >
                                <UserPlus size={16} /> Find Friends
                            </button>
                            <button
                                onClick={() => { onCreateGroup(); setIsOpen(false) }}
                                className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-white/10 hover:text-white flex items-center gap-2"
                            >
                                <Plus size={16} /> Create Group
                            </button>
                            <button
                                onClick={() => { onCreateRoom(); setIsOpen(false) }}
                                className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-white/10 hover:text-white flex items-center gap-2"
                            >
                                <MessageCircle size={16} /> Create Room
                            </button>
                            <button
                                onClick={() => { onOpenSettings(); setIsOpen(false) }}
                                className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-white/10 hover:text-white flex items-center gap-2"
                            >
                                <Settings size={16} /> Settings
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
