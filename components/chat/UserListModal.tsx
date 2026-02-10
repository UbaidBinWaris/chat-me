"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, X, User } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

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
}

export function UserListModal({ isOpen, onClose, onSelectUser, currentUserId }: UserListModalProps) {
    const [users, setUsers] = useState<User[]>([])
    const [filteredUsers, setFilteredUsers] = useState<User[]>([])
    const [searchQuery, setSearchQuery] = useState("")
    const [isLoading, setIsLoading] = useState(false)

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

    const handleSelectUser = (userId: string) => {
        onSelectUser(userId)
        onClose()
        setSearchQuery("")
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
                        <h2 className="text-xl font-bold text-white">Start a Conversation</h2>
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
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/30 hover:bg-gray-800/60 cursor-pointer transition-colors border border-transparent hover:border-blue-500/30"
                                    onClick={() => handleSelectUser(user.id)}
                                >
                                    {/* Avatar */}
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center font-bold text-lg text-white flex-shrink-0">
                                        {user.username[0].toUpperCase()}
                                    </div>

                                    {/* User Info */}
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-white truncate">{user.username}</h3>
                                        <p className="text-xs text-gray-400 truncate">{user.email}</p>
                                    </div>

                                    {/* Online Status (placeholder) */}
                                    {user.lastLoginAt && (
                                        <div className="flex items-center gap-1">
                                            <span className="w-2 h-2 bg-gray-500 rounded-full"></span>
                                        </div>
                                    )}
                                </motion.div>
                            ))
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    )
}
