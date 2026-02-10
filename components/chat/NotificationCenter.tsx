"use client"

import { useState, useEffect, useRef } from "react"
import { Bell, Check, X, User } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { formatDistanceToNow } from "date-fns"

interface NotificationCenterProps {
    currentUserId: string
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

export function NotificationCenter({ currentUserId }: NotificationCenterProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [requests, setRequests] = useState<FriendRequest[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [processingId, setProcessingId] = useState<string | null>(null)
    const dropdownRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        fetchRequests()

        // Poll for new requests
        const interval = setInterval(fetchRequests, 30000)

        // Close on click outside
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }

        document.addEventListener("mousedown", handleClickOutside)

        return () => {
            clearInterval(interval)
            document.removeEventListener("mousedown", handleClickOutside)
        }
    }, [])

    const fetchRequests = async () => {
        try {
            const res = await fetch('/api/friendships?status=pending')
            if (res.ok) {
                const data = await res.json()
                const incomingRequests = data.filter((req: FriendRequest) => !req.isRequester)
                setRequests(incomingRequests)
            }
        } catch (error) {
            console.error('Error fetching notifications:', error)
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
            }
        } catch (error) {
            console.error('Error declining friend request:', error)
        } finally {
            setProcessingId(null)
        }
    }

    return (
        <div className="relative" ref={dropdownRef}>
            <Button
                variant="ghost"
                size="icon"
                className="relative text-gray-400 hover:text-white hover:bg-white/10"
                onClick={() => setIsOpen(!isOpen)}
            >
                <Bell size={20} />
                {requests.length > 0 && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-600 rounded-full border-2 border-gray-900"></span>
                )}
            </Button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-2 w-80 bg-gray-900 border border-white/10 rounded-xl shadow-xl overflow-hidden z-50 ring-1 ring-black/5"
                    >
                        <div className="p-3 border-b border-white/10 flex justify-between items-center bg-gray-900/50">
                            <h3 className="font-semibold text-sm text-white">Notifications</h3>
                            {requests.length > 0 && (
                                <span className="bg-blue-600 text-xs font-bold px-1.5 py-0.5 rounded text-white">
                                    {requests.length} New
                                </span>
                            )}
                        </div>

                        <div className="max-h-[300px] overflow-y-auto">
                            {requests.length === 0 ? (
                                <div className="p-8 text-center text-gray-500 text-sm">
                                    <Bell size={24} className="mx-auto mb-2 opacity-20" />
                                    No new notifications
                                </div>
                            ) : (
                                <div className="divide-y divide-white/5">
                                    {requests.map(request => (
                                        <div key={request.id} className="p-3 hover:bg-white/5 transition-colors">
                                            <div className="flex items-start gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                                                    {request.otherUser.username[0].toUpperCase()}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm text-white font-medium">
                                                        <span className="text-blue-400">{request.otherUser.username}</span> sent you a friend request
                                                    </p>
                                                    <p className="text-xs text-gray-500 mt-0.5">
                                                        {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
                                                    </p>

                                                    <div className="flex gap-2 mt-2">
                                                        <Button
                                                            size="sm"
                                                            onClick={() => handleAccept(request.id)}
                                                            disabled={processingId === request.id}
                                                            className="h-7 text-xs bg-blue-600 hover:bg-blue-700 text-white px-3"
                                                        >
                                                            {processingId === request.id ? '...' : 'Accept'}
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => handleDecline(request.id)}
                                                            disabled={processingId === request.id}
                                                            className="h-7 text-xs text-gray-400 hover:text-white hover:bg-white/10"
                                                        >
                                                            Decline
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
