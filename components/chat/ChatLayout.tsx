"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Phone, Video, Info, Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useSocket } from "@/hooks/useSocket"
import { ChatMessage } from "@/components/chat/ChatMessage"
import { ChatInput } from "@/components/chat/ChatInput"
import { Sidebar } from "@/components/chat/Sidebar"
import { MessageInfoModal } from "@/components/chat/MessageInfoModal"

import { UserInfoPanel } from "@/components/chat/UserInfoPanel"
import { GroupInfoPanel } from "@/components/chat/GroupInfoPanel"
import { AddParticipantModal } from "@/components/chat/AddParticipantModal"

interface ChatLayoutProps {
    currentUser: any
}

export function ChatLayout({ currentUser }: ChatLayoutProps) {
    const [selectedRoom, setSelectedRoom] = useState<string | null>(null)
    const [rooms, setRooms] = useState<any[]>([])
    const [messages, setMessages] = useState<any[]>([])
    const [isNewChatOpen, setIsNewChatOpen] = useState(false)
    const [newChatName, setNewChatName] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [isUserListOpen, setIsUserListOpen] = useState(false)
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const [isInfoOpen, setIsInfoOpen] = useState(false)

    // Message Info Modal
    const [selectedMessage, setSelectedMessage] = useState<any>(null)
    const [isMessageInfoOpen, setIsMessageInfoOpen] = useState(false)

    // Group Management
    const [isAddParticipantOpen, setIsAddParticipantOpen] = useState(false)
    const [currentRoomDetails, setCurrentRoomDetails] = useState<any>(null)


    const messagesEndRef = useRef<HTMLDivElement>(null)
    const socket = useSocket(currentUser?.id)

    // Online Users State
    const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set())

    // Function to mark room as read
    const markRoomAsRead = async (roomId: string) => {
        try {
            await fetch('/api/rooms/read', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ roomId })
            })

            // Update local state
            setRooms(prev => prev.map(r =>
                r.id === roomId ? { ...r, unreadCount: 0 } : r
            ))

            // Emit read status to socket
            if (socket) {
                socket.emit("mark_read", { roomId, userId: currentUser.id })
            }
        } catch (e) {
            console.error("Failed to mark room as read", e)
        }
    }

    // Reset Info Panel and Mark Read when changing rooms
    useEffect(() => {
        setIsInfoOpen(false)
        if (selectedRoom) {
            markRoomAsRead(selectedRoom)
        }
    }, [selectedRoom])

    // Socket: Listen for incoming messages & Status
    useEffect(() => {
        if (!socket) return

        // Online Status Listeners
        socket.on("user_status", ({ userId, status }: { userId: string, status: "online" | "offline" }) => {
            setOnlineUsers(prev => {
                const newSet = new Set(prev)
                if (status === "online") newSet.add(userId)
                else newSet.delete(userId)
                return newSet
            })
        })

        socket.on("online_users", (userIds: string[]) => {
            setOnlineUsers(new Set(userIds))
        })

        socket.on("receive_message", (incomingMsg: any) => {
            console.log('📨 Received message:', {
                from: incomingMsg.senderId,
                currentUser: currentUser.id,
                shouldPlaySound: incomingMsg.senderId !== currentUser.id
            })

            // Play sound if message is not from current user
            if (incomingMsg.senderId !== currentUser.id) {
                try {
                    const audio = new Audio('/notification.mp3');
                    audio.volume = 0.5; // Set volume to 50%
                    audio.play()
                        .then(() => console.log('🔔 Notification sound played'))
                        .catch(e => console.error("❌ Audio play failed:", e));
                } catch (error) {
                    console.error("❌ Audio creation failed:", error);
                }

                // Emit Delivered status if we received it
                socket.emit("mark_delivered", {
                    messageIds: [incomingMsg.id],
                    senderId: incomingMsg.senderId,
                    roomId: incomingMsg.roomId
                });
            }

            if (incomingMsg.roomId === selectedRoom) {
                setMessages(prev => {
                    if (prev.some(m => m.id === incomingMsg.id)) return prev
                    return [...prev, incomingMsg]
                })
                // Mark as read immediately if in the room
                markRoomAsRead(incomingMsg.roomId)
            } else {
                // Increment unread count for other rooms
                setRooms(prev => prev.map(r =>
                    r.id === incomingMsg.roomId
                        ? { ...r, unreadCount: (r.unreadCount || 0) + 1 }
                        : r
                ))
            }

            setRooms(prev => prev.map(r =>
                r.id === incomingMsg.roomId
                    ? {
                        ...r,
                        lastMessage: incomingMsg.content,
                        time: incomingMsg.createdAt
                    }
                    : r
            ))
        })

        // Listen for status updates (Sent -> Delivered -> Read)
        socket.on("message_status_update", (data: { messageIds?: string[], roomId: string, status: string, deliveredAt?: string, readAt?: string, readBy?: string }) => {
            // Update messages in the current view
            if (selectedRoom === data.roomId) {
                setMessages(prev => prev.map(msg => {
                    // Update if it's one of the specific messages OR if it's a "read all" event (no messageIds)
                    const shouldUpdate = data.messageIds
                        ? data.messageIds.includes(msg.id)
                        : (msg.senderId === currentUser.id && msg.status !== 'read'); // Simple assumption: update all my unread messages

                    if (shouldUpdate) {
                        return {
                            ...msg,
                            status: data.status,
                            deliveredAt: data.deliveredAt || msg.deliveredAt,
                            readAt: data.readAt || msg.readAt
                        }
                    }
                    return msg
                }))
            }
        })

        socket.on("new_chat", (newRoom: any) => {
            setRooms(prev => {
                if (prev.some(r => r.id === newRoom.id)) return prev
                return [newRoom, ...prev]
            })

            // Join the new room
            socket.emit("join_room", newRoom.id)

            // Play sound
            const audio = new Audio('/notification.mp3')
            audio.play().catch(e => console.error("Audio play failed:", e))
        })

        socket.on("message_deleted", (messageId: string) => {
            setMessages(prev => prev.filter(msg => msg.id !== messageId))
        })

        // Group event listeners
        socket.on("participant_added", (data: any) => {
            if (data.roomId === selectedRoom) {
                fetchRoomDetails()
            }
            fetchRooms()
        })

        socket.on("participant_removed", (data: any) => {
            if (data.roomId === selectedRoom) {
                fetchRoomDetails()
            }
            fetchRooms()
        })

        socket.on("participant_role_changed", (data: any) => {
            if (data.roomId === selectedRoom) {
                fetchRoomDetails()
            }
            fetchRooms()
        })

        socket.on("group_updated", (data: any) => {
            if (data.roomId === selectedRoom) {
                fetchRoomDetails()
            }
            fetchRooms()
        })

        socket.on("user_left_group", (data: any) => {
            if (data.roomId === selectedRoom) {
                fetchRoomDetails()
            }
            fetchRooms()
        })

        socket.on("group_deleted", (data: any) => {
            if (data.roomId === selectedRoom) {
                setSelectedRoom(null)
            }
            fetchRooms()
        })

        return () => {
            socket.off("receive_message")
            socket.off("user_status")
            socket.off("online_users")
            socket.off("message_status_update")
            socket.off("message_status_update")
            socket.off("new_chat")
            socket.off("message_deleted")
            socket.off("participant_added")
            socket.off("participant_removed")
            socket.off("participant_role_changed")
            socket.off("group_updated")
            socket.off("user_left_group")
            socket.off("group_deleted")
        }
    }, [socket, selectedRoom, currentUser.id])


    // Fetch Rooms function
    const fetchRooms = async () => {
        try {
            const res = await fetch('/api/rooms')
            if (res.ok) {
                const data = await res.json()
                setRooms(data)

                // Join all rooms to receive real-time updates for them
                if (socket && data.length > 0) {
                    data.forEach((room: any) => {
                        socket.emit("join_room", room.id)
                    })
                }
            }
        } catch (e) { console.error(e) }
    }

    // Fetch Room Details function
    const fetchRoomDetails = async () => {
        if (!selectedRoom) return
        try {
            const res = await fetch(`/api/rooms/${selectedRoom}`)
            if (res.ok) {
                const data = await res.json()
                setCurrentRoomDetails(data)
            }
        } catch (e) { console.error(e) }
    }

    // Fetch Rooms (Initial Load Only)
    useEffect(() => {
        fetchRooms()
    }, [socket])

    // Fetch room details when selected room changes
    useEffect(() => {
        if (selectedRoom) {
            fetchRoomDetails()
        } else {
            setCurrentRoomDetails(null)
        }
    }, [selectedRoom])

    // Fetch Messages & Join Room
    useEffect(() => {
        if (!selectedRoom) return

        const fetchMessages = async () => {
            try {
                const res = await fetch(`/api/messages?roomId=${selectedRoom}`)
                if (res.ok) {
                    const data = await res.json()
                    setMessages(data)
                }
            } catch (e) { console.error(e) }
        }
        fetchMessages()

        if (socket) {
            socket.emit("join_room", selectedRoom)
        }

    }, [selectedRoom, socket])

    // Scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages])

    const handleSendMessage = async (content: string, type: "text" | "audio" | "image" | "file" = "text", fileUrl?: string) => {
        if (!selectedRoom) return

        const tempMsg = {
            id: Date.now().toString(),
            content: content,
            senderId: currentUser.id, // ID from DB
            sender: currentUser,
            createdAt: new Date().toISOString(),
            roomId: selectedRoom,
            type: type,
            fileUrl: fileUrl
        }

        // Optimistic update
        setMessages(prev => [...prev, tempMsg])
        setIsLoading(true)

        // Emit to Socket Server
        if (socket) {
            socket.emit("send_message", tempMsg)
        }

        // Persist to DB (for history)
        try {
            await fetch('/api/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: tempMsg.content,
                    roomId: selectedRoom,
                    senderId: currentUser.id,
                    type: type,
                    fileUrl: fileUrl
                })
            })
        } catch (e) {
            console.error("Failed to save message", e)
        } finally {
            setIsLoading(false)
        }
    }

    const handleDeleteMessage = async (messageId: string) => {
        if (!selectedRoom) return

        // Optimistic update
        setMessages(prev => prev.filter(msg => msg.id !== messageId))

        // Emit to Socket
        if (socket) {
            socket.emit("delete_message", { messageId, roomId: selectedRoom })
        }

        // Call API
        try {
            await fetch(`/api/messages/${messageId}`, {
                method: 'DELETE'
            })
        } catch (e) {
            console.error("Failed to delete message", e)
        }
    }

    const handleCreateRoom = async () => {
        if (!newChatName.trim()) return

        try {
            const res = await fetch('/api/rooms', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newChatName,
                    isGroup: true,
                    participantIds: [currentUser.id]
                })
            })
            if (res.ok) {
                const newRoom = await res.json()
                setRooms(prev => [newRoom, ...prev])
                setSelectedRoom(newRoom.id)
                setIsNewChatOpen(false)
                setNewChatName("")

                if (socket) socket.emit("join_room", newRoom.id)
            }
        } catch (e) { console.error(e) }
    }

    const handleStartDM = async (otherUserId: string) => {
        try {
            const res = await fetch('/api/rooms/dm', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ otherUserId })
            })

            if (res.ok) {
                const dmRoom = await res.json()

                // Check if room already exists in the list
                const existingRoom = rooms.find(r => r.id === dmRoom.id)

                if (!existingRoom) {
                    // Add to rooms list if it's a new DM
                    setRooms(prev => [dmRoom, ...prev])
                }

                // Select the DM room
                setSelectedRoom(dmRoom.id)

                // Join the Socket.IO room
                if (socket) socket.emit("join_room", dmRoom.id)
            }
        } catch (e) {
            console.error('Error starting DM:', e)
        }
    }


    const currentRoom = rooms.find(r => r.id === selectedRoom)

    return (
        <div className="flex h-screen bg-black text-white overflow-hidden relative">
            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar (Responsive) */}
            <div className={cn(
                "fixed inset-y-0 left-0 z-50 w-80 bg-gray-900 border-r border-white/10 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0",
                isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="absolute top-4 right-4 md:hidden z-50">
                    <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(false)}>
                        <X size={20} className="text-gray-400" />
                    </Button>
                </div>
                <Sidebar
                    currentUser={currentUser}
                    rooms={rooms}
                    selectedRoom={selectedRoom}
                    onSelectRoom={(id) => { setSelectedRoom(id); setIsMobileMenuOpen(false) }}
                    onCreateRoom={handleCreateRoom}
                    onStartDM={handleStartDM}
                    isNewChatOpen={isNewChatOpen}
                    setIsNewChatOpen={setIsNewChatOpen}
                    newChatName={newChatName}
                    setNewChatName={setNewChatName}
                    isUserListOpen={isUserListOpen}
                    setIsUserListOpen={setIsUserListOpen}
                    onlineUsers={onlineUsers}
                />
            </div>

            {/* Chat Area */}
            {selectedRoom ? (
                <div className="flex-1 flex flex-col bg-gradient-to-b from-gray-900 to-black relative">
                    {/* Chat Header */}
                    <div className="h-16 border-b border-white/10 flex items-center justify-between px-4 md:px-6 bg-gray-900/50 backdrop-blur-md z-10">
                        <div className="flex items-center gap-3">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="md:hidden text-gray-400 -ml-2"
                                onClick={() => setIsMobileMenuOpen(true)}
                            >
                                <Menu size={20} />
                            </Button>
                            <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-white flex-shrink-0 overflow-hidden relative">
                                {currentRoom?.isGroup ? (
                                    <span className="text-lg">{currentRoom?.name?.[0].toUpperCase()}</span>
                                ) : (
                                    currentRoom?.image ? (
                                        <img src={currentRoom.image} alt={currentRoom.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-lg">{currentRoom?.name?.[0].toUpperCase()}</span>
                                    )
                                )}
                            </div>
                            <div>
                                <h3 className="font-semibold text-white">{currentRoom?.name}</h3>
                                {currentRoom?.isGroup && (
                                    <p className="text-xs text-gray-400">{currentRoom?.participants?.length || 0} participants</p>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-2 text-gray-400">
                            <Button variant="ghost" size="icon"><Phone size={20} /></Button>
                            <Button variant="ghost" size="icon"><Video size={20} /></Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setIsInfoOpen(!isInfoOpen)}
                                className={cn(isInfoOpen && "text-blue-500 bg-blue-500/10")}
                            >
                                <Info size={20} />
                            </Button>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-4">
                        {messages.map((msg) => (
                            <ChatMessage
                                key={msg.id}
                                message={msg}
                                isMe={msg.senderId === currentUser.id}
                                onShowInfo={(m) => {
                                    setSelectedMessage(m)
                                    setIsMessageInfoOpen(true)
                                }}
                                onDelete={handleDeleteMessage}
                            />
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Chat Input */}
                    <ChatInput
                        onSendMessage={handleSendMessage}
                        isLoading={isLoading}
                        isGroupChat={currentRoom?.isGroup || false}
                        participants={currentRoomDetails?.participants?.map((p: any) => p.user) || []}
                    />

                    {/* User Info Panel */}
                    <UserInfoPanel
                        isOpen={isInfoOpen && !currentRoom?.isGroup}
                        onClose={() => setIsInfoOpen(false)}
                        user={currentRoom?.otherUser}
                    />

                    {/* Group Info Panel */}
                    <GroupInfoPanel
                        isOpen={isInfoOpen && currentRoom?.isGroup}
                        onClose={() => setIsInfoOpen(false)}
                        room={currentRoomDetails || currentRoom}
                        currentUserId={currentUser.id}
                        onAddParticipants={() => setIsAddParticipantOpen(true)}
                        onRefresh={() => {
                            fetchRoomDetails()
                            fetchRooms()
                        }}
                    />

                    {/* Message Info Modal */}
                    <MessageInfoModal
                        isOpen={isMessageInfoOpen}
                        onClose={() => setIsMessageInfoOpen(false)}
                        message={selectedMessage}
                    />

                    {/* Add Participant Modal */}
                    <AddParticipantModal
                        isOpen={isAddParticipantOpen}
                        onClose={() => setIsAddParticipantOpen(false)}
                        roomId={selectedRoom || ''}
                        currentParticipants={currentRoomDetails?.participants || []}
                        onSuccess={() => {
                            fetchRoomDetails()
                            fetchRooms()
                        }}
                    />
                </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-500 space-y-4">
                    <div className="w-24 h-24 rounded-full bg-gray-800/50 flex items-center justify-center">
                        <span className="text-4xl">👋</span>
                    </div>
                    <p className="text-lg">Select a chat to start messaging</p>
                </div>
            )}
        </div>
    )
}
