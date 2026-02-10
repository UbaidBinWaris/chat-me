"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, X, User, Check, Clock, MessageCircle, UserPlus } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { getAvatar } from "@/lib/avatar"
import Image from "next/image"

interface UserListModalProps {
    isOpen: boolean
    onClose: () => void
    onSelectUser: (userId: string) => void
    currentUserId: string
}

interface User {
    id: string
    username: string
    email: string
    lastLoginAt?: string
    friendshipStatus: 'none' | 'pending_sent' | 'pending_received' | 'accepted' | 'declined' | 'blocked'
    friendshipId: string | null
    image?: string | null
}

export function UserListModal({ isOpen, onClose, onSelectUser, currentUserId }: UserListModalProps) {
    const [users, setUsers] = useState<User[]>([])
    const [filteredUsers, setFilteredUsers] = useState<User[]>([])
    const [searchQuery, setSearchQuery] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [processingId, setProcessingId] = useState<string | null>(null)

    useEffect(() => {
        if (isOpen) {
            fetchUsers()
        }
    }, [isOpen])

    useEffect(() => {
        if (searchQuery.trim()) {
            const filtered = users.filter(user =>
                user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                user.email.toLowerCase().includes(searchQuery.toLowerCase())
            )
            setFilteredUsers(filtered)
        } else {
            setFilteredUsers(users)
        }
    }, [searchQuery, users])

    const fetchUsers = async () => {
        setIsLoading(true)
        try {
            const res = await fetch('/api/users')
            if (res.ok) {
                const data = await res.json()
                setUsers(data)
                setFilteredUsers(data)
            }
        } catch (error) {
            console.error('Error fetching users:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleSendRequest = async (userId: string) => {
        setProcessingId(userId)
        try {
            const res = await fetch('/api/friendships', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ addresseeId: userId })
            })

            if (res.ok) {
                // Refresh users to update friendship status
                fetchUsers()
            }
        } catch (error) {
            console.error('Error sending friend request:', error)
        } finally {
            setProcessingId(null)
        }
    }

    const handleAcceptRequest = async (friendshipId: string, userId: string) => {
        setProcessingId(userId)
        try {
            const res = await fetch(`/api/friendships/${friendshipId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'accepted' })
            })

            if (res.ok) {
                fetchUsers()
            }
        } catch (error) {
            console.error('Error accepting friend request:', error)
        } finally {
            setProcessingId(null)
        }
    }

    const handleDeclineRequest = async (friendshipId: string, userId: string) => {
        setProcessingId(userId)
        try {
            const res = await fetch(`/api/friendships/${friendshipId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'declined' })
            })

            if (res.ok) {
                fetchUsers()
            }
        } catch (error) {
            console.error('Error declining friend request:', error)
        } finally {
            setProcessingId(null)
        }
    }

    const handleStartChat = (userId: string) => {
        onSelectUser(userId)
        onClose()
        setSearchQuery("")
    }

    const renderActionButton = (user: User) => {
        const isProcessing = processingId === user.id

        switch (user.friendshipStatus) {
            case 'none':
                return (
                    <Button
                        size="sm"
                        onClick={() => handleSendRequest(user.id)}
                        disabled={isProcessing}
                        className="bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 hover:text-blue-300 border border-blue-500/20 transition-all"
                    >
                        <UserPlus size={16} className="mr-1.5" />
                        {isProcessing ? 'Sending...' : 'Add Friend'}
                    </Button>
                )

            case 'pending_sent':
                return (
                    <Button
                        size="sm"
                        disabled
                        className="bg-gray-600 text-gray-300 cursor-not-allowed"
                    >
                        <Clock size={14} className="mr-1" />
                        Pending
                    </Button>
                )

            case 'pending_received':
                return (
                    <div className="flex gap-1">
                        <Button
                            size="sm"
                            onClick={() => handleAcceptRequest(user.friendshipId!, user.id)}
                            disabled={isProcessing}
                            className="bg-green-600 hover:bg-green-700 text-white px-2"
                        >
                            <Check size={14} />
                        </Button>
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeclineRequest(user.friendshipId!, user.id)}
                            disabled={isProcessing}
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10 px-2"
                        >
                            <X size={14} />
                        </Button>
                    </div>
                )

            case 'accepted':
                return (
                    <Button
                        size="sm"
                        onClick={() => handleStartChat(user.id)}
                        className="bg-green-600 hover:bg-green-700 text-white"
                    >
                        <MessageCircle size={14} className="mr-1" />
                        Chat
                    </Button>
                )

            case 'blocked':
                return (
                    <span className="text-xs text-red-400">Blocked</span>
                )

            default:
                return null
        }
    }

    if (!isOpen) return null

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    onClick={onClose}
                />

                {/* Modal */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-md mx-4 bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
                >
                    {/* Header */}
                    <div className="p-6 border-b border-white/10 flex items-center justify-between">
                        <h2 className="text-xl font-bold text-white">Find Friends</h2>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onClose}
                            className="text-gray-400 hover:text-white hover:bg-white/10"
                        >
                            <X size={20} />
                        </Button>
                    </div>

                    {/* Search */}
                    <div className="p-4 border-b border-white/10">
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                            <Input
                                placeholder="Search users..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 bg-gray-800/50 border-none focus:ring-blue-500/50 text-white"
                            />
                        </div>
                    </div>

                    {/* User List */}
                    <div className="max-h-96 overflow-y-auto p-4 space-y-2">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="text-gray-400">Loading users...</div>
                            </div>
                        ) : filteredUsers.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                                <User size={48} className="mb-2 opacity-50" />
                                <p>No users found</p>
                            </div>
                        ) : (
                            filteredUsers.map((user) => (
                                <motion.div
                                    key={user.id}
                                    whileHover={{ scale: 1.01, backgroundColor: "rgba(31, 41, 55, 0.5)" }}
                                    className="flex items-center gap-4 p-4 rounded-xl bg-gray-800/20 border border-white/5 hover:border-blue-500/30 transition-all group"
                                >
                                    {/* Avatar */}
                                    <div className="relative w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center overflow-hidden flex-shrink-0 border border-white/10">
                                        <Image
                                            src={getAvatar(user.username, user.image)}
                                            alt={user.username}
                                            fill
                                            className="object-cover"
                                        />
                                    </div>

                                    {/* User Info */}
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-white truncate">{user.username}</h3>
                                        <p className="text-xs text-gray-400 truncate">{user.email}</p>
                                    </div>

                                    {/* Action Button */}
                                    <div className="flex-shrink-0">
                                        {renderActionButton(user)}
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    )
}
