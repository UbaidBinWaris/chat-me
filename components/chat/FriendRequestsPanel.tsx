"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { X, Check, XCircle, Clock } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { formatDistanceToNow } from "date-fns"

interface FriendRequestsPanelProps {
    isOpen: boolean
    onClose: () => void
    currentUserId: string
    onRequestUpdate: () => void
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

export function FriendRequestsPanel({ isOpen, onClose, currentUserId, onRequestUpdate }: FriendRequestsPanelProps) {
    const [requests, setRequests] = useState<FriendRequest[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [processingId, setProcessingId] = useState<string | null>(null)

    useEffect(() => {
        if (isOpen) {
            fetchRequests()
        }
    }, [isOpen])

    const fetchRequests = async () => {
        setIsLoading(true)
        try {
            const res = await fetch('/api/friendships?status=pending')
            if (res.ok) {
                const data = await res.json()
                // Only show incoming requests
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

                {/* Panel */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-md mx-4 bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
                >
                    {/* Header */}
                    <div className="p-6 border-b border-white/10 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <h2 className="text-xl font-bold text-white">Friend Requests</h2>
                            {requests.length > 0 && (
                                <span className="px-2 py-1 text-xs font-bold bg-blue-600 text-white rounded-full">
                                    {requests.length}
                                </span>
                            )}
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onClose}
                            className="text-gray-400 hover:text-white hover:bg-white/10"
                        >
                            <X size={20} />
                        </Button>
                    </div>

                    {/* Requests List */}
                    <div className="max-h-96 overflow-y-auto p-4">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="text-gray-400">Loading requests...</div>
                            </div>
                        ) : requests.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                                <Clock size={48} className="mb-2 opacity-50" />
                                <p>No pending friend requests</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {requests.map((request) => (
                                    <motion.div
                                        key={request.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/30 border border-white/5"
                                    >
                                        {/* Avatar */}
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center font-bold text-lg text-white flex-shrink-0">
                                            {request.otherUser.username[0].toUpperCase()}
                                        </div>

                                        {/* User Info */}
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-white truncate">{request.otherUser.username}</h3>
                                            <p className="text-xs text-gray-400 truncate">
                                                {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
                                            </p>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex gap-2 flex-shrink-0">
                                            <Button
                                                size="sm"
                                                onClick={() => handleAccept(request.id)}
                                                disabled={processingId === request.id}
                                                className="bg-green-600 hover:bg-green-700 text-white px-3"
                                            >
                                                <Check size={16} />
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => handleDecline(request.id)}
                                                disabled={processingId === request.id}
                                                className="text-red-400 hover:text-red-300 hover:bg-red-500/10 px-3"
                                            >
                                                <XCircle size={16} />
                                            </Button>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    )
}
