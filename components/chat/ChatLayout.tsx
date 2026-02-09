"use client"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Plus, MoreVertical, Send, Phone, Video, Info } from "lucide-react"
import { cn } from "@/lib/utils"
// Import custom useSocket hook
import { useSocket } from "@/hooks/useSocket"

interface ChatLayoutProps {
    currentUser: any
}

export function ChatLayout({ currentUser }: ChatLayoutProps) {
    const [selectedRoom, setSelectedRoom] = useState<string | null>(null)
    const [message, setMessage] = useState("")
    const [rooms, setRooms] = useState<any[]>([])
    const [messages, setMessages] = useState<any[]>([])
    const [isNewChatOpen, setIsNewChatOpen] = useState(false)
    const [newChatName, setNewChatName] = useState("")

    const messagesEndRef = useRef<HTMLDivElement>(null)
    const socket = useSocket()

    // Socket: Listen for incoming messages
    useEffect(() => {
        if (!socket) return

        socket.on("receive_message", (incomingMsg: any) => {
            // If message belongs to current room, add it
            if (incomingMsg.roomId === selectedRoom) {
                setMessages(prev => {
                    // Prevent duplicates if we already added it enthusiastically (optimistic UI)
                    if (prev.some(m => m.id === incomingMsg.id)) return prev
                    return [...prev, incomingMsg]
                })
            }

            // Update room list preview
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
    }, []) // No interval!

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

        // Join room socket channel
        if (socket) {
            socket.emit("join_room", selectedRoom)
        }

    }, [selectedRoom, socket])

    // Scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages])

    const handleSendMessage = async () => {
        if (!message.trim() || !selectedRoom) return

        const tempMsg = {
            id: Date.now().toString(),
            content: message,
            senderId: currentUser.id, // ID from DB
            sender: currentUser,
            createdAt: new Date().toISOString(),
            roomId: selectedRoom
        }

        // Optimistic update
        setMessages(prev => [...prev, tempMsg])
        setMessage("")

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
                    senderId: currentUser.id
                })
            })
        } catch (e) {
            console.error("Failed to save message", e)
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

                // Join new room socket
                if (socket) socket.emit("join_room", newRoom.id)
            }
        } catch (e) { console.error(e) }
    }

    const currentRoom = rooms.find(r => r.id === selectedRoom)

    return (
        <div className="flex h-screen bg-black text-white overflow-hidden">
            {/* Sidebar */}
            <div className="w-80 border-r border-white/10 flex flex-col bg-gray-900/50 backdrop-blur-xl">
                <div className="p-4 border-b border-white/10 flex justify-between items-center">
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
                    <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                        <MoreVertical size={20} />
                    </Button>
                </div>

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
                            <Button size="sm" onClick={handleCreateRoom} className="bg-blue-600">Create</Button>
                            <Button size="sm" variant="ghost" onClick={() => setIsNewChatOpen(false)}>Cancel</Button>
                        </div>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto px-2 space-y-1">
                    {rooms.map((room) => (
                        <button
                            key={room.id}
                            onClick={() => setSelectedRoom(room.id)}
                            className={cn(
                                "w-full p-3 rounded-xl flex items-center gap-3 transition-all duration-200 hover:bg-white/5",
                                selectedRoom === room.id ? "bg-white/10 shadow-lg border border-white/5" : "text-gray-400"
                            )}
                        >
                            <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center text-lg font-medium text-gray-300">
                                {room.name ? room.name[0].toUpperCase() : "?"}
                            </div>
                            <div className="flex-1 text-left">
                                <div className="flex justify-between items-center mb-1">
                                    <span className={cn("font-medium", selectedRoom === room.id ? "text-white" : "text-gray-300")}>
                                        {room.name || "Unnamed Room"}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                        {room.time ? new Date(room.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <p className="text-xs text-gray-500 truncate max-w-[140px]">{room.lastMessage}</p>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>

                <div className="p-4 border-t border-white/10">
                    <Button className="w-full gap-2 bg-blue-600 hover:bg-blue-700 text-white" onClick={() => setIsNewChatOpen(true)}>
                        <Plus size={18} /> New Room
                    </Button>
                </div>
            </div>

            {/* Chat Area */}
            {selectedRoom ? (
                <div className="flex-1 flex flex-col bg-gradient-to-b from-gray-900 to-black relative">
                    {/* Chat Header */}
                    <div className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-gray-900/50 backdrop-blur-md z-10">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-white">
                                {currentRoom?.name?.[0].toUpperCase()}
                            </div>
                            <div>
                                <h3 className="font-semibold text-white">{currentRoom?.name}</h3>
                                <p className="text-xs text-gray-400">{currentRoom?.participants?.length || 0} participants</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 text-gray-400">
                            <Button variant="ghost" size="icon"><Phone size={20} /></Button>
                            <Button variant="ghost" size="icon"><Video size={20} /></Button>
                            <Button variant="ghost" size="icon"><Info size={20} /></Button>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {messages.map((msg) => {
                            const isMe = msg.senderId === currentUser.id;
                            return (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    key={msg.id}
                                    className={cn("flex", isMe ? "justify-end" : "justify-start")}
                                >
                                    <div className={cn(
                                        "max-w-[70%] rounded-2xl p-4 shadow-sm relative group",
                                        isMe
                                            ? "bg-blue-600 text-white rounded-br-none"
                                            : "bg-gray-800 text-gray-200 rounded-bl-none"
                                    )}>
                                        {!isMe && <p className="text-xs text-blue-400 mb-1 font-medium">{msg.sender.username}</p>}
                                        <p className="text-sm leading-relaxed">{msg.content}</p>
                                        <span className={cn(
                                            "text-[10px] absolute bottom-1",
                                            isMe ? "right-2 text-blue-200/50" : "left-2 text-gray-500",
                                            "opacity-0 group-hover:opacity-100 transition-opacity"
                                        )}>
                                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </motion.div>
                            )
                        })}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Message Input */}
                    <div className="p-4 bg-gray-900/50 backdrop-blur-md border-t border-white/10">
                        <form
                            onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
                            className="flex gap-2 max-w-4xl mx-auto"
                        >
                            <Input
                                placeholder="Type a message..."
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                className="bg-gray-800/50 text-white border-none focus:ring-blue-500/50 h-12 rounded-full px-6"
                            />
                            <Button size="icon" type="submit" className="h-12 w-12 rounded-full bg-blue-600 hover:bg-blue-700 shrink-0 text-white">
                                <Send size={20} />
                            </Button>
                        </form>
                    </div>
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
