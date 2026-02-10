"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Phone, Video, Info, Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useSocket } from "@/hooks/useSocket"
import { ChatMessage } from "@/components/chat/ChatMessage"
import { ChatInput } from "@/components/chat/ChatInput"
import { Sidebar } from "@/components/chat/Sidebar"

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


    const messagesEndRef = useRef<HTMLDivElement>(null)
    const socket = useSocket()

    // Socket: Listen for incoming messages
    useEffect(() => {
        if (!socket) return

        socket.on("receive_message", (incomingMsg: any) => {
            if (incomingMsg.roomId === selectedRoom) {
                setMessages(prev => {
                    if (prev.some(m => m.id === incomingMsg.id)) return prev
                    return [...prev, incomingMsg]
                })
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

        return () => {
            socket.off("receive_message")
        }
    }, [socket, selectedRoom])


    // Fetch Rooms (Initial Load Only)
    useEffect(() => {
        const fetchRooms = async () => {
            try {
                const res = await fetch('/api/rooms')
                if (res.ok) {
                    const data = await res.json()
                    setRooms(data)
                }
            } catch (e) { console.error(e) }
        }
        fetchRooms()
    }, [])

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
                            <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-white flex-shrink-0">
                                {currentRoom?.name?.[0].toUpperCase()}
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
                            <Button variant="ghost" size="icon"><Info size={20} /></Button>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-4">
                        {messages.map((msg) => (
                            <ChatMessage
                                key={msg.id}
                                message={msg}
                                isMe={msg.senderId === currentUser.id}
                            />
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Chat Input */}
                    <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
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
