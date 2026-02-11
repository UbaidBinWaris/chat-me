"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, X, User, Check, Clock, MessageCircle, UserPlus, Inbox, Shield } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { getAvatar } from "@/lib/avatar"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"

interface AddFriendModalProps {
    isOpen: boolean
    onClose: () => void
    onSelectUser: (userId: string) => void
    currentUserId: string
}

type AddFriendTab = "find" | "requests"

interface User {
    id: string
    username: string
    email: string
    lastLoginAt?: string
    friendshipStatus: 'none' | 'pending_sent' | 'pending_received' | 'accepted' | 'declined' | 'blocked'
    friendshipId: string | null
    image?: string | null
}

interface FriendRequest {
    id: string
    status: string
    createdAt: string
    isRequester: boolean
    otherUser: {
        id: string
        username: string
        email: string
    }
}

export function AddFriendModal({ isOpen, onClose, onSelectUser, currentUserId }: AddFriendModalProps) {
    const [activeTab, setActiveTab] = useState<AddFriendTab>("find")
    const [requestCount, setRequestCount] = useState(0)

    // Check for pending requests count initially
    useEffect(() => {
        if (isOpen) {
            const fetchRequestCount = async () => {
                try {
                    const res = await fetch('/api/friendships?status=pending')
                    if (res.ok) {
                        const data = await res.json()
                        const incoming = data.filter((req: FriendRequest) => !req.isRequester)
                        setRequestCount(incoming.length)
                    }
                } catch (error) {
                    console.error('Error fetching request count:', error)
                }
            }
            fetchRequestCount()
        }
    }, [isOpen])


    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl p-0 gap-0 bg-gray-950 border-white/10 text-white overflow-hidden h-[600px] flex">
                <DialogTitle className="sr-only">Add Friends</DialogTitle>

                {/* Left Sidebar - Navigation */}
                <div className="w-64 bg-gray-900/50 border-r border-white/10 flex flex-col p-4">
                    <div className="mb-8 pl-2">
                        <h2 className="text-xl font-bold tracking-tight">Friends</h2>
                    </div>

                    <nav className="space-y-1 flex-1">
                        <SidebarTabButton
                            active={activeTab === "find"}
                            onClick={() => setActiveTab("find")}
                            icon={<UserPlus className="h-4 w-4" />}
                            label="Find Friends"
                        />
                        <SidebarTabButton
                            active={activeTab === "requests"}
                            onClick={() => setActiveTab("requests")}
                            icon={<Inbox className="h-4 w-4" />}
                            label="Friend Requests"
                            badge={requestCount > 0 ? requestCount : undefined}
                        />
                    </nav>

                    <div className="pt-4 border-t border-white/10 text-xs text-gray-600 text-center">
                        Gixiai Chats
                    </div>
                </div>

                {/* Right Content Area */}
                <div className="flex-1 flex flex-col min-w-0 bg-gray-950">
                    <div className="flex items-center justify-between p-6 border-b border-white/10">
                        <h2 className="text-xl font-semibold capitalize">
                            {activeTab === "find" ? "Find Friends" : "Friend Requests"}
                        </h2>
                        <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-white/10 -mr-2">
                            <X className="h-5 w-5 text-gray-400" />
                        </Button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-gray-800">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                transition={{ duration: 0.2 }}
                                className="h-full"
                            >
                                {activeTab === "find" && (
                                    <FindFriendsView
                                        onSelectUser={(userId) => {
                                            onSelectUser(userId)
                                            onClose()
                                        }}
                                        currentUserId={currentUserId}
                                    />
                                )}
                                {activeTab === "requests" && (
                                    <FriendRequestsView
                                        currentUserId={currentUserId}
                                        onRequestUpdate={() => {
                                            // Refresh count if needed
                                            const fetchRequestCount = async () => {
                                                try {
                                                    const res = await fetch('/api/friendships?status=pending')
                                                    if (res.ok) {
                                                        const data = await res.json()
                                                        const incoming = data.filter((req: FriendRequest) => !req.isRequester)
                                                        setRequestCount(incoming.length)
                                                    }
                                                } catch (error) {
                                                    console.error('Error fetching request count:', error)
                                                }
                                            }
                                            fetchRequestCount()
                                        }}
                                    />
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

function SidebarTabButton({
    active,
    onClick,
    icon,
    label,
    badge
}: {
    active: boolean,
    onClick: () => void,
    icon: React.ReactNode,
    label: string,
    badge?: number
}) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                active
                    ? "bg-blue-600 text-white shadow-md shadow-blue-900/20"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
            )}
        >
            <div className="flex items-center gap-3">
                {icon}
                {label}
            </div>
            {badge !== undefined && (
                <span className={cn(
                    "px-2 py-0.5 rounded-full text-xs font-bold",
                    active ? "bg-white text-blue-600" : "bg-blue-600 text-white"
                )}>
                    {badge}
                </span>
            )}
        </button>
    )
}

// -----------------------------------------------------------------------------
// Sub-components reusing logic from UserListModal and FriendRequestsPanel
// -----------------------------------------------------------------------------

function FindFriendsView({ onSelectUser, currentUserId }: { onSelectUser: (userId: string) => void, currentUserId: string }) {
    const [users, setUsers] = useState<User[]>([])
    const [filteredUsers, setFilteredUsers] = useState<User[]>([])
    const [searchQuery, setSearchQuery] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [processingId, setProcessingId] = useState<string | null>(null)

    useEffect(() => {
        fetchUsers()
    }, [])

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
                        onClick={() => onSelectUser(user.id)}
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

    return (
        <div className="space-y-4 h-full flex flex-col">
            <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                    placeholder="Search users by username or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 bg-gray-800/50 border-white/5 focus:border-blue-500/50 focus:ring-blue-500/20 text-white"
                />
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <div className="text-gray-400">Loading users...</div>
                    </div>
                ) : filteredUsers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                        <User size={48} className="mb-2 opacity-50" />
                        <p>{searchQuery ? "No users found matching your search" : "No users found"}</p>
                    </div>
                ) : (
                    filteredUsers.map((user) => (
                        <div
                            key={user.id}
                            className="flex items-center gap-4 p-4 rounded-xl bg-gray-800/20 border border-white/5 hover:border-blue-500/30 transition-all group"
                        >
                            <div className="relative w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center overflow-hidden flex-shrink-0 border border-white/10">
                                <Image
                                    src={getAvatar(user.username, user.image)}
                                    alt={user.username}
                                    fill
                                    className="object-cover"
                                />
                            </div>

                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-white truncate">{user.username}</h3>
                                <p className="text-xs text-gray-400 truncate">{user.email}</p>
                            </div>

                            <div className="flex-shrink-0">
                                {renderActionButton(user)}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}

function FriendRequestsView({ currentUserId, onRequestUpdate }: { currentUserId: string, onRequestUpdate: () => void }) {
    const [requests, setRequests] = useState<FriendRequest[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [processingId, setProcessingId] = useState<string | null>(null)

    useEffect(() => {
        fetchRequests()
    }, [])

    const fetchRequests = async () => {
        setIsLoading(true)
        try {
            const res = await fetch('/api/friendships?status=pending')
            if (res.ok) {
                const data = await res.json()
                const incomingRequests = data.filter((req: FriendRequest) => !req.isRequester)
                setRequests(incomingRequests)
            }
        } catch (error) {
            console.error('Error fetching friend requests:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleAccept = async (requestId: string) => {
        setProcessingId(requestId)
        try {
            const res = await fetch(`/api/friendships/${requestId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'accepted' })
            })

            if (res.ok) {
                setRequests(prev => prev.filter(req => req.id !== requestId))
                onRequestUpdate()
            }
        } catch (error) {
            console.error('Error accepting friend request:', error)
        } finally {
            setProcessingId(null)
        }
    }

    const handleDecline = async (requestId: string) => {
        setProcessingId(requestId)
        try {
            const res = await fetch(`/api/friendships/${requestId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'declined' })
            })

            if (res.ok) {
                setRequests(prev => prev.filter(req => req.id !== requestId))
                onRequestUpdate()
            }
        } catch (error) {
            console.error('Error declining friend request:', error)
        } finally {
            setProcessingId(null)
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-8">
                <div className="text-gray-400">Loading requests...</div>
            </div>
        )
    }

    if (requests.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                <Inbox size={48} className="mb-4 opacity-20" />
                <p>No pending friend requests</p>
                <p className="text-xs mt-2">Check back later for new requests</p>
            </div>
        )
    }

    return (
        <div className="space-y-3">
            {requests.map((request) => (
                <div
                    key={request.id}
                    className="flex items-center gap-3 p-4 rounded-xl bg-gray-800/30 border border-white/5 hover:bg-gray-800/50 transition-colors"
                >
                    <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center font-bold text-lg text-white flex-shrink-0">
                        {request.otherUser.username[0].toUpperCase()}
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-white truncate">{request.otherUser.username}</h3>
                            <span className="text-xs text-gray-500 border border-white/10 px-1.5 py-0.5 rounded">
                                {request.otherUser.email}
                            </span>
                        </div>

                        <p className="text-xs text-gray-400 truncate mt-0.5">
                            Sent {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
                        </p>
                    </div>

                    <div className="flex gap-2 flex-shrink-0">
                        <Button
                            size="sm"
                            onClick={() => handleAccept(request.id)}
                            disabled={processingId === request.id}
                            className="bg-green-600 hover:bg-green-700 text-white px-4"
                        >
                            <Check size={16} className="mr-1.5" />
                            Accept
                        </Button>
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDecline(request.id)}
                            disabled={processingId === request.id}
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10 px-4"
                        >
                            <X size={16} className="mr-1.5" />
                            Decline
                        </Button>
                    </div>
                </div>
            ))}
        </div>
    )
}
